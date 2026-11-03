import assert from "node:assert/strict";
import test from "node:test";
import { Config, liveConfig } from "../lib/plugin.mjs";
import { crossCheck, diffOps, FIELDS, parseField, toText } from "../settings.js";

const write = Symbol.for("cosmokit.volatile.write");
const isRef = (value) => value !== null && typeof value === "object" && typeof value.get === "function" && !Array.isArray(value);

test("every Settings field is volatile in the Host Config", () => {
  const parsed = Config({});
  for (const field of FIELDS) assert.ok(isRef(parsed[field.key]), `${field.key} must be .volatile()`);
  // Structural fields stay ordinary (edited in cordis.patch.yml).
  for (const key of ["liveView", "claimBrowserUse", "routePrompt"]) assert.ok(!isRef(parsed[key]), key);
});

test("live config reads Settings edits without remounting and keeps the last valid pair", () => {
  const parsed = Config({ maxSessions: 3 });
  const live = liveConfig(parsed);
  assert.equal(live.maxSessions, 3);
  parsed.maxSessions[write](7);
  assert.equal(live.maxSessions, 7);
  parsed.viewportWidth[write](800);
  assert.equal(live.viewportWidth, 0, "half-set viewport pair is rejected");
  parsed.viewportHeight[write](600);
  assert.equal(live.viewportWidth, 800);
  assert.equal(live.viewportHeight, 600);
});

test("form parsing, cross-checks and diffs", () => {
  const field = (key) => FIELDS.find((f) => f.key === key);
  assert.deepEqual(parseField(field("maxSessions"), "12"), { ok: true, value: 12 });
  assert.equal(parseField(field("maxSessions"), "0").ok, false);
  assert.equal(parseField(field("maxSessions"), "1.5").ok, false);
  assert.deepEqual(parseField(field("geoip"), "auto"), { ok: true, value: "auto" });
  assert.deepEqual(parseField(field("geoip"), "true"), { ok: true, value: true });
  assert.deepEqual(parseField(field("allowedDomains"), "a.com\n *.b.com ,c.com\n"), { ok: true, value: ["a.com", "*.b.com", "c.com"] });
  assert.equal(toText(field("allowedDomains"), ["x.com", "y.com"]), "x.com\ny.com");
  assert.deepEqual(crossCheck({ proxyEnv: "bad name" }), { proxyEnv: "envName" });
  assert.deepEqual(diffOps({ headless: true, maxSessions: 5 }, { headless: true, maxSessions: 6 }), [{ op: "set", path: ["maxSessions"], value: 6 }]);
});
