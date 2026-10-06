function focusable(container) {
  return [
    ...container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ];
}

export function bindDialog(dialog, {
  onOpen = null,
  onClose = null
} = {}) {
  if (!(dialog instanceof HTMLDialogElement)) {
    throw new Error("AurorA dialog binding requires a <dialog> element.");
  }

  let previousFocus = null;

  function open() {
    if (dialog.open) return;
    previousFocus = document.activeElement;
    dialog.showModal();
    dialog.dataset.state = "open";
    onOpen?.();

    requestAnimationFrame(() => {
      focusable(dialog)[0]?.focus();
    });
  }

  function close(returnValue = "") {
    if (!dialog.open) return;
    dialog.dataset.state = "closing";

    const finish = () => {
      dialog.close(returnValue);
      dialog.dataset.state = "closed";
      previousFocus?.focus?.();
      onClose?.(returnValue);
    };

    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }

    setTimeout(finish, 160);
  }

  dialog.addEventListener("cancel", event => {
    event.preventDefault();
    close("cancel");
  });

  dialog.addEventListener("click", event => {
    if (event.target === dialog && dialog.dataset.dismissible !== "false") {
      close("backdrop");
    }
  });

  dialog.querySelectorAll("[data-dialog-close]").forEach(button => {
    button.addEventListener("click", () => close(button.dataset.dialogClose || ""));
  });

  return { open, close };
}
