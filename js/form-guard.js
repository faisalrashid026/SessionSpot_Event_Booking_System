// Independent of the module graph: a failed controller must never turn a demo
// credential form into a native GET. HTML method="dialog" is the final fallback
// even when all scripts are disabled or form.submit() bypasses this listener.
(() => {
  document.addEventListener("submit", (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.hasAttribute("data-demo-form")) return;
    event.preventDefault();
    if (form.dataset.demoReady !== "true") {
      event.stopImmediatePropagation();
      const feedback = form.querySelector("[data-feedback], #quantity-error");
      if (feedback) {
        feedback.textContent = "The demo is not initialized. Reload this page before submitting. Nothing was sent or saved.";
        feedback.classList.remove("success");
      }
    }
  }, true);
})();
