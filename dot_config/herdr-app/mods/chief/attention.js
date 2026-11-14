// Joe's attention per agent: prompts (chief.heat, written on the agent's machine) and minutes of
// focus (chief.focus.<client>, written here). Both are keyed by hours since the epoch.
import { focused, terminals, agents, exec, window as appWindow } from "herdr";
import { label } from "./actions.js";

const HOUR = 3600000;
const DAY = 24 * HOUR;
const KEEP_HOURS = 30 * 24;
// A prompt weighs as much as this many minutes of focus.
const PROMPT_MINUTES = 6;
const HALF_LIFE_HOURS = 24;
const TICK_MS = 15000;
const IDLE_LIMIT_S = 120;

const parse = (text) => {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
};

export function attention(labels, touched, now) {
  const prompts = parse(labels["chief.heat"]) ?? {};
  const focus = {};
  for (const [key, value] of Object.entries(labels)) {
    if (!key.startsWith("chief.focus.")) continue;
    for (const [h, m] of Object.entries(parse(value) ?? {})) focus[h] = (focus[h] ?? 0) + (Number(m) || 0);
  }
  // Minutes per hour, prompts converted to minutes.
  const hours = { ...focus };
  for (const [h, n] of Object.entries(prompts)) hours[h] = (hours[h] ?? 0) + (Number(n) || 0) * PROMPT_MINUTES;
  const hourNow = Math.floor(now / HOUR);
  const midnight = new Date(now).setHours(0, 0, 0, 0);
  // One entry per local calendar day, oldest first, today last.
  const days = Array.from({ length: 7 }, (_, i) => ({ start: midnight - (6 - i) * DAY, focus: 0, prompts: 0, total: 0 }));
  let score = touched ? 30 * 0.5 ** ((now - touched) / HOUR / HALF_LIFE_HOURS) : 0;
  for (const [h, m] of Object.entries(hours)) {
    score += m * 0.5 ** ((hourNow - Number(h)) / HALF_LIFE_HOURS);
    const index = 6 - Math.max(0, Math.ceil((midnight - Number(h) * HOUR) / DAY));
    if (index >= 0) {
      days[index].total += m;
      days[index].focus += focus[h] ?? 0;
      days[index].prompts += Number(prompts[h]) || 0;
    }
  }
  const since = (h) => Number(h) > hourNow - 7 * 24;
  const week = {
    focus: Math.round(Object.entries(focus).filter(([h]) => since(h)).reduce((s, [, m]) => s + m, 0)),
    prompts: Object.entries(prompts).filter(([h]) => since(h)).reduce((s, [, n]) => s + n, 0),
  };
  const recent = (parse(labels["chief.prompts"]) ?? []).filter((p) => typeof p?.text === "string").map((p) => ({ at: Date.parse(p.at) || 0, text: p.text }));
  // Minutes in the last `span` hours, for the Attention tab's range.
  const within = (span) => Object.entries(hours).filter(([h]) => Number(h) > hourNow - span).reduce((s, [, m]) => s + m, 0);
  return { days, score, week, prompts: recent, within };
}

// Counts a minute of focus for the agent shown while this window is active and Joe is at the
// keyboard. An agent counts from the second tick it stays focused, so passing through it does not.
export function trackFocus(cx) {
  let client = localStorage.getItem("client");
  if (!client) {
    client = Math.random().toString(36).slice(2, 8);
    localStorage.setItem("client", client);
  }
  const key = `chief.focus.${client}`;
  const seconds = new Map();
  let last = null;
  let ticks = 0;
  cx.spawn(async (cx) => {
    for (;;) {
      await cx.sleep(TICK_MS);
      const shown = focused();
      const address = shown?.terminal ?? shown?.agent ?? null;
      const isAgent = Boolean(address) && agents().some((a) => a.address === address);
      const here = isAgent && appWindow().active && (await atKeyboard());
      if (here && address === last) seconds.set(address, (seconds.get(address) ?? 0) + TICK_MS / 1000);
      last = here ? address : null;
      if (++ticks % 4 === 0) await flush(key, seconds).catch(() => {});
    }
  });
}

async function flush(key, seconds) {
  const hour = Math.floor(Date.now() / HOUR);
  const all = terminals();
  for (const [address, s] of seconds) {
    const minutes = Math.floor(s / 60);
    if (!minutes) continue;
    seconds.set(address, s - minutes * 60);
    const old = parse(all.find((t) => t.address === address)?.labels?.[key]) ?? {};
    const kept = Object.fromEntries(Object.entries(old).filter(([h]) => Number(h) > hour - KEEP_HOURS));
    kept[hour] = (kept[hour] ?? 0) + minutes;
    await label(address, { [key]: JSON.stringify(kept) });
  }
}

// macOS reports time since the last key or pointer event. Elsewhere, assume Joe is there.
async function atKeyboard() {
  if (appWindow().platform !== "macos") return true;
  const r = await exec("ioreg", ["-c", "IOHIDSystem", "-d", "4", "-r", "-k", "HIDIdleTime"], { timeout: 5000 }).catch(() => null);
  const ns = Number(/"HIDIdleTime" = (\d+)/.exec(r?.stdout ?? "")?.[1]);
  return !Number.isFinite(ns) || ns / 1e9 < IDLE_LIMIT_S;
}
