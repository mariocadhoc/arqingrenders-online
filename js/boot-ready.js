(function () {
  const root = document.documentElement;

  const reveal = window.__bootReadyReveal || (() => {
    if (root.classList.contains('js-ready')) return;
    root.classList.add('js-ready');
    root.classList.remove('js-pending');
  });

  const scheduleReveal = window.__bootReadySchedule || (() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(reveal);
    });
  });

  scheduleReveal();

  window.addEventListener('pageshow', reveal);
  window.setTimeout(reveal, 2500);
})();
