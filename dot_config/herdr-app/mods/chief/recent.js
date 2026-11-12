// Recent sessions: every interactive agent the VM recorder saw, open or closed, with search and reopen.
// The list lives on each agent machine (agent-board/session-log.mjs). This file only reads it.
import { exec, spaces, terminals, run } from "herdr";

// exec gets herdr-core's PATH, which has no node. An interactive zsh would find it but writes
// terminal escape codes to stdout, so the usual node folders are added here instead.
const LIST = 'PATH="/home/linuxbrew/.linuxbrew/bin:/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:$PATH" exec node "$HOME/.pi/agent/agent-board/session-log.mjs" list 500';

export const recent = { at: 0, loading: false, error: "", rows: [] };

const machines = () => [...new Set(spaces().map((s) => s.machine).filter(Boolean))];

export async function loadRecent() {
  if (recent.loading) return;
  recent.loading = true;
  const rows = [];
  const errors = [];
  for (const on of machines()) {
    try {
      const r = await exec("sh", ["-c", LIST], { on, timeout: 20000 });
      if (r.code !== 0) throw new Error((r.stderr || "list failed").trim().split("\n").pop());
      for (const rec of JSON.parse(r.stdout || "[]")) rows.push({ ...rec, machine: on });
    } catch (e) {
      errors.push(`${on}: ${e.message}`);
    }
  }
  rows.sort((a, b) => b.last.localeCompare(a.last));
  Object.assign(recent, { at: Date.now(), loading: false, error: errors.join("; "), rows });
}

// Open sessions are the ones a live terminal names in its chief.session label.
export function liveSessions() {
  const live = new Map();
  for (const t of terminals()) {
    const id = t.labels?.["chief.session"];
    if (id && t.state !== "exited") live.set(id, t.address);
  }
  return live;
}

export const recordTitle = (r) => r.report?.title || r.name || r.where || r.cwd.split("/").pop() || r.id;

// Every word must appear somewhere in the record.
export function matches(r, query) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = [r.report?.title, r.report?.update, r.name, r.where, r.cwd, r.kind, r.id, ...(r.report?.links ?? [])].filter(Boolean).join("\n").toLowerCase();
  return words.every((w) => hay.includes(w));
}

const quote = (s) => `'${String(s).replaceAll("'", `'\\''`)}'`;

export function resumeCommand(r) {
  if (r.kind === "Claude") return `exec claude --resume ${quote(r.id)}`;
  return `exec pi --session ${quote(r.path || r.id)}`;
}

// herdr's `where` label is "space / tab".
const placeNames = (r) => {
  const [space = "", ...tab] = (r.where ?? "").split(" / ");
  return { space, tab: tab.join(" / ") };
};

// The original space by ID, else a space on that machine with its old name.
export function targetSpace(r) {
  const here = spaces().filter((s) => s.machine === r.machine);
  const name = placeNames(r).space;
  return here.find((s) => s.id === r.space || s.id.endsWith("/" + r.space))
    ?? (name ? here.find((s) => s.name === name) : null)
    ?? null;
}

// Without a matching space, the space is created again with its old name.
export function reopen(r) {
  const names = placeNames(r);
  const tab = (names.tab || recordTitle(r)).slice(0, 40);
  const argv = ["zsh", "-lic", resumeCommand(r)];
  const space = targetSpace(r);
  if (space) run("tab.new", { space: space.id, name: tab, folder: r.cwd, argv });
  else run("space.new", { name: names.space || recordTitle(r).slice(0, 40), tab, folder: r.cwd, argv, machine: r.machine });
}
