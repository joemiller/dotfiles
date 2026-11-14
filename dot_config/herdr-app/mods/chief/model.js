import { attention } from "./attention.js";

// Groups top to bottom. `folded` groups start closed.
export const GROUPS = [
  { id: "needs", label: "Needs you", color: "blocked" },
  { id: "unclear", label: "Unclear", color: "unknown" },
  { id: "working", label: "Working", color: "working" },
  { id: "waiting", label: "Waiting", color: "idle" },
  { id: "finished", label: "Finished", color: "done" },
  { id: "silent", label: "Not reporting", color: "dim", folded: true },
  { id: "hidden", label: "Hidden until next report", color: "dim", folded: true },
];

// An agent that says it is working but has been idle this long probably stopped.
export const STALE_MS = 60 * 60000;

export function readReport(labels) {
  if (labels["chief.v"] !== "1") return null;
  const rev = labels["chief.rev"] ?? "";
  const at = Date.parse(labels["chief.at"] ?? "");
  return {
    rev,
    at: Number.isFinite(at) ? at : 0,
    title: labels["chief.title"] ?? "",
    situation: labels["chief.situation"] ?? "",
    update: labels["chief.update"] ?? "",
    next: labels["chief.next"] ?? "",
    links: (labels["chief.links"] ?? "").split("\n").filter(Boolean),
    hidden: Boolean(rev) && labels["chief.hidden"] === rev,
    kind: labels["chief.kind"] ?? "",
    session: labels["chief.session"] ?? "",
  };
}

export function classify(agent, report, now) {
  // A blocked agent (a permission prompt, say) shows even when hidden: hiding waits for a new report, not a new block.
  if (agent.status === "blocked") return "needs";
  if (report?.hidden) return "hidden";
  if (report?.situation === "needs_input") return "needs";
  if (agent.status === "working") return "working";
  if (!report) return "silent";
  switch (report.situation) {
    case "waiting_external":
    case "follow_up_later":
      return "waiting";
    case "finished":
      return "finished";
    case "working":
      return now - report.at > STALE_MS ? "unclear" : "working";
    default:
      return "unclear";
  }
}

// Every agent with its report and group, in display order.
// The session's own name (/name, /rename), else a tab name someone chose, else the terminal
// title, else the space. A tab name of only digits is herdr's automatic number.
export function displayName(agent, labels) {
  const tab = agent.tab_name ?? "";
  const raw = agent.title ?? "";
  // Pi titles are "π - <name> - <folder>", or "π - <folder>" without a name. The folder is no name.
  const pi = raw.startsWith("π - ") ? raw.slice(4).split(" - ") : null;
  const title = (pi ? pi.slice(0, -1).join(" - ") : raw.replace(/^[^\p{L}\p{N}]+/u, "")).trim();
  const space = agent.space_name || "?";
  return labels["chief.name"] || (tab && !/^\d+$/.test(tab) ? tab : "") || title || (!tab || tab === "1" ? space : `${space} · ${tab}`);
}

export function collect(agentList, terminalList, now) {
  const labels = new Map(terminalList.map((term) => [term.address, term.labels ?? {}]));
  const terminalParent = new Map(terminalList.map((term) => [term.address, term.parent ?? null]));
  // herdr-core's time of the last status change. The native agents navbar shows the same.
  const statusAt = new Map(terminalList.map((term) => [term.address, term.status_ms ?? 0]));
  const items = agentList.map((agent) => {
    const own = labels.get(agent.address) ?? {};
    const report = readReport(own);
    const touched = Date.parse(own["chief.touched"] ?? "") || 0;
    return {
      agent,
      report,
      name: displayName(agent, own),
      touched,
      heat: attention(own, touched, now),
      statusAt: statusAt.get(agent.address) ?? 0,
      parent: terminalParent.get(agent.address) ?? null,
      prio: own["chief.prio"] === "high",
      group: classify(agent, report, now),
    };
  });
  const rank = (i) => GROUPS.findIndex((g) => g.id === i.group);
  return items.sort((x, y) => rank(x) - rank(y) || Number(y.prio) - Number(x.prio) || (y.report?.at ?? 0) - (x.report?.at ?? 0) || y.agent.seq - x.agent.seq);
}

export function age(ms) {
  const m = Math.floor(ms / 60000);
  if (m < 1) return "<1m";
  if (m < 60) return `${m}m`;
  // Hours and days round to nearest, as the native agents navbar does.
  const h = Math.round(m / 60);
  return h < 24 ? `${h}h` : `${Math.round(h / 24)}d`;
}
