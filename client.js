window.__ModuleLoader__.load({
  id: "dsh-cloak-browser",
  factory(require) {
    const React = require("react");
    const h = React.createElement;
    const { useEffect, useRef, useState, useCallback } = React;

    const KIND = "browser";
    const TYPE_ID = "dsh-cloak-browser";
    const NS = "cloakBrowser";
    const BASE = "/cloak-browser";

    const en = {
      title: "Browser",
      "guide.title": "Browser",
      "guide.description": "Watch and control the agent's CloakBrowser",
      start: "Start browser",
      starting: "Starting…",
      none: "No browser is open for this session yet.",
      noneHint: "The agent opens one with browser_open, or start it yourself.",
      placeholder: "Enter a URL",
      go: "Go",
      back: "Back",
      forward: "Forward",
      reload: "Reload",
      newTab: "New tab",
      closeTab: "Close tab",
      take: "Take control",
      giveBack: "Return control",
      done: "Done — return to agent",
      decline: "Can't do it",
      agentDriving: "Agent is driving",
      youDriving: "You are in control — the agent is paused",
      help: "The agent needs your help",
      closeBrowser: "Close browser",
      connecting: "Connecting to live view…",
      dialog: "Page dialog",
      accept: "OK",
      dismiss: "Cancel",
      lastAction: "Last action",
      error: "Error",
      "dock.label": "Browser",
      "dock.agent": "Agent is browsing",
      "dock.human": "You are in control",
      "dock.help": "Needs your help",
      "dock.blank": "blank page",
      "dock.tabs": "{n} tabs",
      "dock.open": "Open"
    };
    const zh = {
      title: "浏览器",
      "guide.title": "浏览器",
      "guide.description": "观看并接管 Agent 的 CloakBrowser",
      start: "启动浏览器",
      starting: "正在启动…",
      none: "此会话还没有打开浏览器。",
      noneHint: "Agent 会通过 browser_open 打开，或由你手动启动。",
      placeholder: "输入网址",
      go: "前往",
      back: "后退",
      forward: "前进",
      reload: "刷新",
      newTab: "新标签页",
      closeTab: "关闭标签页",
      take: "接管",
      giveBack: "交还控制",
      done: "完成，交还给 Agent",
      decline: "无法完成",
      agentDriving: "Agent 正在操作",
      youDriving: "你正在控制，Agent 已暂停",
      help: "Agent 需要你的协助",
      closeBrowser: "关闭浏览器",
      connecting: "正在连接实时画面…",
      dialog: "页面对话框",
      accept: "确定",
      dismiss: "取消",
      lastAction: "最近操作",
      error: "错误",
      "dock.label": "浏览器",
      "dock.agent": "Agent 正在浏览",
      "dock.human": "你正在控制",
      "dock.help": "需要你的协助",
      "dock.blank": "空白页",
      "dock.tabs": "{n} 个标签页",
      "dock.open": "打开"
    };

    const CSS = `
.cbx-root{display:flex;flex-direction:column;height:100%;min-height:0;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px}
.cbx-bar{display:flex;align-items:center;gap:4px;padding:6px 8px;border-bottom:.5px solid var(--dsw-alias-border-l1)}
.cbx-btn{appearance:none;border:0;background:transparent;color:var(--dsw-alias-label-secondary);height:26px;min-width:26px;padding:0 6px;border-radius:6px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:4px;font:inherit;white-space:nowrap}
.cbx-btn:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.cbx-btn:disabled{opacity:.4;cursor:default;background:transparent}
.cbx-btn.cbx-primary{background:var(--dsw-alias-button-primary-fill,var(--dsw-alias-brand-primary));color:var(--dsw-alias-label-primary-foreground,var(--dsw-alias-bg-base));font-weight:500}
.cbx-btn.cbx-primary:hover{background:var(--dsw-alias-button-primary-hover,var(--dsw-alias-button-primary-fill,var(--dsw-alias-brand-primary)));color:var(--dsw-alias-label-primary-foreground,var(--dsw-alias-bg-base))}
.cbx-btn.cbx-outline{border:.5px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary)}
.cbx-url{flex:1;min-width:0;height:26px;border-radius:6px;border:.5px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);padding:0 8px;font:inherit;outline:none}
.cbx-url:focus{border-color:var(--dsw-alias-brand-primary)}
.cbx-tabs{display:flex;gap:2px;padding:4px 8px 0;overflow-x:auto;border-bottom:.5px solid var(--dsw-alias-border-l1)}
.cbx-tab{display:flex;align-items:center;gap:4px;max-width:180px;padding:4px 8px;border-radius:6px 6px 0 0;cursor:pointer;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cbx-tab.cbx-active{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary)}
.cbx-tab span{overflow:hidden;text-overflow:ellipsis}
.cbx-x{opacity:.6;padding:0 2px}
.cbx-x:hover{opacity:1}
.cbx-status{display:flex;align-items:center;gap:8px;padding:6px 10px;font-size:12px;border-bottom:.5px solid var(--dsw-alias-border-l1)}
.cbx-dot{width:8px;height:8px;border-radius:50%;flex:none;background:var(--dsw-alias-state-success-primary)}
.cbx-human .cbx-dot{background:var(--dsw-alias-state-warn-primary)}
.cbx-status .cbx-grow{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-secondary)}
.cbx-help{padding:10px;margin:8px;border-radius:8px;border:1px solid var(--dsw-alias-state-warn-primary);background:var(--dsw-alias-bg-layer-1);display:flex;flex-direction:column;gap:8px}
.cbx-help b{color:var(--dsw-alias-state-warn-primary)}
.cbx-row{display:flex;gap:6px;flex-wrap:wrap}
.cbx-view{flex:1;min-height:0;overflow:auto;position:relative;background:var(--dsw-alias-bg-layer-2);outline:none}
.cbx-view:focus-visible{box-shadow:inset 0 0 0 2px var(--dsw-alias-brand-primary)}
.cbx-view img{display:block;width:100%;height:auto;user-select:none;-webkit-user-drag:none}
.cbx-human .cbx-view img{cursor:default}
.cbx-agent .cbx-view img{cursor:${"crosshair"}}
.cbx-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:24px;text-align:center;color:var(--dsw-alias-label-secondary)}
.cbx-empty form{display:flex;gap:6px;width:100%;max-width:420px}
.cbx-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--dsw-alias-label-secondary);pointer-events:none}
.cbx-err{color:var(--dsw-alias-state-error-primary);padding:4px 10px;font-size:12px}
`;

    function Icon({ size = 22 }) {
      return h("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", "aria-hidden": true },
        h("circle", { cx: 12, cy: 12, r: 9, stroke: "currentColor", strokeWidth: 1.5 }),
        h("path", { d: "M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z", stroke: "currentColor", strokeWidth: 1.2 }),
        h("path", { d: "M5.5 17.5c2-1.6 4.2-2.3 6.5-2.3s4.5.7 6.5 2.3", stroke: "currentColor", strokeWidth: 1.2, opacity: 0.6 }));
    }

    async function post(path, body) {
      const response = await fetch(`${BASE}${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), credentials: "same-origin" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      return data;
    }

    function normalizeUrl(raw) {
      const text = String(raw || "").trim();
      if (!text) return "";
      if (/^[a-z][a-z0-9+.-]*:/i.test(text)) return text;
      if (/^(localhost|\d{1,3}(\.\d{1,3}){3})(:\d+)?(\/|$)/i.test(text)) return `http://${text}`;
      if (/\s/.test(text) || !/\./.test(text)) return `https://duckduckgo.com/?q=${encodeURIComponent(text)}`;
      return `https://${text}`;
    }

    function useSessionState(sessionId) {
      const [state, setState] = useState(undefined);
      useEffect(() => {
        if (!sessionId) return undefined;
        let source;
        let stopped = false;
        let retry;
        const connect = () => {
          source = new EventSource(`${BASE}/events?session=${encodeURIComponent(sessionId)}`);
          source.onmessage = (event) => {
            try { setState(JSON.parse(event.data)); } catch {}
          };
          source.onerror = () => {
            source.close();
            if (!stopped) retry = setTimeout(connect, 2000);
          };
        };
        connect();
        return () => {
          stopped = true;
          clearTimeout(retry);
          source?.close();
        };
      }, [sessionId]);
      return state;
    }

    function keyCombo(event) {
      const mods = [];
      if (event.ctrlKey) mods.push("Control");
      if (event.altKey) mods.push("Alt");
      if (event.shiftKey && event.key.length > 1) mods.push("Shift");
      if (event.metaKey) mods.push("Meta");
      let key = event.key;
      if (key === " ") key = "Space";
      return [...mods, key].join("+");
    }

    function LiveView({ sessionId, state, t, setError }) {
      const img = useRef(null);
      const queue = useRef(Promise.resolve());
      const pressed = useRef(false);
      const lastMove = useRef(0);
      const [nonce, setNonce] = useState(0);
      const [loaded, setLoaded] = useState(false);
      const human = state.control?.holder === "human";

      const send = useCallback((event) => {
        queue.current = queue.current.then(() => post("/input", { session: sessionId, event })).catch((error) => setError(String(error.message || error)));
      }, [sessionId, setError]);

      const point = (event) => {
        const rect = img.current.getBoundingClientRect();
        return { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
      };
      const button = (event) => (event.button === 2 ? "right" : event.button === 1 ? "middle" : "left");

      useEffect(() => { setLoaded(false); }, [nonce, sessionId]);

      return h("div", {
        className: "cbx-view",
        tabIndex: 0,
        onKeyDown: (event) => {
          if (event.isComposing) return;
          event.preventDefault();
          event.stopPropagation();
          const printable = event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
          send(printable ? { type: "text", text: event.key } : { type: "key", key: keyCombo(event) });
        },
        onPaste: (event) => {
          const text = event.clipboardData?.getData("text");
          if (text) {
            event.preventDefault();
            send({ type: "text", text });
          }
        },
        onWheel: (event) => {
          if (!img.current) return;
          send({ type: "wheel", ...point(event), deltaX: event.deltaX, deltaY: event.deltaY });
        },
        onContextMenu: (event) => event.preventDefault()
      },
      h("img", {
        ref: img,
        key: `${sessionId}:${nonce}`,
        alt: "",
        draggable: false,
        src: `${BASE}/stream?session=${encodeURIComponent(sessionId)}&n=${nonce}`,
        onLoad: () => setLoaded(true),
        onError: () => setTimeout(() => setNonce((n) => n + 1), 1500),
        onMouseDown: (event) => {
          event.preventDefault();
          event.currentTarget.parentElement.focus();
          pressed.current = true;
          send({ type: "down", ...point(event), button: button(event) });
        },
        onMouseMove: (event) => {
          // Plain hover is forwarded too (throttled) so menus/tooltips react; moves never take control.
          const now = Date.now();
          if (now - lastMove.current < (pressed.current ? 40 : 100)) return;
          lastMove.current = now;
          send({ type: "move", ...point(event) });
        },
        onMouseUp: (event) => {
          if (!pressed.current) return;
          pressed.current = false;
          send({ type: "up", ...point(event), button: button(event) });
        },
        onMouseLeave: (event) => {
          if (!pressed.current) return;
          pressed.current = false;
          send({ type: "up", ...point(event), button: "left" });
        },
        title: human ? "" : t("take")
      }),
      loaded ? null : h("div", { className: "cbx-overlay" }, t("connecting")));
    }

    function Body(props) {
      const { useTabInfo, sessionId, t } = props;
      const { tab } = useTabInfo();
      const state = useSessionState(sessionId);
      const [url, setUrl] = useState("");
      const [editing, setEditing] = useState(false);
      const [busy, setBusy] = useState(false);
      const [error, setError] = useState("");
      const handled = useRef(undefined);

      const activeTab = state?.tabs?.find((x) => x.active);
      useEffect(() => { if (!editing) setUrl(activeTab?.url ?? ""); }, [activeTab?.url, editing]);

      const act = useCallback(async (fn) => {
        setError("");
        try { await fn(); } catch (e) { setError(String(e.message || e)); }
      }, []);

      const start = useCallback((target) => act(async () => {
        setBusy(true);
        try { await post("/open", { session: sessionId, ...(target ? { url: normalizeUrl(target) } : {}) }); } finally { setBusy(false); }
      }), [act, sessionId]);

      // A chat link or another plugin opened this tab with { url }: load it.
      const params = tab.navigation?.params;
      const revision = tab.navigation?.revision;
      useEffect(() => {
        if (!params?.url || state === undefined) return;
        const token = `${revision}:${params.url}`;
        if (handled.current === token) return;
        handled.current = token;
        if (state.open) act(() => post("/input", { session: sessionId, event: { type: "navigate", url: params.url } }));
        else start(params.url);
      }, [params?.url, revision, state === undefined, state?.open]);

      useEffect(() => tab.actions?.bindCommands?.({ refresh: () => act(() => post("/input", { session: sessionId, event: { type: "reload" } })) }), [sessionId]);

      if (state === undefined) return h("div", { className: "cbx-root" }, h("style", null, CSS), h("div", { className: "cbx-empty" }, t("connecting")));

      if (!state.open) {
        return h("div", { className: "cbx-root" }, h("style", null, CSS),
          h("div", { className: "cbx-empty" },
            h(Icon, { size: 36 }),
            h("div", null, t("none")),
            h("div", { style: { fontSize: 12 } }, t("noneHint")),
            h("form", { onSubmit: (e) => { e.preventDefault(); start(url); } },
              h("input", { className: "cbx-url", value: url, placeholder: t("placeholder"), onChange: (e) => setUrl(e.target.value) }),
              h("button", { className: "cbx-btn cbx-primary", type: "submit", disabled: busy }, busy ? t("starting") : t("start"))),
            error ? h("div", { className: "cbx-err" }, error) : null));
      }

      const human = state.control?.holder === "human";
      const input = (event) => act(() => post("/input", { session: sessionId, event }));
      const control = (action) => act(() => post("/control", { session: sessionId, action }));

      return h("div", { className: `cbx-root ${human ? "cbx-human" : "cbx-agent"}` }, h("style", null, CSS),
        h("div", { className: "cbx-bar" },
          h("button", { className: "cbx-btn", title: t("back"), onClick: () => input({ type: "back" }) }, "←"),
          h("button", { className: "cbx-btn", title: t("forward"), onClick: () => input({ type: "forward" }) }, "→"),
          h("button", { className: "cbx-btn", title: t("reload"), onClick: () => input({ type: "reload" }) }, "↻"),
          h("form", { style: { display: "flex", flex: 1, minWidth: 0, gap: 4 }, onSubmit: (e) => { e.preventDefault(); setEditing(false); input({ type: "navigate", url: normalizeUrl(url) }); } },
            h("input", { className: "cbx-url", value: url, placeholder: t("placeholder"), onFocus: () => setEditing(true), onBlur: () => setEditing(false), onChange: (e) => setUrl(e.target.value) }),
            h("button", { className: "cbx-btn", type: "submit" }, t("go"))),
          human
            ? h("button", { className: "cbx-btn cbx-primary", onClick: () => control("return") }, t("giveBack"))
            : h("button", { className: "cbx-btn cbx-outline", onClick: () => control("take") }, t("take")),
          h("button", { className: "cbx-btn", title: t("closeBrowser"), onClick: () => act(() => post("/close", { session: sessionId })) }, "⏻")),
        h("div", { className: "cbx-tabs" },
          ...(state.tabs ?? []).map((tb) => h("div", { key: tb.pageId, className: `cbx-tab ${tb.active ? "cbx-active" : ""}`, title: tb.url, onClick: () => input({ type: "tab", pageId: tb.pageId }) },
            h("span", null, tb.title || tb.url || tb.pageId),
            (state.tabs.length > 1) ? h("span", { className: "cbx-x", title: t("closeTab"), onClick: (e) => { e.stopPropagation(); input({ type: "closetab", pageId: tb.pageId }); } }, "×") : null)),
          h("button", { className: "cbx-btn", title: t("newTab"), onClick: () => input({ type: "newtab" }) }, "+")),
        h("div", { className: "cbx-status" },
          h("span", { className: "cbx-dot" }),
          h("b", null, human ? t("youDriving") : t("agentDriving")),
          h("span", { className: "cbx-grow" }, state.lastAction ? `${t("lastAction")}: ${state.lastAction.label}` : ""),
          state.binary?.version ? h("span", { style: { color: "var(--dsw-alias-label-secondary)" } }, `Chromium ${state.binary.version}`) : null),
        state.helpRequest ? h("div", { className: "cbx-help" },
          h("b", null, t("help")),
          h("div", null, state.helpRequest.reason),
          h("div", { className: "cbx-row" },
            h("button", { className: "cbx-btn cbx-primary", onClick: () => control("return") }, t("done")),
            h("button", { className: "cbx-btn", onClick: () => control("decline") }, t("decline")))) : null,
        state.pendingDialog ? h("div", { className: "cbx-help" },
          h("b", null, `${t("dialog")} (${state.pendingDialog.type})`),
          h("div", null, state.pendingDialog.message),
          h("div", { className: "cbx-row" },
            h("button", { className: "cbx-btn cbx-primary", onClick: () => input({ type: "dialog", accept: true }) }, t("accept")),
            h("button", { className: "cbx-btn", onClick: () => input({ type: "dialog", accept: false }) }, t("dismiss")))) : null,
        error ? h("div", { className: "cbx-err" }, `${t("error")}: ${error}`) : null,
        h(LiveView, { sessionId, state, t, setError }));
    }

    /** One page-wide subscription to every open browser (key = DSH session id). */
    function createBrowserDirectory() {
      let browsers = [];
      let connected = false;
      const listeners = new Set();
      const changeListeners = new Set();
      let source;
      let stopped = false;
      let retry;
      const emit = () => { for (const fn of listeners) { try { fn(); } catch {} } };
      const connect = () => {
        source = new EventSource(`${BASE}/events`);
        source.onmessage = (event) => {
          let data;
          try { data = JSON.parse(event.data); } catch { return; }
          const previous = browsers;
          browsers = Array.isArray(data.browsers) ? data.browsers : [];
          const first = !connected;
          connected = true;
          for (const fn of changeListeners) { try { fn(browsers, previous, first); } catch {} }
          emit();
        };
        source.onerror = () => {
          source.close();
          if (!stopped) retry = setTimeout(connect, 3000);
        };
      };
      connect();
      return {
        get: (key) => browsers.find((b) => b.key === key),
        list: () => browsers,
        subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
        onChange(fn) { changeListeners.add(fn); return () => changeListeners.delete(fn); },
        dispose() {
          stopped = true;
          clearTimeout(retry);
          source?.close();
          listeners.clear();
          changeListeners.clear();
        }
      };
    }

    /** Reveal (or create) this session's Browser tab in the right sidebar. */
    function revealBrowserTab(ctx, sessionId) {
      try {
        const sidebar = ctx.get("sidebarRight");
        if (!sidebar) return false;
        const onScreen = sidebar.mounted?.getSnapshot?.();
        const tabs = typeof sidebar.tabsIn === "function" ? sidebar.tabsIn(sessionId) : [];
        const existing = tabs.find((tab) => tab.kind === KIND);
        if (existing === undefined) {
          if (onScreen === sessionId && typeof sidebar.openTab === "function") sidebar.openTab(KIND, {});
          else if (typeof sidebar.openTabIn === "function") sidebar.openTabIn(sessionId, KIND, {});
          else return false;
        }
        if (onScreen === sessionId) {
          if (typeof sidebar.isExpanded === "function" && !sidebar.isExpanded()) sidebar.toggleExpanded?.();
          const tab = (typeof sidebar.tabsIn === "function" ? sidebar.tabsIn(sessionId) : []).find((t) => t.kind === KIND);
          if (tab) sidebar.focus?.(tab.id);
        }
        return true;
      } catch {
        return false;
      }
    }

    /** Open the Browser tab when a browser starts or asks for help (not for ones already open at page load). */
    function autoOpenOnActivity(ctx, directory) {
      const helped = new Set();
      return directory.onChange((browsers, previous, first) => {
        const before = new Set(previous.map((b) => b.key));
        for (const b of browsers) {
          if (first) {
            if (b.help) helped.add(b.key);
            continue;
          }
          if (!before.has(b.key)) revealBrowserTab(ctx, b.key);
          if (b.help && !helped.has(b.key)) {
            helped.add(b.key);
            revealBrowserTab(ctx, b.key);
          } else if (!b.help) helped.delete(b.key);
        }
      });
    }

    const DOCK_CSS = `
.cbd-dock{box-sizing:border-box;width:calc(100% - var(--dsh-composer-side-clearance,0px)*2 - var(--dsh-composer-dock-inset,8px)*4);margin:0 auto}
.cbd-bar{isolation:isolate;box-sizing:border-box;width:100%;max-width:calc(var(--dsh-composer-card-max-width,760px) - 4 * var(--dsh-composer-dock-inset,8px));--dsw-elevation-stroke-color:var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-md,10px);min-height:36px;box-shadow:var(--dsw-elevation-panel);border:0;align-items:center;gap:10px;margin:0 auto;padding:4px 5px 4px 12px;display:flex;position:relative;cursor:pointer;text-align:left;font:inherit;color:inherit;background:none}
.cbd-bar:before{z-index:-1;border-radius:inherit;background:var(--dsw-specific-menu,var(--dsw-alias-bg-layer-1));backdrop-filter:var(--dsw-menu-backdrop-filter);content:"";pointer-events:none;position:absolute;inset:0}
.cbd-bar:hover:before{background:var(--dsw-alias-interactive-bg-hover,var(--dsw-alias-bg-layer-2))}
.cbd-bar:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.cbd-glyph{color:var(--dsw-alias-label-tertiary);flex:none;display:inline-flex;position:relative}
.cbd-pulse{position:absolute;right:-2px;bottom:-1px;width:7px;height:7px;border-radius:50%;background:var(--dsw-alias-state-success-primary);box-shadow:0 0 0 2px var(--dsw-specific-menu,var(--dsw-alias-bg-layer-1))}
.cbd-human .cbd-pulse{background:var(--dsw-alias-state-warn-primary)}
.cbd-label{color:var(--dsw-alias-label-primary);flex:none;font-size:13px;font-weight:500;line-height:24px}
.cbd-detail{min-width:0;color:var(--dsw-alias-label-primary-dimmed,var(--dsw-alias-label-secondary));text-overflow:ellipsis;white-space:nowrap;flex:1;font-size:13px;line-height:20px;overflow:hidden}
.cbd-help .cbd-detail{color:var(--dsw-alias-state-warn-label,var(--dsw-alias-state-warn-primary))}
.cbd-open{flex:none;font-size:12px;color:var(--dsw-alias-label-tertiary);padding:0 8px;line-height:28px;border-radius:999px}
.cbd-bar:hover .cbd-open{color:var(--dsw-alias-label-secondary)}
`;

    function hostOf(url) {
      try { return new URL(url).host || url; } catch { return url || ""; }
    }

    /** Fixed bar above the composer while this conversation's browser runs; click opens its sidebar tab. */
    function BrowserDock({ sessionId, directory, reveal, t }) {
      const [entry, setEntry] = useState(() => directory.get(sessionId));
      useEffect(() => {
        setEntry(directory.get(sessionId));
        return directory.subscribe(() => setEntry(directory.get(sessionId)));
      }, [sessionId]);
      if (!entry) return null;
      const human = entry.control === "human";
      const status = entry.help ? t("dock.help") : human ? t("dock.human") : t("dock.agent");
      const where = entry.title || hostOf(entry.url) || t("dock.blank");
      return h("div", { className: "cbd-dock" },
        h("style", null, DOCK_CSS),
        h("button", {
          type: "button",
          className: `cbd-bar ${human ? "cbd-human" : ""} ${entry.help ? "cbd-help" : ""}`,
          title: entry.url || "",
          "aria-label": `${t("dock.label")}: ${status}. ${t("dock.open")}`,
          onClick: () => reveal(sessionId)
        },
          h("span", { className: "cbd-glyph" }, h(Icon, { size: 16 }), h("span", { className: "cbd-pulse" })),
          h("span", { className: "cbd-label" }, t("dock.label")),
          h("span", { className: "cbd-detail" }, entry.help ? `${status} — ${entry.help}` : `${status} · ${where}${entry.tabs > 1 ? ` · ${t("dock.tabs", { n: String(entry.tabs) })}` : ""}`),
          h("span", { className: "cbd-open" }, t("dock.open"))));
    }

    // BEGIN settings.js (generated by scripts/build-client.mjs)
    // Settings → Plugins → Cloak Browser: a staged form over the Host's `cloak-browser` config
    // namespace (client `configForms` service). Only `.volatile()` fields are served and writable;
    // saves go through DSH's settings transport, persist into the profile cordis.patch.yml and
    // apply to the running plugin without a restart.
    const SETTINGS_NS = "cloak-browser";

    const SECTIONS = [
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

    const FIELDS = SECTIONS.flatMap((section) => section.fields);

    /** Text shown in an input for a stored value. */
    function toText(field, value) {
      if (value === undefined || value === null) return "";
      if (field.type === "list") return Array.isArray(value) ? value.join("\n") : "";
      if (field.type === "enum") return String(value);
      return String(value);
    }

    /** Parse an edited text back into a config value; returns { ok, value } or { ok:false, error }. */
    function parseField(field, text) {
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
    function crossCheck(values) {
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
    function diffOps(saved, draft) {
      const ops = [];
      for (const field of FIELDS) {
        if (!(field.key in draft)) continue;
        if (!sameValue(saved?.[field.key], draft[field.key])) ops.push({ op: "set", path: [field.key], value: draft[field.key] });
      }
      return ops;
    }

    const SETTINGS_EN = {
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

    const SETTINGS_ZH = {
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
    // END settings.js

    const SNS = "cloakBrowserSettings";
    const SETTINGS_CSS = `
.cbs-root{display:flex;flex-direction:column;gap:16px;color:var(--dsw-alias-label-primary);font-size:13px}
.cbs-intro{color:var(--dsw-alias-label-secondary);margin:0;line-height:1.5}
.cbs-section{border:.5px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);overflow:hidden}
.cbs-section>summary{cursor:pointer;padding:10px 14px;font-weight:600;list-style:none;display:flex;align-items:center;gap:8px}
.cbs-section>summary::-webkit-details-marker{display:none}
.cbs-section>summary::before{content:"▸";color:var(--dsw-alias-label-secondary);transition:transform .15s}
.cbs-section[open]>summary::before{transform:rotate(90deg)}
.cbs-fields{display:flex;flex-direction:column;border-top:.5px solid var(--dsw-alias-border-l1)}
.cbs-field{display:grid;grid-template-columns:minmax(180px,1fr) minmax(160px,260px);gap:6px 16px;align-items:center;padding:10px 14px;border-top:.5px solid var(--dsw-alias-border-l1)}
.cbs-field:first-child{border-top:0}
.cbs-label{display:flex;align-items:center;gap:6px;min-width:0}
.cbs-tag{font-size:10px;padding:1px 6px;border-radius:999px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary)}
.cbs-hint{grid-column:1/-1;color:var(--dsw-alias-label-secondary);font-size:12px;margin:-2px 0 0;line-height:1.4}
.cbs-err{grid-column:1/-1;color:var(--dsw-alias-state-error-primary);font-size:12px;margin:0}
.cbs-control{display:flex;justify-content:flex-end;align-items:center;gap:6px}
.cbs-input,.cbs-select,.cbs-text{width:100%;box-sizing:border-box;border:.5px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);border-radius:6px;padding:5px 8px;font:inherit;outline:none}
.cbs-input:focus,.cbs-select:focus,.cbs-text:focus{border-color:var(--dsw-alias-brand-primary)}
.cbs-text{min-height:56px;resize:vertical;font-family:ui-monospace,Consolas,monospace;font-size:12px}
.cbs-input[aria-invalid=true],.cbs-text[aria-invalid=true]{border-color:var(--dsw-alias-state-error-primary)}
.cbs-switch{position:relative;width:36px;height:20px;border-radius:999px;border:0;cursor:pointer;background:var(--dsw-alias-border-l2);flex:none;padding:0}
.cbs-switch[aria-checked=true]{background:var(--dsw-alias-brand-primary)}
.cbs-switch::after{content:"";position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:var(--dsw-alias-bg-base);transition:left .12s}
.cbs-switch[aria-checked=true]{background:var(--dsw-alias-button-primary-fill,var(--dsw-alias-brand-primary))}
.cbs-switch[aria-checked=true]::after{left:18px}
.cbs-switch:disabled{opacity:.5;cursor:default}
.cbs-link{appearance:none;border:0;background:none;color:var(--dsw-alias-label-secondary);cursor:pointer;font:inherit;font-size:12px;padding:0 2px;text-decoration:underline}
.cbs-bar{position:sticky;bottom:0;display:flex;align-items:center;justify-content:flex-end;gap:8px;padding:10px 0;background:var(--dsw-alias-bg-base)}
.cbs-bar .cbs-status{margin-right:auto;color:var(--dsw-alias-label-secondary);font-size:12px}
.cbs-bar .cbs-status.cbs-bad{color:var(--dsw-alias-state-error-primary)}
.cbs-btn{appearance:none;border:.5px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border-radius:8px;padding:6px 14px;font:inherit;cursor:pointer}
.cbs-btn.cbs-primary{background:var(--dsw-alias-button-primary-fill,var(--dsw-alias-brand-primary));border-color:transparent;color:var(--dsw-alias-label-primary-foreground,var(--dsw-alias-bg-base))}
.cbs-btn.cbs-primary:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover,var(--dsw-alias-button-primary-fill))}
.cbs-btn:disabled{opacity:.45;cursor:default}
.cbs-note{border-left:3px solid var(--dsw-alias-brand-primary);padding:8px 12px;background:var(--dsw-alias-bg-layer-1);border-radius:6px;color:var(--dsw-alias-label-secondary);line-height:1.5}
.cbs-note b{color:var(--dsw-alias-label-primary)}
`;

    function useFormSnapshot(form) {
      const [snapshot, setSnapshot] = useState(() => form.getSnapshot());
      useEffect(() => {
        setSnapshot(form.getSnapshot());
        return form.subscribe(() => setSnapshot(form.getSnapshot()));
      }, [form]);
      return snapshot;
    }

    function optionLabel(t, option) {
      const key = `opt.${String(option)}`;
      const text = t(key);
      return text === key ? String(option) : text;
    }

    function FieldRow({ field, value, draftText, error, overridden, disabled, onChange, onReset, t }) {
      const id = `cbs-${field.key}`;
      const hintKey = `h.${field.key}`;
      const hint = t(hintKey);
      let control;
      if (field.type === "bool") {
        control = h("button", { type: "button", role: "switch", id, className: "cbs-switch", "aria-checked": value === true, "aria-label": t(`f.${field.key}`), disabled, onClick: () => onChange(value === true ? "false" : "true") });
      } else if (field.type === "enum") {
        control = h("select", { id, className: "cbs-select", value: draftText, disabled, onChange: (e) => onChange(e.target.value) },
          ...field.options.map((option) => h("option", { key: String(option), value: String(option) }, optionLabel(t, option))));
      } else if (field.type === "list") {
        control = h("textarea", { id, className: "cbs-text", value: draftText, disabled, rows: 3, "aria-invalid": Boolean(error), placeholder: t("listHint"), onChange: (e) => onChange(e.target.value) });
      } else {
        control = h("input", { id, className: "cbs-input", value: draftText, disabled, "aria-invalid": Boolean(error), inputMode: field.type === "int" ? "numeric" : undefined, placeholder: field.placeholder ?? "", spellCheck: false, onChange: (e) => onChange(e.target.value) });
      }
      return h("div", { className: "cbs-field" },
        h("label", { className: "cbs-label", htmlFor: id },
          h("span", null, t(`f.${field.key}`)),
          overridden ? h("span", { className: "cbs-tag" }, t("overridden")) : null,
          overridden ? h("button", { type: "button", className: "cbs-link", disabled, onClick: onReset }, t("reset")) : null),
        h("div", { className: "cbs-control" }, control),
        hint !== hintKey ? h("p", { className: "cbs-hint" }, hint) : null,
        error ? h("p", { className: "cbs-err", role: "status" }, t(`error.${error}`, { min: String(field.min), max: String(field.max) })) : null);
    }

    function CloakSettings(props) {
      const { form, t, view } = props;
      const snapshot = useFormSnapshot(form);
      const [drafts, setDrafts] = useState({});
      const [saving, setSaving] = useState(false);
      const [status, setStatus] = useState({ kind: "idle" });

      if (view === "summary") return t("title");
      if (snapshot.status === "loading") return h("div", { className: "cbs-root" }, h("style", null, SETTINGS_CSS), h("p", { className: "cbs-intro" }, t("loading")));
      if (snapshot.status !== "ready") return h("div", { className: "cbs-root" }, h("style", null, SETTINGS_CSS), h("p", { className: "cbs-intro" }, t("unavailable")));

      const saved = snapshot.value ?? {};
      const user = snapshot.user && typeof snapshot.user === "object" ? snapshot.user : {};
      const disabled = !snapshot.writable || saving;

      const parsed = {};
      const errors = {};
      for (const field of FIELDS) {
        if (!(field.key in drafts)) continue;
        const result = parseField(field, drafts[field.key]);
        if (result.ok) parsed[field.key] = result.value;
        else errors[field.key] = result.error;
      }
      const merged = { ...saved, ...parsed };
      Object.assign(errors, Object.fromEntries(Object.entries(crossCheck(merged)).filter(([key]) => !(key in errors))));
      const ops = diffOps(saved, parsed);
      const dirty = ops.length > 0;
      const valid = Object.keys(errors).length === 0;

      const textFor = (field) => (field.key in drafts ? drafts[field.key] : toText(field, saved[field.key]));
      const edit = (key, text) => {
        setStatus({ kind: "idle" });
        setDrafts((current) => ({ ...current, [key]: text }));
      };
      const save = async () => {
        if (!dirty || !valid) return;
        setSaving(true);
        setStatus({ kind: "idle" });
        try {
          const accepted = await form.mutate(ops);
          if (accepted) {
            setDrafts({});
            setStatus({ kind: "saved" });
          } else setStatus({ kind: "failed" });
        } catch {
          setStatus({ kind: "failed" });
        } finally {
          setSaving(false);
        }
      };
      const resetField = async (key) => {
        setSaving(true);
        try {
          const accepted = await form.unset(key);
          setDrafts((current) => {
            const next = { ...current };
            delete next[key];
            return next;
          });
          setStatus({ kind: accepted ? "saved" : "failed" });
        } finally {
          setSaving(false);
        }
      };

      return h("div", { className: "cbs-root" },
        h("style", null, SETTINGS_CSS),
        h("p", { className: "cbs-intro" }, t("intro")),
        snapshot.writable ? null : h("p", { className: "cbs-note" }, t("readOnly")),
        h("div", { className: "cbs-note" }, h("b", null, `${t("license.title")}: `), t("license.body")),
        ...SECTIONS.map((section, index) => h("details", { key: section.id, className: "cbs-section", open: index === 0 },
          h("summary", null, t(`section.${section.id}`)),
          h("div", { className: "cbs-fields" },
            ...section.fields.map((field) => h(FieldRow, {
              key: field.key,
              field,
              t,
              disabled,
              value: field.key in parsed ? parsed[field.key] : saved[field.key],
              draftText: textFor(field),
              error: errors[field.key],
              overridden: Object.prototype.hasOwnProperty.call(user, field.key),
              onChange: (text) => edit(field.key, text),
              onReset: () => resetField(field.key)
            }))))),
        h("div", { className: "cbs-bar" },
          h("span", { className: `cbs-status ${status.kind === "failed" ? "cbs-bad" : ""}` },
            status.kind === "saved" ? t("saved") : status.kind === "failed" ? t("saveFailed") : ""),
          h("button", { type: "button", className: "cbs-btn", disabled: !dirty || saving, onClick: () => { setDrafts({}); setStatus({ kind: "idle" }); } }, t("discard")),
          h("button", { type: "button", className: "cbs-btn cbs-primary", disabled: !dirty || !valid || disabled, onClick: save }, saving ? t("saving") : t("save"))));
    }

    return {
      inject: ["slots", "locale", "sidebarRight", "sidebarRightTabs"],
      apply(ctx) {
        const t = ctx.locale.bind(NS);
        ctx.effect(() => ctx.locale.register(NS, { en, zh }), "cloak-browser.copy");
        // Settings → Plugins → Cloak Browser (client configForms over the Host `cloak-browser` entry).
        const forms = ctx.get("configForms");
        if (forms && typeof forms.get === "function") {
          const ts = ctx.locale.bind(SNS);
          ctx.effect(() => ctx.locale.register(SNS, { en: SETTINGS_EN, zh: SETTINGS_ZH }), "cloak-browser.settings-copy");
          const form = forms.get(SETTINGS_NS);
          ctx.effect(() => ctx.slots.inject("plugins.bundle.config", () => ctx.slots.register({
            name: "plugins.bundle.config",
            key: "dsh-cloak-browser",
            label: () => ts("title"),
            locale: SNS,
            inject: () => ({ form })
          }, (props) => h(CloakSettings, { ...props, form, t: ts }))), "cloak-browser.settings");
        }
        ctx.effect(() => ctx.sidebarRightTabs.register({
          id: TYPE_ID,
          kind: KIND,
          priority: "extension",
          keepMounted: true,
          title: () => t("title"),
          guide: [{ id: "open", order: 30, title: () => t("guide.title"), description: () => t("guide.description"), icon: Icon }]
        }), "cloak-browser.type");
        ctx.effect(() => ctx.slots.inject("sidebar.right.pane.tab", () => ctx.slots.register({
          name: "sidebar.right.pane.tab",
          key: TYPE_ID,
          locale: NS
        }, Body)), "cloak-browser.body");
        const directory = createBrowserDirectory();
        ctx.effect(() => () => directory.dispose(), "cloak-browser.directory");
        ctx.effect(() => autoOpenOnActivity(ctx, directory), "cloak-browser.auto-open");
        // "Browser running" bar above the composer, like the goal/todo docks.
        const reveal = (sessionId) => revealBrowserTab(ctx, sessionId);
        ctx.effect(() => ctx.slots.inject("conversation.input.dock", () => ctx.slots.register({
          name: "conversation.input.dock",
          id: "cloak-browser",
          order: 5,
          label: () => t("dock.label"),
          locale: NS
        }, (props) => h(BrowserDock, { sessionId: props.sessionId, directory, reveal, t }))), "cloak-browser.dock");
      }
    };
  }
});
