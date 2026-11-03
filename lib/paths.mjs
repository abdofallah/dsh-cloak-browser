import { homedir } from "node:os";
import { join } from "node:path";

/** Path under DSH_HOME without importing a Harness package the Desktop runtime may not expose. */
export function dshHomeFallback(...segments) {
  const root = String(process.env.DSH_HOME ?? "").trim() || join(homedir(), ".dsh");
  return join(root, ...segments);
}
