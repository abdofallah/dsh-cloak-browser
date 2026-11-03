// Settings → Plugins → Cloak Browser: a staged form over the Host's `cloak-browser` config
// namespace (client `configForms` service). Only `.volatile()` fields are served and writable;
// saves go through DSH's settings transport, persist into the profile cordis.patch.yml and
// apply to the running plugin without a restart.
export const SETTINGS_NS = "cloak-browser";

export const SECTIONS = [
  {
    id: "browser",
    fields: [
      { key: "headless", type: "bool" },
      { key: "windowWidth", type: "int", min: 320, max: 7680 },
      { key: "windowHeight", type: "int", min: 240, max: 4320 },
      { key: "humanize", type: "bool" },
      { key: "humanPreset", type: "enum", options: ["default", "careful"] },
      { key: "liveViewQuality", type: "int", min: 20, max: 95 },
      { key: "inputTakesControl", type: "bool" }
    ]
  },
  {
    id: "sessions",
    fields: [
      { key: "profileMode", type: "enum", options: ["per-session", "shared", "ephemeral"] },
      { key: "persistentProfileRoot", type: "text", placeholder: "<DSH_HOME>/cloak-browser/profiles" },
      { key: "maxSessions", type: "int", min: 1, max: 50 },
      { key: "maxPages", type: "int", min: 1, max: 30 },
      { key: "idleCloseMinutes", type: "int", min: 0, max: 1440 },
      { key: "closeOnSessionEnd", type: "bool" },
      { key: "subagentsShareBrowser", type: "bool" }
    ]
  },
  {
    id: "binary",
    fields: [
      { key: "legacyBinaryFallback", type: "bool" },
      { key: "binaryPath", type: "text", placeholder: "C:\\path\\to\\chrome.exe" },
      { key: "releaseChannel", type: "enum", options: ["stable", "preview"] },
      { key: "browserVersion", type: "text", placeholder: "146.0.7680.177.5" },
      { key: "launchTimeoutMs", type: "int", min: 5000, max: 900000 }
    ]
  },
  {
    id: "network",
    fields: [
      { key: "proxyEnv", type: "text", placeholder: "CLOAKBROWSER_PROXY_URL" },
      { key: "proxyFailClosed", type: "bool" },
      { key: "proxyProbeTimeoutMs", type: "int", min: 500, max: 60000 },
      { key: "geoip", type: "enum", options: ["auto", true, false] },
      { key: "timezone", type: "text", placeholder: "Asia/Muscat" },
      { key: "locale", type: "text", placeholder: "en-US" },
      { key: "allowedDomains", type: "list" },
      { key: "blockedDomains", type: "list" },
      { key: "blockPrivateNetworks", type: "bool" },
      { key: "humanMayOpenPrivate", type: "bool" }
    ]
  },
  {
    id: "fingerprint",
    fields: [
      { key: "fingerprintSeed", type: "text", placeholder: "" },
      { key: "fingerprintNoise", type: "bool" },
      { key: "fingerprintWindowsFontMetrics", type: "bool" },
      { key: "allowThirdPartyCookies", type: "bool" },
      { key: "fingerprintStorageQuotaMb", type: "int", min: 0, max: 10000000 },
      { key: "viewportWidth", type: "int", min: 0, max: 10000 },
      { key: "viewportHeight", type: "int", min: 0, max: 10000 },
      { key: "extensionPaths", type: "list" },
      { key: "extraArgs", type: "list" }
    ]
  },
  {
    id: "agent",
    fields: [
      { key: "allowEvaluate", type: "bool" },
      { key: "autoSnapshot", type: "bool" },
      { key: "maxSnapshotElements", type: "int", min: 10, max: 500 },
      { key: "maxTextChars", type: "int", min: 1000, max: 100000 },
      { key: "actionTimeoutMs", type: "int", min: 1000, max: 120000 },
      { key: "navigationTimeoutMs", type: "int", min: 1000, max: 180000 },
      { key: "typingTimeoutMs", type: "int", min: 1000, max: 300000 },
      { key: "helpWaitSeconds", type: "int", min: 5, max: 1800 },
      { key: "screenshotFormat", type: "enum", options: ["jpeg", "png"] },
      { key: "screenshotQuality", type: "int", min: 20, max: 100 },
      { key: "downloadSubdir", type: "text", placeholder: "downloads" }
    ]
  }
];

export const FIELDS = SECTIONS.flatMap((section) => section.fields);

/** Text shown in an input for a stored value. */
export function toText(field, value) {
  if (value === undefined || value === null) return "";
  if (field.type === "list") return Array.isArray(value) ? value.join("\n") : "";
  if (field.type === "enum") return String(value);
  return String(value);
}

/** Parse an edited text back into a config value; returns { ok, value } or { ok:false, error }. */
export function parseField(field, text) {
  switch (field.type) {
    case "bool":
      return { ok: true, value: text === true || text === "true" };
    case "int": {
      const trimmed = String(text).trim();
      if (!/^\d+$/.test(trimmed)) return { ok: false, error: "integer" };
      const value = Number(trimmed);
      if ((field.min !== undefined && value < field.min) || (field.max !== undefined && value > field.max)) return { ok: false, error: "range" };
      return { ok: true, value };
    }
    case "enum": {
      const match = field.options.find((option) => String(option) === String(text));
      return match === undefined ? { ok: false, error: "choice" } : { ok: true, value: match };
    }
    case "list":
      return { ok: true, value: String(text).split(/\r?\n|,/).map((line) => line.trim()).filter(Boolean) };
    default:
      return { ok: true, value: String(text).trim() };
  }
}

/** Cross-field checks mirroring the Host's normalizeConfig. */
export function crossCheck(values) {
  const errors = {};
  if ((Number(values.viewportWidth) === 0) !== (Number(values.viewportHeight) === 0)) errors.viewportHeight = "viewportPair";
  if (values.proxyEnv && !/^[A-Za-z_][A-Za-z0-9_]*$/.test(values.proxyEnv)) errors.proxyEnv = "envName";
  if (values.fingerprintSeed && !/^[A-Za-z0-9_-]{1,128}$/.test(values.fingerprintSeed)) errors.fingerprintSeed = "seed";
  return errors;
}

function sameValue(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Field operations for a save: changed fields only, in form order. */
export function diffOps(saved, draft) {
  const ops = [];
  for (const field of FIELDS) {
    if (!(field.key in draft)) continue;
    if (!sameValue(saved?.[field.key], draft[field.key])) ops.push({ op: "set", path: [field.key], value: draft[field.key] });
  }
  return ops;
}

export const SETTINGS_EN = {
  title: "Cloak Browser",
  intro: "These settings apply to new browser launches and the next tool calls; open browsers keep their current window until closed. Changes are saved to this profile.",
  "section.browser": "Browser window & live view",
  "section.sessions": "Sessions & profiles",
  "section.binary": "Browser binary & license",
  "section.network": "Network, proxy & sites",
  "section.fingerprint": "Fingerprint & advanced launch",
  "section.agent": "Agent tools",
  save: "Save",
  saving: "Saving…",
  discard: "Discard",
  saved: "Saved",
  saveFailed: "The Host refused the change (it may have been edited elsewhere). The form was reloaded; review and save again.",
  loading: "Loading settings…",
  unavailable: "Cloak Browser settings are unavailable. Make sure the plugin is enabled.",
  readOnly: "Settings are read-only in this connection.",
  reset: "Reset",
  overridden: "Custom",
  on: "On",
  off: "Off",
  "error.integer": "Enter a whole number.",
  "error.range": "Out of range ({min}–{max}).",
  "error.choice": "Choose one of the options.",
  "error.viewportPair": "Set both viewport width and height, or both to 0.",
  "error.envName": "Use an environment variable name (letters, digits, _).",
  "error.seed": "Letters, digits, _ and - only (max 128).",
  listHint: "One per line.",
  "license.title": "License",
  "license.body": "Keyless: uses the cached Chromium in ~/.cloakbrowser when present. Newest builds need a free key: run `npx cloakbrowser login` once, or set CLOAKBROWSER_LICENSE_KEY before starting DSH. Free keys allow one open browser at a time.",

  "f.headless": "Headless (no desktop window)",
  "h.headless": "Off opens a real CloakBrowser window on this computer in addition to the sidebar view.",
  "f.windowWidth": "Window width",
  "f.windowHeight": "Window height",
  "h.windowWidth": "Size of the headless browser window, in pixels.",
  "f.humanize": "Human-like input",
  "h.humanize": "Adds realistic mouse paths and typing delays. Stealthier, noticeably slower.",
  "f.humanPreset": "Human-like preset",
  "f.liveViewQuality": "Live view quality",
  "h.liveViewQuality": "JPEG quality of the sidebar stream (20–95). Lower uses less bandwidth.",
  "f.inputTakesControl": "Clicking the live view takes control",
  "h.inputTakesControl": "When on, your clicks, scrolls and typing pause the agent until you return control.",

  "f.profileMode": "Profile mode",
  "h.profileMode": "per-session: cookies kept per conversation. shared: one profile for all. ephemeral: nothing is saved.",
  "f.persistentProfileRoot": "Profile folder",
  "f.maxSessions": "Max open browsers",
  "h.maxSessions": "Across all conversations. A Free license key allows only one regardless.",
  "f.maxPages": "Max tabs per browser",
  "f.idleCloseMinutes": "Close idle browser after (minutes)",
  "h.idleCloseMinutes": "0 keeps browsers open until closed. Watched or human-controlled browsers are never closed.",
  "f.closeOnSessionEnd": "Close browser when its conversation ends",
  "f.subagentsShareBrowser": "Subagents share the conversation's browser",

  "f.legacyBinaryFallback": "Use keyless cached build when no license",
  "f.binaryPath": "Custom browser executable",
  "f.releaseChannel": "Release channel",
  "f.browserVersion": "Pin browser version",
  "h.browserVersion": "Paid keys only; Free keys always get the latest build.",
  "f.launchTimeoutMs": "Launch timeout (ms)",

  "f.proxyEnv": "Proxy environment variable",
  "h.proxyEnv": "Name of the variable holding the proxy URL. The URL itself is never stored here.",
  "f.proxyFailClosed": "Refuse to start if the proxy is down",
  "f.proxyProbeTimeoutMs": "Proxy check timeout (ms)",
  "f.geoip": "Match timezone/locale to proxy (GeoIP)",
  "f.timezone": "Timezone override",
  "f.locale": "Locale override",
  "f.allowedDomains": "Allowed sites (agent)",
  "h.allowedDomains": "Empty allows all. Use example.com or *.example.com, one per line.",
  "f.blockedDomains": "Blocked sites (agent)",
  "f.blockPrivateNetworks": "Block localhost and private networks for the agent",
  "f.humanMayOpenPrivate": "Let me open localhost/private sites from the address bar",

  "f.fingerprintSeed": "Fixed fingerprint seed",
  "h.fingerprintSeed": "Empty gives each conversation its own stable identity.",
  "f.fingerprintNoise": "Fingerprint noise",
  "f.fingerprintWindowsFontMetrics": "Windows font metrics",
  "f.allowThirdPartyCookies": "Allow third-party cookies",
  "f.fingerprintStorageQuotaMb": "Storage quota (MB, 0 = default)",
  "f.viewportWidth": "Spoofed screen width (0 = real)",
  "f.viewportHeight": "Spoofed screen height (0 = real)",
  "f.extensionPaths": "Extension folders to load",
  "f.extraArgs": "Extra Chromium arguments",

  "f.allowEvaluate": "Allow page JavaScript (browser_evaluate)",
  "h.allowEvaluate": "Lets the agent run its own JavaScript in pages.",
  "f.autoSnapshot": "Return a page snapshot after each action",
  "f.maxSnapshotElements": "Max elements per snapshot",
  "f.maxTextChars": "Max page text per read",
  "f.actionTimeoutMs": "Action timeout (ms)",
  "f.navigationTimeoutMs": "Navigation timeout (ms)",
  "f.typingTimeoutMs": "Typing timeout (ms)",
  "f.helpWaitSeconds": "Default wait for your help (seconds)",
  "f.screenshotFormat": "Screenshot format",
  "f.screenshotQuality": "Screenshot JPEG quality",
  "f.downloadSubdir": "Downloads folder (inside the workspace)",
  "opt.true": "Always",
  "opt.false": "Never",
  "opt.auto": "Auto (when a proxy is set)"
};

export const SETTINGS_ZH = {
  ...SETTINGS_EN,
  title: "Cloak 浏览器",
  intro: "这些设置作用于新启动的浏览器和后续工具调用；已打开的浏览器保持当前窗口直到关闭。修改会保存到当前配置文件。",
  "section.browser": "浏览器窗口与实时画面",
  "section.sessions": "会话与配置文件",
  "section.binary": "浏览器程序与许可证",
  "section.network": "网络、代理与站点",
  "section.fingerprint": "指纹与高级启动参数",
  "section.agent": "Agent 工具",
  save: "保存",
  saving: "保存中…",
  discard: "放弃",
  saved: "已保存",
  saveFailed: "宿主拒绝了修改（可能已在别处被编辑）。表单已重新加载，请检查后再保存。",
  loading: "正在加载设置…",
  unavailable: "Cloak 浏览器设置不可用，请确认插件已启用。",
  readOnly: "当前连接下设置为只读。",
  reset: "重置",
  overridden: "已自定义",
  on: "开",
  off: "关",
  listHint: "每行一个。"
};
