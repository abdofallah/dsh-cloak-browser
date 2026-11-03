// Owns every BrowserSession: one per DSH Session id, lazily launched, serialized launches,
// license-aware occupancy, idle reaping and change notification for the live view.
import { EventEmitter } from "node:events";
import { assertAllowedUrl } from "./policy.mjs";
import { abortError, BrowserSession, throwIfAborted } from "./session.mjs";
import {
  buildCloakLaunchOptions,
  chooseBinary,
  ensureDir,
  fingerprintSeedFor,
  probeProxy,
  profileDirFor,
  resolveCloakBrowserLicenseKey,
  withBinaryOverride
} from "./launch.mjs";

export async function defaultBrowserApiLoader() {
  return import("cloakbrowser");
}

export class BrowserNotStarted extends Error {
  constructor(reason, message) {
    super(message);
    this.name = "BrowserNotStarted";
    this.reason = reason;
  }
}

export class SessionManager extends EventEmitter {
  constructor(config, options = {}) {
    super();
    this.setMaxListeners(100);
    this.config = config;
    this.browserApiLoader = options.browserApiLoader ?? defaultBrowserApiLoader;
    this.licenseKeyResolver = options.licenseKeyResolver ?? (() => resolveCloakBrowserLicenseKey());
    this.binaryChooser = options.binaryChooser ?? ((cfg) => chooseBinary(cfg));
    this.profileRoot = options.profileRoot;
    this.env = options.env ?? process.env;
    this.sessions = new Map();
    this.launchTail = Promise.resolve();
    this.licenseInspection = undefined;
    this.disposed = false;
  }

  async inspectLicense() {
    if (!this.licenseInspection) {
      this.licenseInspection = (async () => {
        const key = this.licenseKeyResolver();
        if (!key) return { tier: "keyless" };
        const api = await this.browserApiLoader();
        if (typeof api.validateLicense !== "function") return { tier: "unknown" };
        const info = await api.validateLicense(key);
        if (!info?.valid) return { tier: "invalid" };
        return { tier: String(info.plan ?? "unknown").trim().toLowerCase() || "unknown" };
      })().catch(() => ({ tier: "unknown" }));
    }
    return this.licenseInspection;
  }

  async serializeLaunch(task) {
    let release;
    const prior = this.launchTail;
    this.launchTail = new Promise((resolveTail) => { release = resolveTail; });
    await prior.catch(() => {});
    try {
      return await task();
    } finally {
      release();
    }
  }

  get(key) {
    const entry = this.sessions.get(key);
    return entry?.session;
  }

  has(key) {
    return this.sessions.has(key);
  }

  list() {
    return [...this.sessions.entries()].filter(([, entry]) => entry.session && !entry.session.closed).map(([key, entry]) => ({ key, session: entry.session }));
  }

  /** Launch (once) and return the session for a key. */
  async open(key, signal, label = "") {
    if (this.disposed) throw new Error("cloak-browser is unloading");
    if (!key) throw new Error("browser tools require an Agent-scoped execution");
    throwIfAborted(signal);
    const existing = this.sessions.get(key);
    if (existing) {
      const session = await existing.pending;
      if (!session.closed) return session;
      this.sessions.delete(key);
    }
    return this.serializeLaunch(async () => {
      const again = this.sessions.get(key);
      if (again) return again.pending;
      const live = this.list().length;
      if (live >= this.config.maxSessions) {
        throw new BrowserNotStarted("session_limit", `maxSessions (${this.config.maxSessions}) browsers are already open; close one with browser_close first.`);
      }
      const license = await this.inspectLicense();
      if (license.tier === "free" && live > 0) {
        throw new BrowserNotStarted("session_in_use", "Another DSH session already holds the single CloakBrowser Free seat. Close that browser or upgrade the license.");
      }
      const entry = { pending: this.launch(key, label, license), session: undefined };
      this.sessions.set(key, entry);
      try {
        entry.session = await entry.pending;
      } catch (error) {
        if (this.sessions.get(key) === entry) this.sessions.delete(key);
        if (/session limit reached/i.test(String(error?.message ?? error))) {
          throw new BrowserNotStarted("license_server", "CloakBrowser's license server reports the Free seat is occupied (another device or a stale lease). Do not retry repeatedly.");
        }
        throw error;
      }
      if (signal?.aborted) {
        await this.close(key);
        throw abortError();
      }
      this.emit("changed");
      return entry.session;
    });
  }

  async launch(key, label, license) {
    const api = await this.browserApiLoader();
    const binary = this.binaryChooser(this.config);
    if (binary.mode === "unlicensed") {
      throw new BrowserNotStarted(
        "no_license",
        "CloakBrowser needs a license key (free with an email). Run `npx cloakbrowser login` once, or set CLOAKBROWSER_LICENSE_KEY in the environment that starts DSH, then retry. Alternatively set binaryPath in the cloak-browser plugin config."
      );
    }
    const options = buildCloakLaunchOptions(this.config, this.env, fingerprintSeedFor(key));
    if (options.proxy && this.config.proxyFailClosed) await probeProxy(options.proxy, this.config.proxyProbeTimeoutMs);
    let context;
    await withBinaryOverride(binary.path, async () => {
      if (this.config.profileMode === "ephemeral") {
        context = await api.launchContext(options);
      } else {
        const root = this.config.persistentProfileRoot || this.profileRoot;
        if (!root) throw new Error("profileMode requires persistentProfileRoot");
        const userDataDir = this.config.profileMode === "shared" ? await ensureDir(`${root}/shared`) : await ensureDir(profileDirFor(root, key));
        context = await api.launchPersistentContext({ ...options, userDataDir });
      }
    });
    try {
      context.setDefaultTimeout?.(this.config.actionTimeoutMs);
      context.setDefaultNavigationTimeout?.(this.config.navigationTimeoutMs);
      if (typeof context.route === "function") {
        await context.route("**/*", async (route) => {
          try {
            const request = route.request();
            if (request.isNavigationRequest()) assertAllowedUrl(request.url(), this.config);
            await route.continue();
          } catch {
            await route.abort("blockedbyclient").catch(() => {});
          }
        });
      }
      const session = new BrowserSession(context, this.config, {
        key,
        label,
        binary: { mode: binary.mode, version: binary.version ?? null, licenseTier: license.tier }
      });
      session.on("state", () => this.emit("changed", key));
      context.on?.("close", () => {
        const current = this.sessions.get(key);
        if (current?.session === session) this.sessions.delete(key);
        this.emit("changed", key);
      });
      return session;
    } catch (error) {
      await context.close().catch(() => {});
      throw error;
    }
  }

  async run(key, signal, task, { mutates = true } = {}) {
    const session = this.get(key);
    if (!session || session.closed) throw new Error("no browser is open for this session; call browser_open first");
    return session.enqueue(signal, async () => {
      if (mutates && !session.agentMayAct()) {
        throw new Error("the human currently controls this browser (take-over in the Cloak Browser sidebar tab). Wait, or use browser_request_help to ask for it back; read-only tools still work.");
      }
      session.touched = Date.now();
      const value = await task(session);
      throwIfAborted(signal);
      return value;
    });
  }

  async close(key) {
    const entry = this.sessions.get(key);
    if (!entry) return false;
    this.sessions.delete(key);
    try {
      const session = await entry.pending;
      await session.close();
    } catch {
      // A failed launch left nothing to close.
    }
    this.emit("changed", key);
    return true;
  }

  async reapIdle(now = Date.now()) {
    if (!(this.config.idleCloseMinutes > 0)) return;
    const limit = this.config.idleCloseMinutes * 60_000;
    for (const { key, session } of this.list()) {
      const last = Math.max(session.touched ?? 0, session.lastAction?.at ?? 0);
      if (session.frameListeners.size > 0 || session.control.holder === "human") continue;
      if (now - last > limit) await this.close(key);
    }
  }

  async closeAll() {
    this.disposed = true;
    await Promise.all([...this.sessions.keys()].map((key) => this.close(key)));
  }
}
