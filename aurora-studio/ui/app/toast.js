export function createToast({
  selector = "#toast",
  duration = 2800
} = {}) {
  let timer = null;

  return function toast(message, error = false) {
    const node = document.querySelector(selector);
    if (!node) return;

    node.textContent = String(message || "");
    node.classList.toggle("error", Boolean(error));
    node.classList.add("show");

    clearTimeout(timer);
    timer = setTimeout(() => {
      node.classList.remove("show");
    }, duration);
  };
}
