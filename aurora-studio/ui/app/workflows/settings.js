
function safeLocalStorageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Local UI preferences are optional.
  }
}

export function createSettingsWorkflow({ api, getState, onState, toast }) {
  const diagnostics = {};
  let developerMode =
    safeLocalStorageGet("aurora:developer-mode") === "true";

  function setBusy(button, busy, busyText) {
    if (!button) return;

    if (busy) {
      button.dataset.originalText = button.textContent;
      button.disabled = true;
      button.textContent = busyText || "Working…";
    } else {
      button.disabled = false;
      button.textContent =
        button.dataset.originalText || button.textContent;
      delete button.dataset.originalText;
    }
  }

  async function toolAction(button) {
    const tool = button.dataset.tool;
    const action = button.dataset.toolAction;

    setBusy(
      button,
      true,
      action === "install"
        ? "Installing…"
        : action === "upgrade_check"
          ? "Checking…"
          : "Testing…"
    );

    try {
      const result = await api("/api/tool-action", {
        method: "POST",
        body: JSON.stringify({ tool, action })
      });

      diagnostics[tool] = result.detail || null;
      onState(result.state);

      toast(
        action === "install"
          ? "Tested HyperFrames core installed."
          : action === "upgrade_check"
            ? "HyperFrames update check complete."
            : tool + " check complete."
      );
    } catch (error) {
      toast(error.message, true);
    } finally {
      setBusy(button, false);
    }
  }

  async function agentAction(button) {
    const action = button.dataset.agentAction;
    const target = button.dataset.agentTarget;

    setBusy(
      button,
      true,
      action === "install" ? "Installing…" : "Removing…"
    );

    try {
      const result = await api("/api/agent-action", {
        method: "POST",
        body: JSON.stringify({ action, target })
      });

      onState(result.state);
      toast(
        action === "install"
          ? target + " AurorA integration installed."
          : target + " AurorA integration removed."
      );
    } catch (error) {
      toast(error.message, true);
    } finally {
      setBusy(button, false);
    }
  }

  async function syncSystem(button) {
    setBusy(button, true, "Syncing…");

    try {
      const result = await api("/api/system-sync", {
        method: "POST",
        body: "{}"
      });

      onState(result.state);
      toast("Managed AurorA system synced.");
    } catch (error) {
      toast(error.message, true);
    } finally {
      setBusy(button, false);
    }
  }

  function bind() {
    const settings = document.querySelector(
      "[data-view-panel='settings']"
    );

    if (!settings || settings.dataset.workflowBound === "true") return;
    settings.dataset.workflowBound = "true";

    settings.addEventListener("click", event => {
      const toolButton = event.target.closest("[data-tool-action]");
      if (toolButton) {
        toolAction(toolButton);
        return;
      }

      const agentButton = event.target.closest("[data-agent-action]");
      if (agentButton) {
        agentAction(agentButton);
      }
    });

    document.querySelector("#settings-system-sync")
      ?.addEventListener("click", event => {
        syncSystem(event.currentTarget);
      });

    document.querySelector("#settings-refresh-runtime")
      ?.addEventListener("click", async event => {
        const button = event.currentTarget;
        setBusy(button, true, "Refreshing…");

        try {
          const next = await api("/api/state");
          onState(next);
          toast("Runtime status refreshed.");
        } catch (error) {
          toast(error.message, true);
        } finally {
          setBusy(button, false);
        }
      });

    document.querySelector("#settings-developer-mode")
      ?.addEventListener("change", event => {
        developerMode = Boolean(event.target.checked);
        safeLocalStorageSet(
          "aurora:developer-mode",
          developerMode ? "true" : "false"
        );
        onState(getState());
      });
  }

  return {
    bind,
    diagnostics,
    get developerMode() {
      return developerMode;
    }
  };
}
