const $ = selector => document.querySelector(selector);

export function renderAgentHandoff(agent, toast) {
  const panel = $("#agent-handoff");
  const message = $("#agent-handoff-message");
  const button = $("#copy-agent-handoff");

  const handoff = agent?.handoff;
  const shouldShow = Boolean(
    handoff &&
    !agent?.bridge_connected
  );

  panel.hidden = !shouldShow;
  if (!shouldShow) return;

  message.textContent = handoff.message || "";

  button.onclick = async () => {
    const value = handoff.message || "";

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const field = document.createElement("textarea");
        field.value = value;
        field.setAttribute("readonly", "");
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.append(field);
        field.select();

        if (!document.execCommand("copy")) {
          throw new Error("copy_failed");
        }

        field.remove();
      }

      toast("Agent handoff copied.");
    } catch {
      toast("Could not copy the agent handoff.", true);
    }
  };
}
