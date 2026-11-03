import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";
import { browserDirectory, registerLiveRoutes, ROUTE_BASE } from "../lib/live.mjs";

test("browser directory rows carry what the composer dock shows", async () => {
  const page = { url: () => "https://assetstore.unity.com/account/assets", title: async () => "My Assets", isClosed: () => false };
  const session = { activePage: page, livePages: () => [page, page], control: { holder: "human" }, helpRequest: { reason: "log in" }, lastAction: { label: "open" } };
  const rows = await browserDirectory({ list: () => [{ key: "session-a", session }] });
  assert.deepEqual(rows, [{ key: "session-a", control: "human", help: "log in", url: "https://assetstore.unity.com/account/assets", title: "My Assets", tabs: 2, lastAction: "open" }]);
});

// Same longest-prefix rule as @deepseek-ai/dsh-host-webserver `match()`.
function matches(prefix, pathname) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

test("live routes register a prefix the DSH webserver actually matches", () => {
  const routes = [];
  const ctx = { get: (name) => (name === "webServer" ? { register: (r) => { routes.push(r); return () => {}; } } : undefined) };
  const manager = Object.assign(new EventEmitter(), { list: () => [], get: () => undefined });
  registerLiveRoutes(ctx, manager, {});
  assert.equal(routes.length, 1);
  assert.equal(routes[0].kind, "prefix");
  for (const path of ["/state", "/events", "/stream", "/input", "/control", "/open", "/close"]) {
    assert.ok(matches(routes[0].path, `${ROUTE_BASE}${path}`), path);
  }
});
