// One BrowserSession per DSH Session: tabs, element refs, console/network/dialog logs,
// live-view screencast and the human take-over lease.
import { EventEmitter } from "node:events";
import { expectedFingerprint, inspectInteractiveLocator, INTERACTIVE_SELECTOR, takePageSnapshot } from "./snapshot.mjs";

const LOG_LIMIT = 200;

export function abortError(message = "browser operation aborted") {
  const error = new Error(message);
  error.name = "AbortError";
  return error;
}

export function throwIfAborted(signal) {
  if (signal?.aborted) throw abortError();
}

function pushBounded(list, item, limit = LOG_LIMIT) {
  list.push(item);
  if (list.length > limit) list.splice(0, list.length - limit);
}

export class BrowserSession extends EventEmitter {
  constructor(context, config, info = {}) {
    super();
    this.setMaxListeners(50);
    this.context = context;
    this.config = config;
    this.key = info.key;
    this.label = info.label ?? "";
    this.binary = info.binary;
    this.pageIds = new Map();
    this.nextPageId = 1;
    this.activePage = undefined;
    this.refs = new Map();
    this.snapshotSequence = 0;
    this.closed = false;
    this.tail = Promise.resolve();
    this.consoleLog = [];
    this.networkLog = [];
    this.dialogLog = [];
    this.downloads = [];
    this.pendingDialog = undefined;
    this.dialogPolicy = "accept";
    this.control = { holder: "agent", since: Date.now(), note: "" };
    this.helpRequest = undefined;
    this.lastAction = { label: "opened", at: Date.now() };
    this.screencast = undefined;
    this.frameListeners = new Set();
    this.lastFrame = undefined;
    for (const page of context.pages()) this.trackPage(page, false);
    context.on?.("page", (page) => {
      this.trackPage(page, true);
      this.restartScreencast().catch(() => {});
      this.notify();
    });
    context.on?.("close", () => {
      this.closed = true;
      this.notify();
    });
  }

  trackPage(page, activate = true) {
    if (!this.pageIds.has(page)) {
      this.pageIds.set(page, `p${this.nextPageId++}`);
      this.instrumentPage(page);
    }
    if (activate || !this.activePage) this.activePage = page;
    if (this.pageIds.size > this.config.maxPages) {
      page.close?.().catch(() => {});
      this.pageIds.delete(page);
      if (this.activePage === page) this.activePage = undefined;
    }
    return this.pageIds.get(page);
  }

  instrumentPage(page) {
    const pageId = () => this.pageIds.get(page) ?? "?";
    page.on?.("console", (message) => {
      try {
        pushBounded(this.consoleLog, { pageId: pageId(), type: message.type(), text: String(message.text()).slice(0, 2000), at: Date.now() });
      } catch {}
    });
    page.on?.("pageerror", (error) => {
      pushBounded(this.consoleLog, { pageId: pageId(), type: "pageerror", text: String(error?.message ?? error).slice(0, 2000), at: Date.now() });
    });
    page.on?.("response", (response) => {
      try {
        const request = response.request();
        pushBounded(this.networkLog, {
          pageId: pageId(),
          method: request.method(),
          url: String(response.url()).slice(0, 1000),
          status: response.status(),
          resourceType: request.resourceType(),
          at: Date.now()
        });
      } catch {}
    });
    page.on?.("requestfailed", (request) => {
      try {
        pushBounded(this.networkLog, {
          pageId: pageId(),
          method: request.method(),
          url: String(request.url()).slice(0, 1000),
          status: 0,
          failure: request.failure()?.errorText ?? "failed",
          resourceType: request.resourceType(),
          at: Date.now()
        });
      } catch {}
    });
    page.on?.("dialog", async (dialog) => {
      const entry = { pageId: pageId(), type: dialog.type(), message: String(dialog.message()).slice(0, 2000), at: Date.now() };
      if (this.dialogPolicy === "manual") {
        this.pendingDialog = { dialog, entry };
        entry.handled = "pending";
        pushBounded(this.dialogLog, entry);
        this.notify();
        return;
      }
      try {
        if (this.dialogPolicy === "dismiss") await dialog.dismiss();
        else await dialog.accept(dialog.type() === "prompt" ? dialog.defaultValue() : undefined);
        entry.handled = this.dialogPolicy === "dismiss" ? "dismissed" : "accepted";
      } catch {
        entry.handled = "failed";
      }
      pushBounded(this.dialogLog, entry);
    });
    page.on?.("download", (download) => {
      pushBounded(this.downloads, { pageId: pageId(), download, url: download.url(), suggestedFilename: download.suggestedFilename(), at: Date.now() }, 20);
    });
    page.on?.("framenavigated", (frame) => {
      if (frame === page.mainFrame?.()) this.notify();
    });
    page.on?.("close", () => {
      if (this.activePage === page) this.activePage = undefined;
      if (this.screencast?.page === page && !this.closed) this.restartScreencast().catch(() => {});
      this.notify();
    });
  }

  livePages() {
    const pages = this.context.pages().filter((page) => !page.isClosed?.());
    for (const page of pages) this.trackPage(page, false);
    for (const page of this.pageIds.keys()) if (!pages.includes(page)) this.pageIds.delete(page);
    return pages;
  }

  async page() {
    const live = this.livePages();
    if (this.activePage && live.includes(this.activePage)) return this.activePage;
    if (live.length > 0) return (this.activePage = live[live.length - 1]);
    const page = await this.context.newPage();
    this.trackPage(page, true);
    return page;
  }

  pageId(page) {
    return this.trackPage(page, false);
  }

  pageById(pageId) {
    return this.livePages().find((page) => this.pageId(page) === pageId);
  }

  async selectPage(page) {
    this.activePage = page;
    await page.bringToFront?.().catch(() => {});
    this.invalidateRefs();
    await this.restartScreencast();
    this.notify();
  }

  invalidateRefs() {
    this.refs.clear();
  }

  async snapshot(maxElements) {
    const page = await this.page();
    const pageId = this.pageId(page);
    this.snapshotSequence += 1;
    const result = await takePageSnapshot(page, pageId, this.snapshotSequence, {
      maxElements: Math.min(maxElements ?? this.config.maxSnapshotElements, this.config.maxSnapshotElements),
      maxTextChars: this.config.maxTextChars
    });
    this.refs = result.refs;
    return result.value;
  }

  async locatorForRef(ref) {
    const entry = this.refs.get(ref);
    if (!entry) throw new Error(`unknown or stale element ref "${ref}"; use the refs from the latest snapshot or call browser_snapshot`);
    const page = await this.page();
    if (!ref.startsWith(`${this.pageId(page)}:`) || (entry.page && entry.page !== page)) {
      throw new Error(`element ref "${ref}" belongs to another tab; select that tab and take a new snapshot`);
    }
    if (entry.frame?.isDetached?.()) throw new Error(`element ref "${ref}" is stale because its frame was detached; take a new snapshot`);
    const locator = (entry.frame ?? page).locator(INTERACTIVE_SELECTOR).nth(entry.index);
    const actual = await inspectInteractiveLocator(locator);
    if (actual.fingerprint !== expectedFingerprint(entry)) throw new Error(`element ref "${ref}" is stale because the page changed; take a new snapshot`);
    return { locator, page };
  }

  /** Locate by snapshot ref, CSS selector, or visible text (in that order). */
  async target(spec) {
    if (spec.ref) return this.locatorForRef(spec.ref);
    const page = await this.page();
    if (spec.selector) return { locator: page.locator(spec.selector).first(), page };
    if (spec.text) return { locator: page.getByText(spec.text, { exact: false }).first(), page };
    throw new Error("one of ref, selector or text is required");
  }

  async enqueue(signal, task) {
    let release;
    const prior = this.tail;
    this.tail = new Promise((resolveTail) => { release = resolveTail; });
    await prior.catch(() => {});
    try {
      throwIfAborted(signal);
      return await task();
    } finally {
      release();
    }
  }

  // ---- human/agent cooperation --------------------------------------------------------

  agentMayAct() {
    return this.control.holder === "agent";
  }

  setControl(holder, note = "") {
    if (holder !== "agent" && holder !== "human") throw new Error("holder must be agent or human");
    this.control = { holder, since: Date.now(), note: String(note).slice(0, 500) };
    if (holder === "agent" && this.helpRequest) this.resolveHelp({ completed: true, by: "human-returned-control" });
    this.notify();
  }

  requestHelp(reason) {
    if (this.helpRequest) return this.helpRequest.promise;
    let resolveHelp;
    const promise = new Promise((resolvePromise) => { resolveHelp = resolvePromise; });
    this.helpRequest = { reason: String(reason).slice(0, 1000), at: Date.now(), promise, resolve: resolveHelp };
    this.control = { holder: "human", since: Date.now(), note: this.helpRequest.reason };
    this.notify();
    return promise;
  }

  resolveHelp(result) {
    const request = this.helpRequest;
    if (!request) return false;
    this.helpRequest = undefined;
    request.resolve(result);
    this.notify();
    return true;
  }

  noteAction(label) {
    this.lastAction = { label: String(label).slice(0, 200), at: Date.now() };
    this.notify();
  }

  // ---- live view ------------------------------------------------------------------------

  notify() {
    this.emit("state");
  }

  async state() {
    const pages = this.closed ? [] : this.livePages();
    const active = this.activePage && pages.includes(this.activePage) ? this.activePage : pages[pages.length - 1];
    const tabs = await Promise.all(pages.map(async (page) => ({
      pageId: this.pageId(page),
      url: page.url(),
      title: await page.title().catch(() => ""),
      active: page === active
    })));
    return {
      key: this.key,
      label: this.label,
      closed: this.closed,
      control: this.control,
      helpRequest: this.helpRequest ? { reason: this.helpRequest.reason, at: this.helpRequest.at } : null,
      lastAction: this.lastAction,
      pendingDialog: this.pendingDialog ? this.pendingDialog.entry : null,
      tabs,
      viewport: this.lastFrame ? { width: this.lastFrame.width, height: this.lastFrame.height } : null,
      binary: this.binary ?? null
    };
  }

  /** Subscribe to JPEG frames for the active tab; the screencast runs only while someone watches. */
  async addFrameListener(listener) {
    this.frameListeners.add(listener);
    if (this.lastFrame) listener(this.lastFrame);
    if (!this.screencast) await this.startScreencast();
    return async () => {
      this.frameListeners.delete(listener);
      if (this.frameListeners.size === 0) await this.stopScreencast();
    };
  }

  async startScreencast() {
    if (this.closed || this.frameListeners.size === 0 || this.screencast) return;
    const page = await this.page();
    if (this.screencast) return;
    const cdp = await this.context.newCDPSession(page);
    const state = { page, cdp, stopped: false };
    this.screencast = state;
    cdp.on("Page.screencastFrame", (event) => {
      cdp.send("Page.screencastFrameAck", { sessionId: event.sessionId }).catch(() => {});
      if (state.stopped) return;
      const frame = {
        data: event.data,
        width: event.metadata.deviceWidth,
        height: event.metadata.deviceHeight,
        pageId: this.pageId(page),
        at: Date.now()
      };
      this.lastFrame = frame;
      for (const listener of this.frameListeners) {
        try {
          listener(frame);
        } catch {}
      }
    });
    try {
      await cdp.send("Page.startScreencast", {
        format: "jpeg",
        quality: this.config.liveViewQuality,
        maxWidth: this.config.liveViewMaxWidth,
        maxHeight: this.config.liveViewMaxHeight,
        everyNthFrame: 1
      });
    } catch (error) {
      if (this.screencast === state) this.screencast = undefined;
      await cdp.detach().catch(() => {});
      throw error;
    }
  }

  async stopScreencast() {
    const state = this.screencast;
    this.screencast = undefined;
    if (!state) return;
    state.stopped = true;
    await state.cdp.send("Page.stopScreencast").catch(() => {});
    await state.cdp.detach().catch(() => {});
  }

  async restartScreencast() {
    if (!this.screencast) return;
    await this.stopScreencast();
    await this.startScreencast();
  }

  /** Forward one human input event from the live view to the active tab. */
  async dispatchHumanInput(event) {
    if (this.closed) throw new Error("browser is closed");
    const page = await this.page();
    // Input arrives as fractions of the shown frame; map them onto the page's CSS viewport.
    let size = this.lastFrame && this.lastFrame.pageId === this.pageId(page) ? { width: this.lastFrame.width, height: this.lastFrame.height } : undefined;
    if (!size) size = page.viewportSize?.() ?? await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
    const px = (fraction, axis) => Math.max(0, Math.min(1, Number(fraction) || 0)) * (axis === "x" ? size.width : size.height);
    const button = ["left", "right", "middle"].includes(event.button) ? event.button : "left";
    switch (event.type) {
      case "click":
        await page.mouse.click(px(event.x, "x"), px(event.y, "y"), { button, clickCount: Math.min(3, Math.max(1, Number(event.clickCount) || 1)) });
        break;
      case "move":
        await page.mouse.move(px(event.x, "x"), px(event.y, "y"));
        break;
      case "down":
        await page.mouse.move(px(event.x, "x"), px(event.y, "y"));
        await page.mouse.down({ button });
        break;
      case "up":
        await page.mouse.move(px(event.x, "x"), px(event.y, "y"));
        await page.mouse.up({ button });
        break;
      case "wheel":
        await page.mouse.move(px(event.x, "x"), px(event.y, "y"));
        await page.mouse.wheel(Number(event.deltaX) || 0, Number(event.deltaY) || 0);
        break;
      case "key":
        await page.keyboard.press(String(event.key).slice(0, 64));
        break;
      case "text":
        await page.keyboard.insertText(String(event.text).slice(0, 5000));
        break;
      case "navigate":
        if (typeof this.urlGuard === "function") this.urlGuard(String(event.url));
        await page.goto(String(event.url), { waitUntil: "domcontentloaded", timeout: this.config.navigationTimeoutMs });
        break;
      case "newtab": {
        const created = await this.context.newPage();
        this.trackPage(created, true);
        if (event.url) {
          if (typeof this.urlGuard === "function") this.urlGuard(String(event.url));
          await created.goto(String(event.url), { waitUntil: "domcontentloaded", timeout: this.config.navigationTimeoutMs });
        }
        await this.restartScreencast();
        break;
      }
      case "closetab": {
        const target = this.pageById(String(event.pageId));
        if (target) await target.close();
        await this.page();
        await this.restartScreencast();
        break;
      }
      case "back":
        await page.goBack({ timeout: this.config.navigationTimeoutMs }).catch(() => null);
        break;
      case "forward":
        await page.goForward({ timeout: this.config.navigationTimeoutMs }).catch(() => null);
        break;
      case "reload":
        await page.reload({ timeout: this.config.navigationTimeoutMs }).catch(() => null);
        break;
      case "tab": {
        const target = this.pageById(String(event.pageId));
        if (!target) throw new Error("unknown tab");
        await this.selectPage(target);
        break;
      }
      case "dialog": {
        const pending = this.pendingDialog;
        if (!pending) break;
        this.pendingDialog = undefined;
        if (event.accept) await pending.dialog.accept(event.text).catch(() => {});
        else await pending.dialog.dismiss().catch(() => {});
        pending.entry.handled = event.accept ? "accepted-by-human" : "dismissed-by-human";
        break;
      }
      default:
        throw new Error(`unsupported input "${event.type}"`);
    }
    this.invalidateRefs();
    if (event.type !== "move") this.noteAction(`human: ${event.type}`);
  }

  async close() {
    if (this.closed && !this.context) return;
    this.closed = true;
    this.refs.clear();
    this.resolveHelp({ completed: false, by: "browser-closed" });
    await this.stopScreencast();
    this.frameListeners.clear();
    await this.context.close().catch(() => {});
    this.notify();
    this.removeAllListeners();
  }
}
