// The Overview window: one column per group, a full card per agent.

import { div, svg } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { run, setShared, closeOverlay, props, exec, window as appWindow } from "herdr";
import { GROUPS, age } from "./model.js";

const COLUMNS = ["needs", "unclear", "working", "waiting", "finished"];
const SUMMARY_CHARS = 420;

const clip = (text, n) => (text.length > n ? text.slice(0, n).trimEnd() + "…" : text);
const shortUrl = (url) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/^github\.com\//, "");
// A press on a control must not start dragging the window.
const control = (el) => el.on_mouse_down("left", (_e, cx) => cx.stop_propagation());

function close() {
  setShared("chief.overview", null);
  closeOverlay(props().overlay);
}

function focusAgent(agent) {
  run("pane.focus", { pane: agent.pane });
  close();
}

function openUrl(url) {
  exec(appWindow()?.platform === "macos" ? "open" : "xdg-open", [url]).catch(() => {});
}

function statusMark(t, status) {
  if (status === "working") return svg("mods/workspace-chrome/spinner.svg").size(12).mt(3).flex_none().text_color(t.working).spin(900);
  if (status === "idle") return div().size(8).mt(5).flex_none().rounded(4).border(1.5).border_color(t.idle ?? t.dim);
  return div().size(8).mt(5).flex_none().rounded(4).bg(t[status] ?? t.dim);
}

function card(t, item, now) {
  const { agent: a, report: r, group } = item;
  const where = `${a.space_name || "?"} · ${a.tab_name || a.tab}`;
  const meta = [where, r?.at ? age(now - r.at) : null].filter(Boolean).join(" · ");
  return control(v_flex()
    .id(`chief-card-${a.address}`)
    .p(10)
    .gap(6)
    .flex_none()
    .rounded(9)
    .bg(t.surface)
    .border(1)
    .border_color(group === "needs" ? t.blocked : t.border)
    .cursor_pointer()
    .hover((s) => s.border_color(t.input))
    .on_click(() => focusAgent(a)))
    .child(h_flex()
      .gap(7)
      .items_start()
      .child(statusMark(t, a.status))
      .when(item.prio, (el) => el.child(div().flex_none().text_color(t.blocked).child("★")))
      .child(div().flex_1().min_w(0).font_semibold().text_color(t.foreground).child(r?.title || where)))
    .child(div().truncate().text_size(11).text_color(t.dim).child(meta))
    .when(Boolean(r?.next), (el) => el.child(div().px(6).py(3).rounded(5).bg(t.idle + "22").text_size(12).text_color(t.foreground).child(`Next: ${r.next}`)))
    .when(Boolean(r?.update), (el) => el.child(div().text_size(12).text_color(t.muted).child(clip(r.update, SUMMARY_CHARS))))
    .when(Boolean(r?.links.length), (el) => el.child(h_flex()
      .flex_wrap()
      .gap(4)
      .children(r.links.map((url, i) => control(div()
        .id(`chief-link-${a.address}-${i}`)
        .max_w(260)
        .truncate()
        .px(6)
        .rounded(9)
        .border(1)
        .border_color(t.border)
        .text_size(10.5)
        .text_color(t.muted)
        .cursor_pointer()
        .hover((s) => s.text_color(t.foreground).border_color(t.input))
        .tooltip(url)
        .on_click((_e, cx) => {
          cx.stop_propagation();
          openUrl(url);
        }))
        .child(shortUrl(url))))));
}

function quietRow(t, item) {
  const a = item.agent;
  return control(h_flex()
    .id(`chief-quiet-${a.address}`)
    .h(24)
    .px(6)
    .gap(7)
    .flex_none()
    .items_center()
    .rounded(6)
    .cursor_pointer()
    .hover((s) => s.bg(t.hover))
    .on_click(() => focusAgent(a)))
    .child(div().size(7).flex_none().rounded(4).bg(t[a.status] ?? t.dim))
    .child(div().flex_1().min_w(0).truncate().text_size(12).text_color(t.muted).child(`${a.space_name || "?"} · ${a.tab_name || a.tab}`));
}

function column(t, label, color, members, render) {
  return v_flex()
    .flex_1()
    .min_w(0)
    .h_full()
    .min_h(0)
    .gap(8)
    .child(h_flex()
      .px(4)
      .gap(6)
      .items_center()
      .flex_none()
      .text_size(11.5)
      .font_medium()
      .child(div().text_color(t[color] ?? t.dim).child(label))
      .child(div().text_color(t.dim).child(String(members.length))))
    .child(v_flex()
      .id(`chief-col-${label}`)
      .flex_1()
      .min_h(0)
      .gap(8)
      .pr(4)
      .overflow_y_scrollbar()
      .children(members.map(render)));
}

export function overview(t, items, now) {
  const groupOf = (id) => GROUPS.find((g) => g.id === id);
  const quiet = items.filter((i) => i.group === "silent");
  const hidden = items.filter((i) => i.group === "hidden").length;
  return v_flex()
    .size_full()
    .bg(t.chrome)
    .text_size(13)
    .child(h_flex()
      .h(40)
      .px(14)
      .gap(10)
      .flex_none()
      .items_center()
      .border_b(1)
      .border_color(t.border)
      .child(div().font_semibold().text_color(t.foreground).child("Chief"))
      .child(div().text_size(12).text_color(t.dim).child(`${items.length} agents${hidden ? ` · ${hidden} hidden` : ""}`))
      .child(div().flex_1())
      .child(control(div()
        .id("chief-overview-close")
        .px(6)
        .rounded(5)
        .text_color(t.dim)
        .cursor_pointer()
        .hover((s) => s.bg(t.hover).text_color(t.foreground))
        .tooltip("Close (cmd-shift-o)")
        .on_click(close))
        .child("✕")))
    .child(h_flex()
      .flex_1()
      .min_h(0)
      .p(12)
      .gap(12)
      .children(COLUMNS.map((id) => {
        const g = groupOf(id);
        return column(t, g.label, g.color, items.filter((i) => i.group === id), (i) => card(t, i, now));
      }))
      .when(quiet.length > 0, (el) => el.child(v_flex()
        .w(200)
        .flex_none()
        .min_h(0)
        .h_full()
        .child(column(t, "Not reporting", "dim", quiet, (i) => quietRow(t, i))))));
}
