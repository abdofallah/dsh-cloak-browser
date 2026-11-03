import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { buildCloakLaunchOptions, chooseBinary, findLegacyBinary, fingerprintSeedFor } from "../lib/launch.mjs";
import { browserKeyResolver, normalizeConfig } from "../lib/plugin.mjs";
import { BrowserNotStarted, SessionManager } from "../lib/manager.mjs";

function fakePage(url = "about:blank") {
  const handlers = {};
  return {
    _url: url,
    url() { return this._url; },
    async title() { return "T"; },
    on(event, fn) { (handlers[event] ??= []).push(fn); },
    isClosed() { return false; },
    async close() {},
    mainFrame() { return this; },
    handlers
  };
}

function fakeContext() {
  const pages = [fakePage()];
  const handlers = {};
  return {
    closed: false,
    pages: () => pages,
    async newPage() { const p = fakePage(); pages.push(p); return p; },
    on(event, fn) { (handlers[event] ??= []).push(fn); },
    async close() { this.closed = true; for (const fn of handlers.close ?? []) fn(); },
    setDefaultTimeout() {},
    setDefaultNavigationTimeout() {},
    async route() {}
  };
}

test("config defaults validate and reject inconsistent viewport", () => {
  const config = normalizeConfig({});
  assert.equal(config.headless, true);
  assert.equal(config.profileMode, "per-session");
  assert.throws(() => normalizeConfig({ viewportWidth: 1000 }), /both/);
  assert.throws(() => normalizeConfig({ proxyEnv: "bad name" }), /environment variable/);
});

test("launch options map config, proxy env and headless window size", () => {
  const config = normalizeConfig({ proxyEnv: "P", timezone: "Asia/Muscat", locale: "ar-OM" });
  const options = buildCloakLaunchOptions(config, { P: "http://proxy:8080" }, "seed1");
  assert.equal(options.proxy, "http://proxy:8080");
  assert.equal(options.geoip, true);
  assert.equal(options.timezone, "Asia/Muscat");
  assert.ok(options.args.includes("--fingerprint=seed1"));
  assert.ok(options.args.includes("--window-size=1366,900"));
  const noProxy = buildCloakLaunchOptions(config, {}, "");
  assert.equal(noProxy.proxy, undefined);
  assert.equal(noProxy.geoip, false);
});

test("fingerprint seed is stable per key and distinct across keys", () => {
  assert.equal(fingerprintSeedFor("a"), fingerprintSeedFor("a"));
  assert.notEqual(fingerprintSeedFor("a"), fingerprintSeedFor("b"));
});

test("binary choice prefers configured, then licensed, then the keyless legacy cache", async () => {
  const home = await mkdtemp(join(tmpdir(), "cbx-"));
  const env = {};
  const config = normalizeConfig({});
  assert.equal(chooseBinary(config, env, home).mode, "unlicensed");
  await mkdir(join(home, ".cloakbrowser", "chromium-146.0.1.2"), { recursive: true });
  await writeFile(join(home, ".cloakbrowser", "chromium-146.0.1.2", process.platform === "win32" ? "chrome.exe" : "chrome"), "");
  assert.equal(findLegacyBinary(env, home)?.version, "146.0.1.2");
  assert.equal(chooseBinary(config, env, home).mode, "legacy");
  assert.equal(chooseBinary(config, { CLOAKBROWSER_LICENSE_KEY: "cb_x" }, home).mode, "licensed");
  assert.equal(chooseBinary(normalizeConfig({ legacyBinaryFallback: false }), env, home).mode, "unlicensed");
});

test("manager isolates sessions, enforces limits and closes on request", async () => {
  const contexts = [];
  const config = normalizeConfig({ maxSessions: 2, profileMode: "ephemeral" });
  const manager = new SessionManager(config, {
    browserApiLoader: async () => ({ launchContext: async () => { const c = fakeContext(); contexts.push(c); return c; } }),
    licenseKeyResolver: () => undefined,
    binaryChooser: () => ({ mode: "configured", path: "x" })
  });
  const a = await manager.open("A");
  const again = await manager.open("A");
  assert.equal(a, again);
  const b = await manager.open("B");
  assert.notEqual(a, b);
  await assert.rejects(manager.open("C"), (error) => error instanceof BrowserNotStarted && error.reason === "session_limit");
  assert.equal(await manager.close("A"), true);
  assert.equal(contexts[0].closed, true);
  await manager.closeAll();
  assert.equal(contexts[1].closed, true);
});

test("unlicensed launch reports not_started instead of hanging on a prompt", async () => {
  const manager = new SessionManager(normalizeConfig({}), {
    browserApiLoader: async () => ({}),
    licenseKeyResolver: () => undefined,
    binaryChooser: () => ({ mode: "unlicensed" })
  });
  await assert.rejects(manager.open("A"), (error) => error instanceof BrowserNotStarted && error.reason === "no_license");
});

test("free license holds a single seat", async () => {
  const manager = new SessionManager(normalizeConfig({ profileMode: "ephemeral" }), {
    browserApiLoader: async () => ({ launchContext: async () => fakeContext(), validateLicense: async () => ({ valid: true, plan: "free" }) }),
    licenseKeyResolver: () => "cb_free",
    binaryChooser: () => ({ mode: "licensed" })
  });
  await manager.open("A");
  await assert.rejects(manager.open("B"), (error) => error.reason === "session_in_use");
});

test("human control blocks mutating agent calls but not reads", async () => {
  const manager = new SessionManager(normalizeConfig({ profileMode: "ephemeral" }), {
    browserApiLoader: async () => ({ launchContext: async () => fakeContext() }),
    licenseKeyResolver: () => undefined,
    binaryChooser: () => ({ mode: "configured", path: "x" })
  });
  const session = await manager.open("A");
  session.setControl("human", "testing");
  await assert.rejects(manager.run("A", undefined, async () => 1), /human currently controls/);
  assert.equal(await manager.run("A", undefined, async () => 2, { mutates: false }), 2);
  const help = session.requestHelp("captcha");
  session.setControl("agent");
  assert.deepEqual(await help, { completed: true, by: "human-returned-control" });
  await manager.closeAll();
});

test("subagents resolve to their root session's browser", () => {
  const agents = new Map([["root", { id: "root", session: { header: {} } }]]);
  const resolve = browserKeyResolver({ get: (name) => (name === "agents" ? { get: (id) => agents.get(id) } : undefined) }, normalizeConfig({}));
  const sub = { parentSession: "root", origin: "subagent", delegationDepth: 1 };
  assert.equal(resolve({ agent: { id: "child", session: { header: sub } } }), "root");
  assert.equal(resolve({ agent: { id: "root", session: { header: {} } } }), "root");
  const isolated = browserKeyResolver({ get: () => undefined }, normalizeConfig({ subagentsShareBrowser: false }));
  assert.equal(isolated({ agent: { id: "child", session: { header: sub } } }), "child");
});

test("a forked or resumed conversation keeps its own browser (it has its own sidebar)", () => {
  const agents = new Map([["original", { id: "original", session: { header: {} } }]]);
  const resolve = browserKeyResolver({ get: (name) => (name === "agents" ? { get: (id) => agents.get(id) } : undefined) }, normalizeConfig({}));
  const fork = { parentSession: "original", isSeeded: true, delegationDepth: 0 };
  assert.equal(resolve({ agent: { id: "forked", session: { header: fork } } }), "forked");
  // Parent gone (e.g. the original chat was closed): still its own key, never the dead parent's.
  agents.clear();
  assert.equal(resolve({ agent: { id: "forked", session: { header: fork } } }), "forked");
});
