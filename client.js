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
      error: "Error"
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
      error: "错误"
    };

    const CSS = `
.cbx-root{display:flex;flex-direction:column;height:100%;min-height:0;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px}
.cbx-bar{display:flex;align-items:center;gap:4px;padding:6px 8px;border-bottom:.5px solid var(--dsw-alias-border-l1)}
.cbx-btn{appearance:none;border:0;background:transparent;color:var(--dsw-alias-label-secondary);height:26px;min-width:26px;padding:0 6px;border-radius:6px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:4px;font:inherit;white-space:nowrap}
.cbx-btn:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.cbx-btn:disabled{opacity:.4;cursor:default;background:transparent}
.cbx-btn.cbx-primary{background:var(--dsw-alias-brand-primary);color:#fff}
.cbx-btn.cbx-primary:hover{filter:brightness(1.08)}
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
            : h("button", { className: "cbx-btn", onClick: () => control("take") }, t("take")),
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

    function watchAgentBrowsers(ctx) {
      let source;
      let stopped = false;
      let retry;
      let seen;
      const helped = new Set();
      const open = (sessionId) => {
        try {
          const sidebar = ctx.get("sidebarRight");
          if (!sidebar || typeof sidebar.openTabIn !== "function") return;
          if (typeof sidebar.tabsIn === "function" && sidebar.tabsIn(sessionId).some((tab) => tab.kind === KIND)) {
            const existing = sidebar.tabsIn(sessionId).find((tab) => tab.kind === KIND);
            if (typeof sidebar.isExpanded === "function" && !sidebar.isExpanded() && sidebar.mounted?.getSnapshot?.() === sessionId) sidebar.toggleExpanded?.();
            if (existing && sidebar.mounted?.getSnapshot?.() === sessionId) sidebar.focus?.(existing.id);
            return;
          }
          sidebar.openTabIn(sessionId, KIND, {});
        } catch {}
      };
      const connect = () => {
        source = new EventSource(`${BASE}/events`);
        source.onmessage = (event) => {
          let data;
          try { data = JSON.parse(event.data); } catch { return; }
          const browsers = data.browsers ?? [];
          if (seen === undefined) {
            seen = new Set(browsers.map((b) => b.key));
            for (const b of browsers) if (b.help) helped.add(b.key);
            return;
          }
          for (const b of browsers) {
            if (!seen.has(b.key)) {
              seen.add(b.key);
              open(b.key);
            }
            if (b.help && !helped.has(b.key)) {
              helped.add(b.key);
              open(b.key);
            } else if (!b.help) helped.delete(b.key);
          }
          for (const key of [...seen]) if (!browsers.some((b) => b.key === key)) seen.delete(key);
        };
        source.onerror = () => {
          source.close();
          if (!stopped) retry = setTimeout(connect, 3000);
        };
      };
      connect();
      return () => {
        stopped = true;
        clearTimeout(retry);
        source?.close();
      };
    }

    return {
      inject: ["slots", "locale", "sidebarRight", "sidebarRightTabs"],
      apply(ctx) {
        const t = ctx.locale.bind(NS);
        ctx.effect(() => ctx.locale.register(NS, { en, zh }), "cloak-browser.copy");
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
        ctx.effect(() => watchAgentBrowsers(ctx), "cloak-browser.watch");
      }
    };
  }
});
