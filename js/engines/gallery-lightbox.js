import { openGalleryLightbox, warmImage, warmSources } from './gallery-modal-lightbox.js';

document.addEventListener('DOMContentLoaded', () => {
  function queueIdle(task) {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(task, { timeout: 1200 });
      return;
    }
    window.setTimeout(task, 120);
  }

  function warmCardsMedia(cardsData) {
    cardsData.forEach((card) => {
      if (!card || card.isTitle) return;
      warmImage(card.img);
      warmSources((card.children || []).map((child) => child.thumbSrc));
    });
  }

  // --- HOVER MINI-THUMBS LOGIC ---
  const thGlowInt = 0.5;
  const HOVER_THUMB_SIZE = 96;
  const HOVER_THUMB_GAP = 12;
  const HOVER_THUMB_OFFSET = 16;
  const HOVER_BOTTOM_MAX_COLUMNS = 3;
  const HOVER_STACK_CLASSES = [
    'gp-thumb-stack-left',
    'gp-thumb-stack-bottom',
    'gp-thumb-stack-right'
  ];

  function gp_getHoverColIndex(el, item) {
    if (typeof item.colIndex === 'number') return item.colIndex;

    const attrCol = Number.parseInt(el.getAttribute('data-col') || '', 10);
    return Number.isNaN(attrCol) ? 1 : attrCol;
  }

  function gp_getHoverLayoutClass(colIndex, totalCols) {
    if (totalCols <= 1) return 'gp-thumb-stack-bottom';
    const isLeftmost = colIndex <= 0;
    const isRightmost = colIndex >= totalCols - 1;
    if (totalCols <= 2) return isLeftmost ? 'gp-thumb-stack-right' : 'gp-thumb-stack-left';
    if (isLeftmost) return 'gp-thumb-stack-right';
    if (isRightmost) return 'gp-thumb-stack-left';
    return 'gp-thumb-stack-bottom';
  }

  function gp_applyThumbContainerLayout(container, colIndex, childCount) {
    const totalCols = window.gp_activeLayoutColumns || 2;
    const layoutClass = gp_getHoverLayoutClass(colIndex, totalCols);

    container.classList.remove(...HOVER_STACK_CLASSES);
    container.classList.add(layoutClass);
    container.style.removeProperty('width');
    container.style.setProperty('--gp-thumb-size', `${HOVER_THUMB_SIZE}px`);
    container.style.setProperty('--gp-thumb-gap', `${HOVER_THUMB_GAP}px`);
    container.style.setProperty('--gp-thumb-offset', `${HOVER_THUMB_OFFSET}px`);

    if (layoutClass === 'gp-thumb-stack-bottom') {
      const cols = Math.min(childCount, HOVER_BOTTOM_MAX_COLUMNS);
      const width = (cols * HOVER_THUMB_SIZE) + (Math.max(cols - 1, 0) * HOVER_THUMB_GAP);
      container.style.width = `${width}px`;
    }

    return layoutClass;
  }

  function buildThumbContainer(cardData, colIndex) {
    const container = document.createElement('div');
    container.className = 'gp-thumb-container';
    const layoutClass = gp_applyThumbContainerLayout(container, colIndex, cardData.children.length);

    cardData.children.forEach((child, index) => {
      const img = document.createElement('img');
      img.className = 'gp-mini-thumb';
      img.src = child.thumbSrc;
      img.alt = child.alt || `${cardData.label} detail ${index + 1}`;
      img.decoding = 'async';
      img.fetchPriority = 'low';

      if (window.gp_buildGlow) {
        img.style.boxShadow = window.gp_buildGlow(thGlowInt, true);
      }

      container.appendChild(img);
    });

    return { container, layoutClass };
  }

  window.addEventListener('gpCardHoverEnter', (event) => {
    const { el, item } = event.detail;
    const cardData = item.cardData;

    if (!cardData.children || cardData.children.length === 0) return;

    const colIndex = gp_getHoverColIndex(el, item);
    const existingContainer = el.querySelector('.gp-thumb-container');
    if (existingContainer) existingContainer.remove();

    const { container, layoutClass } = buildThumbContainer(cardData, colIndex);
    el.appendChild(container);
    warmSources(cardData.children.map((child) => child.thumbSrc));

    if (window.gsap) {
      const originMap = {
        'gp-thumb-stack-left': 'right center',
        'gp-thumb-stack-bottom': 'top center',
        'gp-thumb-stack-right': 'left center'
      };
      const transformOrigin = originMap[layoutClass] || 'center center';

      window.gsap.fromTo(
        container.querySelectorAll('.gp-mini-thumb'),
        { scale: 0, opacity: 0, transformOrigin },
        { scale: 1, opacity: 1, duration: 0.4, stagger: 0.08, ease: 'back.out(1.5)', overwrite: true }
      );
      return;
    }

    container.querySelectorAll('.gp-mini-thumb').forEach((img) => {
      img.style.opacity = 1;
    });
  });

  window.addEventListener('gpCardHoverLeave', (event) => {
    const { el } = event.detail;
    const container = el.querySelector('.gp-thumb-container');
    if (!container) return;

    if (window.gsap) {
      window.gsap.to(container.querySelectorAll('.gp-mini-thumb'), {
        scale: 0.5,
        opacity: 0,
        duration: 0.25,
        stagger: 0.04,
        ease: 'power2.in',
        onComplete: () => {
          if (container.parentNode) container.remove();
        }
      });
      return;
    }

    container.remove();
  });

  // --- STILL GALLERY ADAPTER FOR THE SHARED MODAL ---
  const gpCanvas = document.getElementById('gp-canvas');
  if (gpCanvas) {
    gpCanvas.addEventListener('click', (event) => {
      const targetCard = event.target.closest('.gp-card:not(.gp-title-card)');
      if (!targetCard) return;

      const cardId = Number.parseInt(targetCard.getAttribute('data-id'), 10);
      const cardData = Array.isArray(window.gp_cardsData)
        ? window.gp_cardsData.find((card) => card.id === cardId)
        : null;
      const imgEl = targetCard.querySelector('img');

      if (!cardData || !imgEl) return;

      const thumbContainer = targetCard.querySelector('.gp-thumb-container');
      const mediaItems = [
        { thumbSrc: cardData.img, fullSrc: cardData.full || cardData.img, alt: `${cardData.label} image 1` },
        ...(cardData.children || [])
      ].filter((item) => item && item.fullSrc);

      openGalleryLightbox({
        mediaItems,
        sourceRect: imgEl.getBoundingClientRect(),
        onOpen: () => {
          if (thumbContainer) thumbContainer.style.display = 'none';
        },
        onClose: () => {
          if (thumbContainer) thumbContainer.style.display = '';
        }
      });
    });
  }

  window.addEventListener('gpCardsDataReady', (event) => {
    const cardsData = Array.isArray(event.detail?.cardsData) ? event.detail.cardsData : [];
    queueIdle(() => {
      warmCardsMedia(cardsData);
    });
  });

  queueIdle(() => {
    const cardsData = Array.isArray(window.gp_cardsData) ? window.gp_cardsData : [];
    if (cardsData.length) {
      warmCardsMedia(cardsData);
    }
  });
});
