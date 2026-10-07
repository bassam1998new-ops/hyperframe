import { escapeHtml, money, titleCase } from "../format.js";
import { mountMediaPlayer } from "../components/media-player.js";

const $ = selector => document.querySelector(selector);

function phaseRows(run) {
  if (!run) return [];

  const stages = new Map((run.stages || []).map(stage => [stage.id, stage]));
  const groups = run.mode === "director"
    ? [
        ["Direction", ["understand", "concept", "mood"]],
        ["Assets", ["assets"]],
        ["Build", ["routing", "build_plan", "build"]],
        ["Review", ["pre_render_review", "render", "post_render_review"]],
        ["Ready", ["approval", "finalize"]]
      ]
    : [
        ["Understand", ["understand", "concept", "mood"]],
        ["Assets", ["assets"]],
        ["Build", ["routing", "build_plan", "build"]],
        ["Review", ["pre_render_review", "render", "post_render_review"]],
        ["Ready", ["approval", "finalize"]]
      ];

  return groups.map(([label, ids]) => {
    const items = ids.map(id => stages.get(id)).filter(Boolean);
    const current = items.find(item => item.current);
    let status = current ? "in_progress" : "pending";

    if (items.some(item => item.status === "failed")) status = "failed";
    else if (items.some(item => item.status === "awaiting_human")) status = "awaiting_human";
    else if (
      items.length &&
      items.every(item => ["completed", "skipped"].includes(item.status))
    ) {
      status = "completed";
    } else if (
      items.some(item => ["completed", "in_progress"].includes(item.status))
    ) {
      status = "in_progress";
    }

    return {
      label,
      status,
      detail: current
        ? "Current: " + titleCase(current.id)
        : status === "completed"
          ? "Complete"
          : "Waiting"
    };
  });
}

export function renderPreview(run, mediaUrl) {
  const stage = $("#preview-stage");
  const status = $("#preview-status");
  const meta = $("#preview-meta");
  const title = $("#preview-title");
  const detail = $("#preview-detail");
  const chips = $("#route-chips");

  title.textContent = run?.task || "AurorA Studio";
  detail.textContent = run
    ? titleCase(run.current_stage) + " · " + titleCase(run.mode) + " mode"
    : "Waiting for a production run";

  const statusText = run ? titleCase(run.status) : "Ready";
  status.innerHTML = "<i></i> " + escapeHtml(statusText);
  meta.textContent = run?.review?.decision && run.review.decision !== "PENDING"
    ? "Review: " + run.review.decision
    : run?.preview
      ? "Live workspace render"
      : "No render yet";

  const intentChips = run
    ? [
        run.intent?.quality
          ? '<span class="quality-chip">' + escapeHtml(titleCase(run.intent.quality)) + "</span>"
          : "",
        run.intent?.aspect
          ? '<span class="route-chip">' + escapeHtml(run.intent.aspect) + "</span>"
          : ""
      ].filter(Boolean)
    : [];

  const conceptChips =
    run?.concepts?.selected
      ? [
          '<span class="direction-chip">Direction · ' +
          escapeHtml(run.concepts.selected.name) +
          "</span>"
        ]
      : [];

  const routeChips = (run?.route || []).map(route =>
    '<span class="route-chip">' +
    escapeHtml(titleCase(route)) +
    "</span>"
  );

  chips.innerHTML = [
    ...conceptChips,
    ...intentChips,
    ...routeChips
  ].join("");

  if (!run?.preview) {
    stage.innerHTML = `
      <div class="preview-empty">
        <div class="aurora-scene">
          <div class="scene-orbit orbit-one"></div>
          <div class="scene-orbit orbit-two"></div>
          <div class="scene-glow"></div>
          <div class="scene-word">AURORA</div>
        </div>
        <div class="preview-empty-copy">
          <strong>${run ? "No preview file yet" : "Nothing rendering yet"}</strong>
          <span>${
            run
              ? escapeHtml(titleCase(run.current_stage)) + " is in progress."
              : "Start a run and AurorA will show the current render here."
          }</span>
        </div>
      </div>`;
    return;
  }

  const src = mediaUrl(run.preview);
  if (run.preview.type === "video") {
    mountMediaPlayer(stage, {
      src,
      label: run.task || "AurorA Studio preview"
    });
  } else {
    stage.innerHTML =
      '<img alt="Current AurorA render" src="' + escapeHtml(src) + '" />';
  }
}

function shotPreview(shot, mediaUrl) {
  const preview = shot.output_preview;

  if (preview?.type === "image") {
    return `
      <span class="shot-thumb">
        <img src="${escapeHtml(mediaUrl(preview))}" alt="" />
      </span>
    `;
  }

  if (preview?.type === "video") {
    return `
      <span class="shot-thumb">
        <video
          muted
          preload="metadata"
          src="${escapeHtml(mediaUrl(preview))}"
        ></video>
      </span>
    `;
  }

  return `
    <span class="shot-thumb shot-thumb-empty">
      <span>${String(shot.number || "").padStart(2, "0")}</span>
    </span>
  `;
}

export function renderBoard(run, mediaUrl) {
  const eyebrow = $("#board-eyebrow");
  const title = $("#board-title");
  const list = $("#board-list");
  const count = $("#board-count");
  const footer = $("#board-footer-text");

  if (!run) {
    eyebrow.textContent = "PRODUCTION";
    title.textContent = "No active run";
    count.textContent = "0";
    list.innerHTML =
      '<div class="empty-card">Start a run to see the real production board.</div>';
    footer.textContent =
      "AurorA keeps routing and checkpoints behind the scenes.";
    return;
  }

  const shots = run.shots || [];
  const director = run.mode === "director";
  eyebrow.textContent = shots.length
    ? "STORYBOARD"
    : director
      ? "DIRECTOR BOARD"
      : "PRODUCTION";
  title.textContent = run.task;

  if (shots.length) {
    count.textContent = String(shots.length);
    footer.textContent = run.storyboard_editable
      ? "Drag shots to reorder, or open a shot for keyboard-safe move controls."
      : "Storyboard is read-only at this stage.";

    list.innerHTML = shots.map(shot => {
      const duration =
        shot.duration_seconds == null
          ? "Auto duration"
          : `${shot.duration_seconds}s`;

      return `
        <div
          class="board-row storyboard-row ${shot.status === "complete" ? "complete" : ""}"
          data-shot-id="${escapeHtml(shot.id)}"
          tabindex="${run.storyboard_editable ? "0" : "-1"}"
          aria-label="Shot ${shot.number}: ${escapeHtml(shot.purpose || shot.id)}"
        >
          <button
            class="shot-drag-handle"
            type="button"
            aria-label="Drag shot ${shot.number}"
            ${run.storyboard_editable ? "" : "disabled"}
          >
            <svg><use href="#i-grip"/></svg>
          </button>

          ${shotPreview(shot, mediaUrl)}

          <div class="board-copy storyboard-copy">
            <div class="storyboard-title-line">
              <span>SHOT ${String(shot.number).padStart(2, "0")}</span>
              <strong>${escapeHtml(shot.purpose || shot.id)}</strong>
            </div>
            <div class="storyboard-meta">
              <span>${escapeHtml(duration)}</span>
              <span class="shot-status ${escapeHtml(shot.status)}">${escapeHtml(titleCase(shot.status))}</span>
            </div>
          </div>

          <div class="board-side storyboard-side">
            <span class="engine-chip">${escapeHtml(titleCase(shot.engine))}</span>
            <span class="quality-chip">${escapeHtml(titleCase(shot.quality || "normal"))}</span>
            ${
              run.storyboard_editable
                ? `
                  <button
                    class="shot-open"
                    type="button"
                    data-shot-open
                    aria-label="Edit shot ${shot.number}"
                    title="Edit shot"
                    data-tooltip="Edit shot"
                    data-tooltip-placement="left"
                  >
                    <svg><use href="#i-edit"/></svg>
                  </button>
                `
                : ""
            }
          </div>
        </div>
      `;
    }).join("");

    return;
  }

  const phases = phaseRows(run);
  count.textContent = String(phases.length);
  footer.textContent = director
    ? "Concept and final approval stay visible. Internal routing stays behind the scenes."
    : "Direct mode keeps the internal stage machine simple.";

  list.innerHTML = phases.map((phase, index) => `
    <div class="board-row ${phase.status === "in_progress" ? "current" : ""}">
      <div class="board-number">${index + 1}</div>
      <div class="board-copy">
        <strong>${escapeHtml(phase.label)}</strong>
        <p>${escapeHtml(phase.detail)}</p>
      </div>
      <div class="board-side">
        <span class="stage-state ${escapeHtml(phase.status)}">${escapeHtml(titleCase(phase.status))}</span>
      </div>
    </div>
  `).join("");
}

export function renderAgentPresence(agent) {
  const root = $("#agent-presence");
  if (!root) return;

  const led = $("#agent-presence-led");
  const title = $("#agent-presence-title");
  const detail = $("#agent-presence-detail");
  const state = $("#agent-presence-state");
  const workers = $("#agent-worker-chips");
  const workBlock = $("#agent-work-block");
  const workTitle = $("#agent-work-title");
  const workDetail = $("#agent-work-detail");
  const progressFill = $("#agent-progress-fill");
  const progressLabel = $("#agent-progress-label");
  const attention = $("#agent-attention");
  const attentionTitle = $("#agent-attention-title");
  const attentionDetail = $("#agent-attention-detail");

  const source =
    agent?.source === "claude"
      ? "Claude"
      : agent?.source === "codex"
        ? "Codex"
        : null;

  const connected = Boolean(agent?.bridge_connected);
  const ready = Boolean(agent?.bridge_ready);
  const status = agent?.state || "offline";

  root.dataset.state = connected ? status : ready ? "ready" : "offline";
  led.className = "agent-presence-led " + (
    connected
      ? status
      : ready
        ? "ready"
        : "offline"
  );

  const workerRows = agent?.workers || [];
  workers.innerHTML = workerRows
    .filter(worker => worker.connected)
    .slice(0, 3)
    .map(worker => {
      const label =
        worker.source === "claude"
          ? "Claude"
          : worker.source === "codex"
            ? "Codex"
            : "Agent";
      return `
        <span
          class="agent-worker-chip ${escapeHtml(worker.state || "offline")}"
          title="${escapeHtml(worker.summary || label)}"
        >
          <i></i>${escapeHtml(label)}
        </span>
      `;
    })
    .join("");

  if (!workers.innerHTML && ready) {
    workers.innerHTML =
      '<span class="agent-worker-chip ready"><i></i>Ready</span>';
  }

  if (connected) {
    title.textContent =
      source
        ? source + " · " + titleCase(status)
        : "Agent · " + titleCase(status);

    detail.textContent =
      agent?.summary ||
      (agent?.tool_name
        ? "Current tool: " + titleCase(agent.tool_name)
        : "Live agent activity connected.");

    state.textContent =
      status === "waiting"
        ? "NEEDS YOU"
        : status === "working"
          ? "LIVE"
          : titleCase(status).toUpperCase();
  } else if (ready) {
    title.textContent = "Agent bridge ready";
    detail.textContent =
      "Start Claude or Codex in this workspace to see live activity.";
    state.textContent = "READY";
  } else {
    title.textContent = "Agent bridge not installed";
    detail.textContent =
      "Install Claude/Codex integration in Settings.";
    state.textContent = "OFF";
  }

  const work = agent?.work;
  const progress = agent?.progress;

  if (work && (agent?.run_id || progress?.total > 0)) {
    workBlock.hidden = false;
    workTitle.textContent = work.title || "Continuing production";
    workDetail.textContent = work.detail || "";
    const percent = Math.max(0, Math.min(100, Number(progress?.percent || 0)));
    progressFill.style.width = percent + "%";
    progressLabel.textContent =
      progress?.label || Math.round(percent) + "%";
  } else {
    workBlock.hidden = true;
    progressFill.style.width = "0%";
    progressLabel.textContent = "0 of 0 stages";
  }

  if (agent?.attention) {
    attention.hidden = false;
    attentionTitle.textContent = agent.attention.title || "Needs you";
    attentionDetail.textContent = agent.attention.detail || "";
  } else {
    attention.hidden = true;
    attentionTitle.textContent = "";
    attentionDetail.textContent = "";
  }
}

export function renderActivity(activity) {
  const list = $("#activity-list");
  if (!activity?.length) {
    list.innerHTML =
      '<div class="empty-card compact">No run activity yet.</div>';
    return;
  }

  list.innerHTML = activity.map(item => `
    <div class="activity-item ${escapeHtml(item.status || "info")}">
      <strong><i></i>${escapeHtml(titleCase(item.title))}</strong>
      <p>${escapeHtml(item.detail || titleCase(item.status || "updated"))}</p>
    </div>
  `).join("");
}

export function renderTools(tools) {
  const available = (tools || []).filter(tool => tool.available).length;

  $("#tool-summary").textContent = tools?.length
    ? available + " of " + tools.length + " production tools reachable"
    : "Workspace tools not detected yet";

  $("#studio-dot").style.background =
    available ? "var(--aurora-green)" : "var(--aurora-amber)";

  $("#tool-chips").innerHTML = (tools || []).map(tool => `
    <span class="tool-chip ${tool.available ? "on" : ""}">
      <i></i>${escapeHtml(tool.name)}
    </span>
  `).join("") || '<span class="tool-chip"><i></i>No tool state</span>';
}

export function renderUsage(run) {
  const node = $("#usage-content");
  if (!run?.usage) {
    node.textContent = "No paid usage recorded.";
    return;
  }

  const pieces = [];
  if (run.usage.actual_usd > 0) {
    pieces.push("Known spend " + money(run.usage.actual_usd));
  }

  for (const [provider, values] of Object.entries(run.usage.units || {})) {
    for (const [unit, amount] of Object.entries(values)) {
      pieces.push(titleCase(provider) + ": " + amount + " " + unit);
    }
  }

  node.textContent = pieces.join(" · ") || "No paid usage recorded.";
}
