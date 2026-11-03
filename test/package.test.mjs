import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const manifest = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

test("DSH runtime packages are peers provided by the host and accept 0.2", () => {
  for (const name of ["@deepseek-ai/dsh-llm", "@deepseek-ai/dsh-tools"]) {
    assert.equal(manifest.dependencies?.[name], undefined);
    assert.match(manifest.peerDependencies?.[name], /0\.2/);
  }
});

test("bundle exposes patch, client half, locales and icon", async () => {
  assert.equal(manifest.dsh.bundle.patch, "./cordis.patch.yml");
  assert.equal(manifest.dsh.client.platform, "web");
  assert.equal(manifest.exports["./client"], "./client.js");
  for (const file of ["client.js", "icon.svg", "locale/en.json", "locale/zh.json", "cordis.patch.yml"]) {
    assert.ok((await stat(new URL(`../${file}`, import.meta.url))).size > 0, file);
  }
  const en = JSON.parse(await readFile(new URL("../locale/en.json", import.meta.url), "utf8"));
  assert.ok(en.meta.title && en.meta.description);
});
