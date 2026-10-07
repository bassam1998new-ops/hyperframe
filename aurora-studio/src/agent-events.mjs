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

function summarizeOneAgent(
  latest,
  {
    now,
    connectedWindowMs,
    workingWindowMs
  }
) {
  if (!latest) {
    return {
      connected: false,
      state: "offline",
      source: null,
      summary: null,
      tool_name: null,
      workspace_path: null,
      event: null,
      run_id: null,
      session_id: null,
      last_event_at: null
    };
  }

  const age = ageMs(latest.timestamp, now);
  const explicitOffline = latest.state === "offline";
  const connected =
    !explicitOffline &&
    age <= connectedWindowMs;

  let state = connected
    ? latest.state || "idle"
    : "offline";

  if (
    connected &&
    state === "working" &&
    age > workingWindowMs
  ) {
    state = "idle";
  }

  return {
    connected,
    state,
    source: latest.source || null,
    summary: latest.summary || null,
    tool_name: latest.tool_name || null,
    workspace_path: latest.workspace_path || null,
    event: latest.event || null,
    run_id: latest.run_id || null,
    session_id: latest.session_id || null,
    last_event_at: latest.timestamp || null
  };
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
    .sort((a, b) =>
      String(b.timestamp || "")
        .localeCompare(String(a.timestamp || ""))
    );

  const latestBySource = new Map();
  for (const item of ordered) {
    const source = item.source || "agent";
    if (!latestBySource.has(source)) {
      latestBySource.set(source, item);
    }
  }

  const options = {
    now,
    connectedWindowMs,
    workingWindowMs
  };

  const perAgent = [...latestBySource.values()]
    .map(item => summarizeOneAgent(item, options));

  const connected = perAgent
    .filter(item => item.connected)
    .sort((a, b) => {
      const priority = value =>
        value.state === "waiting"
          ? 3
          : value.state === "working"
            ? 2
            : 1;

      const diff = priority(b) - priority(a);
      if (diff) return diff;

      return String(b.last_event_at || "")
        .localeCompare(String(a.last_event_at || ""));
    });

  const selected =
    connected[0] ||
    summarizeOneAgent(ordered[0] || null, options);

  return {
    ...selected,
    agents: Object.fromEntries(
      perAgent
        .filter(item => item.source)
        .map(item => [item.source, item])
    )
  };
}

function semanticAgentDetail(item) {
  const agent =
    item.source === "claude"
      ? "Claude"
      : item.source === "codex"
        ? "Codex"
        : "Agent";

  const workspacePath = String(item.workspace_path || "");
  const file = workspacePath.split("/").pop() || "";

  const artifactLabels = new Map([
    ["concepts.json", "creative concepts"],
    ["mood.json", "creative direction"],
    ["asset-plan.json", "asset plan"],
    ["build-plan.json", "storyboard and build plan"],
    ["review.json", "final review"],
    ["learning-review.json", "learning review"],
    ["project.json", "project brain"],
    ["workspace.json", "Studio settings"]
  ]);

  if (
    ["PostToolUse", "PostToolUseFailure"].includes(item.event) &&
    artifactLabels.has(file)
  ) {
    const action =
      item.event === "PostToolUseFailure"
        ? "could not update"
        : "updated";
    return `${agent} ${action} ${artifactLabels.get(file)}`;
  }

  if (
    ["PostToolUse", "PostToolUseFailure"].includes(item.event) &&
    /^renders\//.test(workspacePath)
  ) {
    return item.event === "PostToolUseFailure"
      ? `${agent} render action failed`
      : `${agent} updated a render output`;
  }

  if (
    ["PostToolUse", "PostToolUseFailure"].includes(item.event) &&
    /^\.aurora\/blender\//.test(workspacePath)
  ) {
    return item.event === "PostToolUseFailure"
      ? `${agent} Blender action failed`
      : `${agent} updated Blender production files`;
  }

  return item.summary || item.event || "Agent activity";
}

export function agentEventActivity(events, runId = null) {
  const hiddenFromHistory = new Set([
    "PreToolUse",
    "UserPromptSubmit"
  ]);

  const mapped = (events || [])
    .filter(item =>
      (!runId || !item.run_id || item.run_id === runId) &&
      !hiddenFromHistory.has(item.event)
    )
    .slice()
    .reverse()
    .slice(0, 60)
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
      detail: semanticAgentDetail(item),
      at: item.timestamp || null,
      event: item.event || null,
      tool_name: item.tool_name || null,
      source: item.source || null,
      run_id: item.run_id || null,
      count: 1
    }));

  const coalesced = [];
  for (const item of mapped) {
    const previous = coalesced[coalesced.length - 1];
    const same =
      previous &&
      previous.source === item.source &&
      previous.status === item.status &&
      previous.detail === item.detail;

    const withinWindow =
      same &&
      Number.isFinite(Date.parse(previous.at || "")) &&
      Number.isFinite(Date.parse(item.at || "")) &&
      Math.abs(Date.parse(previous.at) - Date.parse(item.at)) <= 45_000;

    if (withinWindow) {
      previous.count += 1;
      continue;
    }

    coalesced.push(item);
  }

  return coalesced.slice(0, 20);
}
