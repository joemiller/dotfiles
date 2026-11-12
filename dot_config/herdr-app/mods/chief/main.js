// Chief: agent sessions sorted by what needs you. Runtime status comes from herdr;
// the report comes from chief.* labels that the agent-board reporters write on each terminal.

import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { agents, terminals, theme, layout, run, shared, setShared, setAgentOrder, nextCommand, openOverlay, closeOverlay, props } from "herdr";
import { collect, age } from "./model.js";
import { overview, agentCard, initOverview, openUrl } from "./overview.js";
import { POLL_MS, prData, prStatus, refreshPrs } from "./prs.js";

const RAIL = 44;
const WIDE = 340;
const TABS = [
  { id: "agents", label: "Agents" },
  { id: "prs", label: "PRs" },
  { id: "slack", label: "Slack", later: "Slack is phase 2." },
  { id: "recent", label: "Recent" },
];

function find(node, test) {
  if (node && test(node)) return node;
  for (const child of node?.children ?? []) {
    const found = find(child, test);
    if (found) return found;
  }
  return null;
}

const ownBlock = () => find(layout(), (n) => n.content?.mod === "chief");
// The rail goes by width, not a flag, so dragging the edge narrow gives the rail too.
const narrow = () => (ownBlock()?.size?.px ?? WIDE) < 160;

function toggle() {
  const block = ownBlock();
  if (!block?.id) return;
  if (narrow()) {
    run("layout.resize", { id: block.id, px: shared("chief.width") ?? WIDE });
    return;
  }
  if (block.size?.px) setShared("chief.width", block.size.px);
  run("layout.resize", { id: block.id, px: RAIL });
}

// The Overview window's id lives in shared state so its own close button can clear it.
function toggleOverview() {
  const open = shared("chief.overview");
  setShared("chief.overview", null);
  if (open) {
    closeOverlay(open);
    return;
  }
  setShared("chief.overview", openOverlay({ mod: "chief", kind: "window", frame: "none", key: "chief-overview", width: 0.94, height: 0.88, props: { view: "overview" } }));
}

// One agent's card in its own window. The Overview and the card share detail state.
function openCard(address) {
  for (const key of ["chief.overview", "chief.card"]) {
    const open = shared(key);
    if (open) closeOverlay(open);
    setShared(key, null);
  }
  setShared("chief.card", openOverlay({ mod: "chief", kind: "window", frame: "none", key: "chief-card", width: 780, height: 0.85, props: { view: "card", address } }));
}

// Opens the Overview on one tab. An open Overview is reopened so its tab loads.
function showOverview(tab) {
  setShared("chief.ovtab", tab);
  const open = shared("chief.overview");
  if (open) closeOverlay(open);
  setShared("chief.overview", null);
  toggleOverview();
}

// A sub-agent reports to its parent, so its done is not news: it shows as idle. Errors count
// as blocked. From the native agents mod.
const kidStatus = (k, listed) => {
  const s = listed ?? k.status;
  return s === "error" ? "blocked" : s === "done" ? "idle" : s;
};

const sortMode = () => (shared("chief.sort") === "space" ? "space" : "recent");

export default class Chief extends View {
  init(_props, cx) {
    if (props()?.view === "overview" || props()?.view === "card") {
      // A window does not take the keyboard when it opens, so Esc and c need this.
      this.handle = cx.focus_handle();
      this.handle.focus();
      initOverview(cx);
      cx.timer.every(30000, (cx) => cx.notify());
      return;
    }
    // The window is not kept, so after a restart a remembered id is stale.
    setShared("chief.overview", null);
    setShared("chief.card", null);
    this.tab = "agents";
    this.folded = new Set();
    // Ages and the stale rule depend on the clock, not only on live data.
    cx.timer.every(30000, (cx) => cx.notify());
    // Only the docked copy polls, so one Herdr window makes one gh call per interval.
    cx.spawn(async (cx) => {
      for (;;) {
        await refreshPrs().catch(() => {});
        cx.notify();
        await cx.sleep(POLL_MS);
      }
    });
    cx.spawn(async (cx) => {
      for (;;) {
        const command = await nextCommand();
        if (command === "toggle") toggle();
        if (command === "overview") toggleOverview();
        cx.notify();
      }
    });
  }

  // Drawn as the native agents mod draws them: idle a ring, done a dot, blocked a "!" here,
  // because the Needs you header already says it.
  status(t, status) {
    if (status === "working") return svg("mods/workspace-chrome/spinner.svg").size(12).mx(1).flex_none().text_color(t.working).spin(900);
    if (status === "blocked") return div().size(14).flex_none().rounded(4).bg(t.blocked + "26").text_size(10.5).font_bold().text_color(t.blocked).flex().items_center().justify_center().child("!");
    if (status === "idle") return div().size(7).mx(3).flex_none().rounded(4).border(1.5).border_color(t.idle ?? t.dim);
    return div().size(7).mx(3).flex_none().rounded(4).bg(status === "done" ? t.done ?? t.dim : t.dim + "00");
  }

  // Live sub-agents of addr, depth first, with the tree lines in front of each. From the native agents mod.
  tree(all, addr, lead = []) {
    const kids = all.filter((k) => k.parent === addr && k.state === "live");
    return kids.flatMap((k, i) => {
      const last = i === kids.length - 1;
      return [{ t: k, lines: [...lead, last ? "└" : "├"] }, ...this.tree(all, k.address, [...lead, last ? "" : "│"])];
    });
  }

  subRow(t, s, byAddress, now) {
    const k = s.t;
    const item = byAddress.get(k.address);
    const st = kidStatus(k, item?.agent.status);
    return h_flex()
      .id(`chief-sub-${k.address}`)
      .h(24)
      .pl(12)
      .pr(8)
      .flex_none()
      .items_center()
      .rounded(7)
      .when(Boolean(item?.agent.focused), (el) => el.bg(t.selected))
      .cursor_pointer()
      .hover((s) => s.bg(t.hover))
      .on_click(() => (item ? run("pane.focus", { pane: item.agent.pane }) : run("terminal.peek", { terminal: k.address })))
      .children(s.lines.map((l) => div().self_start().mt(-4).w(9).h(16).mr(4).flex_none()
        .when(Boolean(l), (el) => el.border_l(1.5).border_color(t.input))
        .when(l === "└" || l === "├", (el) => el.border_b(1.5).rounded_bl(6))))
      .child(div().flex_1().min_w(0).truncate().text_color(t.muted).child(item?.name || k.name || k.template || k.program?.name || k.address))
      .when(Boolean(item?.touched), (el) => el.child(div().flex_none().mr(6).text_size(11).text_color(t.dim).child(age(now - item.touched))))
      .child(this.status(t, st));
  }

  fold(t, address, subs) {
    const open = !this.folded.has(address);
    return div()
      .id(`chief-fold-${address}`)
      .h(18)
      .px(3)
      .gap(3)
      .flex()
      .flex_none()
      .items_center()
      .rounded(4)
      .text_size(11)
      .text_color(t.dim)
      .cursor_pointer()
      .hover((s) => s.bg(t.hover).text_color(t.foreground))
      .on_click((_e, cx) => {
        cx.stop_propagation();
        open ? this.folded.add(address) : this.folded.delete(address);
        cx.notify();
      })
      .child(svg(`mods/workspace-chrome/chevron-${open ? "down" : "right"}.svg`).size(11).flex_none())
      .when(!open, (el) => el.child(String(subs.length)));
  }

  // The focused agent's row also shows its last report, so a jump to an agent brings its context.
  row(t, item, now, subs = []) {
    const { agent: a, report: r } = item;
    const where = `${a.space_name || "?"} · ${a.tab_name || a.tab}`;
    const tip = [item.name === where ? null : where, r?.title, r?.update?.slice(0, 500)].filter(Boolean).join("\n");
    const open = a.focused && Boolean(r);
    return v_flex()
      .id(`chief-${a.address}`)
      .flex_none()
      .rounded(7)
      .when(a.status === "blocked", (el) => el.bg(t.blocked + "14"))
      .when(a.focused, (el) => el.bg(t.selected))
      // Split row: the name part focuses the agent, the › part opens its card.
      .child(h_flex()
        .h(26)
        .items_center()
        .child(h_flex()
          .id(`chief-head-${a.address}`)
          .h_full()
          .flex_1()
          .min_w(0)
          .pl(8)
          .pr(6)
          .gap(7)
          .items_center()
          .rounded_l(7)
          .cursor_pointer()
          .hover((s) => s.bg(t.hover))
          .when(!open, (el) => el.tooltip(tip))
          .on_click(() => run("pane.focus", { pane: a.pane }))
          .child(this.status(t, a.status))
          .when(item.prio, (el) => el.child(div().flex_none().text_color(t.blocked).child("★")))
          .child(div().flex_1().min_w(0).truncate().text_color(item.touched ? t.foreground : t.muted).child(item.name))
          .when(subs.length > 0, (el) => el.child(this.fold(t, a.address, subs)))
          .child(div().flex_none().text_size(11).text_color(t.dim).child(item.touched ? age(now - item.touched) : "–")))
        .child(div()
          .id(`chief-card-${a.address}`)
          .h_full()
          .w(28)
          .flex()
          .flex_none()
          .items_center()
          .justify_center()
          .rounded_r(7)
          .border_l(1)
          .border_color(t.border)
          .text_size(15)
          .text_color(t.dim)
          .cursor_pointer()
          .hover((s) => s.bg(t.hover).text_color(t.foreground))
          .tooltip("Open the agent's card")
          .on_click((_e, cx) => {
            cx.stop_propagation();
            openCard(a.address);
          })
          .child("›")))
      .when(open, (el) => el.child(v_flex()
        .pl(29)
        .pr(10)
        .pb(7)
        .gap(4)
        .text_size(11.5)
        .line_height("16px")
        .when(Boolean(r.next), (el) => el.child(div().text_color(t.foreground).child(`Next: ${r.next}`)))
        .child(div().text_color(t.muted).child(r.update.length > 280 ? r.update.slice(0, 279) + "…" : r.update))
        .children(r.links.slice(0, 3).map((url, i) => div()
          .id(`chief-flink-${i}`)
          .truncate()
          .text_color(t.dim)
          .cursor_pointer()
          .hover((s) => s.text_color(t.foreground))
          .tooltip(url)
          .on_click((_e, cx) => {
            cx.stop_propagation();
            openUrl(url);
          })
          .child(url.replace(/^https?:\/\/(www\.)?/, ""))))));
  }

  // urgent: an agent blocked itself or through a sub-agent.
  sections(all, urgent = (i) => i.agent.status === "blocked") {
    const items = all.slice().sort((x, y) => y.touched - x.touched || y.agent.seq - x.agent.seq);
    const blocked = items.filter(urgent);
    const rest = items.filter((i) => !urgent(i));
    const out = blocked.length ? [{ id: "blocked", label: "Needs you", color: "blocked", members: blocked }] : [];
    if (sortMode() === "recent") return [...out, { id: "recent", label: "", members: rest }];
    const bySpace = new Map();
    for (const i of rest) {
      const id = i.agent.space;
      if (!bySpace.has(id)) bySpace.set(id, { id: `space-${id}`, label: i.agent.space_name || "?", members: [] });
      bySpace.get(id).members.push(i);
    }
    return [...out, ...bySpace.values()];
  }

  header(t, g, count) {
    if (!g.label) return null;
    const open = !this.folded.has(g.id);
    return h_flex()
      .id(`chief-group-${g.id}`)
      .px(8)
      .pt(8)
      .h(28)
      .flex_none()
      .gap(6)
      .items_center()
      .text_size(11)
      .font_medium()
      .cursor_pointer()
      .hover((s) => s.text_color(t.foreground))
      .on_click((_e, cx) => {
        open ? this.folded.add(g.id) : this.folded.delete(g.id);
        cx.notify();
      })
      .child(div().text_color(t[g.color] ?? t.dim).child(g.label))
      .child(div().text_color(t.dim).child(String(count)))
      .child(div().flex_1())
      .child(svg(`mods/workspace-chrome/chevron-${open ? "down" : "right"}.svg`).size(11).flex_none().text_color(t.dim));
  }

  tabs(t, needs) {
    return h_flex()
      .px(8)
      .h(36)
      .flex_none()
      .gap(2)
      .items_center()
      .border_b(1)
      .border_color(t.border)
      .children(TABS.map((tab) => div()
        .id(`chief-tab-${tab.id}`)
        .px(8)
        .h(24)
        .flex()
        .items_center()
        .rounded(6)
        .text_size(12)
        .cursor_pointer()
        .when(tab.id === this.tab, (el) => el.bg(t.selected))
        .text_color(tab.later ? t.dim : t.foreground)
        .hover((s) => s.bg(t.hover))
        .on_click((_e, cx) => {
          // Recent needs search and room, so it opens in the Overview.
          if (tab.id === "recent") return showOverview("recent");
          this.tab = tab.id;
          cx.notify();
        })
        .child(tab.id === "agents" && needs ? `Agents ${needs}` : tab.label)))
      .child(div().flex_1())
      .child(div()
        .id("chief-overview")
        .px(4)
        .text_color(t.dim)
        .cursor_pointer()
        .hover((s) => s.text_color(t.foreground))
        .tooltip("Overview (cmd-shift-o)")
        .on_click(toggleOverview)
        .child("⤢"))
      .child(div()
        .id("chief-collapse")
        .px(4)
        .text_color(t.dim)
        .cursor_pointer()
        .hover((s) => s.text_color(t.foreground))
        .tooltip("Collapse")
        .on_click(toggle)
        .child("»"));
  }

  prRows(t, now) {
    const data = prData();
    const sections = [
      { label: "Review requested", prs: data.review },
      { label: "My PRs", prs: data.mine.slice().sort((x, y) => prStatus(x).rank - prStatus(y).rank || y.updated - x.updated) },
      { label: "Agent PRs", prs: data.linked },
    ];
    return sections.filter((sec) => sec.prs.length).flatMap((sec) => [
      div().px(8).pt(8).h(28).flex_none().text_size(11).font_medium().text_color(t.dim).child(`${sec.label} ${sec.prs.length}`),
      ...sec.prs.map((pr) => {
        const st = prStatus(pr);
        return h_flex()
          .id(`chief-spr-${pr.url}`)
          .h(24)
          .px(8)
          .gap(7)
          .flex_none()
          .items_center()
          .rounded(7)
          .cursor_pointer()
          .hover((s) => s.bg(t.hover))
          .tooltip(`${pr.repo}#${pr.number} · ${st.label}\n${pr.title}`)
          .on_click(() => openUrl(pr.url))
          .child(div().size(7).mx(3).flex_none().rounded(4).bg(st.color))
          .child(div().flex_1().min_w(0).truncate().text_color(t.foreground).child(pr.title))
          .child(div().flex_none().text_size(11).text_color(t.dim).child(age(now - pr.updated)));
      }),
    ]);
  }

  rail(t, items) {
    const urgent = items.filter((i) => i.agent.status === "blocked");
    const working = items.filter((i) => i.agent.status === "working").length;
    return v_flex()
      .size_full()
      .bg(t.chrome)
      .items_center()
      .gap(6)
      .pt(8)
      .child(div()
        .id("chief-expand")
        .text_color(t.dim)
        .cursor_pointer()
        .hover((s) => s.text_color(t.foreground))
        .tooltip("Expand")
        .on_click(toggle)
        .child("«"))
      .children(urgent.map((i) => div()
        .id(`chief-rail-${i.agent.address}`)
        .size(28)
        .flex_none()
        .flex()
        .items_center()
        .justify_center()
        .rounded(7)
        .bg(t.raised)
        .cursor_pointer()
        .hover((s) => s.bg(t.hover))
        .tooltip(i.name)
        .on_click(() => run("pane.focus", { pane: i.agent.pane }))
        .child(div().size(9).rounded(5).bg(t.blocked))))
      .child(div().w(20).border_t(1).border_color(t.border))
      .child(div().text_size(11).text_color(t.working).tooltip("Working").child(String(working)));
  }

  sortToggle(t) {
    const mode = sortMode();
    const choice = (id, label) => div()
      .id(`chief-sort-${id}`)
      .px(7)
      .h(20)
      .flex()
      .items_center()
      .rounded(5)
      .cursor_pointer()
      .text_color(mode === id ? t.foreground : t.dim)
      .when(mode === id, (el) => el.bg(t.selected))
      .hover((s) => s.text_color(t.foreground))
      .on_click((_e, cx) => {
        setShared("chief.sort", id);
        cx.notify();
      })
      .child(label);
    return h_flex()
      .px(4)
      .pt(4)
      .pb(2)
      .gap(2)
      .flex_none()
      .text_size(11)
      .child(choice("recent", "Recent"))
      .child(choice("space", "By space"));
  }

  render(_cx) {
    const t = theme();
    const now = Date.now();
    const items = collect(agents(), terminals(), now);
    if (props()?.view === "overview") return overview(t, items, now, this.handle);
    if (props()?.view === "card") return agentCard(t, items, now, this.handle);
    // A sub-agent shows under its parent, not as a row of its own. From the native agents mod.
    const all = terminals();
    const byAddress = new Map(items.map((i) => [i.agent.address, i]));
    const trees = new Map(items.map((i) => [i.agent.address, this.tree(all, i.agent.address)]));
    const nested = new Set([...trees.values()].flatMap((subs) => subs.map((s) => s.t.address)));
    const top = items.filter((i) => !nested.has(i.agent.address));
    const urgent = (i) => i.agent.status === "blocked" || trees.get(i.agent.address).some((s) => kidStatus(s.t, byAddress.get(s.t.address)?.agent.status) === "blocked");
    const sections = this.sections(top, urgent);
    setAgentOrder(sections.flatMap((g) => g.members.flatMap((i) => [i.agent.address, ...trees.get(i.agent.address).map((s) => s.t.address).filter((a) => byAddress.has(a))])));
    if (narrow()) return this.rail(t, items);

    const needs = items.filter((i) => i.agent.status === "blocked").length;
    const later = TABS.find((tab) => tab.id === this.tab)?.later;
    const withKids = (i) => {
      const subs = trees.get(i.agent.address);
      const head = this.row(t, i, now, subs);
      return this.folded.has(i.agent.address) ? [head] : [head, ...subs.map((s) => this.subRow(t, s, byAddress, now))];
    };
    const rows = [this.sortToggle(t), ...sections.flatMap((g) => [
      this.header(t, g, g.members.length),
      ...(this.folded.has(g.id) ? [] : g.members.flatMap(withKids)),
    ])].filter(Boolean);
    return v_flex()
      .size_full()
      .min_h(0)
      .bg(t.chrome)
      .text_size(12.5)
      .child(this.tabs(t, needs))
      .when(Boolean(later), (el) => el.child(div().p(12).text_size(12).text_color(t.dim).child(later)))
      .when(this.tab === "agents" && items.length === 0, (el) => el.child(div().p(12).text_size(12).text_color(t.dim).child("No agents yet.")))
      .when(this.tab === "prs" && !prData().at, (el) => el.child(div().p(12).text_size(12).text_color(t.dim).child("Loading PRs from gh…")))
      .when(!later, (el) => el.child(v_flex().id("chief-list").flex_1().min_h(0).px(6).pb(8).overflow_y_scrollbar().mode("always").children(this.tab === "prs" ? this.prRows(t, now) : rows)));
  }
}
