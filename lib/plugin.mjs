// dsh-cloak-browser: CloakBrowser as DeepSeek Harness's one browser.
// Host half: config, browser_* tools, the exclusive browser-use slot, routing prompt,
// lifecycle and the live-view routes the sidebar Browser tab uses.
import z from "@deepseek-ai/schemastery";
import { dshHomeFallback } from "./paths.mjs";
import { SessionManager } from "./manager.mjs";
import { buildCloakLaunchOptions, chooseBinary, resolveCloakBrowserLicenseKey } from "./launch.mjs";
import { registerLiveRoutes } from "./live.mjs";
import { defaultKeyOf, ROUTING_PROMPT, toolDefinitions } from "./tools.mjs";

export const name = "cloak-browser";
export const inject = ["tools"];

// `.volatile()` marks a field editable from Settings → Plugins → Cloak Browser. The Loader
// commits volatile edits into the running plugin without a restart; the plugin reads them
// through `liveConfig`, so the next browser launch or tool call sees the new value.
// Fields left ordinary shape plugin structure (tools registered, routes, browser slot) and
// stay in cordis.patch.yml.
const V = (schema) => (typeof schema.volatile === "function" ? schema.volatile() : schema);

/** Settings whose change alters tool definitions (presence, descriptions, outer timeouts). */
const TOOL_SHAPING_FIELDS = new Set([
  "allowEvaluate", "actionTimeoutMs", "navigationTimeoutMs", "typingTimeoutMs",
  "autoSnapshot", "maxSnapshotElements", "maxTextChars", "helpWaitSeconds", "launchTimeoutMs"
]);

export const Config = z.object({
  headless: V(z.boolean().default(true).description("Run without a desktop window; watch and control it from the sidebar Browser tab.")),
  windowWidth: V(z.natural().min(320).max(7680).default(1366).description("Headless window width.")),
  windowHeight: V(z.natural().min(240).max(4320).default(900).description("Headless window height.")),
  humanize: V(z.boolean().default(false).description("CloakBrowser human-like mouse/keyboard timing (slower, stealthier).")),
  humanPreset: V(z.union(["default", "careful"]).default("default")),
  profileMode: V(z.union(["per-session", "shared", "ephemeral"]).default("per-session").description("per-session keeps cookies per DSH session; shared uses one profile for all; ephemeral forgets everything.")),
  persistentProfileRoot: V(z.string().default("").description("Profile root; empty uses <DSH_HOME>/cloak-browser/profiles.")),
  subagentsShareBrowser: V(z.boolean().default(true).description("Subagents drive their root session's browser instead of opening their own.")),
  maxSessions: V(z.natural().min(1).max(50).default(5)),
  maxPages: V(z.natural().min(1).max(30).default(8)),
  idleCloseMinutes: V(z.natural().max(1440).default(30).description("Close a browser nobody used or watched for this long; 0 disables.")),
  closeOnSessionEnd: V(z.boolean().default(true)),
  binaryPath: V(z.string().default("").description("Explicit Chromium executable; empty lets CloakBrowser manage it.")),
  legacyBinaryFallback: V(z.boolean().default(true).description("Without a license key, use a keyless cached build (~/.cloakbrowser/chromium-<ver>) when present.")),
  browserVersion: V(z.string().default("")),
  releaseChannel: V(z.union(["stable", "preview"]).default("stable")),
  launchTimeoutMs: V(z.natural().min(5000).max(900000).default(300000).description("First launch may download ~200 MB.")),
  proxyEnv: V(z.string().default("CLOAKBROWSER_PROXY_URL").description("Environment variable holding the proxy URL.")),
  proxyFailClosed: V(z.boolean().default(true).description("Refuse to launch when the configured proxy is unreachable instead of connecting directly.")),
  proxyProbeTimeoutMs: V(z.natural().min(500).max(60000).default(5000)),
  geoip: V(z.union([z.boolean(), z.const("auto")]).default("auto")),
  timezone: V(z.string().default("")),
  locale: V(z.string().default("")),
  fingerprintSeed: V(z.string().default("")),
  fingerprintNoise: V(z.boolean().default(false)),
  fingerprintWindowsFontMetrics: V(z.boolean().default(false)),
  allowThirdPartyCookies: V(z.boolean().default(false)),
  fingerprintStorageQuotaMb: V(z.natural().default(0)),
  viewportWidth: V(z.natural().max(10000).default(0)),
  viewportHeight: V(z.natural().max(10000).default(0)),
  extensionPaths: V(z.array(String).default([])),
  extraArgs: V(z.array(String).default([])),
  allowedDomains: V(z.array(String).default([])),
  blockedDomains: V(z.array(String).default([])),
  blockPrivateNetworks: V(z.boolean().default(false).description("Block localhost/private-network URLs for the agent.")),
  humanMayOpenPrivate: V(z.boolean().default(true)),
  actionTimeoutMs: V(z.natural().min(1000).max(120000).default(15000)),
  typingTimeoutMs: V(z.natural().min(1000).max(300000).default(90000)),
  navigationTimeoutMs: V(z.natural().min(1000).max(180000).default(45000)),
  maxSnapshotElements: V(z.natural().min(10).max(500).default(150)),
  maxTextChars: V(z.natural().min(1000).max(100000).default(12000)),
  autoSnapshot: V(z.boolean().default(true)),
  screenshotFormat: V(z.union(["jpeg", "png"]).default("jpeg")),
  screenshotQuality: V(z.natural().min(20).max(100).default(80)),
  allowEvaluate: V(z.boolean().default(false).description("Expose browser_evaluate (model-written JavaScript in the page).")),
  downloadSubdir: V(z.string().default("downloads")),
  helpWaitSeconds: V(z.natural().min(5).max(1800).default(600)),
  liveView: z.boolean().default(true),
  liveViewQuality: V(z.natural().min(20).max(95).default(70)),
  liveViewMaxWidth: V(z.natural().min(320).max(3840).default(1600)),
  liveViewMaxHeight: V(z.natural().min(240).max(2160).default(1200)),
  inputTakesControl: V(z.boolean().default(true).description("Human input in the live view takes control from the agent.")),
  claimBrowserUse: z.boolean().default(true).description("Hold DSH's exclusive browser-use provider slot so no second browser provider can load."),
  routePrompt: z.boolean().default(true)
});

/** Unwrap a parsed field: volatile refs expose `get()`, ordinary fields are plain values. */
function unwrap(value) {
  return value !== null && typeof value === "object" && typeof value.get === "function" && !Array.isArray(value) ? value.get() : value;
}

const DEFAULTS = Object.freeze(Object.fromEntries(Object.entries(Config({})).map(([key, value]) => [key, unwrap(value)])));

function validate(config) {
  if ((config.viewportWidth === 0) !== (config.viewportHeight === 0)) throw new Error("viewportWidth and viewportHeight must both be 0 or both set");
  if (config.proxyEnv && !/^[A-Za-z_][A-Za-z0-9_]*$/.test(config.proxyEnv)) throw new Error("proxyEnv must be an environment variable name");
  if (config.fingerprintSeed && !/^[A-Za-z0-9_-]{1,128}$/.test(config.fingerprintSeed)) throw new Error("fingerprintSeed may contain letters, digits, _ and - (max 128)");
}

/** Plain snapshot of a config (tests and one-off callers). */
export function normalizeConfig(input = {}) {
  const config = { ...DEFAULTS };
  for (const [key, value] of Object.entries(input ?? {})) config[key] = unwrap(value);
  validate(config);
  return Object.freeze(config);
}

/**
 * A config object whose properties always read the current value: volatile fields read through
 * their Loader-owned refs, so Settings edits apply without restarting the plugin. Invalid live
 * edits (rejected by validate) fall back to the last good value.
 */
export function liveConfig(input = {}) {
  const source = input ?? {};
  let lastGood = normalizeConfig(source);
  const read = () => {
    const next = { ...DEFAULTS };
    for (const [key, value] of Object.entries(source)) next[key] = unwrap(value);
    try {
      validate(next);
      lastGood = next;
    } catch {
      // Keep the previous valid snapshot; the form shows the Loader's own validation.
    }
    return lastGood;
  };
  return new Proxy({}, {
    get: (_target, key) => (typeof key === "string" ? read()[key] : undefined),
    has: (_target, key) => key in DEFAULTS,
    ownKeys: () => Reflect.ownKeys(DEFAULTS),
    getOwnPropertyDescriptor: (_target, key) => (key in DEFAULTS ? { enumerable: true, configurable: true, value: read()[key] } : undefined)
  });
}

/** The browser key for an execution: its session id, or its root session's id when subagents share. */
export function browserKeyResolver(ctx, config) {
  return (exec) => {
    const own = defaultKeyOf(exec);
    if (!config.subagentsShareBrowser || !exec.agent) return own;
    const agents = ctx.get?.("agents");
    let agent = exec.agent;
    for (let depth = 0; depth < 16; depth++) {
      const parentId = agent?.session?.header?.parentSession;
      if (!parentId) break;
      const parent = agents?.get?.(parentId);
      if (!parent) return String(parentId);
      agent = parent;
    }
    return String(agent?.id ?? own);
  };
}

function claimBrowserUse(ctx) {
  const existing = ctx.get?.("browserUse");
  if (existing) {
    ctx.effect(() => existing.register("cloak-browser"), "cloak-browser.browserUse");
    return;
  }
  // The Desktop runtime ships no @deepseek-ai/dsh-browser-use row; provide a compatible
  // single-slot registry so a second browser-use provider is refused while this one loads.
  let holder;
  const registry = {
    get providerName() { return holder; },
    register(providerName) {
      if (holder !== undefined) throw new Error(`browser use provider "${holder}" is already registered`);
      holder = providerName;
      return () => { if (holder === providerName) holder = undefined; };
    }
  };
  try {
    ctx.reflect.provide("browserUse", registry);
    registry.register("cloak-browser");
  } catch (error) {
    ctx.logger?.("cloak-browser")?.warn?.(`could not claim the browser-use slot: ${error.message}`);
  }
}

export function createCloakBrowserPlugin(dependencies = {}) {
  function apply(ctx, inputConfig) {
    const config = liveConfig(inputConfig);
    const keyFor = browserKeyResolver(ctx, config);
    const manager = new SessionManager(config, {
      browserApiLoader: dependencies.browserApiLoader,
      licenseKeyResolver: dependencies.licenseKeyResolver,
      binaryChooser: dependencies.binaryChooser,
      profileRoot: dependencies.profileRoot || dshHomeFallback("cloak-browser", "profiles")
    });
    const cwdFor = (exec) => {
      try {
        return ctx.get?.("workingDirectory")?.get(exec.agent.session) ?? process.cwd();
      } catch {
        return process.cwd();
      }
    };
    // Tool definitions capture outer timeouts and descriptions, and browser_evaluate exists only
    // while allowEvaluate is on, so a Settings edit to one of those fields re-registers the set.
    let toolDisposers = [];
    const registerTools = () => {
      for (const dispose of toolDisposers) dispose();
      toolDisposers = toolDefinitions(ctx, manager, config, { keyFor, cwdFor }).map((definition) =>
        ctx.effect(() => ctx.tools.register(definition), `cloak-browser.tool(${definition.name})`));
    };
    registerTools();
    ctx.on?.("loader/volatile-update", (paths) => {
      if (Array.isArray(paths) && paths.some((path) => TOOL_SHAPING_FIELDS.has(String(path?.[0])))) registerTools();
    });

    if (config.claimBrowserUse) claimBrowserUse(ctx);

    // The plugin ships its own Settings page (client half); no auto-generated form.
    ctx.inject?.(["settings"], (settingsCtx) => {
      settingsCtx.effect(() => settingsCtx.settings.configure({ auto: false }, ctx.fiber), "cloak-browser.settings-page");
    });

    ctx.on?.("agent/disposed", ({ agent }) => {
      if (!config.closeOnSessionEnd) return;
      const key = String(agent?.id ?? "");
      if (key && manager.has(key)) manager.close(key).catch(() => {});
    });

    // The reaper always runs; idleCloseMinutes (live) decides whether it closes anything.
    ctx.effect(() => {
      const timer = setInterval(() => manager.reapIdle().catch(() => {}), 60_000);
      timer.unref?.();
      return () => clearInterval(timer);
    }, "cloak-browser.idle-reaper");

    if (config.routePrompt) {
      ctx.inject?.(["systemPrompt"], (promptCtx) => {
        promptCtx.effect(() => promptCtx.systemPrompt.section({ name: "app:cloak-browser-routing", order: -45, text: ROUTING_PROMPT }), "cloak-browser.systemPrompt");
      });
    }

    if (config.liveView) {
      ctx.inject?.(["webServer"], (webCtx) => {
        webCtx.effect(() => registerLiveRoutes(webCtx, manager, config), "cloak-browser.live-routes");
      });
    }

    // Close every browser (and await it) when the plugin unloads.
    ctx.effect(() => async () => manager.closeAll(), "cloak-browser.closeAll()");
    return manager;
  }
  return { name, inject, Config, apply };
}

const defaultPlugin = createCloakBrowserPlugin();
export const apply = defaultPlugin.apply;
export { buildCloakLaunchOptions, chooseBinary, resolveCloakBrowserLicenseKey, SessionManager };
