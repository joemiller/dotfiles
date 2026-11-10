// Agent actions. hc accepts the app's own `machine/t7` addresses, so these run on this computer.
import { hc, exec, spaces } from "herdr";

async function run(args) {
  const r = await hc(args);
  if (r.code !== 0) throw new Error((r.stderr || r.stdout || `hc ${args[0]} failed`).trim());
  return r.stdout;
}

export const label = (address, pairs) => run(["label", address, ...Object.entries(pairs).map(([k, v]) => `${k}=${v ?? ""}`)]);
export const send = (address, text) => run(["send", address, text]);
export const kill = (address) => run(["kill", address]);
export const readScreen = (address, lines = 60) => run(["read", address, "--lines", String(lines)]);

// The suggest script lives with the agent-board code on the agent's machine.
export async function suggestReply(agent) {
  const on = spaces().find((s) => s.id === agent.space)?.machine ?? null;
  const terminal = agent.address.split("/").pop();
  const r = await exec("sh", ["-c", '"$HOME/.pi/agent/agent-board/suggest-reply" "$1"', "sh", terminal], { on, timeout: 120000 });
  if (r.code !== 0) throw new Error((r.stderr || "suggest-reply failed").trim().split("\n").pop());
  return r.stdout.trim();
}
