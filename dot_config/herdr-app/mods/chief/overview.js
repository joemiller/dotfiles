// The Overview window: one column per group, a card per agent, one scroll for the whole board.

import { div, svg } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { run, shared, setShared, closeOverlay, props, exec, agents, window as appWindow } from "herdr";
import { age } from "./model.js";

// Colors from the old HTML board, so a group reads the same at a glance.
const COLUMNS = [
  { id: "needs", label: "Needs you", hint: "A decision or input", color: "#e1b578" },
  { id: "unclear", label: "Unclear", hint: "Stale or unsure", color: "#a1a9b8" },
  { id: "working", label: "Working", hint: "Running now", color: "#e3b36b" },
  { id: "waiting", label: "Waiting", hint: "Paused or awaiting something", color: "#bc9cd7" },
  { id: "finished", label: "Finished", hint: "Nothing left to do", color: "#9fbb8f" },
];
const RUNTIME = { idle: "#8fabd8", done: "#8fabd8", working: "#e3b36b", blocked: "#e996a6" };
const C = { card: "#1d2129", edge: "#353b46", edgeHover: "#545d6c", text: "#edf0f5", body: "#c1c8d4", muted: "#a1a9b8", accent: "#e3bd80", column: "#14171c" };
const SUMMARY_CHARS = { detailed: 520, compact: 0 };
const RECENT_MS = 15 * 60000;
const MAX_WIDTH = 1760;

const clip = (text, n) => (text.length > n ? text.slice(0, n).trimEnd() + "…" : text);
const shortUrl = (url) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/^github\.com\//, "");
// A press on a control must not start dragging the window.
const control = (el) => el.on_mouse_down("left", (_e, cx) => cx.stop_propagation());

export const isCompact = () => shared("chief.compact") === true;

export function closeOverview() {
  setShared("chief.overview", null);
  setShared("chief.detail", null);
  closeOverlay(props().overlay);
}

// Esc closes, c toggles compact. Keys with Cmd, Ctrl or Alt are left to the app.
export function overviewKey(e, cx) {
  const m = e.modifiers ?? {};
  if (m.platform || m.control || m.alt) return;
  if (e.key === "escape") {
    if (shared("chief.detail")) {
      setShared("chief.detail", null);
      cx.notify();
    } else closeOverview();
  } else if (e.key === "enter" && shared("chief.detail")) {
    const agent = agents().find((a) => a.address === shared("chief.detail"));
    if (agent) focusAgent(agent);
  }
  else if (e.key === "c") {
    setShared("chief.compact", !isCompact());
    cx.notify();
  }
}

function focusAgent(agent) {
  run("pane.focus", { pane: agent.pane });
  closeOverview();
}

function openUrl(url) {
  exec(appWindow()?.platform === "macos" ? "open" : "xdg-open", [url]).catch(() => {});
}

function badge(status) {
  const color = RUNTIME[status] ?? C.muted;
  return h_flex()
    .flex_none()
    .gap(5)
    .items_center()
    .text_color(color)
    .child(status === "working" ? svg("mods/workspace-chrome/spinner.svg").size(10).text_color(color).spin(900) : div().size(5).rounded(3).bg(color))
    .child(status || "unknown");
}

function links(item) {
  const a = item.agent;
  return h_flex()
    .flex_wrap()
    .gap(4)
    .children(item.report.links.map((url, i) => control(div()
      .id(`chief-link-${a.address}-${i}`)
      .max_w(280)
      .truncate()
      .px(6)
      .py(1)
      .rounded(4)
      .border(1)
      .border_color("#3b414c")
      .text_size(10.5)
      .text_color("#b1bdcc")
      .cursor_pointer()
      .hover((s) => s.text_color(C.text).border_color(C.edgeHover))
      .tooltip(url)
      .on_click((_e, cx) => {
        cx.stop_propagation();
        openUrl(url);
      }))
      .child(shortUrl(url))));
}

function card(item, col, now, compact) {
  const { agent: a, report: r } = item;
  const where = `${a.space_name || "?"} · ${a.tab_name || a.tab}`;
  const recent = r && now - r.at < RECENT_MS;
  const summary = compact ? "" : clip(r?.update ?? "", SUMMARY_CHARS.detailed);
  return control(v_flex()
    .id(`chief-card-${a.address}`)
    .flex_none()
    .rounded(9)
    .overflow_hidden()
    .bg(C.card)
    .border(1)
    .border_color(item.prio ? C.accent : C.edge)
    .shadow_sm()
    .cursor_pointer()
    .hover((s) => s.border_color(item.prio ? C.accent : C.edgeHover))
    .on_click((_e, cx) => {
      cx.stop_propagation();
      setShared("chief.detail", a.address);
      cx.notify();
    }))
    .child(div().h(2).flex_none().bg(col.color))
    .child(v_flex()
    .px(13)
    .pt(compact ? 8 : 11)
    .pb(compact ? 9 : 11)
    .child(h_flex()
      .gap(10)
      .items_center()
      .text_size(11)
      .text_color(C.muted)
      .child(div().flex_1().min_w(0).truncate().child(where))
      .child(badge(a.status)))
    .child(div()
      .mt(compact ? 5 : 8)
      .text_size(13)
      .font_weight(600)
      .line_height("19px")
      .text_color(C.text)
      .child(item.prio ? `★ ${r?.title || where}` : r?.title || where))
    .when(Boolean(r?.next), (el) => el.child(div()
      .mt(7)
      .px(7)
      .py(3)
      .rounded(5)
      .bg(col.color + "1f")
      .text_size(12)
      .text_color(C.text)
      .child(`Next: ${r.next}`)))
    .when(Boolean(summary), (el) => el.child(div()
      .mt(8)
      .text_size(12)
      .line_height("20px")
      .text_color(C.body)
      .child(summary)))
    .when(!compact && Boolean(r?.links.length), (el) => el.child(div().mt(9).child(links(item))))
    .when(Boolean(r?.at), (el) => el.child(h_flex()
      .mt(compact ? 6 : 10)
      .gap(8)
      .text_size(11)
      .text_color(C.muted)
      .child(div()
        .when(recent, (d) => d.font_weight(600).text_color(C.text))
        .child(`reported ${age(now - r.at)} ago`))
      .when(compact && Boolean(r?.links.length), (f) => f.child(div().child(`${r.links.length} link${r.links.length === 1 ? "" : "s"}`))))));
}

const SITUATION = { needs_input: "Needs input", uncertain: "Unsure", working: "Working", waiting_external: "Waiting on something", follow_up_later: "Follow up later", finished: "Finished" };

function button(id, label, onClick, primary = false) {
  return control(div()
    .id(id)
    .px(10)
    .py(4)
    .rounded(6)
    .border(1)
    .border_color(primary ? C.accent : C.edge)
    .text_size(12)
    .text_color(primary ? C.accent : C.text)
    .cursor_pointer()
    .hover((s) => s.border_color(primary ? C.accent : C.edgeHover).bg("#ffffff0d"))
    .on_click(onClick))
    .child(label);
}

function field(label, value) {
  return h_flex()
    .gap(12)
    .items_start()
    .text_size(12)
    .child(div().w(110).flex_none().text_color(C.muted).child(label))
    .child(div().flex_1().min_w(0).text_color(C.body).child(value));
}

function agentChip(item, label) {
  const a = item.agent;
  return control(h_flex()
    .id(`chief-rel-${a.address}`)
    .gap(6)
    .items_center()
    .px(7)
    .py(2)
    .rounded(5)
    .border(1)
    .border_color(C.edge)
    .text_size(11.5)
    .text_color(C.body)
    .cursor_pointer()
    .hover((s) => s.border_color(C.edgeHover))
    .on_click((_e, cx) => {
      cx.stop_propagation();
      setShared("chief.detail", a.address);
      cx.notify();
    }))
    .child(div().size(6).rounded(3).bg(RUNTIME[a.status] ?? C.muted))
    .child(label ?? item.report?.title ?? `${a.space_name} · ${a.tab_name || a.tab}`);
}

// The full report for one agent, shown in place of the board.
function detail(t, item, items, now) {
  const { agent: a, report: r } = item;
  const col = COLUMNS.find((c) => c.id === item.group) ?? { label: "Not reporting", color: C.muted };
  const where = `${a.space_name || "?"} · ${a.tab_name || a.tab}`;
  const parent = item.parent && items.find((i) => i.agent.address === item.parent || i.agent.address.endsWith("/" + item.parent));
  const children = items.filter((i) => i.parent && (i.parent === a.address || a.address.endsWith("/" + i.parent)));
  const back = (_e, cx) => {
    setShared("chief.detail", null);
    cx.notify();
  };
  return v_flex()
    .id("chief-detail")
    .flex_1()
    .min_h(0)
    .overflow_y_scrollbar()
    .child(v_flex()
      .w_full()
      .max_w(920)
      .mx_auto()
      .px(28)
      .py(20)
      .gap(14)
      .child(h_flex()
        .gap(8)
        .items_center()
        .child(button("chief-back", "‹ Board (Esc)", back))
        .child(div().flex_1())
        .child(button("chief-focus", "Focus agent (Enter)", () => focusAgent(a), true)))
      .child(h_flex()
        .gap(8)
        .items_center()
        .text_size(12)
        .child(div().size(7).rounded(4).bg(col.color))
        .child(div().text_color(col.color).child(col.label))
        .child(div().text_color(C.muted).child(`· ${where}`))
        .child(div().flex_1())
        .child(badge(a.status)))
      .child(div()
        .text_size(18)
        .font_weight(600)
        .line_height("26px")
        .text_color(C.text)
        .child(item.prio ? `★ ${r?.title || where}` : r?.title || where))
      .when(Boolean(r?.next), (el) => el.child(div()
        .px(10)
        .py(6)
        .rounded(6)
        .bg(col.color + "1f")
        .text_size(13)
        .line_height("20px")
        .text_color(C.text)
        .child(`Next: ${r.next}`)))
      .when(Boolean(r?.update), (el) => el.child(div()
        .text_size(13)
        .line_height("21px")
        .text_color(C.body)
        .child(r.update)))
      .when(!r, (el) => el.child(div().text_size(13).text_color(C.muted).child("This agent has not reported. Its runtime status comes from herdr only.")))
      .when(Boolean(r?.links.length), (el) => el.child(v_flex()
        .gap(5)
        .children(r.links.map((url, i) => control(div()
          .id(`chief-dlink-${i}`)
          .truncate()
          .text_size(12)
          .text_color("#8fabd8")
          .cursor_pointer()
          .hover((s) => s.text_color(C.text))
          .on_click((_e, cx) => {
            cx.stop_propagation();
            openUrl(url);
          }))
          .child(url)))))
      .child(div().h(1).bg(C.edge))
      .child(v_flex()
        .gap(6)
        .when(Boolean(r), (el) => el
          .child(field("Reported", `${SITUATION[r.situation] ?? r.situation} · ${age(now - r.at)} ago · rev ${r.rev}`))
          .child(field("Agent", [r.kind, r.session].filter(Boolean).join(" · "))))
        .child(field("Runtime", a.status || "unknown"))
        .child(field("Terminal", a.address))
        .when(Boolean(parent), (el) => el.child(h_flex().gap(12).items_center().text_size(12)
          .child(div().w(110).flex_none().text_color(C.muted).child("Parent"))
          .child(agentChip(parent))))
        .when(children.length > 0, (el) => el.child(h_flex().gap(12).items_start().text_size(12)
          .child(div().w(110).flex_none().text_color(C.muted).child("Sub-agents"))
          .child(h_flex().flex_1().flex_wrap().gap(5).children(children.map((c) => agentChip(c))))))));
}

function quietRow(t, item) {
  const a = item.agent;
  return control(h_flex()
    .id(`chief-quiet-${a.address}`)
    .h(26)
    .px(8)
    .gap(7)
    .flex_none()
    .items_center()
    .rounded(6)
    .cursor_pointer()
    .hover((s) => s.bg(t.hover))
    .on_click((_e, cx) => {
      cx.stop_propagation();
      setShared("chief.detail", a.address);
      cx.notify();
    }))
    .child(div().size(6).flex_none().rounded(3).bg(RUNTIME[a.status] ?? C.muted))
    .child(div().flex_1().min_w(0).truncate().text_size(12).text_color(C.muted).child(`${a.space_name || "?"} · ${a.tab_name || a.tab}`));
}

function header(col, count) {
  return v_flex()
    .px(4)
    .pb(4)
    .flex_none()
    .child(h_flex()
      .gap(7)
      .items_center()
      .text_size(12)
      .font_weight(550)
      .child(div().size(6).rounded(3).bg(col.color))
      .child(div().text_color(C.text).child(col.label))
      .child(div().flex_1())
      .child(div().text_size(11).font_weight(400).text_color(C.muted).child(String(count))))
    .child(div().ml(13).mt(3).text_size(11).text_color(C.muted).child(col.hint));
}

export function overview(t, items, now, handle) {
  const compact = isCompact();
  const quiet = items.filter((i) => i.group === "silent");
  const hidden = items.filter((i) => i.group === "hidden").length;
  const detailItem = items.find((i) => i.agent.address === shared("chief.detail"));
  // The window is frameless and transparent. The board is a centered panel with a width cap,
  // because a mod cannot read the screen size and an overlay size has no maximum.
  return h_flex()
    .id("chief-overview-root")
    .track_focus(handle)
    .on_key_down(overviewKey)
    .size_full()
    .justify_center()
    .on_click(closeOverview)
    .child(control(v_flex()
    .id("chief-overview-panel")
    .w_full()
    .max_w(MAX_WIDTH)
    .h_full()
    .rounded(12)
    .overflow_hidden()
    .border(1)
    .border_color(C.edge)
    .shadow_lg()
    .bg(C.column)
    .text_size(13)
    .on_click((_e, cx) => cx.stop_propagation()))
    .child(h_flex()
      .h(42)
      .px(16)
      .gap(12)
      .flex_none()
      .items_center()
      .border_b(1)
      .border_color(t.border)
      .bg(t.chrome)
      .child(div().font_weight(600).text_color(C.text).child("Chief"))
      .child(div().text_size(12).text_color(C.muted).child(`${items.length} agents${hidden ? ` · ${hidden} hidden` : ""}`))
      .child(div().flex_1())
      .child(control(div()
        .id("chief-compact")
        .px(8)
        .py(2)
        .rounded(5)
        .border(1)
        .border_color(C.edge)
        .text_size(11.5)
        .text_color(C.muted)
        .cursor_pointer()
        .hover((s) => s.text_color(C.text).border_color(C.edgeHover))
        .on_click((_e, cx) => {
          setShared("chief.compact", !compact);
          cx.notify();
        }))
        .child(compact ? "Detailed (c)" : "Compact (c)"))
      .child(control(div()
        .id("chief-overview-close")
        .px(6)
        .rounded(5)
        .text_color(C.muted)
        .cursor_pointer()
        .hover((s) => s.bg(t.hover).text_color(C.text))
        .tooltip("Close (Esc)")
        .on_click(closeOverview))
        .child("✕")))
    .when(Boolean(detailItem), (el) => el.child(detail(t, detailItem, items, now)))
    .when(!detailItem, (el) => el.child(v_flex()
      .id("chief-board")
      .flex_1()
      .min_h(0)
      .overflow_y_scrollbar()
      .child(h_flex()
        .p(14)
        .gap(14)
        .items_start()
        .children(COLUMNS.map((col) => {
          const members = items.filter((i) => i.group === col.id);
          return v_flex()
            .flex_1()
            .min_w(0)
            .gap(10)
            .child(header(col, members.length))
            .children(members.map((i) => card(i, col, now, compact)));
        }))
        .when(quiet.length > 0, (el) => el.child(v_flex()
          .w(210)
          .flex_none()
          .gap(2)
          .child(header({ label: "Not reporting", hint: "No reports yet", color: C.muted }, quiet.length))
          .children(quiet.map((i) => quietRow(t, i)))))))));
}
