const $ = selector => document.querySelector(selector);

export function renderAgentHandoff(agent, toast) {
  const panel = $("#agent-handoff");
  const message = $("#agent-handoff-message");
  const button = $("#copy-agent-handoff");

  const handoff = agent?.handoff;
  const shouldShow = Boolean(
    handoff &&
    !agent?.bridge_connected &&
    (agent?.claude_installed || agent?.codex_installed)
  );

  panel.hidden = !shouldShow;
  if (!shouldShow) return;

  message.textContent = handoff.message || "";

  button.onclick = async () => {
    try {
      await navigator.clipboard.writeText(handoff.message || "");
      toast("Agent handoff copied.");
    } catch {
      toast("Could not copy the agent handoff.", true);
    }
  };
}
