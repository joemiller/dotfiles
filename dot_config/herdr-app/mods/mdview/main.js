// Rendered markdown. `mdv file.md` in any terminal, on this Mac or a connected
// machine, sets the `mdview.open` label on that terminal (`mdv -w`: the
// `mdview.window` label). The copy in the layout's 0px block (no props) sees
// the label, splits a viewer copy (props: file, machine) beside that
// terminal's pane (a new tab if it has none) or opens it as a window, and
// clears the label. A viewer pops out into a window and docks back.
import { View, div } from "gpui-kit";
import { v_flex, h_flex, TextView } from "gpui-base";
import {
  props,
  panes,
  focused,
  terminals,
  readTextFile,
  exec,
  hc,
  run,
  openOverlay,
  closeOverlay,
  shared,
  setShared,
  theme,
} from "herdr";

const OPEN_LABEL = "mdview.open";
const WINDOW_LABEL = "mdview.window";
const MARKDOWN = /\.(md|markdown|mdx)$/i;
const WATCH_MS = 300;
const RELOAD_MS = 2000;
// Herdr windows have no resize of their own: a window is as big as its
// content, so the mod sizes its root. The size is a share of the Herdr
// window ({w, h}), from the Size button's presets or the corner grip.
const SIZES = [
  { label: "S", w: 0.35, h: 0.55 },
  { label: "M", w: 0.5, h: 0.8 },
  { label: "L", w: 0.75, h: 0.92 },
];
const SIZE_KEY = "mdview.window-size";
const MIN_W = 320;
const MIN_H = 200;
const GRIP = 14;
const DRAG_MS = 16;

export default class MdView extends View {
  init(_props, cx) {
    this.file = props()?.file ?? null;
    if (this.file) {
      this.machine = props().machine ?? null;
      this.overlay = props().overlay ?? null;
      this.history = props().history ?? [];
      this.text = null;
      this.missing = false;
      cx.timer.every(RELOAD_MS, (cx) => this.reload(cx));
      this.reload(cx);
    } else {
      this.handled = new Set();
      cx.timer.every(WATCH_MS, () => this.watch());
    }
  }

  // A label is forgotten only once terminals() stops showing it: the clear
  // reaches terminals() well after hc returns, especially from another machine.
  watch() {
    const live = new Set();
    for (const t of terminals()) {
      for (const label of [OPEN_LABEL, WINDOW_LABEL]) {
        const file = t.labels?.[label];
        if (!file) continue;
        const key = `${t.address}\n${label}\n${file}`;
        live.add(key);
        if (this.handled.has(key)) continue;
        this.handled.add(key);
        const slash = t.address.indexOf("/");
        const viewer = { file, machine: slash > 0 ? t.address.slice(0, slash) : null };
        if (label === WINDOW_LABEL) openWindow(viewer);
        else openPane(viewer, panes().find((p) => p.terminal === t.address)?.pane);
        hc(["label", t.address, `${label}=`]);
      }
    }
    for (const key of this.handled) if (!live.has(key)) this.handled.delete(key);
  }

  reload(cx) {
    const file = this.file;
    cx.spawn(async (cx) => {
      let text = null;
      try {
        text = await readTextFile(file, { on: this.machine });
      } catch {}
      if (file !== this.file) return;
      if (text !== null && !MARKDOWN.test(file)) {
        const ext = file.includes(".") ? file.split(".").pop() : "";
        text = "````" + ext + "\n" + text + "\n````";
      }
      if (text === this.text && this.missing === (text === null)) return;
      this.text = text;
      this.missing = text === null;
      cx.notify();
    });
  }

  openLink(url, cx) {
    if (/^(https?|mailto):/i.test(url)) {
      exec("open", [url]);
      return;
    }
    const target = decodeURIComponent(url.replace(/^file:\/\//, "").replace(/[#?].*$/, ""));
    if (!target) return;
    this.history.push(this.file);
    this.show(resolvePath(this.file.slice(0, this.file.lastIndexOf("/")), target), cx);
  }

  show(file, cx) {
    this.file = file;
    this.text = null;
    this.missing = false;
    this.reload(cx);
    cx.notify();
  }

  viewer() {
    return { file: this.file, machine: this.machine, history: this.history };
  }

  // A mod pane isn't told its own pane id. Clicking Pop out focuses this
  // pane, so the focused pane is it; failing that, the only viewer pane.
  popOut() {
    const viewers = panes().filter((p) => p.mod === "mdview");
    const mine = viewers.find((p) => p.pane === focused()?.pane) ?? (viewers.length === 1 ? viewers[0] : null);
    openWindow(this.viewer());
    if (mine) run("pane.close", { pane: mine.pane });
  }

  dock() {
    openPane(this.viewer(), null);
    closeOverlay(this.overlay);
  }

  button(t, id, label, action) {
    return div()
      .id(id)
      .flex_none()
      .text_color(t.accent)
      .hover((s) => s.text_color(t.foreground))
      .child(label)
      .on_mouse_down("left", (_e, cx) => cx.stop_propagation())
      .on_click((_e, cx) => action(cx));
  }

  // Mouse moves reach an element only while the pointer is over it, and the
  // window trails the pointer, so the drag reads the pointer on a timer
  // instead. A release outside the window is missed; the next press ends it.
  startDrag(event, size, cx) {
    cx.stop_propagation();
    this.drag = { x: event.position.x, y: event.position.y, w: size.w, h: size.h, current: size };
    this.dragTask = cx.timer.every(DRAG_MS, (cx) => cx.notify());
  }

  endDrag() {
    if (!this.drag) return;
    this.dragTask.cancel();
    const { current } = this.drag;
    this.drag = null;
    setShared(SIZE_KEY, { w: current.w / this.viewport.width, h: current.h / this.viewport.height });
  }

  windowSize(viewport) {
    if (this.drag) {
      const p = window.mouse_position();
      this.drag.current = {
        w: Math.min(viewport.width, Math.max(MIN_W, this.drag.w + p.x - this.drag.x)),
        h: Math.min(viewport.height, Math.max(MIN_H, this.drag.h + p.y - this.drag.y)),
      };
      return this.drag.current;
    }
    const share = sizeShare();
    return { w: viewport.width * share.w, h: viewport.height * share.h };
  }

  render() {
    if (!this.file) return div();
    const t = theme();
    const where = this.machine ? `${this.machine}:${this.file}` : this.file;
    this.viewport = window.viewport_size();
    const size = this.overlay ? this.windowSize(this.viewport) : null;
    const share = sizeShare();
    const preset = SIZES.findIndex((s) => s.w === share.w && s.h === share.h);
    return v_flex()
      .id("mdview-root")
      .relative()
      .when(!this.overlay, (el) => el.size_full())
      .when(Boolean(this.overlay), (el) =>
        el
          .w(size.w)
          .h(size.h)
          .on_mouse_up("left", () => this.endDrag())
          .on_mouse_down("left", () => this.endDrag())
          .on_mouse_down_out(() => this.endDrag()),
      )
      .bg(t.background)
      .text_color(t.foreground)
      .text_size(14)
      .child(
        h_flex()
          .flex_none()
          .h(28)
          .px(12)
          .gap(12)
          .items_center()
          .border_b(1)
          .border_color(t.border)
          .text_size(12)
          // Window controls come first: a window grown past Herdr's right
          // edge stays where it was dropped, so the bar's right end can be off screen.
          .when(Boolean(this.overlay), (el) =>
            el
              .child(this.button(t, "mdview-close", "Close", () => closeOverlay(this.overlay)))
              .child(
                this.button(t, "mdview-size", `Size ${SIZES[preset]?.label ?? ""}`.trim(), () => {
                  const { w, h } = SIZES[(preset + 1) % SIZES.length];
                  setShared(SIZE_KEY, { w, h });
                }),
              ),
          )
          .child(
            this.overlay
              ? this.button(t, "mdview-dock", "Dock", () => this.dock())
              : this.button(t, "mdview-popout", "Pop out", () => this.popOut()),
          )
          .when(this.history.length > 0, (el) =>
            el.child(this.button(t, "mdview-back", "← Back", (cx) => this.show(this.history.pop(), cx))),
          )
          .child(div().flex_1().truncate().text_color(t.dim).child(where)),
      )
      .child(
        div()
          .id(`mdview-scroll-${this.file}`)
          .flex_1()
          .min_h(0)
          .overflow_y_scrollbar()
          .px(24)
          .py(16)
          .child(
            this.missing
              ? div().text_color(t.dim).child(`Can't read ${where}`)
              : div()
                  .child(
                    TextView.markdown("mdview-doc", this.text ?? "")
                      .selectable(true)
                      .on_link_click((url, cx) => this.openLink(url, cx)),
                  ),
          ),
      )
      // Last, so it's drawn over the content and gets the press.
      .when(Boolean(this.overlay), (el) =>
        el.child(
          div()
            .id("mdview-grip")
            .absolute()
            .right(0)
            .bottom(0)
            .size(GRIP)
            .flex()
            .items_end()
            .justify_end()
            .text_size(10)
            .text_color(theme().dim)
            .cursor_nwse_resize()
            .child("◢")
            .on_mouse_down("left", (e, cx) => this.startDrag(e, size, cx)),
        ),
      );
  }
}

function sizeShare() {
  const saved = shared(SIZE_KEY);
  if (saved && typeof saved === "object" && saved.w > 0 && saved.h > 0) return saved;
  return SIZES[1];
}

// No pane: beside the focused pane, else a new tab.
function openPane(viewer, pane) {
  if (pane || focused()?.pane) run("pane.split", { direction: "right", pane: pane ?? undefined, mod: "mdview", props: viewer });
  else run("tab.new", { name: viewer.file.split("/").pop(), mod: "mdview", props: viewer });
}

function openWindow(viewer) {
  openOverlay({
    kind: "window",
    mod: "mdview",
    props: viewer,
    key: `mdview:${viewer.machine ?? ""}:${viewer.file}`,
    keep: true,
  });
}

function resolvePath(dir, target) {
  const parts = target.startsWith("/") ? [] : dir.split("/");
  for (const seg of target.split("/")) {
    if (seg === "..") parts.pop();
    else if (seg !== ".") parts.push(seg);
  }
  return "/" + parts.filter(Boolean).join("/");
}
