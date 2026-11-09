// cmd-; jumps back to the previously shown space, like tmux's last-window.
// It draws nothing; the layout gives it a 0px block so it keeps running.
import { View, div } from "gpui-kit";
import { focused, spaces, run, nextCommand } from "herdr";

const POLL_MS = 150;

export default class LastSpace extends View {
  init(_props, cx) {
    this.current = focused()?.space ?? null;
    this.previous = null;
    cx.timer.every(POLL_MS, () => this.track());
    cx.spawn(async () => {
      for (;;) {
        if ((await nextCommand()) === "toggle") this.toggle();
      }
    });
  }

  track() {
    const space = focused()?.space;
    if (!space || space === this.current) return;
    this.previous = this.current;
    this.current = space;
  }

  toggle() {
    if (!this.previous || !spaces().some((s) => s.id === this.previous)) return;
    run("space.select", { id: this.previous });
  }

  render() {
    return div();
  }
}
