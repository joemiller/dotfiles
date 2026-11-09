// cmd-; jumps back to the previously focused pane, like tmux's last-pane.
// It draws nothing; the layout gives it a 0px block so it keeps running.
import { View, div } from "gpui-kit";
import { focused, panes, run, nextCommand } from "herdr";

const POLL_MS = 150;

export default class LastPane extends View {
  init(_props, cx) {
    this.current = focused()?.pane ?? null;
    this.previous = null;
    cx.timer.every(POLL_MS, () => this.track());
    cx.spawn(async () => {
      for (;;) {
        if ((await nextCommand()) === "toggle") this.toggle();
      }
    });
  }

  track() {
    const pane = focused()?.pane;
    if (!pane || pane === this.current) return;
    this.previous = this.current;
    this.current = pane;
  }

  toggle() {
    if (!this.previous || !panes().some((p) => p.pane === this.previous)) return;
    run("pane.focus", { pane: this.previous });
  }

  render() {
    return div();
  }
}
