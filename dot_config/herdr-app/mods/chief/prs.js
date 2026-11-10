// PR facts from gh on this computer. The docked sidebar polls; every view reads shared("chief.prs").
import { exec, shared, setShared, terminals } from "herdr";

export const POLL_MS = 90000;
// GitHub's search API returns 502 after about 10 s. Larger pages with check status hit that often.
const PAGE = 25;
const MAX_LINKED = 30;

const FIELDS = "url number title isDraft state reviewDecision createdAt updatedAt repository { nameWithOwner } author { login } commits(last: 1) { nodes { commit { statusCheckRollup { state } } } }";

const PR_URL = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/pull\/(\d+)\/?$/i;
export const prKey = (url) => {
  const m = PR_URL.exec(url.trim());
  return m ? `https://github.com/${m[1]}/${m[2]}/pull/${m[3]}`.toLowerCase() : null;
};

export const prData = () => shared("chief.prs") ?? { at: 0, error: "", mine: [], mineTotal: 0, review: [], linked: [] };

export function prIndex(data = prData()) {
  const index = new Map();
  for (const pr of [...data.linked, ...data.review, ...data.mine]) index.set(prKey(pr.url), pr);
  return index;
}

// One label per PR, most urgent first. rank orders a list: lower needs you sooner.
export function prStatus(pr) {
  if (pr.state === "MERGED") return { label: "merged", color: "#bc9cd7", rank: 8 };
  if (pr.state === "CLOSED") return { label: "closed", color: "#a1a9b8", rank: 9 };
  if (pr.checks === "FAILURE" || pr.checks === "ERROR") return { label: "checks failing", color: "#e996a6", rank: 0 };
  if (pr.review === "CHANGES_REQUESTED") return { label: "changes requested", color: "#e996a6", rank: 1 };
  if (pr.draft) return { label: "draft", color: "#a1a9b8", rank: 6 };
  if (pr.review === "APPROVED") return pr.checks === "PENDING" || pr.checks === "EXPECTED"
    ? { label: "approved · checks running", color: "#9fbb8f", rank: 3 }
    : { label: "approved", color: "#9fbb8f", rank: 2 };
  if (pr.checks === "PENDING" || pr.checks === "EXPECTED") return { label: "checks running", color: "#e3b36b", rank: 4 };
  return { label: "in review", color: "#8fabd8", rank: 5 };
}

function parse(node) {
  if (!node?.url) return null;
  return {
    url: node.url,
    repo: node.repository?.nameWithOwner ?? "",
    number: node.number,
    title: node.title,
    draft: node.isDraft,
    state: node.state,
    review: node.reviewDecision ?? "",
    checks: node.commits?.nodes?.[0]?.commit?.statusCheckRollup?.state ?? "",
    author: node.author?.login ?? "",
    created: Date.parse(node.createdAt) || 0,
    updated: Date.parse(node.updatedAt) || 0,
  };
}

async function graphql(query) {
  const r = await exec("gh", ["api", "graphql", "-f", `query=${query}`], { timeout: 25000 });
  if (r.code !== 0) throw new Error((r.stderr || "gh failed").trim().split("\n").pop());
  return JSON.parse(r.stdout).data;
}

const search = async (q) => {
  const data = await graphql(`query { s: search(type: ISSUE, first: ${PAGE}, query: "${q} sort:updated-desc") { issueCount nodes { ... on PullRequest { ${FIELDS} } } } }`);
  return { total: data.s.issueCount, prs: data.s.nodes.map(parse).filter(Boolean) };
};

// PR links that agents reported, newest report first.
function reportedPrUrls() {
  const seen = new Map();
  const terms = terminals().slice().sort((x, y) => (Date.parse(y.labels?.["chief.at"] ?? "") || 0) - (Date.parse(x.labels?.["chief.at"] ?? "") || 0));
  for (const term of terms) {
    for (const url of (term.labels?.["chief.links"] ?? "").split("\n")) {
      const key = prKey(url);
      if (key && !seen.has(key)) seen.set(key, url.trim());
    }
  }
  return [...seen.values()];
}

let running = false;

// Each query fails on its own. A failed one keeps its last good list.
export async function refreshPrs() {
  if (running) return;
  running = true;
  try {
    const old = prData();
    const errors = [];
    const attempt = async (what, fn, fallback) => {
      try {
        return await fn();
      } catch (e) {
        errors.push(`${what}: ${e.message}`);
        return fallback;
      }
    };
    const mine = await attempt("my PRs", () => search("is:pr is:open author:@me archived:false"), { total: old.mineTotal, prs: old.mine });
    const review = await attempt("review requests", () => search("is:pr is:open user-review-requested:@me archived:false"), { prs: old.review });
    const known = new Set([...mine.prs, ...review.prs].map((pr) => prKey(pr.url)));
    const wanted = reportedPrUrls().filter((url) => !known.has(prKey(url))).slice(0, MAX_LINKED);
    const linked = wanted.length === 0 ? [] : await attempt("agent PRs", async () => {
      const aliases = wanted.map((url, i) => `l${i}: resource(url: ${JSON.stringify(url)}) { ... on PullRequest { ${FIELDS} } }`);
      const data = await graphql(`query { ${aliases.join("\n")} }`);
      return Object.values(data).map(parse).filter(Boolean);
    }, old.linked);
    setShared("chief.prs", { at: Date.now(), error: errors.join("; "), mine: mine.prs, mineTotal: mine.total, review: review.prs, linked });
  } finally {
    running = false;
  }
}
