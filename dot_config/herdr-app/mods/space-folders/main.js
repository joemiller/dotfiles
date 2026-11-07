// Workspace spaces: stable colored avatars, worktrees under their checkout,
// grouped by machine when more than one is known. After a space's name, the repo
// its first terminal is in now, only where unusual: branch, ahead/behind. Agent state lives in the agents list, not here. Click to
// switch, right-click for its menu, drag to reorder.
//
// Folders (Herdr's own spaces mod, cloned): spaces dragged onto a folder's
// header go in it, dropped on a space they join its folder, dropped below the
// list they leave. A folder folds; right-click colors, edits or deletes it.
// A folder can start its new spaces in a folder, and collect the spaces
// working in folders matching its rules. A folder on this computer collects
// another machine too, with its header and spaces, when a rule matches the
// machine's name or the folder one of its spaces works in.

import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex, InputState, Input } from "gpui-base";
import { spaces, machines, panes, run, openOverlay, closeOverlay, props, exec, hc, theme, shared, setShared, watchFolder, window, layout, pickFolder, home, nextCommand } from "herdr";

// A machine's folders live in a file in its home, so every screen showing its
// spaces shows the same folders: { list: [{ id, name, folded }], of: { spaceId:
// folderId }, at }, with space ids as that machine knows them. While this runs,
// shared state holds them per machine ("" is this computer), so the sidebar, a
// folder's menu and its edit dialog see a change at once.
const FILE = "~/.config/herdr-space-folders.json";
const key = (machine) => machine ?? "";
const all = () => shared("space-folders") ?? {};
const folders = (machine) => all()[key(machine)] ?? { list: [], of: {} };
const localId = (s) => (s.machine ? s.id.slice(s.machine.length + 1) : s.id);
const URGENT = ["blocked", "done", "working"];
// Left padding of a row: 8 at the top, a step of 18 under a folder; a machine
// in a folder has its header at 26 and what's under it a step further, at 44.
const STEP = 18;
const indent = (folder, nested) => 8 + (nested ? 2 * STEP : 0) + (folder ? STEP : 0);

async function readFolders(machine) {
  const r = await exec("sh", ["-c", `cat ${FILE} 2>/dev/null`], { on: machine });
  try {
    const d = JSON.parse(r.stdout);
    return { list: d.list ?? [], of: d.of ?? {}, at: d.at ?? 0 };
  } catch { return null; }
}

// A machine's home, asked once, for a start folder written with "~".
const homes = {};
async function expand(machine, path) {
  if (!path?.startsWith("~")) return path;
  homes[key(machine)] ??= (await exec("sh", ["-c", 'printf %s "$HOME"'], { on: machine })).stdout.trim();
  return homes[key(machine)] + path.slice(1);
}

// A new space for a folder, in its start folder; with no folder (id null), one
// in none, whichever space is in front. Herdr names no id back, so the sidebar
// gives the first space that appears (on that machine, for a folder) its place
// (see adopt).
async function newSpaceIn(machine, id) {
  setShared("space-folders.new", { machine, id, before: spaces().map((s) => s.id), until: Date.now() + 60000 });
  const path = id && folders(machine).list.find((f) => f.id === id)?.path;
  const folder = path ? await expand(machine, path).catch(() => null) : null;
  run("space.new", { ...(machine ? { machine } : {}), ...(folder ? { folder } : {}) });
}

// A rule of "Collect spaces from" takes a folder and everything in it. "~" is
// any home, "*" any one folder name, and a rule starting with neither "/" nor
// "~" is a folder name at any depth ("wbso-ai").
export function rule(pattern) {
  const p = pattern.trim().replace(/\/+$/, "");
  if (!p) return null;
  const body = p.replace(/^~/, "\u0000").split("*").map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join("[^/]*")
    .replace("\u0000", "(?:/home/[^/]+|/Users/[^/]+|/root)");
  return new RegExp(`${/^[/~]/.test(p) ? "^" : "(?:^|/)"}${body}(?:/|$)`);
}

const collects = (f, path) => Boolean(path) && (f.match ?? "").split(",").some((p) => rule(p)?.test(path));

// How deep into the path a folder's rules reach: 0 when none match. A rule
// that takes ~/code/client wins over one that takes ~/code; a bare "*" reaches
// least (it matches the first slash) but still counts.
const reach = (f, path) => !path ? 0 : Math.max(0, ...(f.match ?? "").split(",").map((p) => {
  const m = rule(p)?.exec(path);
  return m ? 1 + m.index + m[0].replace(/\/$/, "").length : 0;
}));

// The folder whose rules reach deepest; the first one on a tie.
function deepest(list, score) {
  let best = null, most = 0;
  for (const f of list) { const n = score(f); if (n > most) { best = f; most = n; } }
  return best?.id ?? null;
}

// Where a space goes: where it was dragged (or "" for out of every folder), else
// the folder whose rules reach deepest into the folder it works in.
function folderOf(s, { list, of }, ps) {
  const id = of[localId(s)];
  if (id !== undefined) return list.some((f) => f.id === id) ? id : null;
  return deepest(list, (f) => reach(f, place(s, ps)));
}

// The folder on this computer that takes in another machine: the first whose
// rules match its name ("vm-*") or the folder one of its spaces works in. Not
// the deepest: a machine's name is no path, so its depth says nothing.
function machineFolder(m, rows, ps) {
  return folders(null).list.find((f) => collects(f, m) || rows.some((r) => collects(f, place(r.w, ps))))?.id ?? null;
}

function saveFolders(machine, data) {
  const next = { list: data.list, of: data.of, at: Date.now() };
  setShared("space-folders", { ...all(), [key(machine)]: next });
  exec("sh", ["-c", `mkdir -p ~/.config && printf '%s\\n' "$1" > ${FILE}.tmp && mv ${FILE}.tmp ${FILE}`, "sh", JSON.stringify(next)], { on: machine })
    .catch(() => null);
}

function find(node, id) {
  if (node?.id === id) return node;
  for (const child of node?.children ?? []) {
    const found = find(child, id);
    if (found) return found;
  }
  return null;
}

// The sidebar's rail goes by its width, not a flag: dragging its edge narrows it too.
const narrow = () => (find(layout(), "sidebar")?.size?.px ?? Infinity) < 160;

// Where a space is now: its first terminal's live folder, else where it was made.
// `ps`: panes(), read once by the caller (each read copies every pane).
function place(s, ps) {
  const tabs = new Set((s.tabs ?? []).map((c) => c.id));
  return ps.find((p) => tabs.has(p.tab) && p.cwd)?.cwd || s.folder;
}
const rowHeight = ({ tree }) => (tree ? 28 : 30);
const where = (s, ps) => JSON.stringify([s.machine ?? null, place(s, ps)]);
const base = (path) => path.replace(/\/+$/, "").split("/").pop();
// Changes made outside Herdr (an editor's save, a commit in another app): looked
// for this often, in repos the list shows, while the window is in front.
const FALLBACK = 60000;

// What a stored color name looks like on an avatar (the same in every mod
// that draws space avatars): one strong color per hue, light and dark alike.
const MARK = { ansi6: "#22a99a", ansi3: "#e3814f", ansi4: "#5b8def", ansi5: "#8b7cf6", ansi2: "#3fae6a", ansi1: "#d9649a" };

// A space speaks up only when something in it needs you.
export function glyph(status) {
  return status === "blocked" || status === "done" ? "●" : "·";
}

export function tone(t, status) {
  return t[status] ?? t.unknown;
}

const NEW_FOLDER = "New folder";

// A path's last folder name: "~/Projects/herdr/" gives "herdr"; "~" or "/" give "".
const lastPart = (p) => {
  const part = p.trim().replace(/[\\/]+$/, "").split(/[\\/]/).pop() ?? "";
  return part === "~" ? "" : part;
};

export default class Spaces extends View {
  init(_props, cx) {
    // As an overlay of the sidebar: a folder's menu, or the dialog editing one.
    const { folderMenu, edit, machine = null, fresh = false, overlay } = props() ?? {};
    if (folderMenu) { this.folderMenu = { id: folderMenu, machine, overlay }; return; }
    if (edit) {
      const f = folders(machine).list.find((x) => x.id === edit) ?? { name: NEW_FOLDER };
      this.editing = { id: edit, machine, fresh, overlay };
      this.name = InputState.new({ value: f.name ?? "" });
      this.path = InputState.new({ value: f.path ?? "", placeholder: "e.g. ~/Documents/github.com/owner/repo" });
      this.match = InputState.new({ value: f.match ?? "", placeholder: "e.g. wbso-ai, ~/code/client-*" });
      // The rules follow the start folder until they're given rules of their own.
      this.mirror = !f.match || f.match === f.path;
      this.path.on("change", (_e, cx) => { if (this.mirror) { this.match.set_value(this.path.value()); cx.notify(); } });
      this.match.on("change", () => { this.mirror = this.match.value() === this.path.value(); });
      // The name follows the start folder's last part while it's still the default
      // (or already that part); typing a name of its own stops that.
      const named = (n) => !n || n === NEW_FOLDER || n === lastPart(this.path.value());
      this.nameMirror = named(this.name.value());
      this.path.on("change", (_e, cx) => { this.follow(); cx.notify(); });
      this.name.on("change", () => { this.nameMirror = named(this.name.value()); });
      for (const input of [this.name, this.path, this.match]) input.on("submit", () => this.saveFolder());
      this.name.set_selected_range({ start: 0, end: this.name.value().length });
      this.name.focus();
      cx.timer.after(300, () => this.name.focus());
      return;
    }
    this.overFolder = null;
    this.moving = null; // a folder being dragged: { machine, id, index }
    this.overMove = null;
    this.git = {}; // where() -> { name, branch, ahead, behind, repo, linked }, null: not a repo
    this.checked = {}; // where() -> when it was last looked at
    this.unsure = new Set(); // where()s git couldn't answer for (a machine away)
    this.pending = new Set(); // where()s to look at next
    this.busy = {}; // pane -> an agent working or a program in front of its shell
    this.ready = {}; // machine -> its layout was readable at the last look
    this.at = {}; // space -> its where() at the last look
    this.watching = new Set(); // local repos' git folders
    // Spaces made while this runs wait (at most a moment) for their git, so a
    // worktree appears under its repo instead of jumping there.
    this.shown = new Set(spaces().map((s) => s.id));
    this.born = {};
    // The space in front at the last look and the folder it showed in, so a
    // space made from there (a key, the palette) can join it (see join).
    this.known = new Set(spaces().map((s) => s.id));
    this.front = null;
    this.coming = {}; // a new space -> { at, from: this.front then }
    this.pressed = null;
    this.over = null;
    this.machines = [];
    this.folded = new Set(JSON.parse(localStorage.getItem("machines.folded") ?? "[]"));
    this.refreshMachines(cx);
    cx.timer.every(15000, cx => this.refreshMachines(cx));
    // Another screen may have changed them: read every machine's file again now and then.
    this.loadFolders(cx);
    cx.timer.every(15000, cx => this.loadFolders(cx));
    // `git status` walks the whole tree, on another machine a process there:
    // only when its answer could have changed (see `due`).
    cx.timer.every(250, (cx) => this.checkNew(cx));
    // "space-folders.next" and ".prev" in keys.json: the next space down the
    // list as it shows, where Herdr's own space.next goes by its own order.
    this.seen = [];
    cx.spawn(async (cx) => {
      for (;;) {
        const c = String(await nextCommand()).split(".").pop();
        if (c === "next" || c === "prev") this.step(c === "next" ? 1 : -1);
        cx.notify();
      }
    });
  }

  // One space down (1) or up (-1) from the one in front, past the spaces in
  // folded folders and machines, round from the end to the top.
  step(dir) {
    const seen = this.seen, len = seen.length;
    if (!len) return;
    const at = seen.findIndex((s) => s.id === spaces().find((w) => w.active)?.id);
    const from = at >= 0 ? at : dir > 0 ? -1 : len;
    for (let n = 1; n <= len; n++) {
      const s = seen[(((from + dir * n) % len) + len) % len];
      if (s.shown) { run("space.select", { id: s.id }); return; }
    }
  }

  checkNew(cx) {
    const now = Date.now();
    const sp = spaces();
    for (const s of sp) if (!this.shown.has(s.id)) this.born[s.id] ??= now;
    this.closed(sp);
    this.join(sp, now, this.adopt(sp, now));
    const due = this.due(now, sp, panes());
    if (due.size) this.refreshGit(due, cx);
    if (sp.some((s) => !this.shown.has(s.id))) cx.notify();
  }

  // Places whose git could have changed: new ones (a new space, a cd), where a
  // command or an agent's turn just ended (a checkout, a commit, edits), those on
  // a machine that is back, and repos in view whose fallback is due.
  due(now, sp, ps) {
    // Moved there: what it knew of that place may be old.
    const at = {};
    for (const s of sp) at[s.id] = where(s, ps);
    const keys = new Set(Object.values(at).filter((k) => JSON.parse(k)[1]));
    const due = new Set([...keys].filter((k) => !(k in this.git)));
    for (const [id, k] of Object.entries(at)) if (this.at[id] && this.at[id] !== k && keys.has(k)) due.add(k);
    this.at = at;
    const spaceOf = {};
    for (const s of sp) for (const t of s.tabs ?? []) spaceOf[t.id] = s;
    const busy = {};
    for (const p of ps) {
      if (!p.terminal || !spaceOf[p.tab]) continue;
      busy[p.pane] = p.status === "working" || !(p.program?.shell || p.program?.agent);
      if (this.busy[p.pane] && !busy[p.pane]) this.sameRepo(at[spaceOf[p.tab].id], keys).forEach((k) => due.add(k));
    }
    this.busy = busy;
    for (const m of machines()) {
      const ready = m.layout === "ready";
      if (ready && this.ready[m.name] === false) for (const k of keys) if (JSON.parse(k)[0] === m.name) due.add(k);
      this.ready[m.name] = ready;
    }
    if (window().active) {
      for (const k of keys) {
        const asks = this.git[k] || this.unsure.has(k);
        if (asks && !this.folded.has(JSON.parse(k)[0]) && now - (this.checked[k] ?? 0) > FALLBACK) due.add(k);
      }
    }
    return due;
  }

  // `key` and the other places in its repo (a commit there moves their ahead/behind).
  sameRepo(key, keys) {
    const repo = this.git[key]?.repo;
    return [key, ...(repo ? [...keys].filter((k) => this.git[k]?.repo === repo) : [])];
  }

  refreshMachines(cx) {
    cx.spawn(async cx => {
      try { const r = await hc(["machine", "ls", "--json"]); if (r.code === 0) this.machines = (JSON.parse(r.stdout).machines ?? []).filter((m) => !m.temporary); } catch {}
      cx.notify();
    });
  }

  // One look at a time, each place once however often it was asked for meanwhile.
  refreshGit(keys, cx) {
    for (const k of keys) this.pending.add(k);
    if (this.refreshing) return;
    this.refreshing = true;
    cx.spawn(async (cx) => {
      while (this.pending.size) {
        const keys = [...this.pending];
        this.pending.clear();
        for (const key of keys) await this.check(key, cx);
      }
      const used = new Set(Object.values(this.git).filter(Boolean).map((g) => JSON.parse(g.repo)).filter(([on]) => !on).map(([, repo]) => repo));
      for (const repo of this.watching) if (!used.has(repo)) this.watching.delete(repo);
      this.refreshing = false;
      cx.notify();
    });
  }

  // One place's git: branch, ahead/behind, its repo.
  async check(key, cx) {
    const [on, cwd] = JSON.parse(key);
    this.checked[key] = Date.now();
    this.unsure.delete(key);
    try {
      // No optional locks: a status that touched the index would wake the watch again.
      // Writes nothing under .git (index lock, fsmonitor cookie): watch() would wake on it.
      const r = await exec("git", ["--no-optional-locks", "-c", "core.fsmonitor=false", "status", "--porcelain=v2", "--branch"], { cwd, on });
      if (r.code !== 0) {
        // Only git's own "no" is remembered as no repo; anything else is asked again.
        if (!/not a git repository/i.test(r.stderr)) this.unsure.add(key);
        this.git[key] = null;
        return;
      }
      // The repo's own .git folder names it; a worktree's top differs from it.
      const top = await exec("git", ["rev-parse", "--show-toplevel"], { cwd, on });
      const common = await exec("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd, on });
      const repo = common.stdout.trim();
      const name = repo.endsWith("/.git") ? base(repo.slice(0, -5)) : base(repo).replace(/\.git$/, "");
      const info = { name, branch: null, ahead: 0, behind: 0, repo: JSON.stringify([on, repo]), linked: repo !== `${top.stdout.trim()}/.git` };
      for (const line of r.stdout.split("\n")) {
        if (line.startsWith("# branch.head ")) info.branch = line.slice(14);
        else if (line.startsWith("# branch.ab ")) {
          const [a, b] = line.slice(12).split(" ");
          info.ahead = Math.abs(parseInt(a, 10)) || 0;
          info.behind = Math.abs(parseInt(b, 10)) || 0;
        }
      }
      this.git[key] = info;
      if (!on) this.watch(repo, cx);
    } catch {
      // Couldn't ask (the machine is away): keep what it showed, look again later.
      this.git[key] ??= null;
      this.unsure.add(key);
    }
  }

  watch(repo, cx) {
    if (this.watching.has(repo)) return;
    this.watching.add(repo);
    cx.spawn(async (cx) => {
      try {
        while (this.watching.has(repo)) {
          await watchFolder(repo);
          const mine = JSON.stringify([null, repo]);
          if (this.watching.has(repo)) this.refreshGit(Object.keys(this.git).filter((k) => this.git[k]?.repo === mine), cx);
        }
      } catch { this.watching.delete(repo); }
    });
  }

  menu(w) {
    // A popup is as tall as its items; height is only the most.
    openOverlay({ mod: "menu", kind: "popup", width: 200, height: 260, props: { tab: "space", target: { id: w.id } } });
  }

  // ---- folders ----

  // Each machine's file, read again; a newer copy here (a save on its way) wins.
  loadFolders(cx) {
    const names = [null, ...this.machines.filter((m) => m.state === "connected").map((m) => m.name)];
    cx.spawn(async (cx) => {
      for (const m of names) {
        const read = await readFolders(m).catch(() => null), now = all()[key(m)];
        if (read && (!now || read.at > now.at)) setShared("space-folders", { ...all(), [key(m)]: read });
      }
      cx.notify();
    });
  }

  // A new folder is only made when its dialog is saved; cancelled, nothing's left.
  newFolder(machine) {
    const id = `f${Date.now().toString(36)}`;
    openOverlay({ mod: "space-folders", kind: "dialog", width: 460, props: { edit: id, machine, fresh: true } });
  }

  reorder(machine, from, to) {
    const f = folders(machine), list = [...f.list], i = list.findIndex((x) => x.id === from), j = list.findIndex((x) => x.id === to);
    if (i < 0 || j < 0) return;
    list.splice(j, 0, ...list.splice(i, 1));
    saveFolders(machine, { ...f, list });
  }

  // One of the spaces' avatar colors, or null for grey.
  paint(machine, id, color) {
    const f = folders(machine);
    saveFolders(machine, { ...f, list: f.list.map((x) => x.id === id ? { ...x, color } : x) });
  }

  toggleFolder(machine, id) {
    const f = folders(machine);
    saveFolders(machine, { ...f, list: f.list.map((x) => x.id === id ? { ...x, folded: !x.folded } : x) });
  }

  // A space dropped into a folder (or out of one, with null): only one of its own
  // machine's. Out of a folder its rules would put it in, it stays out ("").
  drop(index, id) {
    const s = spaces()[index], machine = s?.machine ?? null, f = folders(machine);
    if (!s || (id && !f.list.some((x) => x.id === id))) return;
    const of = { ...f.of };
    if (id) of[localId(s)] = id;
    else if (folderOf(s, f, panes())) of[localId(s)] = "";
    else delete of[localId(s)];
    saveFolders(machine, { ...f, of });
  }

  // A space made from a folder (its + or its menu) goes in it: the first new space
  // on that machine, once Herdr has made it. Returns that space's id, also for
  // one made in no folder (a machine's +), so join leaves it alone.
  adopt(sp, now) {
    const want = shared("space-folders.new");
    if (!want) return null;
    // In no folder, Herdr picks the machine (the one in front): any will do.
    const on = (s) => !want.id || (s.machine ?? null) === (want.machine ?? null);
    const before = new Set(want.before), fresh = sp.find((s) => !before.has(s.id) && on(s));
    if (fresh || now > want.until) setShared("space-folders.new", null);
    if (!fresh) return null;
    const f = folders(want.machine);
    if (f.list.some((x) => x.id === want.id)) saveFolders(want.machine, { ...f, of: { ...f.of, [localId(fresh)]: want.id } });
    return fresh.id;
  }

  // A space made from the one in front (Herdr's new-space keys, the palette)
  // goes right under it (see settle): a new space that comes up in front
  // within a few seconds, on the same machine, the only one that appeared then.
  // Not one a + made (`made`), nor the spaces of a machine coming in.
  join(sp, now, made) {
    const fresh = sp.filter((s) => !this.known.has(s.id));
    for (const s of fresh) {
      this.known.add(s.id);
      if (fresh.length === 1 && s.id !== made && this.front) this.coming[s.id] = { at: now, from: this.front };
    }
    for (const [id, c] of Object.entries(this.coming)) if (now - c.at > 3000) delete this.coming[id];
    const front = sp.find((s) => s.active), c = front && this.coming[front.id];
    if (c) {
      delete this.coming[front.id];
      if ((front.machine ?? null) === c.from.machine) this.settle(sp, front, c.from);
    }
    // A space just made isn't where the next one comes from until it shows.
    if (front && !fresh.some((s) => s.id === front.id)) {
      const machine = front.machine ?? null, shown = this.seen.find((e) => e.id === front.id);
      this.front = { id: front.id, machine, folder: shown ? shown.folder : folderOf(front, folders(machine), panes()), near: this.near(front.id) };
    }
  }

  // A new space `s` under the space it was made from: in that one's folder, and
  // after it in Herdr's order, which the list keeps inside a folder (a checkout's
  // worktrees stay between them). space.move's index is where it ends up, from 1.
  settle(sp, s, from) {
    const f = folders(from.machine);
    if (from.folder && f.of[localId(s)] === undefined && f.list.some((x) => x.id === from.folder)) {
      saveFolders(from.machine, { ...f, of: { ...f.of, [localId(s)]: from.folder } });
    }
    const i = sp.findIndex((w) => w.id === from.id), j = sp.findIndex((w) => w.id === s.id);
    if (i >= 0 && j >= 0 && j !== i + 1) run("space.move", { id: s.id, index: j > i ? i + 2 : i + 1 });
  }

  // Where to go when this space closes: the space shown above it in the list,
  // else the one below. Spaces in folded folders don't count.
  near(id) {
    const list = this.seen.filter((e) => e.shown || e.id === id), i = list.findIndex((e) => e.id === id);
    return i < 0 ? null : (list[i - 1] ?? list[i + 1])?.id ?? null;
  }

  // The space in front is gone (closed): show the one above it in the list,
  // where Herdr picks by its own order, which folders don't change.
  closed(sp) {
    const was = this.front;
    if (!was?.id || sp.some((s) => s.id === was.id)) return;
    this.front = null;
    if (was.near && sp.some((s) => s.id === was.near)) run("space.select", { id: was.near });
  }

  saveFolder() {
    const { id, machine, fresh, overlay } = this.editing, f = folders(machine);
    const name = this.name.value().trim(), path = this.path.value().trim() || null, match = this.match.value().trim() || null;
    // A folder deleted while its dialog was open isn't made again; a new one is made now.
    const list = fresh && !f.list.some((x) => x.id === id) ? [...f.list, { id, name: NEW_FOLDER, folded: false }] : f.list;
    saveFolders(machine, { ...f, list: list.map((x) => x.id === id ? { ...x, name: name || x.name, path, match } : x) });
    closeOverlay(overlay);
  }

  // The name, while it follows the start folder, set to that folder's last part.
  follow() {
    const part = lastPart(this.path.value());
    if (this.nameMirror && part && part !== this.name.value()) this.name.set_value(part);
  }

  // The system's folder picker, for this computer: home written as "~".
  choose(cx) {
    cx.spawn(async (cx) => {
      const picked = await pickFolder({ prompt: "Start new spaces in" });
      if (!picked) return;
      this.path.set_value(picked.startsWith(home()) ? `~${picked.slice(home().length)}` : picked);
      if (this.mirror) this.match.set_value(this.path.value());
      this.follow();
      cx.notify();
    });
  }

  // A machine's folders, each with its spaces and the machines it takes in,
  // then the spaces in none. A worktree goes where its checkout's space goes.
  // Every space goes in `seen` in this order, folded away (`hidden`) or not,
  // for the keys that step through the list.
  foldered(rows, machine, t, collapsed, { guests = [], nested = false, hidden = false, seen = [] } = {}) {
    const draw = (r, away) => {
      seen.push({ id: r.w.id, shown: !away, folder: r.folder });
      return away ? [] : [collapsed ? this.compact(r, t) : this.row(r, t)];
    };
    const f = folders(machine), { list } = f, ps = panes();
    let parent = null;
    const placed = rows.map((r) => {
      if (!r.tree) parent = folderOf(r.w, f, ps);
      return { ...r, folder: parent, nested };
    });
    return [
      ...list.flatMap((f, n) => {
        const inside = placed.filter((r) => r.folder === f.id);
        const visitors = guests.filter((g) => g.folder === f.id);
        const counted = [...inside, ...visitors.flatMap((g) => g.rows)];
        const away = hidden || f.folded;
        return [
          ...(hidden ? [] : [this.folderHead(f, n, machine, counted, t, collapsed, nested)]),
          ...inside.flatMap((r) => draw(r, away)),
          ...visitors.flatMap((g) => this.machineSection(g.m, g.rows, t, collapsed, { nested: true, hidden: away, seen })),
        ];
      }),
      ...placed.filter((r) => !r.folder).flatMap((r) => draw(r, hidden)),
    ];
  }

  folderHead(f, n, machine, inside, t, collapsed, nested = false) {
    const status = URGENT.find((s) => inside.some((r) => r.w.status === s));
    const target = this.pressed !== null && this.overFolder === f.id;
    // A folder dragged over this one: a line where it would go, as for spaces.
    const moving = this.moving, aimed = moving && moving.id !== f.id && this.overMove === f.id;
    // As tall as a space's row, with an 18px tile where a space has its avatar.
    const head = h_flex().relative().id(`folder-${f.id}`).h(30).flex_none().px(collapsed ? 2 : 8).when(!collapsed, (el) => el.pl(indent(null, nested))).gap(9).items_center().rounded(8)
      .text_color(t.foreground).cursor_pointer()
      .when(target, (el) => el.bg(t.selected).border_1().border_color(t.accent))
      .when(!target, (el) => el.hover((s) => s.bg(t.hover)))
      .when(Boolean(moving) && moving.id === f.id && this.overMove !== f.id, (el) => el.opacity(0.5))
      .when(Boolean(aimed), (el) => el.child(div().absolute().left(0).right(0).h(2).bg(t.accent)
        .when(moving.index < n, (line) => line.bottom(0)).when(moving.index > n, (line) => line.top(0))))
      .on_mouse_down("left", () => { this.moving = { machine, id: f.id, index: n }; this.overMove = f.id; })
      .on_mouse_move((_e, cx) => {
        if (this.pressed !== null && this.overFolder !== f.id) { this.overFolder = f.id; this.over = null; cx.notify(); }
        const over = this.moving && (this.moving.machine ?? null) === (machine ?? null) ? f.id : null;
        if (this.moving && this.overMove !== over) { this.overMove = over; cx.notify(); }
      })
      .on_mouse_up("left", (_e, cx) => {
        if (this.pressed !== null) this.drop(this.pressed, f.id);
        else if (this.moving && this.moving.id !== f.id && this.overMove === f.id) this.reorder(machine, this.moving.id, f.id);
        this.pressed = null; this.over = null; this.overFolder = null; this.moving = null; this.overMove = null;
        cx.notify();
      })
      .on_click(() => this.toggleFolder(machine, f.id))
      .on_mouse_down("right", () => openOverlay({ mod: "space-folders", kind: "popup", width: 210, height: 160, props: { folderMenu: f.id, machine } }));
    // Built like a space's avatar: a filled 18px tile in the folder's color, its mark in white.
    const tile = h_flex().size(18).flex_none().rounded(5).items_center().justify_center().bg(f.color ? (MARK[f.color] ?? f.color) : t.dim)
      .child(svg("mods/workspace-chrome/folder.svg").size(13).text_color("#ffffff"));
    if (collapsed) return head.justify_center().child(tile);
    return head
      .child(tile)
      .child(div().flex_1().min_w(0).truncate().font_medium().child(f.name))
      // Folded, it still says when something in it is running or needs you.
      .when(f.folded && status === "working", (el) => el.child(svg("mods/workspace-chrome/spinner.svg").size(11).flex_none().text_color(t.working).spin(900)))
      .when(f.folded && Boolean(status) && status !== "working", (el) => el.child(div().flex_none().text_color(tone(t, status)).child(glyph(status))))
      .child(div().id(`folder-add-${f.id}`).flex_none().px(4).rounded(4).text_color(t.dim).hover((s) => s.bg(t.hover).text_color(t.foreground))
        .on_click((_e, cx) => { cx.stop_propagation(); newSpaceIn(machine, f.id); }).child("+"))
      .child(div().flex_none().text_size(11.5).text_color(t.dim).child(String(inside.length)))
      .child(svg(`mods/workspace-chrome/chevron-${f.folded ? "right" : "down"}.svg`).size(11).flex_none().text_color(t.dim));
  }

  folderMenuView(t) {
    const { id, machine, overlay } = this.folderMenu;
    const item = (key, label, action) => div().id(key).h(30).px(10).flex().items_center().rounded(6).cursor_pointer()
      .hover((s) => s.bg(t.hover)).on_click(() => { closeOverlay(overlay); action(); }).child(label);
    const current = folders(machine).list.find((x) => x.id === id)?.color ?? null;
    const swatch = (color) => div().id(`folder-color-${color ?? "grey"}`).size(20).flex_none().rounded(10).cursor_pointer()
      .bg(color ? MARK[color] : t.dim).border_2().border_color(color === current ? t.foreground : t.popover)
      .hover((s) => s.border_color(t.muted)).on_click(() => { this.paint(machine, id, color); closeOverlay(overlay); });
    return v_flex().id("folder-menu").size_full().p(5).gap(1).bg(t.popover).text_color(t.foreground).text_size(12.5)
      .child(h_flex().px(8).pt(6).pb(8).gap(6).items_center().children([null, ...Object.keys(MARK)].map(swatch)))
      .child(item("folder-space", "New space here", () => newSpaceIn(machine, id)))
      .child(item("folder-edit", "Edit folder…", () => openOverlay({ mod: "space-folders", kind: "dialog", width: 460, props: { edit: id, machine } })))
      .child(item("folder-delete", "Delete folder", () => {
        const f = folders(machine);
        saveFolders(machine, { list: f.list.filter((x) => x.id !== id), of: Object.fromEntries(Object.entries(f.of).filter(([, v]) => v !== id)) });
      }));
  }

  editView(t) {
    const { machine, overlay } = this.editing;
    const button = (key, label, primary, action) => h_flex().id(key).h(32).px(14).flex_none().items_center().rounded(8).border_1()
      .border_color(primary ? t.solid : t.input).bg(primary ? t.solid : t.raised).text_color(primary ? t.solid_foreground : t.foreground)
      .text_size(12.5).font_medium().cursor_pointer().hover((s) => s.opacity(0.88)).on_click(action).child(label);
    const field = (label, input, hint, extra = null) => v_flex().gap(6)
      .child(div().text_size(12).font_medium().text_color(t.muted).child(label))
      .child(h_flex().gap(8)
        .child(div().flex_1().min_w(0).h(34).px(10).flex().items_center().rounded(8).border_1().border_color(t.input).bg(t.background)
          .child(Input.new(input).w_full().text_size(13).text_color(t.foreground)))
        .when(Boolean(extra), (el) => el.child(extra)))
      .when(Boolean(hint), (el) => el.child(div().text_size(11.5).text_color(t.dim).child(hint)));
    return v_flex().id("folder-edit").w_full().p(20).gap(16).bg(t.popover).text_color(t.foreground)
      .on_key_down((e, cx) => { if (e.key === "escape") { closeOverlay(overlay); cx.stop_propagation(); } })
      .child(div().text_size(15).font_semibold().child("Edit folder"))
      .child(field("Name", this.name, null))
      .child(field("Start new spaces in", this.path, "Its + and New space here open a space there.",
        machine ? null : button("folder-choose", "Choose…", false, (_e, cx) => this.choose(cx))))
      .child(field("Collect spaces from", this.match,
        "Spaces working in these folders join this one. Comma-separated: a folder name like wbso-ai, or a path like ~/code/client-*."))
      .child(h_flex().pt(4).gap(8).justify_end()
        .child(button("folder-cancel", "Cancel", false, () => closeOverlay(overlay)))
        .child(button("folder-save", "Save", true, () => this.saveFolder())));
  }

  // Spaces in order, each worktree space moved under its main checkout's.
  ordered() {
    const sp = spaces(), ps = panes();
    const ready = (w) => this.shown.has(w.id) || where(w, ps) in this.git || Date.now() - (this.born[w.id] ??= Date.now()) > 1500;
    for (const w of sp) if (!this.shown.has(w.id) && ready(w)) this.shown.add(w.id);
    const list = sp.map((w, i) => ({ w, i, g: this.git[where(w, ps)] ?? null })).filter((r) => this.shown.has(r.w.id));
    const mains = new Set(list.filter((r) => r.g && !r.g.linked).map((r) => r.g.repo));
    const nested = (r) => r.g?.linked && mains.has(r.g.repo);
    const out = [];
    const placed = new Set(); // repos whose worktrees are listed (under the first of its spaces)
    for (const r of list) {
      if (nested(r)) continue;
      out.push({ ...r, tree: null });
      if (!r.g || r.g.linked || placed.has(r.g.repo)) continue;
      placed.add(r.g.repo);
      const kids = list.filter((k) => nested(k) && k.g.repo === r.g.repo);
      kids.forEach((k, n) => out.push({ ...k, tree: n === kids.length - 1 ? "└─" : "├─" }));
    }
    return out;
  }

  // Whether a machine's spaces are still coming in.
  machineLoading(m) {
    const layout = machines().find(k => k.name === m)?.layout;
    return layout === "loading" || (!layout && this.machines.some(k => k.name === m && k.state === "connected"))
      || spaces().some(s => (s.machine ?? null) === m && !this.shown.has(s.id));
  }

  loadingRow(m, t, collapsed) {
    return div().id(`machine-loading-${m ?? "local"}`).h(28).flex_none().px(8).text_size(12).text_color(t.dim).child(collapsed ? "…" : "Loading…");
  }

  // A machine's header and, unless it's folded, its folders and spaces. In a
  // folder on this computer (`nested`) the header is indented like the
  // folder's spaces, and the machine's folders and spaces a step further (see indent).
  machineSection(m, mine, t, collapsed, { nested = false, guests = [], hidden = false, seen = [] } = {}) {
    const machine = this.machines.find(k => k.name === m);
    const connected = !m || machine?.state === "connected";
    const folded = this.folded.has(m);
    const head = h_flex().id(`machine-${m ?? "local"}`).h(26).flex_none().pl(collapsed ? 2 : nested ? 26 : 8).pr(collapsed ? 2 : 8).gap(7).items_center().text_size(11).text_color(t.dim)
      .cursor_pointer().hover(s => s.bg(t.hover))
      .on_click((_e, cx) => {
        folded ? this.folded.delete(m) : this.folded.add(m);
        localStorage.setItem("machines.folded", JSON.stringify([...this.folded]));
        cx.notify();
      })
      .child(svg(`mods/workspace-chrome/${m ? "server" : "monitor"}.svg`).size(13).flex_none())
      .when(!collapsed, el => el.child(div().flex_1().truncate().child(m ?? "This computer"))
        .when(!connected, el => el.child(div().flex_none().child((machine?.state ?? "asleep").replace(/_/g, " "))))
        .when(connected, el => el.child(div().id(`machine-folder-${m ?? "local"}`).flex_none().px(3).rounded(4).hover(s => s.bg(t.hover).text_color(t.foreground))
          .on_click((_e, cx) => { cx.stop_propagation(); this.newFolder(m); }).child(svg("mods/workspace-chrome/folder-plus.svg").size(12))))
        .when(connected, el => el.child(div().id(`machine-add-${m ?? "local"}`).flex_none().px(4).rounded(4).hover(s => s.bg(t.hover).text_color(t.foreground))
          .on_click((_e, cx) => { cx.stop_propagation(); newSpaceIn(m, null); }).child("+")))
        .child(div().size(6).rounded(3).flex_none().bg(connected ? t.ansi2 : t.dim))
        .child(svg(`mods/workspace-chrome/chevron-${folded ? "right" : "down"}.svg`).size(11).flex_none()));
    const empty = h_flex().id(`machine-new-${m ?? "local"}`).h(28).flex_none().pl(indent(null, nested)).pr(8).gap(7).items_center().rounded(7)
      .text_size(12).text_color(t.dim).hover(s => s.bg(t.hover).text_color(t.foreground))
      .on_click(() => newSpaceIn(m, null))
      .child(svg("mods/workspace-chrome/plus.svg").size(12)).when(!collapsed, el => el.child("New space there"));
    const body = mine.length || guests.length ? this.foldered(mine, m, t, collapsed, { guests, nested, hidden: hidden || folded, seen })
      : [this.machineLoading(m) ? this.loadingRow(m, t, collapsed) : empty];
    return hidden ? [] : [head, ...(folded ? [] : body)];
  }

  // The rows, under a header per machine once one isn't this computer. A
  // machine a folder here takes in shows in that folder instead. `seen`
  // collects the spaces in this order (see foldered).
  grouped(t, collapsed, seen = []) {
    const rows = this.ordered(), ps = panes();
    const remote = [...new Set([...rows.map(r => r.w.machine).filter(Boolean), ...this.machines.map(m => m.name)])].sort();
    const guests = remote.map((m) => {
      const mine = rows.filter((r) => r.w.machine === m);
      return { m, rows: mine, folder: machineFolder(m, mine, ps) };
    });
    const housed = guests.filter((g) => g.folder);
    const loose = guests.filter((g) => !g.folder);
    const local = rows.filter((r) => !r.w.machine);
    if (!loose.length) {
      return this.machineLoading(null) && !local.length && !housed.length ? [this.loadingRow(null, t, collapsed)] : this.foldered(local, null, t, collapsed, { guests: housed, seen });
    }
    return [
      ...this.machineSection(null, local, t, collapsed, { guests: housed, seen }),
      ...loose.flatMap((g) => this.machineSection(g.m, g.rows, t, collapsed, { seen })),
    ];
  }

  // Only what's unusual, after the name: "herdr \u00b7 spike \u21912 \u21931". The repo or
  // branch goes when the name already says it (a worktree is named after its branch),
  // and master/main go: nearly every space is on one.
  gitTail(g, tree, name, t) {
    const raw = g.branch ?? "detached";
    const same = (a) => a.toLowerCase() === name.toLowerCase();
    const branch = same(raw) || raw === "master" || raw === "main" ? "" : raw;
    const repo = tree || same(g.name) ? "" : g.name;
    const where = [repo, branch].filter(Boolean).join(" \u00b7 ");
    return h_flex()
      .flex_1()
      .min_w(0)
      .gap(5)
      .justify_end()
      .items_center()
      .text_size(11.5)
      .text_color(t.dim)
      .when(Boolean(where), (el) => el.child(div().min_w(0).truncate().child(where)))
      .when(g.ahead > 0, (el) => el.child(div().flex_none().text_color(t.ansi2).child(`\u2191${g.ahead}`)))
      .when(g.behind > 0, (el) => el.child(div().flex_none().text_color(t.ansi1).child(`\u2193${g.behind}`)));
  }

  row({ w, i, g, tree, folder, nested }, t) {
    const on = w.active;
    const colors = shared("space.colors") ?? {};
    const color = colors[w.id] ?? "ansi6";
    const fill = color.startsWith("#") ? color : (MARK[color] ?? t[color]);
    return v_flex()
      .relative()
      .id(`space-${w.id}`)
      .pl(indent(folder, nested))
      .pr(8)
      .h(rowHeight({ tree }))
      .flex_none()
      .justify_center()
      .rounded(8)
      .when(on, (el) => el.bg(t.selected))
      .when(!on, (el) => el.hover((s) => s.bg(t.hover)))
      .when(this.pressed === i && this.over !== i, (el) => el.opacity(0.5))
      .when(this.pressed !== null && this.over === i && this.pressed !== i, (el) => el.child(
        div().absolute().left(0).right(0).h(2).bg(t.accent)
          .when(this.pressed < i, line => line.bottom(0))
          .when(this.pressed > i, line => line.top(0)),
      ))
      .on_mouse_down("left", () => {
        this.pressed = i;
        this.over = i;
      })
      .on_mouse_move((_e, cx) => {
        const source = spaces()[this.pressed];
        const over = source && (source.machine ?? null) === (w.machine ?? null) ? i : null;
        if (this.pressed !== null && (this.over !== over || this.overFolder !== null)) {
          this.over = over;
          this.overFolder = null;
          cx.notify();
        }
      })
      .on_mouse_up("left", (_e, cx) => {
        const from = this.pressed;
        const over = this.over;
        this.pressed = null;
        this.over = null;
        // Dropped on a space: it goes to that place, and into that space's folder.
        if (from !== null && over === i && from !== i) { this.drop(from, folder); run("space.move", { id: spaces()[from].id, index: i + 1 }); }
        else if (from === i) run("space.select", { id: w.id });
        cx.notify();
      })
      .on_mouse_down("right", () => this.menu(w))
      .child(
        h_flex()
          .gap(9)
          .items_center()
          .when(Boolean(tree), el => el.pl(22).child(svg("mods/workspace-chrome/branch.svg").size(13).text_color(t.dim)))
          .when(!tree, el => el.child(h_flex().size(18).flex_none().rounded(5).bg(fill).items_center().justify_center().text_size(10.5).font_bold().text_color("#ffffff").child([...w.name][0]?.toUpperCase() ?? "?")))
          .child(div().flex_shrink(0).max_w(150).truncate().text_color(t.foreground).child(w.name))
          .child(g ? this.gitTail(g, tree, w.name, t) : div().flex_1()),
      );
  }

  compact({ w, i }, t) {
    return h_flex()
      .id(`space-${w.id}`)
      .h(26)
      .flex_none()
      .justify_center()
      .gap(4)
      .when(w.active, (el) => el.bg(t.raised))
      .hover((s) => s.bg(t.hover))
      .on_click(() => run("space.select", { id: w.id }))
      .child(div().text_color(w.active ? t.foreground : t.muted).child(String(i + 1)))
      .child(div().text_color(tone(t, w.status)).child(glyph(w.status)));
  }

  render() {
    const t = theme();
    if (this.folderMenu) return this.folderMenuView(t);
    if (this.editing) return this.editView(t);
    const collapsed = narrow();
    const palette = ["ansi6", "ansi3", "ansi4", "ansi5", "ansi2", "ansi1"];
    const sp = spaces();
    const ids = new Set(sp.map(p => p.id));
    const kept = Object.fromEntries(Object.entries(shared("space.colors") ?? {}).filter(([id]) => ids.has(id)));
    let changed = Object.keys(kept).length !== Object.keys(shared("space.colors") ?? {}).length;
    for (const p of sp) {
      if (kept[p.id] || p.name === "~") continue;
      const uses = c => Object.values(kept).filter(v => v === c).length;
      kept[p.id] = palette.reduce((best, c) => uses(c) < uses(best) ? c : best);
      changed = true;
    }
    if (changed) setShared("space.colors", kept);
    // While a space in a folder is dragged, a place to drop it out of the folder.
    const dragged = this.pressed !== null ? spaces()[this.pressed] : null;
    const leaving = Boolean(dragged && folderOf(dragged, folders(dragged.machine ?? null), panes()));
    const button = (id, icon, action) => div().id(id).size(26).flex_none().flex().items_center().justify_center().rounded(6)
      .hover(s => s.bg(t.hover).text_color(t.foreground)).on_click(action).child(svg(`mods/workspace-chrome/${icon}.svg`).size(14));
    const seen = [], rows = this.grouped(t, collapsed, seen);
    this.seen = seen;
    return v_flex().size_full().min_h(0).bg(t.chrome).text_size(13)
      .child(h_flex().h(31).pl(16).pr(10).items_center().justify_between().text_size(11.5).text_color(t.dim)
        .when(!collapsed, el => el.child("Spaces"))
        .child(h_flex().gap(2)
          .when(!collapsed, el => el.child(button("folder-new", "folder-plus", () => this.newFolder(null))))
          .child(button("space-new", "plus", () => newSpaceIn(null, null)))))
      .child(v_flex().flex_1().min_h(0).px(8).pb(14).overflow_y_scrollbar().mode("always")
        // Released anywhere but on a space or a folder: out of its folder.
        .on_mouse_up("left", (_e, cx) => {
          if (this.pressed !== null) this.drop(this.pressed, null);
          this.pressed = null; this.over = null; this.overFolder = null; this.moving = null; this.overMove = null;
          cx.notify();
        })
        .children(rows)
        .when(leaving && !collapsed, el => el.child(div().id("folder-out").mt(6).h(34).flex_none().flex().items_center().justify_center()
          .rounded(8).border_1().border_dashed().border_color(this.overFolder === "out" ? t.accent : t.border)
          .text_size(12).text_color(this.overFolder === "out" ? t.foreground : t.dim)
          .on_mouse_move((_e, cx) => { if (this.overFolder !== "out") { this.overFolder = "out"; this.over = null; cx.notify(); } })
          .child("Drop here to take it out of its folder"))));
  }
}
