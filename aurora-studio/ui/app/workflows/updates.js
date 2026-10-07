function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Dismissing an update is only a local UI preference.
  }
}

export function createUpdateWorkflow({
  api,
  getState,
  onState,
  toast
}) {
  let remoteUpdate = null;
  let safetyPlan = null;
  let hyperframesUpdate = null;
  let dismissedVersion =
    safeGet("aurora:update-dismissed-version");

  function busy(button, active, label) {
    if (!button) return;

    if (active) {
      button.dataset.originalText = button.textContent;
      button.disabled = true;
      button.textContent = label || "Working…";
    } else {
      button.disabled = false;
      button.textContent =
        button.dataset.originalText ||
        button.textContent;
      delete button.dataset.originalText;
    }
  }

  async function checkAurora(button) {
    busy(button, true, "Checking…");

    try {
      const result = await api("/api/update-check", {
        method: "POST",
        body: "{}"
      });

      remoteUpdate = result.update || null;

      const planResult = await api("/api/update-plan", {
        method: "POST",
        body: JSON.stringify({
          target_workspace_schema_version:
            remoteUpdate?.workspace_schema_version || null
        })
      });

      safetyPlan = planResult.plan || null;
      onState(getState());

      toast(
        remoteUpdate?.update_available
          ? "AurorA update metadata found."
          : "AurorA is up to date."
      );
    } catch (error) {
      toast(error.message, true);
    } finally {
      busy(button, false);
    }
  }

  async function backup(button) {
    busy(button, true, "Backing up…");

    try {
      const result = await api("/api/update-backup", {
        method: "POST",
        body: "{}"
      });

      safetyPlan =
        result.state?.updates ||
        safetyPlan;

      onState(result.state || getState());
      toast("AurorA workspace backup created.");
    } catch (error) {
      toast(error.message, true);
    } finally {
      busy(button, false);
    }
  }

  async function checkHyperframes(button) {
    busy(button, true, "Checking…");

    try {
      const result = await api("/api/tool-action", {
        method: "POST",
        body: JSON.stringify({
          tool: "hyperframe",
          action: "upgrade_check"
        })
      });

      hyperframesUpdate = result.detail || null;
      onState(result.state || getState());
      toast("HyperFrames update check complete.");
    } catch (error) {
      toast(error.message, true);
    } finally {
      busy(button, false);
    }
  }

  function maybeLater() {
    if (!remoteUpdate?.latest_version) return;

    dismissedVersion = remoteUpdate.latest_version;
    safeSet(
      "aurora:update-dismissed-version",
      dismissedVersion
    );
    onState(getState());
    toast("Update reminder dismissed for this version.");
  }

  function bind() {
    document
      .querySelector("#update-check")
      ?.addEventListener("click", event => {
        checkAurora(event.currentTarget);
      });

    document
      .querySelector("#update-backup")
      ?.addEventListener("click", event => {
        backup(event.currentTarget);
      });

    document
      .querySelector("#hyperframes-update-check")
      ?.addEventListener("click", event => {
        checkHyperframes(event.currentTarget);
      });

    document
      .querySelector("#update-later")
      ?.addEventListener("click", maybeLater);
  }

  return {
    bind,
    get remoteUpdate() {
      return remoteUpdate;
    },
    get safetyPlan() {
      return safetyPlan;
    },
    get hyperframesUpdate() {
      return hyperframesUpdate;
    },
    get dismissedVersion() {
      return dismissedVersion;
    }
  };
}
