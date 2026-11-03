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

export const Config = z.object({
  headless: z.boolean().default(true).description("Run without a desktop window; watch and control it from the sidebar Browser tab."),
  windowWidth: z.natural().default(1366).description("Headless window width."),
  windowHeight: z.natural().default(900).description("Headless window height."),
  humanize: z.boolean().default(false).description("CloakBrowser human-like mouse/keyboard timing (slower, stealthier)."),
  humanPreset: z.union(["default", "careful"]).default("default"),
  profileMode: z.union(["per-session", "shared", "ephemeral"]).default("per-session").description("per-session keeps cookies per DSH session; shared uses one profile for all; ephemeral forgets everything."),
  persistentProfileRoot: z.string().default("").description("Profile root; empty uses <DSH_HOME>/cloak-browser/profiles."),
  subagentsShareBrowser: z.boolean().default(true).description("Subagents drive their root session's browser instead of opening their own."),
  maxSessions: z.natural().min(1).max(50).default(5),
  maxPages: z.natural().min(1).max(30).default(8),
  idleCloseMinutes: z.natural().default(30).description("Close a browser nobody used or watched for this long; 0 disables."),
  closeOnSessionEnd: z.boolean().default(true),
  binaryPath: z.string().default("").description("Explicit Chromium executable; empty lets CloakBrowser manage it."),
  legacyBinaryFallback: z.boolean().default(true).description("Without a license key, use a keyless cached build (~/.cloakbrowser/chromium-<ver>) when present."),
  browserVersion: z.string().default(""),
  releaseChannel: z.union(["stable", "preview"]).default("stable"),
  launchTimeoutMs: z.natural().min(5000).max(900000).default(300000).description("First launch may download ~200 MB."),
  proxyEnv: z.string().default("CLOAKBROWSER_PROXY_URL").description("Environment variable holding the proxy URL."),
  proxyFailClosed: z.boolean().default(true).description("Refuse to launch when the configured proxy is unreachable instead of connecting directly."),
  proxyProbeTimeoutMs: z.natural().default(5000),
  geoip: z.union([z.boolean(), z.const("auto")]).default("auto"),
  timezone: z.string().default(""),
  locale: z.string().default(""),
  fingerprintSeed: z.string().default(""),
  fingerprintNoise: z.boolean().default(false),
  fingerprintWindowsFontMetrics: z.boolean().default(false),
  allowThirdPartyCookies: z.boolean().default(false),
  fingerprintStorageQuotaMb: z.natural().default(0),
  viewportWidth: z.natural().default(0),
  viewportHeight: z.natural().default(0),
  extensionPaths: z.array(String).default([]),
  extraArgs: z.array(String).default([]),
  allowedDomains: z.array(String).default([]),
  blockedDomains: z.array(String).default([]),
  blockPrivateNetworks: z.boolean().default(false).description("Block localhost/private-network URLs for the agent."),
  humanMayOpenPrivate: z.boolean().default(true),
  actionTimeoutMs: z.natural().min(1000).max(120000).default(15000),
  typingTimeoutMs: z.natural().min(1000).max(300000).default(90000),
  navigationTimeoutMs: z.natural().min(1000).max(180000).default(45000),
  maxSnapshotElements: z.natural().min(10).max(500).default(150),
  maxTextChars: z.natural().min(1000).max(100000).default(12000),
  autoSnapshot: z.boolean().default(true),
  screenshotFormat: z.union(["jpeg", "png"]).default("jpeg"),
  screenshotQuality: z.natural().min(20).max(100).default(80),
  allowEvaluate: z.boolean().default(false).description("Expose browser_evaluate (model-written JavaScript in the page)."),
  downloadSubdir: z.string().default("downloads"),
  helpWaitSeconds: z.natural().min(5).max(1800).default(600),
  liveView: z.boolean().default(true),
  liveViewQuality: z.natural().min(20).max(95).default(70),
  liveViewMaxWidth: z.natural().min(320).max(3840).default(1600),
  liveViewMaxHeight: z.natural().min(240).max(2160).default(1200),
  inputTakesControl: z.boolean().default(true).description("Human input in the live view takes control from the agent."),
  claimBrowserUse: z.boolean().default(true).description("Hold DSH's exclusive browser-use provider slot so no second browser provider can load."),
  routePrompt: z.boolean().default(true)
});

const DEFAULTS = Object.freeze(Config({}));

export function normalizeConfig(input = {}) {
  const config = { ...DEFAULTS, ...input };
  if ((config.viewportWidth === 0) !== (config.viewportHeight === 0)) throw new Error("viewportWidth and viewportHeight must both be 0 or both set");
  if (config.proxyEnv && !/^[A-Za-z_][A-Za-z0-9_]*$/.test(config.proxyEnv)) throw new Error("proxyEnv must be an environment variable name");
  if (config.fingerprintSeed && !/^[A-Za-z0-9_-]{1,128}$/.test(config.fingerprintSeed)) throw new Error("fingerprintSeed may contain letters, digits, _ and - (max 128)");
  return Object.freeze(config);
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
    const config = normalizeConfig(inputConfig);
    const keyFor = browserKeyResolver(ctx, config);
    const manager = new SessionManager(config, {
      browserApiLoader: dependencies.browserApiLoader,
      licenseKeyResolver: dependencies.licenseKeyResolver,
      binaryChooser: dependencies.binaryChooser,
      profileRoot: config.persistentProfileRoot || dependencies.profileRoot || dshHomeFallback("cloak-browser", "profiles")
    });
    const cwdFor = (exec) => {
      try {
        return ctx.get?.("workingDirectory")?.get(exec.agent.session) ?? process.cwd();
      } catch {
        return process.cwd();
      }
    };
    for (const definition of toolDefinitions(ctx, manager, config, { keyFor, cwdFor })) {
      ctx.effect(() => ctx.tools.register(definition), `cloak-browser.tool(${definition.name})`);
    }

    if (config.claimBrowserUse) claimBrowserUse(ctx);

    ctx.on?.("agent/disposed", ({ agent }) => {
      if (!config.closeOnSessionEnd) return;
      const key = String(agent?.id ?? "");
      if (key && manager.has(key)) manager.close(key).catch(() => {});
    });

    if (config.idleCloseMinutes > 0) {
      ctx.effect(() => {
        const timer = setInterval(() => manager.reapIdle().catch(() => {}), 60_000);
        timer.unref?.();
        return () => clearInterval(timer);
      }, "cloak-browser.idle-reaper");
    }

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
