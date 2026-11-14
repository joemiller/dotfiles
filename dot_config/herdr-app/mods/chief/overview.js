// The Overview window: an Agents board with a detail view per agent, and a PRs board.

import { div, svg } from "gpui-kit";
import { v_flex, h_flex, TextareaState, Textarea, InputState, Input } from "gpui-base";
import { run, shared, setShared, closeOverlay, props, exec, agents, window as appWindow } from "herdr";
import { age } from "./model.js";
import { label, send, kill, readScreen, suggestReply } from "./actions.js";
import { prData, prIndex, prKey, prStatus, refreshPrs } from "./prs.js";
import { recent, loadRecent, liveSessions, recordTitle, matches, reopen } from "./recent.js";
import { strip, attentionCard, minutes } from "./heat.js";

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

// Detail state lives here because the window shows one detail at a time.
// busy names the running action; error and note show its result.
const ui = { input: null, search: null, query: "", picked: "", typing: false, peek: "", busy: "", error: "", note: "", confirmClose: false };

export function initOverview(cx) {
  ui.input = TextareaState.new({ placeholder: "Message to the agent. Cmd-Enter sends." });
  ui.input.set_auto_grow(2, 8);
  ui.input.on("focus", (_e, cx) => {
    ui.typing = true;
    cx.notify();
  });
  ui.input.on("blur", (_e, cx) => {
    ui.typing = false;
    cx.notify();
  });
  ui.search = InputState.new({ placeholder: "Search titles, reports, folders, session IDs" });
  ui.search.on("change", (_e, cx) => {
    ui.query = ui.search.value();
    cx.notify();
  });
  ui.search.on("focus", (_e, cx) => {
    ui.typing = true;
    cx.notify();
  });
  ui.search.on("blur", (_e, cx) => {
    ui.typing = false;
    cx.notify();
  });
  if (inCard()) return openDetail(props().address, cx);
  // A detail left open when the window closed is not shown again.
  if (shared("chief.detail")) openDetail(shared("chief.detail"), cx);
  if (shared("chief.ovtab") === "recent") openRecent(cx);
}

function openRecent(cx) {
  setShared("chief.ovtab", "recent");
  ui.search.focus();
  cx.spawn(async (cx) => {
    const pending = loadRecent();
    cx.notify();
    await pending;
    cx.notify();
  });
  cx.notify();
}

const currentAgent = () => agents().find((a) => a.address === shared("chief.detail"));

export function openDetail(address, cx) {
  const changed = shared("chief.detail") !== address;
  setShared("chief.detail", address);
  setShared("chief.ovtab", "agents");
  if (changed) {
    Object.assign(ui, { peek: "", busy: "", error: "", note: "", confirmClose: false });
    ui.input?.set_value("");
  }
  refreshPeek(cx);
  cx.notify();
}

function closeDetail(cx) {
  if (inCard()) return closeOverview();
  setShared("chief.detail", null);
  ui.confirmClose = false;
  cx.notify();
}

// The terminal's own lines, without the trailing blank ones.
function refreshPeek(cx) {
  const address = shared("chief.detail");
  cx.spawn(async (cx) => {
    try {
      const text = await readScreen(address, 40);
      if (shared("chief.detail") !== address) return;
      const lines = text.split("\n").map((l) => l.trimEnd()).filter((l) => !l.startsWith("[hc] "));
      while (lines.length && !lines[lines.length - 1]) lines.pop();
      ui.peek = lines.slice(-50).join("\n");
    } catch (e) {
      ui.peek = `Could not read the screen: ${e.message}`;
    }
    cx.notify();
  });
}

// Runs one action at a time. The result shows under the action bar.
function act(cx, name, fn) {
  if (ui.busy) return;
  Object.assign(ui, { busy: name, error: "", note: "" });
  cx.notify();
  const address = shared("chief.detail");
  cx.spawn(async (cx) => {
    try {
      const note = await fn();
      if (shared("chief.detail") === address) ui.note = note ?? "";
    } catch (e) {
      if (shared("chief.detail") === address) ui.error = `${name}: ${e.message}`;
    }
    ui.busy = "";
    cx.notify();
  });
}

function sendDraft(cx) {
  const agent = currentAgent();
  const text = ui.input.value().trim();
  if (!agent || !text) return;
  act(cx, "Send", async () => {
    await send(agent.address, text);
    ui.input.set_value("");
    cx.timer.after(1500, (cx) => refreshPeek(cx));
    return "Sent.";
  });
}

export const isCompact = () => shared("chief.compact") === true;

// The card window shows one agent's detail. It shares the detail state with the Overview,
// so only one of them is open at a time.
const inCard = () => props()?.view === "card";

export function closeOverview() {
  setShared(inCard() ? "chief.card" : "chief.overview", null);
  setShared("chief.detail", null);
  closeOverlay(props().overlay);
}

// Esc closes, c toggles compact. Keys with Cmd, Ctrl or Alt are left to the app.
export function overviewKey(e, cx) {
  const m = e.modifiers ?? {};
  if (ui.typing && shared("chief.detail") && e.key === "enter" && (m.platform || m.control)) {
    sendDraft(cx);
    cx.stop_propagation();
    return;
  }
  if (m.platform || m.control || m.alt) return;
  if (e.key === "escape") {
    if (shared("chief.detail")) closeDetail(cx);
    else closeOverview();
    return;
  }
  // While the text box has the keyboard, plain keys are typing.
  if (ui.typing) return;
  if (e.key === "enter" && shared("chief.detail")) {
    const agent = currentAgent();
    if (agent) focusAgent(agent);
  } else if (e.key === "c") {
    setShared("chief.compact", !isCompact());
    cx.notify();
  }
}

function focusAgent(agent) {
  run("pane.focus", { pane: agent.pane });
  closeOverview();
}

export function openUrl(url) {
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

function prDot(url, index) {
  const pr = index.get(prKey(url) ?? "");
  return pr ? div().size(6).flex_none().rounded(3).bg(prStatus(pr).color) : null;
}

function links(item) {
  const a = item.agent;
  const index = prIndex();
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
      .tooltip(prTooltip(url, index))
      .on_click((_e, cx) => {
        cx.stop_propagation();
        openUrl(url);
      }))
      .child(h_flex().gap(5).items_center().children([prDot(url, index), div().truncate().child(shortUrl(url))].filter(Boolean)))));
}

function prTooltip(url, index) {
  const pr = index.get(prKey(url) ?? "");
  return pr ? `${prStatus(pr).label} · ${pr.title}` : url;
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
      openDetail(a.address, cx);
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
      openDetail(a.address, cx);
    }))
    .child(div().size(6).rounded(3).bg(RUNTIME[a.status] ?? C.muted))
    .child(label ?? item.report?.title ?? `${a.space_name} · ${a.tab_name || a.tab}`);
}

function prRow(pr, id) {
  const st = prStatus(pr);
  return control(h_flex()
    .id(id)
    .gap(8)
    .items_center()
    .px(8)
    .py(5)
    .rounded(6)
    .border(1)
    .border_color(C.edge)
    .text_size(12)
    .cursor_pointer()
    .hover((s) => s.border_color(C.edgeHover))
    .tooltip(pr.url)
    .on_click((_e, cx) => {
      cx.stop_propagation();
      openUrl(pr.url);
    }))
    .child(div().size(7).flex_none().rounded(4).bg(st.color))
    .child(div().flex_none().text_color(C.muted).child(`${pr.repo}#${pr.number}`))
    .child(div().flex_1().min_w(0).truncate().text_color(C.text).child(pr.title))
    .child(div().flex_none().text_color(st.color).child(st.label));
}

function actionBar(a, r, item) {
  const hidden = Boolean(r?.hidden);
  const busy = (name) => ui.busy === name;
  return h_flex()
    .gap(8)
    .flex_wrap()
    .items_center()
    .child(button("chief-act-suggest", busy("Suggest") ? "Drafting…" : "✨ Suggest reply", (_e, cx) => act(cx, "Suggest", async () => {
      ui.input.set_value(await suggestReply(a));
      ui.input.focus();
      return "Draft ready. Edit it, then send.";
    })))
    .child(button("chief-act-prio", item.prio ? "★ Priority on" : "☆ Priority", (_e, cx) => act(cx, "Priority", () => label(a.address, { "chief.prio": item.prio ? "" : "high" }))))
    .when(Boolean(r?.rev), (el) => el.child(button("chief-act-hide", hidden ? "Unhide" : "Hide until next report", (_e, cx) => act(cx, "Hide", async () => {
      await label(a.address, { "chief.hidden": hidden ? "" : r.rev });
      if (!hidden) closeDetail(cx);
    }))))
    .child(button("chief-act-peek", "↻ Screen", (_e, cx) => refreshPeek(cx)))
    .child(div().flex_1())
    .child(ui.confirmClose
      ? h_flex().gap(6)
        .child(button("chief-act-close-no", "Keep", (_e, cx) => {
          ui.confirmClose = false;
          cx.notify();
        }))
        .child(button("chief-act-close-yes", "End the agent", (_e, cx) => act(cx, "Close", async () => {
          ui.confirmClose = false;
          await kill(a.address);
          closeDetail(cx);
        }), true))
      : button("chief-act-close", "Close…", (_e, cx) => {
        ui.confirmClose = true;
        cx.notify();
      }));
}

function sendBox() {
  return v_flex()
    .gap(6)
    .child(Textarea.new(ui.input)
      .w_full()
      .px(10)
      .py(6)
      .rounded(7)
      .border(1)
      .border_color(ui.typing ? C.accent : C.edge)
      .bg(C.card)
      .text_size(13)
      .text_color(C.text))
    .child(h_flex()
      .gap(8)
      .items_center()
      .text_size(11.5)
      .text_color(C.muted)
      .child(div().flex_1().child("hc send pastes the text and presses Enter. A blocked agent refuses it."))
      .child(button("chief-act-send", ui.busy === "Send" ? "Sending…" : "Send (Cmd-Enter)", (_e, cx) => sendDraft(cx), true)));
}

// The full report for one agent, shown in place of the board.
function detail(t, item, items, now) {
  const { agent: a, report: r } = item;
  const col = COLUMNS.find((c) => c.id === item.group) ?? { label: "Not reporting", color: C.muted };
  const where = `${a.space_name || "?"} · ${a.tab_name || a.tab}`;
  const parent = item.parent && items.find((i) => i.agent.address === item.parent || i.agent.address.endsWith("/" + item.parent));
  const children = items.filter((i) => i.parent && (i.parent === a.address || a.address.endsWith("/" + i.parent)));
  const index = prIndex();
  const prs = (r?.links ?? []).map((url) => index.get(prKey(url) ?? "")).filter(Boolean);
  const otherLinks = (r?.links ?? []).filter((url) => !index.has(prKey(url) ?? ""));
  return v_flex()
    .id("chief-detail")
    .flex_1()
    .min_h(0)
    .overflow_y_scrollbar()
    .child(v_flex()
      .w_full()
      .max_w(980)
      .mx_auto()
      .px(28)
      .py(20)
      .gap(14)
      .child(h_flex()
        .gap(8)
        .items_center()
        .child(button("chief-back", inCard() ? "Close (Esc)" : "‹ Board (Esc)", (_e, cx) => closeDetail(cx)))
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
      .child(actionBar(a, r, item))
      .when(Boolean(ui.busy || ui.error || ui.note), (el) => el.child(div()
        .text_size(12)
        .text_color(ui.error ? "#e996a6" : C.muted)
        .child(ui.error || (ui.busy ? `${ui.busy}…` : ui.note))))
      .child(sendBox())
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
      .when(prs.length > 0, (el) => el.child(v_flex()
        .gap(5)
        .children(prs.map((pr, i) => prRow(pr, `chief-dpr-${i}`)))))
      .when(otherLinks.length > 0, (el) => el.child(v_flex()
        .gap(5)
        .children(otherLinks.map((url, i) => control(div()
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
      .child(v_flex()
        .gap(6)
        .child(div().text_size(11.5).text_color(C.muted).child("Screen"))
        .child(div()
          .id("chief-peek")
          .max_h(360)
          .overflow_y_scrollbar()
          .p(10)
          .rounded(7)
          .bg("#0d0f13")
          .border(1)
          .border_color(C.edge)
          .font_family("Menlo")
          .text_size(11.5)
          .line_height("16px")
          .text_color(C.body)
          .children((ui.peek || "Reading…").split("\n").map((line) => div().whitespace_nowrap().child(line || " ")))))
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
      openDetail(a.address, cx);
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

function recentRow(r, live, now) {
  const open = live.get(r.id);
  const picked = ui.picked === r.id;
  const meta = [r.kind, r.where || r.cwd, open ? "open" : `last seen ${age(now - Date.parse(r.last))} ago`].join(" · ");
  return control(v_flex()
    .id(`chief-recent-${r.id}`)
    .flex_none()
    .px(12)
    .py(8)
    .gap(4)
    .rounded(8)
    .border(1)
    .border_color(picked ? C.edgeHover : C.edge)
    .bg(picked ? C.card : "#00000000")
    .cursor_pointer()
    .hover((s) => s.bg(C.card))
    .on_click((_e, cx) => {
      ui.picked = picked ? "" : r.id;
      ui.error = "";
      cx.notify();
    }))
    .child(h_flex()
      .gap(8)
      .items_center()
      .child(div().size(7).flex_none().rounded(4).bg(open ? "#9fbb8f" : "#5c6370"))
      .child(div().flex_1().min_w(0).truncate().text_size(13).font_weight(600).text_color(C.text).child(recordTitle(r)))
      .child(div().flex_none().text_size(11).text_color(C.muted).child(r.report?.situation ?? "")))
    .child(div().truncate().text_size(11.5).text_color(C.muted).child(meta))
    .when(picked, (el) => el
      .when(Boolean(r.report?.update), (el) => el.child(div().pt(4).text_size(12.5).line_height("19px").text_color(C.body).child(r.report.update)))
      .child(div().text_size(11).text_color(C.muted).child(`${r.cwd} · ${r.id}`))
      .child(h_flex()
        .pt(4)
        .gap(8)
        .child(open
          ? button(`chief-recent-focus-${r.id}`, "Focus agent", () => {
            run("agent.focus", { terminal: open });
            closeOverview();
          }, true)
          : button(`chief-recent-open-${r.id}`, "Reopen in a new tab", (_e, cx) => {
            try {
              reopen(r);
              closeOverview();
            } catch (e) {
              ui.error = `Reopen: ${e.message}`;
              cx.notify();
            }
          }, true))
        .when(Boolean(ui.error), (el) => el.child(div().text_size(12).text_color("#e996a6").child(ui.error)))));
}

function recentView(now) {
  const live = liveSessions();
  const rows = recent.rows.filter((r) => matches(r, ui.query)).slice(0, 200);
  return v_flex()
    .id("chief-recent")
    .flex_1()
    .min_h(0)
    .child(h_flex()
      .px(16)
      .py(10)
      .gap(10)
      .flex_none()
      .items_center()
      .child(Input.new(ui.search).flex_1())
      .child(button("chief-recent-refresh", "↻ Refresh", (_e, cx) => openRecent(cx))))
    .when(Boolean(recent.error), (el) => el.child(div().px(16).text_size(12).text_color("#e996a6").child(recent.error)))
    .when(recent.at > 0 && rows.length === 0, (el) => el.child(div().px(16).py(8).text_size(12).text_color(C.muted)
      .child(recent.rows.length ? "No session matches." : "No sessions recorded yet. Agents record themselves after their next start or turn.")))
    .child(v_flex()
      .id("chief-recent-list")
      .flex_1()
      .min_h(0)
      .overflow_y_scrollbar()
      .child(v_flex()
        .w_full()
        .max_w(1100)
        .mx_auto()
        .px(16)
        .pb(16)
        .gap(6)
        .children(rows.map((r) => recentRow(r, live, now)))));
}

function tabButton(id, current, text) {
  const on = id === current;
  return control(div()
    .id(`chief-ovtab-${id}`)
    .px(9)
    .py(3)
    .rounded(6)
    .text_size(12)
    .text_color(on ? C.text : C.muted)
    .when(on, (el) => el.bg("#ffffff14"))
    .cursor_pointer()
    .hover((s) => s.text_color(C.text))
    .on_click((_e, cx) => {
      if (id === "recent") openRecent(cx);
      else {
        setShared("chief.ovtab", id);
        cx.notify();
      }
    }))
    .child(text);
}

const PR_COLUMNS = [
  { id: "review", label: "Review requested", hint: "Asked of you by name", color: "#e1b578" },
  { id: "mine", label: "My PRs", hint: "Open, newest activity first", color: "#8fabd8" },
  { id: "linked", label: "Agent PRs", hint: "Reported by agents, not in the other two", color: "#bc9cd7" },
];

function prCard(pr, now, linkedBy) {
  const st = prStatus(pr);
  return control(v_flex()
    .id(`chief-pr-${pr.url}`)
    .flex_none()
    .rounded(9)
    .overflow_hidden()
    .bg(C.card)
    .border(1)
    .border_color(C.edge)
    .cursor_pointer()
    .hover((s) => s.border_color(C.edgeHover))
    .tooltip(pr.url)
    .on_click((_e, cx) => {
      cx.stop_propagation();
      openUrl(pr.url);
    }))
    .child(div().h(2).flex_none().bg(st.color))
    .child(v_flex()
      .px(13)
      .py(10)
      .gap(6)
      .child(h_flex()
        .gap(8)
        .items_center()
        .text_size(11)
        .child(div().flex_1().min_w(0).truncate().text_color(C.muted).child(`${pr.repo}#${pr.number}${pr.author ? ` · ${pr.author}` : ""}`))
        .child(div().flex_none().text_color(st.color).child(st.label)))
      .child(div().text_size(13).font_weight(600).line_height("19px").text_color(C.text).child(pr.title))
      .child(h_flex()
        .gap(6)
        .flex_wrap()
        .items_center()
        .text_size(11)
        .text_color(C.muted)
        .child(div().child(`updated ${age(now - pr.updated)} ago`))
        .children(linkedBy.map((item) => agentChip(item)))));
}

function prBoard(items, now, prs) {
  const byUrl = new Map();
  for (const item of items) {
    for (const url of item.report?.links ?? []) {
      const key = prKey(url);
      if (key) byUrl.set(key, [...(byUrl.get(key) ?? []), item]);
    }
  }
  const lists = {
    review: prs.review,
    mine: prs.mine.slice().sort((x, y) => prStatus(x).rank - prStatus(y).rank || y.updated - x.updated),
    linked: prs.linked.slice().sort((x, y) => prStatus(x).rank - prStatus(y).rank || y.updated - x.updated),
  };
  return v_flex()
    .id("chief-prs")
    .flex_1()
    .min_h(0)
    .overflow_y_scrollbar()
    .when(Boolean(prs.error), (el) => el.child(div().px(16).pt(10).text_size(12).text_color("#e996a6").child(`Last refresh kept old data for ${prs.error}`)))
    .when(!prs.at, (el) => el.child(div().p(16).text_size(12).text_color(C.muted).child("Loading PRs from gh…")))
    .child(h_flex()
      .p(14)
      .gap(14)
      .items_start()
      .children(PR_COLUMNS.map((col) => {
        const list = lists[col.id];
        const count = col.id === "mine" && prs.mineTotal > list.length ? `${list.length} of ${prs.mineTotal}` : list.length;
        return v_flex()
          .flex_1()
          .min_w(0)
          .gap(10)
          .child(header(col, count))
          .children(list.map((pr) => prCard(pr, now, byUrl.get(prKey(pr.url)) ?? [])));
      })));
}

export function agentCard(t, items, now, handle) {
  const item = items.find((i) => i.agent.address === shared("chief.detail"));
  return v_flex()
    .id("chief-card-root")
    .track_focus(handle)
    .on_key_down(overviewKey)
    .size_full()
    .rounded(12)
    .overflow_hidden()
    .border(1)
    .border_color(C.edge)
    .bg(C.column)
    .text_size(13)
    .child(item
      ? detail(t, item, items, now)
      : v_flex().p(20).gap(10).text_color(C.muted)
        .child("This agent is gone.")
        .child(h_flex().child(button("chief-card-close", "Close (Esc)", closeOverview))));
}

export function overview(t, items, now, handle) {
  const compact = isCompact();
  const quiet = items.filter((i) => i.group === "silent");
  const hidden = items.filter((i) => i.group === "hidden").length;
  const tab = ["prs", "recent", "attention"].includes(shared("chief.ovtab")) ? shared("chief.ovtab") : "agents";
  const detailItem = tab === "agents" ? items.find((i) => i.agent.address === shared("chief.detail")) : null;
  const prs = prData();
  const needs = items.filter((i) => i.group === "needs").length;
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
      .child(tabButton("agents", tab, needs ? `Agents · ${needs} need you` : "Agents"))
      .child(tabButton("prs", tab, prs.review.length ? `PRs · ${prs.review.length} to review` : "PRs"))
      .child(tabButton("recent", tab, "Recent"))
      .child(tabButton("attention", tab, "Attention"))
      .child(div().text_size(12).text_color(C.muted).child(tab === "agents"
        ? `${items.length} agents${hidden ? ` · ${hidden} hidden` : ""}`
        : tab === "recent" ? (recent.loading ? "loading…" : recent.at ? `${recent.rows.length} sessions` : "")
        : tab === "attention" ? ""
        : prs.at ? `updated ${age(now - prs.at)} ago` : "loading…"))
      .child(div().flex_1())
      .when(tab === "prs", (el) => el.child(button("chief-prs-refresh", "↻ Refresh", (_e, cx) => cx.spawn(async (cx) => {
        await refreshPrs();
        cx.notify();
      }))))
      .when(tab === "agents", (el) => el.child(control(div()
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
        .child(compact ? "Detailed (c)" : "Compact (c)")))
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
    .when(tab === "prs", (el) => el.child(prBoard(items, now, prs)))
    .when(tab === "recent", (el) => el.child(recentView(now)))
    .when(tab === "attention", (el) => el.child(attentionView(t, items, now)))
    .when(Boolean(detailItem), (el) => el.child(detail(t, detailItem, items, now)))
    .when(tab === "agents" && !detailItem, (el) => el.child(v_flex()
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

// Attention tab: a treemap of Joe's attention, grouped by space. Area is attention in the range
// (focus minutes, a prompt counts 6), color is how recently he last prompted the agent.
const RANGES = [{ id: 24, label: "24h" }, { id: 168, label: "7d" }, { id: 720, label: "30d" }];
const attention = { size: null };

function squarify(values, x, y, w, h) {
  const rects = [];
  const rest = values.filter((v) => v.v > 0);
  let row = [];
  const worst = (r, side) => {
    const sum = r.reduce((s, z) => s + z.v, 0);
    const max = Math.max(...r.map((z) => z.v));
    const min = Math.min(...r.map((z) => z.v));
    return Math.max((side * side * max) / (sum * sum), (sum * sum) / (side * side * min));
  };
  const lay = () => {
    const sum = row.reduce((s, z) => s + z.v, 0);
    if (w >= h) {
      const cw = sum / h;
      let cy = y;
      for (const z of row) {
        rects.push({ ...z, x, y: cy, w: cw, h: z.v / cw });
        cy += z.v / cw;
      }
      x += cw;
      w -= cw;
    } else {
      const rh = sum / w;
      let cx = x;
      for (const z of row) {
        rects.push({ ...z, x: cx, y, w: z.v / rh, h: rh });
        cx += z.v / rh;
      }
      y += rh;
      h -= rh;
    }
    row = [];
  };
  while (rest.length) {
    const side = Math.min(w, h);
    if (!row.length || worst([...row, rest[0]], side) <= worst(row, side)) row.push(rest.shift());
    else lay();
  }
  if (row.length) lay();
  return rects;
}

// Hot orange for a prompt just now, through brown, to cold blue after about five days.
const STOPS = [[255, 179, 107], [240, 122, 42], [179, 86, 31], [75, 123, 181], [34, 50, 74]];
function recency(hours) {
  const p = Math.min(1, Math.log10(1 + hours) / Math.log10(120)) * (STOPS.length - 1);
  const i = Math.floor(p);
  const a = STOPS[i];
  const b = STOPS[Math.min(i + 1, STOPS.length - 1)];
  const rgb = a.map((c, k) => Math.round(c + (b[k] - c) * (p - i)));
  const light = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255 > 0.55;
  return { bg: `#${rgb.map((c) => c.toString(16).padStart(2, "0")).join("")}`, fg: light ? "#1a1206" : "#ffffff", sub: light ? "#1a1206b0" : "#ffffffb0" };
}

const STATUS_DOT = { blocked: "#f0a04b", working: "#e7c35a", done: "#5aa2f0" };

function attentionView(t, items, now) {
  const span = RANGES.some((r) => r.id === shared("chief.attrange")) ? shared("chief.attrange") : 168;
  const inRange = items.map((i) => ({ i, v: i.heat.within(span) })).filter((z) => z.v > 0);
  const cold = items.length - inRange.length;
  const selected = items.find((i) => i.agent.address === shared("chief.attsel")) ?? inRange.slice().sort((a, b) => b.v - a.v)[0]?.i;
  const size = attention.size;
  const tiles = [];
  if (size && inRange.length) {
    const spaces = new Map();
    for (const z of inRange) {
      const id = z.i.agent.space;
      if (!spaces.has(id)) spaces.set(id, { name: z.i.agent.space_name || "?", members: [], v: 0 });
      const g = spaces.get(id);
      g.members.push(z);
      g.v += z.v;
    }
    const groups = [...spaces.values()].sort((a, b) => b.v - a.v);
    const total = groups.reduce((s, g) => s + g.v, 0);
    for (const o of squarify(groups.map((g) => ({ g, v: (g.v / total) * size.width * size.height })), 0, 0, size.width, size.height)) {
      const top = o.h > 60 && o.w > 90 ? 20 : 3;
      tiles.push(div().absolute().left(o.x + 1).top(o.y + 1).w(Math.max(0, o.w - 2)).h(Math.max(0, o.h - 2)).rounded(9).border(1).border_color("#ffffff22"));
      if (top > 3) tiles.push(div().absolute().left(o.x + 8).top(o.y + 3).max_w(Math.max(0, o.w - 16)).truncate().text_size(10.5).font_weight(650).text_color("#ffffffcc").child(o.g.name.toUpperCase()));
      const members = o.g.members.sort((a, b) => b.v - a.v);
      const inner = { w: o.w - 6, h: o.h - top - 3 };
      for (const r of squarify(members.map((z) => ({ z, v: (z.v / o.g.v) * inner.w * inner.h })), o.x + 3, o.y + top, inner.w, inner.h)) {
        const item = r.z.i;
        const a = item.agent;
        const c = recency(item.touched ? (now - item.touched) / 3600000 : 999);
        const big = r.w > 160 && r.h > 92;
        const mid = r.w > 70 && r.h > 36;
        const last = item.heat.prompts.at(-1)?.text;
        tiles.push(div()
          .id(`chief-att-${a.address}`)
          .absolute()
          .left(r.x + 1)
          .top(r.y + 1)
          .w(Math.max(0, r.w - 2))
          .h(Math.max(0, r.h - 2))
          .rounded(7)
          .overflow_hidden()
          .px(8)
          .py(6)
          .bg(c.bg)
          .when(selected?.agent.address === a.address, (el) => el.border(2).border_color("#ffffff"))
          .cursor_pointer()
          .hover((s) => s.opacity(0.88))
          .tooltip(`${a.space_name} · ${item.name}\n${minutes(r.z.v)} in range`)
          .on_click((_e, cx) => {
            setShared("chief.attsel", a.address);
            cx.notify();
          })
          .when(Boolean(STATUS_DOT[a.status]), (el) => el.child(div().absolute().top(8).right(8).size(7).rounded(4).bg(STATUS_DOT[a.status])))
          .when(mid, (el) => el
            .child(div().pr(12).truncate().text_size(12.5).font_weight(620).text_color(c.fg).child(item.name))
            .child(div().truncate().text_size(11).text_color(c.sub).child(`${minutes(r.z.v)}${item.touched ? ` · ${age(now - item.touched)} ago` : ""}`)))
          .when(big && Boolean(last), (el) => el.child(div().mt(5).max_h(46).overflow_hidden().text_size(11).line_height("15px").text_color(c.sub).child(`“${last}”`)))
          .when(big, (el) => el.child(div().absolute().left(8).bottom(7).child(strip(item.heat.days, { border: "#00000033" })))));
      }
    }
  }
  const rangeButton = (r) => control(div()
    .id(`chief-attrange-${r.id}`)
    .px(8)
    .py(2)
    .rounded(5)
    .text_size(11.5)
    .text_color(r.id === span ? C.text : C.muted)
    .when(r.id === span, (el) => el.bg("#ffffff14"))
    .cursor_pointer()
    .hover((s) => s.text_color(C.text))
    .on_click((_e, cx) => {
      setShared("chief.attrange", r.id);
      cx.notify();
    }))
    .child(r.label);
  return h_flex()
    .flex_1()
    .min_h(0)
    .p(14)
    .gap(14)
    .items_start()
    .child(v_flex()
      .flex_1()
      .min_w(0)
      .h_full()
      .gap(8)
      .child(h_flex().gap(4).items_center()
        .children(RANGES.map(rangeButton))
        .child(div().flex_1())
        .child(div().text_size(11.5).text_color(C.muted).child(`area: your attention in range · color: your last prompt, hot to cold${cold ? ` · ${cold} agents with none` : ""}`)))
      .child(div()
        .id("chief-att-map")
        .relative()
        .flex_1()
        .w_full()
        .min_h(0)
        .on_size_change((s, cx) => {
          if (attention.size?.width === s.width && attention.size?.height === s.height) return;
          attention.size = s;
          cx.notify();
        })
        .when(!inRange.length, (el) => el.child(div().p(20).text_color(C.muted).child("No attention recorded in this range yet. Prompts and focus minutes count from now on.")))
        .children(tiles)))
    .when(Boolean(selected), (el) => el.child(v_flex()
      .w(320)
      .flex_none()
      .p(12)
      .gap(10)
      .rounded(10)
      .border(1)
      .border_color(C.edge)
      .bg(C.card)
      .child(h_flex().gap(8).items_center()
        .child(div().flex_1().min_w(0).truncate().font_weight(600).text_color(C.text).child(selected.name))
        .child(strip(selected.heat.days, t)))
      .child(div().mt(-6).text_size(11.5).text_color(C.muted).child(`${selected.agent.space_name || "?"} · ${selected.agent.tab_name || selected.agent.tab}`))
      .child(attentionCard(t, selected, now, `chief-att-card-${selected.agent.address}`, [
        { id: "focus", label: "Focus ⏎", run: () => focusAgent(selected.agent) },
        { id: "detail", label: "Details", run: (cx) => {
          setShared("chief.ovtab", "agents");
          setShared("chief.detail", selected.agent.address);
          cx.notify();
        } },
      ]))));
}
