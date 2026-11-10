// Rendered markdown in a tab. `mdv file.md` in any terminal, on this Mac or a
// connected machine, sets the `mdview.open` label on that terminal. The copy
// in the layout's 0px block (no props) sees the label, splits a viewer copy
// (props: file, machine) beside that terminal's pane (a new tab if it has
// none), and clears the label.
import { View, div } from "gpui-kit";
import { v_flex, h_flex, TextView } from "gpui-base";
import { props, panes, terminals, readTextFile, exec, hc, run, theme } from "herdr";

const LABEL = "mdview.open";
const MARKDOWN = /\.(md|markdown|mdx)$/i;
const WATCH_MS = 300;
const RELOAD_MS = 2000;

export default class MdView extends View {
  init(_props, cx) {
    this.file = props()?.file ?? null;
    if (this.file) {
      this.machine = props().machine ?? null;
      this.history = [];
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
      const file = t.labels?.[LABEL];
      if (!file) continue;
      const key = `${t.address}\n${file}`;
      live.add(key);
      if (this.handled.has(key)) continue;
      this.handled.add(key);
      const slash = t.address.indexOf("/");
      const machine = slash > 0 ? t.address.slice(0, slash) : null;
      const viewer = { file, machine };
      const pane = panes().find((p) => p.terminal === t.address)?.pane;
      if (pane) run("pane.split", { direction: "right", pane, mod: "mdview", props: viewer });
      else run("tab.new", { name: file.split("/").pop(), mod: "mdview", props: viewer });
      hc(["label", t.address, `${LABEL}=`]);
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

  render() {
    if (!this.file) return div();
    const t = theme();
    const where = this.machine ? `${this.machine}:${this.file}` : this.file;
    return v_flex()
      .size_full()
      .bg(t.background)
      .text_color(t.foreground)
      .text_size(14)
      .when(this.history.length > 0, (el) =>
        el.child(
          h_flex()
            .flex_none()
            .h(28)
            .px(12)
            .gap(10)
            .items_center()
            .border_b(1)
            .border_color(t.border)
            .text_size(12)
            .child(
              div()
                .id("mdview-back")
                .flex_none()
                .text_color(t.accent)
                .hover((s) => s.text_color(t.foreground))
                .child("← Back")
                .on_click((_e, cx) => this.show(this.history.pop(), cx)),
            )
            .child(div().flex_1().truncate().text_color(t.dim).child(where)),
        ),
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
                  .max_w(860)
                  .child(
                    TextView.markdown("mdview-doc", this.text ?? "")
                      .selectable(true)
                      .on_link_click((url, cx) => this.openLink(url, cx)),
                  ),
          ),
      );
  }
}

function resolvePath(dir, target) {
  const parts = target.startsWith("/") ? [] : dir.split("/");
  for (const seg of target.split("/")) {
    if (seg === "..") parts.pop();
    else if (seg !== ".") parts.push(seg);
  }
  return "/" + parts.filter(Boolean).join("/");
}
