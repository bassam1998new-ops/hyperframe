import fs from "node:fs";
import path from "node:path";

function eventFile(cwd) {
  return path.join(cwd, ".aurora", "agent-events.jsonl");
}

export function readAgentEvents(
  cwd = process.cwd(),
  { limit = 100 } = {}
) {
  const file = eventFile(cwd);
  if (!fs.existsSync(file)) return [];

  const raw = fs.readFileSync(file, "utf8").trim();
  if (!raw) return [];

  return raw
    .split("\n")
    .filter(Boolean)
    .slice(-Math.max(1, Number(limit || 100)))
    .flatMap(line => {
      try {
        const value = JSON.parse(line);
        return value && value.schema_version === 1 ? [value] : [];
      } catch {
        return [];
      }
    });
}

function ageMs(value, now) {
  const parsed = Date.parse(value || "");
  if (!Number.isFinite(parsed)) return Infinity;
  return Math.max(0, now - parsed);
}

export function summarizeAgentPresence(
  events,
  {
    now = Date.now(),
    connectedWindowMs = 15 * 60 * 1000,
    workingWindowMs = 90 * 1000
  } = {}
) {
  const ordered = (events || [])
    .slice()
    .sort((a, b) => String(b.timestamp || "").localeCompare(String(a.timestamp || "")));

  const latest = ordered[0] || null;
  if (!latest) {
    return {
      connected: false,
      state: "offline",
      source: null,
      summary: null,
      tool_name: null,
      run_id: null,
      session_id: null,
      last_event_at: null
    };
  }

  const age = ageMs(latest.timestamp, now);
  const explicitOffline = latest.state === "offline";
  const connected = !explicitOffline && age <= connectedWindowMs;

  let state = connected ? latest.state || "idle" : "offline";
  if (connected && state === "working" && age > workingWindowMs) {
    state = "idle";
  }

  return {
    connected,
    state,
    source: latest.source || null,
    summary: latest.summary || null,
    tool_name: latest.tool_name || null,
    run_id: latest.run_id || null,
    session_id: latest.session_id || null,
    last_event_at: latest.timestamp || null
  };
}

export function agentEventActivity(events, runId = null) {
  return (events || [])
    .filter(item => !runId || !item.run_id || item.run_id === runId)
    .slice()
    .reverse()
    .slice(0, 20)
    .map(item => ({
      type: "agent_event",
      title: item.source === "claude"
        ? "Claude"
        : item.source === "codex"
          ? "Codex"
          : "Agent",
      status:
        item.state === "waiting"
          ? "awaiting_human"
          : item.state === "error"
            ? "failed"
            : item.state === "offline"
              ? "idle"
              : item.state,
      detail: item.summary || item.event || "Agent activity",
      at: item.timestamp || null,
      event: item.event || null,
      tool_name: item.tool_name || null,
      source: item.source || null,
      run_id: item.run_id || null
    }));
}
