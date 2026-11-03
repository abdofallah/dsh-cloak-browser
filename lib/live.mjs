// HTTP routes behind the sidebar Browser tab: state, change events, an MJPEG live view,
// and human input/take-over. Every route requires the same browser credential as /api.
import { assertAllowedUrl } from "./policy.mjs";

export const ROUTE_BASE = "/cloak-browser";
const MAX_BODY = 64 * 1024;

function send(res, status, body) {
  const text = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store, private",
    "x-content-type-options": "nosniff",
    "cross-origin-resource-policy": "same-origin"
  });
  res.end(text);
}

function readJson(req) {
  return new Promise((resolvePromise, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error("body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        resolvePromise(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

/** Origin/Host + browser-credential fence; when Connection is absent only loopback same-origin passes. */
function rejection(ctx, req) {
  const origin = req.headers.origin;
  if (req.headers["sec-fetch-site"] === "cross-site") return 403;
  if (origin && origin !== "null") {
    try {
      if (new URL(origin).host !== req.headers.host) return 403;
    } catch {
      return 403;
    }
  }
  if (req.method === "POST" && !/^\s*application\/json\s*(;|$)/i.test(req.headers["content-type"] ?? "")) return 415;
  const connection = ctx.get("connection");
  if (connection) return connection.requestRejection({ headers: req.headers });
  const host = String(req.headers.host ?? "").replace(/:\d+$/, "").replace(/^\[|\]$/g, "");
  return host === "localhost" || host === "::1" || /^127\./.test(host) ? undefined : 403;
}

export function registerLiveRoutes(ctx, manager, config, hooks = {}) {
  const webServer = ctx.get("webServer");
  if (!webServer) return () => {};
  const streams = new Set();

  const summary = async (key, session) => (session ? { open: true, ...(await session.state()) } : { open: false, key });

  const handler = async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const path = url.pathname.slice(ROUTE_BASE.length);
    const denied = rejection(ctx, req);
    if (denied) return send(res, denied, { error: "forbidden" });
    const key = url.searchParams.get("session") ?? "";

    try {
      if (req.method === "GET" && path === "/state") {
        const others = await Promise.all(manager.list().map(async ({ key: k, session }) => ({ key: k, label: session.label, url: (await session.state()).tabs.find((t) => t.active)?.url ?? "" })));
        return send(res, 200, { ...(await summary(key, key ? manager.get(key) : undefined)), browsers: others, config: { allowHumanNavigation: true } });
      }

      if (req.method === "GET" && path === "/events") {
        res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-store, no-transform", connection: "keep-alive", "x-accel-buffering": "no" });
        res.flushHeaders?.();
        let closed = false;
        let pending = false;
        const push = async (changedKey) => {
          if (closed || pending) return;
          if (key && changedKey && changedKey !== key) return;
          pending = true;
          setTimeout(async () => {
            pending = false;
            if (closed) return;
            try {
              const body = key ? await summary(key, manager.get(key)) : { browsers: manager.list().map(({ key: k, session }) => ({ key: k, control: session.control.holder, help: session.helpRequest?.reason ?? null })) };
              res.write(`data: ${JSON.stringify(body)}\n\n`);
            } catch {}
          }, 120);
        };
        const listener = (changedKey) => { push(changedKey); };
        manager.on("changed", listener);
        const heartbeat = setInterval(() => !closed && res.write(": ping\n\n"), 15000);
        const close = () => {
          if (closed) return;
          closed = true;
          clearInterval(heartbeat);
          manager.off("changed", listener);
          streams.delete(close);
          try { res.end(); } catch {}
        };
        streams.add(close);
        req.on("close", close);
        push(key);
        return;
      }

      if (req.method === "GET" && path === "/stream") {
        const session = manager.get(key);
        if (!session || session.closed) return send(res, 404, { error: "no browser for this session" });
        const boundary = "cloakframe";
        res.writeHead(200, {
          "content-type": `multipart/x-mixed-replace; boundary=${boundary}`,
          // no-transform makes DSH's gzip middleware skip this stream, which it would otherwise buffer.
          "cache-control": "no-store, private, no-transform",
          connection: "keep-alive",
          "x-content-type-options": "nosniff"
        });
        let closed = false;
        let busy = false;
        let latest;
        const write = (frame) => {
          latest = frame;
          if (busy || closed) return;
          busy = true;
          const bytes = Buffer.from(latest.data, "base64");
          const ok = res.write(`--${boundary}\r\nContent-Type: image/jpeg\r\nContent-Length: ${bytes.length}\r\nX-Frame-Width: ${latest.width}\r\nX-Frame-Height: ${latest.height}\r\n\r\n`) && res.write(bytes) && res.write("\r\n");
          const done = () => {
            busy = false;
            if (latest !== frame && !closed) write(latest);
          };
          if (ok) done();
          else res.once("drain", done);
        };
        const remove = await session.addFrameListener(write);
        const close = async () => {
          if (closed) return;
          closed = true;
          streams.delete(close);
          await remove().catch(() => {});
          try { res.end(); } catch {}
        };
        streams.add(close);
        req.on("close", close);
        session.once("close-stream", close);
        return;
      }

      if (req.method === "POST" && path === "/open") {
        const body = await readJson(req);
        const sessionKey = String(body.session ?? "");
        if (!sessionKey) return send(res, 400, { error: "session required" });
        if (body.url) assertAllowedUrl(String(body.url), { ...config, blockPrivateNetworks: config.blockPrivateNetworks && !config.humanMayOpenPrivate });
        const session = await manager.open(sessionKey, undefined, hooks.labelForKey?.(sessionKey) ?? "");
        if (body.url) await session.dispatchHumanInput({ type: "navigate", url: String(body.url) });
        return send(res, 200, await summary(sessionKey, session));
      }

      if (req.method === "POST" && path === "/input") {
        const body = await readJson(req);
        const session = manager.get(String(body.session ?? ""));
        if (!session) return send(res, 404, { error: "no browser for this session" });
        const event = body.event ?? {};
        if (event.type === "navigate" || event.type === "newtab") {
          if (event.url) assertAllowedUrl(String(event.url), { ...config, blockPrivateNetworks: config.blockPrivateNetworks && !config.humanMayOpenPrivate });
        }
        // Any human input while the agent holds control is an implicit take-over.
        if (session.control.holder === "agent" && !["move", "tab"].includes(event.type) && config.inputTakesControl) session.setControl("human", "user interacted in the live view");
        await session.dispatchHumanInput(event);
        return send(res, 200, { ok: true });
      }

      if (req.method === "POST" && path === "/control") {
        const body = await readJson(req);
        const session = manager.get(String(body.session ?? ""));
        if (!session) return send(res, 404, { error: "no browser for this session" });
        if (body.action === "take") session.setControl("human", "user took control");
        else if (body.action === "return") {
          if (session.helpRequest) session.resolveHelp({ completed: true, by: "user", note: String(body.note ?? "").slice(0, 1000) });
          session.setControl("agent", "");
        } else if (body.action === "decline") {
          session.resolveHelp({ completed: false, by: "user-declined", note: String(body.note ?? "").slice(0, 1000) });
          session.setControl("agent", "");
        } else return send(res, 400, { error: "action must be take, return or decline" });
        return send(res, 200, await summary(String(body.session), session));
      }

      if (req.method === "POST" && path === "/close") {
        const body = await readJson(req);
        const closed = await manager.close(String(body.session ?? ""));
        return send(res, 200, { closed });
      }

      return send(res, 404, { error: "not found" });
    } catch (error) {
      if (!res.headersSent) send(res, 500, { error: String(error?.message ?? error).slice(0, 500) });
      else try { res.end(); } catch {}
    }
  };

  // The webserver matches a prefix route at `prefix` or `prefix/...`, so register without a trailing slash.
  const dispose = webServer.register({ kind: "prefix", path: ROUTE_BASE, handler });
  return () => {
    for (const close of [...streams]) close();
    dispose();
  };
}
