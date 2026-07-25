/* =========================================================
   MEDIA-PROTECT.JS
   Global protection against right-click and dragging on media elements
   ========================================================= */
(function () {
  const isMediaElement = (el) => {
    if (!el || !(el instanceof HTMLElement)) return false;
    const tagName = el.tagName.toLowerCase();
    if (['img', 'picture', 'video', 'canvas', 'svg'].includes(tagName)) return true;
    if (el.closest('picture, figure, .gp-card, .gp-lightbox, .stills-project-images')) return true;
    return false;
  };

  // Prevent context menu (right click) on media elements
  document.addEventListener('contextmenu', (e) => {
    if (isMediaElement(e.target)) {
      e.preventDefault();
    }
  }, { capture: true });

  // Prevent dragging images
  document.addEventListener('dragstart', (e) => {
    if (isMediaElement(e.target)) {
      e.preventDefault();
    }
  }, { capture: true });
})();
