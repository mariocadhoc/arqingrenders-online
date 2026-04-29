(function () {
    const root = document.documentElement;
    let revealScheduled = false;

    const reveal = () => {
        if (root.classList.contains('js-ready')) return;
        root.classList.add('js-ready');
        root.classList.remove('js-pending');
    };

    const scheduleReveal = () => {
        if (revealScheduled) return;
        revealScheduled = true;
        requestAnimationFrame(() => {
            requestAnimationFrame(reveal);
        });
    };

    root.classList.add('js-pending');
    window.__bootReadyReveal = reveal;
    window.__bootReadySchedule = scheduleReveal;

    if (document.querySelector('[data-js-reveal]')) {
        scheduleReveal();
        return;
    }

    const observer = new MutationObserver(() => {
        if (!document.querySelector('[data-js-reveal]')) return;
        observer.disconnect();
        scheduleReveal();
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
})();
