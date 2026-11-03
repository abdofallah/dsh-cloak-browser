// Launch-option assembly, license/binary resolution and proxy safeguards.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { connect } from "node:net";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

/** Directory CloakBrowser keeps binaries, keys and validation caches in. */
export function cloakCacheDir(env = process.env, home = homedir()) {
  return String(env.CLOAKBROWSER_CACHE_DIR ?? "").trim() || join(home, ".cloakbrowser");
}

/** License key from the environment or the CLI-managed key file, never from tool arguments. */
export function resolveCloakBrowserLicenseKey(env = process.env, home = homedir()) {
  const environmentKey = String(env.CLOAKBROWSER_LICENSE_KEY ?? "").trim();
  if (environmentKey) return environmentKey;
  try {
    const fileKey = readFileSync(join(cloakCacheDir(env, home), "license.key"), "utf8").trim();
    return fileKey || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Newest keyless binary left by the 0.6 wrapper (`chromium-<version>` without the `-pro`
 * suffix). It runs without a license, so it is the fallback when no key has been claimed.
 */
export function findLegacyBinary(env = process.env, home = homedir(), platform = process.platform) {
  const dir = cloakCacheDir(env, home);
  let names;
  try {
    names = readdirSync(dir);
  } catch {
    return undefined;
  }
  const exe = platform === "win32" ? "chrome.exe" : platform === "darwin" ? join("Chromium.app", "Contents", "MacOS", "Chromium") : "chrome";
  const candidates = names
    .filter((name) => /^chromium-\d+(?:\.\d+)+$/.test(name))
    .map((name) => ({ name, version: name.slice("chromium-".length).split(".").map(Number), path: join(dir, name, exe) }))
    .filter((entry) => {
      try {
        return statSync(entry.path).isFile();
      } catch {
        return false;
      }
    })
    .sort((a, b) => {
      for (let i = 0; i < Math.max(a.version.length, b.version.length); i++) {
        const delta = (b.version[i] ?? 0) - (a.version[i] ?? 0);
        if (delta !== 0) return delta;
      }
      return 0;
    });
  return candidates[0] ? { path: candidates[0].path, version: candidates[0].name.slice("chromium-".length) } : undefined;
}

/** Stable, non-reversible per-key fingerprint seed so one Session keeps one identity. */
export function fingerprintSeedFor(key) {
  return createHash("sha256").update("dsh-cloak-browser\0").update(String(key)).digest("hex").slice(0, 24);
}

/** Hashed directory name for a per-session persistent profile. */
export function profileDirFor(root, key) {
  return resolve(root, `session-${createHash("sha256").update(String(key)).digest("hex").slice(0, 20)}`);
}

/** Validate that a proxy answers before launching, so a dead proxy never degrades to a direct connection. */
export function probeProxy(proxyUrl, timeoutMs = 5000) {
  let url;
  try {
    url = new URL(proxyUrl);
  } catch (error) {
    return Promise.reject(new Error("proxy URL in the configured environment variable is invalid", { cause: error }));
  }
  const defaultPort = url.protocol.startsWith("socks") ? 1080 : url.protocol === "https:" ? 443 : 80;
  const port = Number(url.port || defaultPort);
  return new Promise((resolvePromise, reject) => {
    const socket = connect({ host: url.hostname, port });
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error(`proxy ${url.hostname}:${port} did not answer within ${timeoutMs} ms; refusing to fall back to a direct connection`));
    }, timeoutMs);
    socket.once("connect", () => {
      clearTimeout(timer);
      socket.end();
      resolvePromise();
    });
    socket.once("error", (error) => {
      clearTimeout(timer);
      reject(new Error(`proxy ${url.hostname}:${port} is unreachable (${error.code ?? error.message}); refusing to fall back to a direct connection`));
    });
  });
}

/** Map plugin Config onto CloakBrowser launch options. */
export function buildCloakLaunchOptions(config, env = process.env, automaticFingerprintSeed = "") {
  const proxy = config.proxyEnv ? String(env[config.proxyEnv] ?? "").trim() || undefined : undefined;
  const fingerprintSeed = config.fingerprintSeed || automaticFingerprintSeed;
  const args = [];
  if (fingerprintSeed) args.push(`--fingerprint=${fingerprintSeed}`);
  if (!config.fingerprintNoise) args.push("--fingerprint-noise=false");
  if (config.fingerprintWindowsFontMetrics) args.push("--fingerprint-windows-font-metrics");
  if (config.allowThirdPartyCookies) args.push("--fingerprint-allow-3p-cookies");
  if (config.fingerprintStorageQuotaMb > 0) args.push(`--fingerprint-storage-quota=${config.fingerprintStorageQuotaMb}`);
  if (config.viewportWidth > 0) {
    args.push(`--fingerprint-screen-width=${config.viewportWidth}`);
    args.push(`--fingerprint-screen-height=${config.viewportHeight}`);
  } else if (config.headless && config.windowWidth > 0) {
    // Headless Chromium otherwise opens an 800x600 window, too small for the live view.
    args.push(`--window-size=${config.windowWidth},${config.windowHeight}`);
  }
  for (const extra of config.extraArgs ?? []) args.push(extra);
  return {
    headless: config.headless,
    humanize: config.humanize,
    humanPreset: config.humanPreset,
    geoip: config.geoip === true || (config.geoip === "auto" && Boolean(proxy)),
    releaseChannel: config.releaseChannel,
    ...(proxy ? { proxy } : {}),
    ...(config.timezone ? { timezone: config.timezone } : {}),
    ...(config.locale ? { locale: config.locale } : {}),
    ...(config.browserVersion ? { browserVersion: config.browserVersion } : {}),
    ...(config.extensionPaths?.length ? { extensionPaths: [...config.extensionPaths] } : {}),
    ...(args.length > 0 ? { args } : {}),
    ...(config.viewportWidth > 0 ? { viewport: { width: config.viewportWidth, height: config.viewportHeight } } : {})
  };
}

/**
 * Decide which binary to run. A configured path wins; a licensed install uses the managed
 * download; without a key the newest keyless legacy cache is used when allowed.
 */
export function chooseBinary(config, env = process.env, home = homedir()) {
  if (config.binaryPath) {
    if (!existsSync(config.binaryPath)) throw new Error(`binaryPath "${config.binaryPath}" does not exist`);
    return { mode: "configured", path: config.binaryPath };
  }
  if (String(env.CLOAKBROWSER_BINARY_PATH ?? "").trim()) return { mode: "environment", path: env.CLOAKBROWSER_BINARY_PATH };
  if (resolveCloakBrowserLicenseKey(env, home)) return { mode: "licensed" };
  if (config.legacyBinaryFallback) {
    const legacy = findLegacyBinary(env, home);
    if (legacy) return { mode: "legacy", path: legacy.path, version: legacy.version };
  }
  return { mode: "unlicensed" };
}

/** Run a launch with CLOAKBROWSER_BINARY_PATH pointed at a chosen binary; callers serialize launches. */
export async function withBinaryOverride(binaryPath, launch) {
  if (!binaryPath) return launch();
  const previous = process.env.CLOAKBROWSER_BINARY_PATH;
  process.env.CLOAKBROWSER_BINARY_PATH = binaryPath;
  try {
    return await launch();
  } finally {
    if (previous === undefined) delete process.env.CLOAKBROWSER_BINARY_PATH;
    else process.env.CLOAKBROWSER_BINARY_PATH = previous;
  }
}

export async function ensureDir(path) {
  await mkdir(path, { recursive: true, mode: 0o700 });
  return path;
}
