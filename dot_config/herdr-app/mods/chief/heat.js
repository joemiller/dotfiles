// Drawing Joe's attention: one heat scale, the 7-day strip, the score bar, and the attention
// card (his last prompts, one line from the agent, the score) that the sidebar and Overview share.
import { div } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { age } from "./model.js";

// Empty, then five steps up to the hottest.
export const HEAT = ["#3a2a1d", "#6b3d1c", "#b3561f", "#f07a2a", "#ffb36b"];

export function heatColor(minutes, empty) {
  if (minutes <= 0) return empty;
  const x = minutes / 120;
  return HEAT[x < 0.12 ? 0 : x < 0.3 ? 1 : x < 0.55 ? 2 : x < 0.85 ? 3 : 4];
}

// Joe's attention per day for the last 7 days, today on the right.
export function strip(days, t) {
  return h_flex().gap(2).flex_none().children(days.map((m) => div().w(5).h(11).rounded(2).bg(heatColor(m, t.border))));
}

// Relative: a score of 200 minute-equivalents fills the bar.
export function scoreBar(score, t, width = 80) {
  return div().w(width).h(4).flex_none().rounded(2).bg(t.border).overflow_hidden()
    .child(div().h_full().rounded(2).bg(HEAT[3]).w(Math.max(3, Math.min(width, (score / 200) * width))));
}

export const minutes = (m) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ""}` : `${Math.round(m)}m`);

// actions: [{ id, label, run }]. showReport adds the agent's full last report under its line.
export function attentionCard(t, item, now, idPrefix, actions, showReport = false) {
  const { report: r, heat } = item;
  const agentLine = r?.next ? `Next: ${r.next}` : r?.title;
  return v_flex()
    .gap(6)
    .text_size(11.5)
    .line_height("16px")
    .child(heat.prompts.length
      ? v_flex().gap(3).children(heat.prompts.map((p, i) => h_flex().gap(6).items_start()
        .child(div().w(28).flex_none().text_right().text_color(t.dim).child(age(now - p.at)))
        .child(div().flex_1().min_w(0).text_color(i === heat.prompts.length - 1 ? t.foreground : t.muted).child(`“${p.text}”`))))
      : div().text_color(t.dim).child(item.touched ? `Your last prompt: ${age(now - item.touched)} ago. Its text is kept from your next prompt.` : "No prompt from you yet."))
    .when(Boolean(agentLine), (el) => el.child(h_flex().gap(4).items_start()
      .child(div().flex_none().font_weight(600).text_color(t.muted).child("Agent:"))
      .child(div().flex_1().min_w(0).text_color(t.dim).child(agentLine))))
    .when(showReport && Boolean(r?.update), (el) => el.child(div().text_color(t.muted).child(r.update.length > 1200 ? r.update.slice(0, 1199) + "…" : r.update)))
    .child(h_flex().gap(10).items_center()
      .child(scoreBar(heat.score, t, 90))
      .child(div().flex_1().min_w(0).truncate().text_size(11).text_color(t.dim).child(`${minutes(heat.week.focus)} focus · ${heat.week.prompts} prompts this week`)))
    .child(h_flex().gap(6).children(actions.map((a) => div()
      .id(`${idPrefix}-${a.id}`)
      .px(8)
      .py(1)
      .rounded(5)
      .border(1)
      .border_color(t.border)
      .text_size(11)
      .text_color(t.muted)
      .cursor_pointer()
      .hover((s) => s.text_color(t.foreground))
      .on_click((_e, cx) => {
        cx.stop_propagation();
        a.run(cx);
      })
      .child(a.label))));
}

