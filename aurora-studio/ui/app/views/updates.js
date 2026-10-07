import {
  escapeHtml,
  titleCase
} from "../format.js";

const $ = selector => document.querySelector(selector);

function formatDate(value) {
  if (!value) return null;

  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

function safetyItem({
  label,
  state,
  tone,
  detail
}) {
  return `
    <div class="update-safety-item">
      <div class="update-safety-icon ${escapeHtml(tone)}">
        <i></i>
      </div>
      <div class="update-safety-copy">
        <b>${escapeHtml(label)}</b>
        <p>${escapeHtml(detail)}</p>
      </div>
      <span class="update-safety-state ${escapeHtml(tone)}">
        ${escapeHtml(state)}
      </span>
    </div>
  `;
}

function remoteState(remoteUpdate, dismissedVersion) {
  if (!remoteUpdate) {
    return {
      badge: "Not checked",
      tone: "neutral",
      text: "Current local release information."
    };
  }

  if (remoteUpdate.local_newer) {
    return {
      badge: "Development build",
      tone: "violet",
      text:
        "This local build is newer than the currently published release metadata."
    };
  }

  if (remoteUpdate.update_available) {
    if (dismissedVersion === remoteUpdate.latest_version) {
      return {
        badge: "Later",
        tone: "neutral",
        text:
          "Version " +
          remoteUpdate.latest_version +
          " is available. You chose to revisit it later."
      };
    }

    return {
      badge: "Update available",
      tone: "amber",
      text:
        "Version " +
        remoteUpdate.latest_version +
        " is available from the configured release channel."
    };
  }

  return {
    badge: "Up to date",
    tone: "green",
    text: "This AurorA Studio package matches the current release metadata."
  };
}

function hfResultText(value) {
  if (!value) {
    return "HyperFrames is never silently upgraded during an active project.";
  }

  if (value.update_available === true) {
    const latest =
      value.latest_version ||
      value.latest ||
      value.version ||
      "a newer version";

    return "HyperFrames update available: " + latest + ". Review it separately before changing the tested core.";
  }

  if (value.update_available === false) {
    return "HyperFrames reports no update for the currently installed core.";
  }

  if (value.current_version || value.latest_version) {
    const parts = [];
    if (value.current_version) {
      parts.push("current " + value.current_version);
    }
    if (value.latest_version) {
      parts.push("latest " + value.latest_version);
    }
    return "HyperFrames check: " + parts.join(" · ");
  }

  if (value.message) return String(value.message);

  return "HyperFrames update check completed. See Settings for the tested-core compatibility state.";
}

export function renderUpdates(
  next,
  {
    remoteUpdate = null,
    safetyPlan = null,
    hyperframesUpdate = null,
    dismissedVersion = null
  } = {}
) {
  const local = next.release || {};
  const remote = remoteUpdate || null;
  const safety = safetyPlan || next.updates || {};
  const releaseForNotes = remote || local;

  const currentVersion =
    remote?.current_version ||
    local.version ||
    "—";

  const status = remoteState(remote, dismissedVersion);

  $("#update-version").textContent =
    "Version " + currentVersion;

  $("#update-state").textContent = status.text;

  const badge = $("#update-availability-badge");
  badge.textContent = status.badge;
  badge.dataset.tone = status.tone;

  const updateButton = $("#update-apply");
  updateButton.disabled = true;

  if (remote?.update_available) {
    updateButton.textContent =
      safety.apply_supported
        ? "Update now"
        : "Update apply not enabled";
  } else if (remote && !remote.update_available) {
    updateButton.textContent = "Up to date";
  } else {
    updateButton.textContent = "Update now";
  }

  const later = $("#update-later");
  const showLater =
    Boolean(remote?.update_available) &&
    dismissedVersion !== remote.latest_version;
  later.hidden = !showLater;

  const migration = safety.migration || {};
  const activeRuns = safety.active_runs || [];

  const items = [
    {
      label: "Active production",
      state: activeRuns.length ? "Blocked" : "Clear",
      tone: activeRuns.length ? "danger" : "green",
      detail: activeRuns.length
        ? activeRuns.length +
          " production run" +
          (activeRuns.length === 1 ? " is" : "s are") +
          " still active."
        : "No active production would be interrupted."
    },
    {
      label: "Workspace schema",
      state: migration.blocked
        ? "Blocked"
        : migration.needed
          ? "Migration"
          : "Compatible",
      tone: migration.blocked
        ? "danger"
        : migration.needed
          ? "amber"
          : "green",
      detail: migration.blocked
        ? (safety.blockers || [])
            .find(item => item.code === "workspace_migration_blocked")
            ?.message ||
          "No safe migration path is available."
        : migration.needed
          ? "A safe workspace migration is required before this release."
          : "Workspace schema is compatible with this package."
    },
    {
      label: "Workspace backup",
      state: safety.latest_backup ? "Ready" : "Recommended",
      tone: safety.latest_backup ? "green" : "amber",
      detail: safety.latest_backup
        ? "Latest backup: " +
          (formatDate(safety.latest_backup.created_at) || "available")
        : "Create a backup before a future package update."
    },
    {
      label: "AurorA updater",
      state: safety.apply_supported ? "Ready" : "Not enabled",
      tone: safety.apply_supported ? "green" : "neutral",
      detail: safety.apply_supported
        ? "This build has a safe package-apply path."
        : "Check, plan and backup are real. Package apply remains disabled."
    }
  ];

  $("#update-safety-list").innerHTML =
    items.map(safetyItem).join("");

  const blockingPrepare =
    activeRuns.length > 0 ||
    Boolean(migration.blocked);

  $("#update-safety-title").textContent =
    blockingPrepare
      ? "Update preparation is blocked"
      : "Workspace is safe to prepare";

  $("#update-safety-summary").textContent =
    blockingPrepare
      ? "Resolve blockers first"
      : "Local safety checks pass";

  $("#update-backup-state").textContent =
    safety.latest_backup
      ? "Latest: " +
        (formatDate(safety.latest_backup.created_at) || safety.latest_backup.id)
      : "No update backup has been created yet.";

  const notes =
    releaseForNotes.notes ||
    { new: [], fixed: [] };

  $("#update-new").innerHTML =
    (notes.new || [])
      .map(item => "<li>" + escapeHtml(item) + "</li>")
      .join("") ||
    "<li>No new notes.</li>";

  $("#update-fixed").innerHTML =
    (notes.fixed || [])
      .map(item => "<li>" + escapeHtml(item) + "</li>")
      .join("") ||
    "<li>No fixes listed.</li>";

  const hf =
    (next.tools || []).find(item => item.id === "hyperframe") ||
    {};

  $("#hyperframes-current-version").textContent =
    hf.version ||
    (hf.available ? "Detected" : "Not installed");

  $("#hyperframes-tested-version").textContent =
    hf.tested_version || "—";

  $("#hyperframes-compatibility").textContent =
    hf.compatible === true
      ? "Exact tested core"
      : hf.compatible === false
        ? "Different version"
        : hf.available
          ? "Not verified"
          : "Unavailable";

  $("#hyperframes-update-result").textContent =
    hfResultText(hyperframesUpdate);
}
