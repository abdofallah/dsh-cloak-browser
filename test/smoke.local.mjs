// Real CloakBrowser smoke test through the plugin's host half (no DSH process needed).
// Run with NODE_PATH pointing at a DSH node_modules so @deepseek-ai/* resolve:
//   node test/smoke.local.mjs
import { createServer } from "node:http";
import { writeFile } from "node:fs/promises";
import { createCloakBrowserPlugin } from "../lib/plugin.mjs";

const tools = new Map();
const routes = [];
const effects = [];
const ctx = {
  tools: { register(def) { tools.set(def.name, def); return () => tools.delete(def.name); } },
  effect(fn) { const d = fn(); effects.push(d); return d; },
  on() { return () => {}; },
  get(name) { return name === "webServer" ? webServer : undefined; },
  inject(names, cb) { if (names.includes("webServer")) cb(ctx); },
  reflect: { provide() { return () => {}; } }
};
const webServer = { register(route) { routes.push(route); return () => {}; } };

const page = createServer((req, res) => {
  res.writeHead(200, { "content-type": "text/html" });
  res.end(`<!doctype html><title>Smoke</title><h1>Hello Cloak</h1>
  <form onsubmit="event.preventDefault();document.getElementById('out').textContent='got:'+this.q.value">
  <input name="q" placeholder="Search here"><select name="s"><option value="a">Alpha</option><option value="b">Beta</option></select>
  <label><input type="checkbox" name="c"> Agree</label><button>Send</button></form><p id="out"></p>
  <a href="/two">Second page</a><script>console.log('hello-console')</script>`);
});
await new Promise((r) => page.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${page.address().port}/`;

const plugin = createCloakBrowserPlugin();
const manager = plugin.apply(ctx, { headless: true, profileMode: "ephemeral", allowEvaluate: true, idleCloseMinutes: 0, routePrompt: false });
const exec = { agent: { id: "session-smoke", session: { header: {} } }, signal: new AbortController().signal, callId: "c1", deferContext() {} };
const call = async (name, args = {}) => {
  const started = Date.now();
  const value = await tools.get(name).execute(args, exec);
  console.log(`✔ ${name} (${Date.now() - started} ms)`);
  return value;
};

console.log(`tools: ${[...tools.keys()].join(", ")}`);
const opened = await call("browser_open", { url: base });
console.log("  binary:", JSON.stringify(opened.browser), "title:", opened.title, "elements:", opened.snapshot?.elements?.length);
const input = opened.snapshot.elements.find((e) => e.role === "textbox");
const typed = await call("browser_type", { ref: input.ref, value: "cloak test", submit: true });
console.log("  text after submit has 'got:cloak test':", typed.snapshot.text.includes("got:cloak test"));
const select = typed.snapshot.elements.find((e) => e.role === "combobox");
await call("browser_select", { ref: select.ref, values: ["b"] });
await call("browser_check", { selector: "input[name=c]", checked: true });
const ev = await call("browser_evaluate", { script: "return {title: document.title, checked: document.querySelector('input[name=c]').checked, sel: document.querySelector('select').value}" });
console.log("  evaluate:", JSON.stringify(ev.result));
const cons = await call("browser_inspect", { kind: "console" });
console.log("  console entries:", cons.entries.map((e) => e.text).join("|"));
const shot = await call("browser_screenshot", { save_path: "test/.smoke.jpg" });
console.log("  screenshot bytes:", shot.bytes, "saved:", shot.savedTo);
await call("browser_tabs", { action: "new", url: base + "two" });
const tabs = await call("browser_tabs", { action: "list" });
console.log("  tabs:", tabs.tabs.length);
await call("browser_scroll", { direction: "bottom" });
const status = await call("browser_status");
console.log("  control:", status.control.holder);

// Live view: drive the routes like the sidebar does.
const route = routes[0];
const fakeReq = (method, url, body) => {
  const listeners = {};
  const req = { method, url, headers: { host: "127.0.0.1:1", "content-type": "application/json" }, on(e, f) { (listeners[e] ??= []).push(f); return req; } };
  setTimeout(() => { if (body) for (const f of listeners.data ?? []) f(Buffer.from(JSON.stringify(body))); for (const f of listeners.end ?? []) f(); }, 0);
  return req;
};
const fakeRes = () => {
  const chunks = [];
  let resolveDone;
  const done = new Promise((r) => { resolveDone = r; });
  return { headersSent: false, status: 0, writeHead(s) { this.status = s; this.headersSent = true; }, write(c) { chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)); return true; }, end(c) { if (c) chunks.push(Buffer.from(c)); resolveDone(); }, once() {}, chunks, done };
};
let res = fakeRes();
await route.handler(fakeReq("GET", "/cloak-browser/state?session=session-smoke"), res); await res.done;
const st = JSON.parse(Buffer.concat(res.chunks).toString());
console.log("✔ /state open:", st.open, "tabs:", st.tabs.length);

const streamRes = fakeRes();
const streamReq = fakeReq("GET", "/cloak-browser/stream?session=session-smoke");
await route.handler(streamReq, streamRes);
await new Promise((r) => setTimeout(r, 1500));
const streamBytes = Buffer.concat(streamRes.chunks);
const frames = streamBytes.toString("latin1").split("--cloakframe").length - 1;
console.log("✔ /stream frames received:", frames, "bytes:", streamBytes.length);

res = fakeRes();
await route.handler(fakeReq("POST", "/cloak-browser/input", { session: "session-smoke", event: { type: "click", x: 0.05, y: 0.05 } }), res); await res.done;
console.log("✔ /input click status", res.status, "→ control now:", manager.get("session-smoke").control.holder);
let blocked;
try { await tools.get("browser_click").execute({ selector: "button" }, exec); } catch (error) { blocked = error.message; }
console.log("  agent blocked while human holds control:", Boolean(blocked));
res = fakeRes();
await route.handler(fakeReq("POST", "/cloak-browser/control", { session: "session-smoke", action: "return" }), res); await res.done;
console.log("✔ /control return →", manager.get("session-smoke").control.holder);

// request_help resolved by the human through /control.
const helpPromise = tools.get("browser_request_help").execute({ reason: "solve captcha", wait_seconds: 30 }, exec);
await new Promise((r) => setTimeout(r, 200));
res = fakeRes();
await route.handler(fakeReq("POST", "/cloak-browser/control", { session: "session-smoke", action: "return", note: "done" }), res); await res.done;
const help = await helpPromise;
console.log("✔ browser_request_help resolved:", help.completed, help.by);

await call("browser_close");
await writeFile("test/.smoke-ok", new Date().toISOString());
page.close();
for (const d of effects.reverse()) if (typeof d === "function") await d();
process.exit(0);
