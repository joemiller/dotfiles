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
