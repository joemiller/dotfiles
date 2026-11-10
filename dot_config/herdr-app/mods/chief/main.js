// Chief: agent sessions sorted by what needs you. Runtime status comes from herdr;
// the report comes from chief.* labels that the agent-board reporters write on each terminal.

import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { agents, terminals, theme, layout, run, shared, setShared, setAgentOrder, nextCommand, openOverlay, closeOverlay, props } from "herdr";
import { GROUPS, collect, age } from "./model.js";
import { overview, initOverview, openUrl } from "./overview.js";
import { POLL_MS, prData, prStatus, refreshPrs } from "./prs.js";

const RAIL = 44;
const WIDE = 340;
const TABS = [
  { id: "agents", label: "Agents" },
  { id: "prs", label: "PRs" },
  { id: "slack", label: "Slack", later: "Slack is phase 2." },
  { id: "closed", label: "Closed", later: "Closed sessions are phase 2." },
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

export default class Chief extends View {
  init(_props, cx) {
    if (props()?.view === "overview") {
      // A window does not take the keyboard when it opens, so Esc and c need this.
      this.handle = cx.focus_handle();
      this.handle.focus();
      initOverview(cx);
      cx.timer.every(30000, (cx) => cx.notify());
      return;
    }
    // The window is not kept, so after a restart a remembered id is stale.
    setShared("chief.overview", null);
    this.tab = "agents";
    this.folded = new Set(GROUPS.filter((g) => g.folded).map((g) => g.id));
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

  status(t, status) {
    if (status === "working") return svg("mods/workspace-chrome/spinner.svg").size(12).mx(1).flex_none().text_color(t.working).spin(900);
    if (status === "idle") return div().size(7).mx(3).flex_none().rounded(4).border(1.5).border_color(t.idle ?? t.dim);
    return div().size(7).mx(3).flex_none().rounded(4).bg(t[status] ?? t.dim);
  }

  row(t, item, now) {
    const { agent: a, report: r, group } = item;
    const where = `${a.space_name || "?"} · ${a.tab_name || a.tab}`;
    const title = r?.title || where;
    return v_flex()
      .id(`chief-${a.address}`)
      .px(8)
      .py(4)
      .flex_none()
      .rounded(7)
      .when(group === "needs", (el) => el.bg(t.blocked + "14").border_l(2).border_color(t.blocked))
      .when(a.focused, (el) => el.bg(t.selected))
      .cursor_pointer()
      .hover((s) => s.bg(t.hover))
      .when(Boolean(r?.update), (el) => el.tooltip(r.update.slice(0, 600)))
      .on_click(() => run("pane.focus", { pane: a.pane }))
      .child(h_flex()
        .h(18)
        .gap(7)
        .items_center()
        .child(this.status(t, a.status))
        .when(item.prio, (el) => el.child(div().flex_none().text_color(t.blocked).child("★")))
        .child(div().flex_1().min_w(0).truncate().text_color(group === "finished" || group === "silent" ? t.muted : t.foreground).child(title))
        .when(Boolean(r?.at), (el) => el.child(div().flex_none().text_size(11).text_color(t.dim).child(age(now - r.at)))))
      .when(group === "needs" && Boolean(r), (el) => el.child(div().pl(21).truncate().text_size(11).text_color(t.dim).child(where)));
  }

  header(t, g, count) {
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
    const urgent = items.filter((i) => i.group === "needs" || i.group === "unclear");
    const working = items.filter((i) => i.group === "working").length;
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
        .tooltip(i.report?.title || `${i.agent.space_name} · ${i.agent.tab_name}`)
        .on_click(() => run("pane.focus", { pane: i.agent.pane }))
        .child(div().size(9).rounded(5).bg(i.group === "needs" ? t.blocked : t.unknown ?? t.dim))))
      .child(div().w(20).border_t(1).border_color(t.border))
      .child(div().text_size(11).text_color(t.working).tooltip("Working").child(String(working)));
  }

  render(_cx) {
    const t = theme();
    const now = Date.now();
    const items = collect(agents(), terminals(), now);
    if (props()?.view === "overview") return overview(t, items, now, this.handle);
    setAgentOrder(items.map((i) => i.agent.address));
    if (narrow()) return this.rail(t, items);

    const needs = items.filter((i) => i.group === "needs").length;
    const later = TABS.find((tab) => tab.id === this.tab)?.later;
    const rows = GROUPS.flatMap((g) => {
      const members = items.filter((i) => i.group === g.id);
      if (!members.length) return [];
      return [this.header(t, g, members.length), ...(this.folded.has(g.id) ? [] : members.map((i) => this.row(t, i, now)))];
    });
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
