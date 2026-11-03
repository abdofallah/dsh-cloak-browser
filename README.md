# dsh-cloak-browser

**CloakBrowser as DeepSeek Harness's one browser.** The agent gets `browser_*` tools that
drive a stealth Chromium ([CloakBrowser](https://github.com/CloakHQ/CloakBrowser)). You get
the right-sidebar **Browser** tab, which shows the agent's browser live. Click or type in it
to take over, then hand control back.

Fork of [maxiaovivi/dsh-cloak-browser](https://github.com/maxiaovivi/dsh-cloak-browser),
rebuilt for DSH 0.2.x. It borrows ideas from
[Tencent BrowserSkill](https://github.com/Tencent/BrowserSkill/tree/main/packages/dsh-plugin-browserskill)
(tool coverage, human help requests),
[wqty123/dsh-browser](https://github.com/wqty123/dsh-browser) (the "human and agent share
one page" model, watch and take over in the sidebar) and
[jonah791/dsh-cloak-browser](https://github.com/jonah791/dsh-cloak-browser) (a proxy that
fails closed, with no silent fallback to a direct connection).

## What it replaces

| Before | With this plugin |
|---|---|
| Built-in sidebar *Browser* tab: an Electron webview or iframe for you only. The agent cannot see or use it. | The same sidebar *Browser* tab kind is taken over (`priority: extension`). It shows the agent's CloakBrowser, and you can watch and control it. |
| No agent browser in the Desktop build | 25 native `browser_*` tools |
| `browserUse` provider slot empty | Claimed by `cloak-browser`, so a second browser provider (Playwright MCP, BrowserSkill and so on) is refused |

Uninstalling the plugin restores the built-in tab automatically, because the builtin
registration resumes.

## Install

```sh
dsh plugin --profile desktop add github:abdofallah/dsh-cloak-browser
```

Or install a local checkout from the Plugins page (or the agent's
`plugin_manager install_bundle` with the directory path).

### Browser binary and license

- **Keyless:** if `~/.cloakbrowser/chromium-<version>` from the 0.6 wrapper exists, it is
  used (`legacyBinaryFallback`).
- **Latest build:** CloakBrowser 0.7 needs a free key. Run `npx cloakbrowser login` once,
  or set `CLOAKBROWSER_LICENSE_KEY`. The ~200 MB binary downloads on first use.
- **Custom binary:** set `binaryPath`.
- Without any of these, `browser_open` returns `status: not_started, reason: no_license`
  instead of hanging on a terminal prompt.
- A Free key has one concurrent seat. A second session gets `session_in_use`.

## Tools

| Group | Tools |
|---|---|
| Lifecycle | `browser_open`, `browser_close`, `browser_status` |
| Navigation | `browser_navigate` (goto/back/forward/reload), `browser_tabs` (list/new/select/close) |
| Reading | `browser_snapshot` (text + element refs, iframes included), `browser_extract` (text/html/attribute/links/tables), `browser_screenshot` (viewport/full page/element, optional `save_path`), `browser_inspect` (console, network, dialogs, downloads) |
| Interaction | `browser_click` (ref/selector/text or x,y; right-click, double-click, modifiers), `browser_type` (fill or real keystrokes, append, submit), `browser_fill_form`, `browser_select`, `browser_check`, `browser_hover`, `browser_drag`, `browser_press` (key combinations), `browser_scroll`, `browser_wait` (text/selector/URL/network idle/time) |
| Files | `browser_upload`, `browser_download` (saved into the session working directory) |
| Page | `browser_emulate` (viewport, color scheme, print media), `browser_dialog` (accept/dismiss/manual), `browser_evaluate` (when `allowEvaluate`) |
| Human | `browser_request_help`: hands control to you with a reason and waits until you click **Done** |

Actions return a fresh snapshot automatically, so most workflows are
`open → act on a ref → act on a ref → close`.

## Sidebar Browser tab: watch and take over

- A live MJPEG stream of the active tab (CDP screencast; it runs only while someone
  watches), plus an address bar, back/forward/reload, tabs (new/close/switch) and the
  current controller.
- **Take control:** click, drag, scroll or type in the view, or press *Take control*.
  While you hold control, agent tools that change the page are refused with a clear
  message (reads still work).
- **Return control** hands the browser back to the agent. During a `browser_request_help`
  you get *Done* and *Can't do it* buttons, and the agent receives the answer.
- The tab opens by itself when the agent opens a browser or asks for help. Chat links set
  to open "In-App Sidebar" load in CloakBrowser.
- The routes (`/cloak-browser/*`) require the same authenticated browser credential as
  the DSH API.

One browser per DSH session. Subagents share their root session's browser
(`subagentsShareBrowser`). Profiles persist per session by default (`profileMode`).

## Configuration (`- id: cloak-browser` in the profile `cordis.patch.yml`)

Main keys:

- **Display:** `headless`, `windowWidth/Height`.
- **Behaviour:** `humanize`, `profileMode` (`per-session`/`shared`/`ephemeral`),
  `persistentProfileRoot`, `maxSessions`, `maxPages`, `idleCloseMinutes`,
  `closeOnSessionEnd`.
- **Binary:** `binaryPath`, `legacyBinaryFallback`.
- **Network and identity:** `proxyEnv`, `proxyFailClosed`, `geoip`, `timezone`, `locale`,
  `extensionPaths`, `allowedDomains`, `blockedDomains`, `blockPrivateNetworks`.
- **Tools:** `allowEvaluate`, `autoSnapshot`, `helpWaitSeconds`.
- **Live view:** `liveViewQuality`, `inputTakesControl`.
- **Integration:** `claimBrowserUse`, `routePrompt`.

The full schema is in [`lib/plugin.mjs`](lib/plugin.mjs).

Secrets never go in config or tool arguments. Use `CLOAKBROWSER_LICENSE_KEY` and the
variable named by `proxyEnv`. For logins, the agent calls `browser_request_help` and you
type the credentials yourself in the live view.

## Development

```sh
npm install
npm test            # unit tests (fake browser)
npm run check       # syntax
npm run test:smoke  # real CloakBrowser through the host half (needs @deepseek-ai/* resolvable)
```

## License

MIT. The CloakBrowser binary is covered by CloakHQ's separate
[Binary License](https://github.com/CloakHQ/CloakBrowser/blob/main/BINARY-LICENSE.md).
