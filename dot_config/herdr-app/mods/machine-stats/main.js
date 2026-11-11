// CPU, memory and disk use for this computer and every connected machine.
// Clicking a machine opens btop there in a floating window; a copy with the
// `btop` prop is that window's title bar.
import { View, div } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { exec, hc, machines, theme, props, openOverlay, closeOverlay, run } from "herdr";

const POLL_MS = 5000;
// A login shell, for PATH from the user's profile (Homebrew on Linux lives in zsh's rc files).
const BTOP_ARGV = ["sh", "-c", 'exec "${SHELL:-sh}" -lic "exec btop -u 500"'];

// Prints key=value lines. macOS CPU is the sum of per-process %CPU (a decaying
// average); Linux prints raw /proc/stat counters, so its CPU needs two samples.
// Linux disk is the fullest real filesystem by percent; ZFS datasets share
// their pool's free space, so a dataset's percent can overstate how full it is.
const STATS_SCRIPT = `
case $(uname -s) in
Darwin)
  echo ncpu=$(sysctl -n hw.ncpu)
  echo load=$(sysctl -n vm.loadavg | awk '{print $2}')
  ps -A -o %cpu= | awk '{s+=$1} END {print "cpusum=" s}'
  echo memtotal=$(sysctl -n hw.memsize)
  vm_stat | awk '/page size of/ {ps=$8} /Pages active/ {a=$3} /Pages wired/ {w=$4} /occupied by compressor/ {c=$5} END {print "memused=" (a+w+c)*ps}'
  df -kP /System/Volumes/Data | awk 'NR==2 {print "disk=" $5+0; print "diskmount=" $6}'
  ;;
*)
  echo ncpu=$(nproc)
  echo load=$(cut -d' ' -f1 /proc/loadavg)
  head -1 /proc/stat | awk '{t=0; for (i=2; i<=NF; i++) t+=$i; print "cpuidle=" $5+$6; print "cputotal=" t}'
  awk '/^MemTotal/ {t=$2} /^MemAvailable/ {a=$2} END {print "memtotal=" t*1024; print "memused=" (t-a)*1024}' /proc/meminfo
  df -kPT | awk 'NR>1 && $2 ~ /^(ext[234]|xfs|btrfs|zfs)$/ && $7 !~ /^\\/boot/ && $6+0 >= max {max=$6+0; m=$7} END {print "disk=" max; print "diskmount=" m}'
  ;;
esac
`;

function parse(stdout) {
  const kv = {};
  for (const line of stdout.split("\n")) {
    const i = line.indexOf("=");
    if (i > 0) kv[line.slice(0, i)] = line.slice(i + 1);
  }
  return kv;
}

const clampPct = (n) => Math.max(0, Math.min(100, Math.round(n)));

export default class MachineStats extends View {
  init(_props, cx) {
    this.btop = props()?.btop ?? null;
    if (this.btop) return;
    this.stats = {};
    this.linuxCpu = {};
    cx.timer.every(POLL_MS, (cx) => this.refresh(cx));
    this.refresh(cx);
  }

  refresh(cx) {
    for (const m of machines()) {
      if (m.layout !== "ready") continue;
      const key = m.name ?? "";
      cx.spawn(async (cx) => {
        try {
          const r = await exec("sh", ["-c", STATS_SCRIPT], { on: m.name });
          this.stats[key] = this.toStats(key, parse(r.stdout));
        } catch {
          delete this.stats[key];
        }
        cx.notify();
      });
    }
  }

  openBtop(m, cx) {
    cx.spawn(async () => {
      const args = ["run", "--bg", "--json", "--no-parent", "--no-notify", "--rm"];
      if (m.name) args.push("--on", m.name);
      const r = await hc([...args, "--", ...BTOP_ARGV]);
      const address = JSON.parse(r.stdout).address;
      openOverlay({
        kind: "window",
        key: `btop:${m.name ?? ""}`,
        width: 0.7,
        height: 0.75,
        layout: {
          type: "column",
          children: [
            { type: "block", size: { px: 28 }, content: { mod: "machine-stats", props: { btop: address, machine: m.name ?? "local" } } },
            { type: "block", content: { terminal: address } },
          ],
        },
      });
      run("pane.focus", { terminal: address });
    });
  }

  // The window closes itself when btop ends (q); a window closed another way
  // (Close, a layout switch, opening it again) takes btop with it.
  async close() {
    if (this.btop) await hc(["kill", this.btop]);
  }

  titleBar() {
    const t = theme();
    return h_flex()
      .size_full()
      .px(12)
      .gap(12)
      .items_center()
      .bg(t.chrome)
      .border_b(1)
      .border_color(t.border)
      .text_size(12)
      .child(
        div()
          .id("btop-close")
          .flex_none()
          .text_color(t.accent)
          .hover((s) => s.text_color(t.foreground))
          .child("Close")
          .on_mouse_down("left", (_e, cx) => cx.stop_propagation())
          .on_click(() => closeOverlay(props().overlay)),
      )
      .child(div().flex_1().truncate().text_color(t.foreground).child(`btop · ${props().machine}`))
      .child(div().flex_none().text_color(t.dim).child("q quits"));
  }

  toStats(key, kv) {
    const num = (k) => Number(kv[k]);
    let cpu = null;
    if ("cpusum" in kv) {
      cpu = clampPct(num("cpusum") / num("ncpu"));
    } else if ("cputotal" in kv) {
      const prev = this.linuxCpu[key];
      const cur = { idle: num("cpuidle"), total: num("cputotal") };
      this.linuxCpu[key] = cur;
      if (prev && cur.total > prev.total) {
        cpu = clampPct(100 * (1 - (cur.idle - prev.idle) / (cur.total - prev.total)));
      }
    }
    return {
      ncpu: num("ncpu"),
      load: num("load"),
      cpu,
      mem: num("memtotal") ? clampPct((100 * num("memused")) / num("memtotal")) : null,
      disk: kv.diskmount ? clampPct(num("disk")) : null,
      diskMount: kv.diskmount,
    };
  }

  // The bar flexes into whatever its label and percentage leave, so it
  // shrinks away on a narrow sidebar instead of pushing the text out.
  meter(t, id, label, pct, tip) {
    return h_flex()
      .id(id)
      .flex_1()
      .min_w(0)
      .gap(4)
      .items_center()
      .when(Boolean(tip), (el) => el.tooltip(tip))
      .child(div().flex_none().text_size(10.5).text_color(t.dim).child(label))
      .child(
        div()
          .flex_1()
          .min_w(0)
          .max_w(40)
          .h(5)
          .rounded(3)
          .bg(t.raised)
          .overflow_hidden()
          .child(div().h_full().rounded(3).bg(t.accent).w(`${pct ?? 0}%`)),
      )
      .child(div().flex_none().text_size(11).text_color(t.muted).child(pct == null ? "–" : `${pct}%`));
  }

  row(t, m) {
    const key = m.name ?? "";
    const s = this.stats[key];
    const ready = m.layout === "ready";
    return v_flex()
      .id(`ms-${key || "local"}`)
      .px(8)
      .py(3)
      .gap(2)
      .rounded(6)
      .hover((st) => st.bg(t.hover))
      .when(ready, (el) => el.cursor_pointer().on_click((_e, cx) => this.openBtop(m, cx)))
      .child(
        h_flex()
          .gap(6)
          .items_center()
          .child(div().size(6).rounded(3).flex_none().bg(ready ? t.accent : t.dim))
          .child(div().flex_1().truncate().text_color(ready ? t.foreground : t.dim).child(m.name ?? "local"))
          .when(Boolean(s), (el) =>
            el.child(div().flex_none().text_size(11).text_color(t.dim).child(`load ${s.load.toFixed(2)} · ${s.ncpu}c`)),
          ),
      )
      .child(
        h_flex()
          .gap(8)
          .child(this.meter(t, `ms-cpu-${key}`, "CPU", s?.cpu ?? null))
          .child(this.meter(t, `ms-mem-${key}`, "MEM", s?.mem ?? null))
          .child(this.meter(t, `ms-dsk-${key}`, "DSK", s?.disk ?? null, s?.diskMount)),
      );
  }

  render() {
    if (this.btop) return this.titleBar();
    const t = theme();
    return v_flex()
      .size_full()
      .min_h(0)
      .overflow_hidden()
      .bg(t.chrome)
      .border_t(1)
      .border_color(t.border)
      .text_size(13)
      .child(
        h_flex()
          .px(16)
          .h(30)
          .pt(10)
          .pb(2)
          .flex_none()
          .items_center()
          .child(div().text_size(11.5).font_medium().text_color(t.dim).child("Machines")),
      )
      .child(
        v_flex()
          .id("ms-list")
          .flex_1()
          .min_h(0)
          .px(8)
          .overflow_y_scrollbar()
          .children(machines().map((m) => this.row(t, m))),
      );
  }
}
