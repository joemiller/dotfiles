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
export function collect(agentList, terminalList, now) {
  const labels = new Map(terminalList.map((term) => [term.address, term.labels ?? {}]));
  const terminalParent = new Map(terminalList.map((term) => [term.address, term.parent ?? null]));
  const items = agentList.map((agent) => {
    const own = labels.get(agent.address) ?? {};
    const report = readReport(own);
    return { agent, report, parent: terminalParent.get(agent.address) ?? null, prio: own["chief.prio"] === "high", group: classify(agent, report, now) };
  });
  const rank = (i) => GROUPS.findIndex((g) => g.id === i.group);
  return items.sort((x, y) => rank(x) - rank(y) || Number(y.prio) - Number(x.prio) || (y.report?.at ?? 0) - (x.report?.at ?? 0) || y.agent.seq - x.agent.seq);
}

export function age(ms) {
  const m = Math.floor(ms / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`;
}
