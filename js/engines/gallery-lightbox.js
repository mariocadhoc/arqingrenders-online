/* =========================================
   GALLERY-LIGHTBOX.JS
   Hover Interactions & Lightbox Modal
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
  const imageCache = new Map();
  const hasGsap = () => typeof window.gsap !== 'undefined';

  function applyStyleTargets(targets, styles) {
    const list = targets instanceof NodeList || Array.isArray(targets) ? Array.from(targets) : [targets];
    list.filter(Boolean).forEach((target) => {
      Object.entries(styles).forEach(([key, value]) => {
        if (key === 'onComplete' || key === 'duration' || key === 'delay' || key === 'ease' || key === 'stagger') {
          return;
        }
        target.style[key] = typeof value === 'number' && key !== 'opacity' ? `${value}px` : String(value);
      });
    });
  }

  function queueIdle(task) {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(task, { timeout: 1200 });
      return;
    }
    window.setTimeout(task, 120);
  }

  function warmImage(src) {
    if (!src) return Promise.resolve(null);
    if (imageCache.has(src)) return imageCache.get(src);

    const promise = new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.src = src;

      const done = () => {
        if (typeof img.decode === 'function') {
          img.decode().catch(() => { }).finally(() => resolve(img));
          return;
        }
        resolve(img);
      };

      if (img.complete) {
        done();
        return;
      }

      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', () => resolve(null), { once: true });
    });

    imageCache.set(src, promise);
    return promise;
  }

  function warmSources(sources) {
    sources.filter(Boolean).forEach((src) => {
      queueIdle(() => {
        warmImage(src);
      });
    });
  }

  function warmCardsMedia(cardsData) {
    cardsData.forEach((card) => {
      if (!card || card.isTitle) return;
      warmImage(card.img);
      warmSources((card.children || []).map((child) => child.thumbSrc));
    });
  }

  // --- 1. HOVER MINI-THUMBS LOGIC ---
  const thGlowInt = 0.5; // Base glow depth for thumbs
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
    // Children always expand toward the center:
    // - leftmost column (0) → expand right
    // - rightmost column → expand left
    // - middle columns (3-col layout) → expand bottom
    if (totalCols <= 1) return 'gp-thumb-stack-bottom';
    const isLeftmost = colIndex <= 0;
    const isRightmost = colIndex >= totalCols - 1;
    if (totalCols <= 2) {
      // With 2 columns there is no true middle: left→right, right→left
      return isLeftmost ? 'gp-thumb-stack-right' : 'gp-thumb-stack-left';
    }
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

  window.addEventListener('gpCardHoverEnter', (e) => {
    const { el, item } = e.detail;
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
      const tOrigin = originMap[layoutClass] || 'center center';

      gsap.fromTo(
        container.querySelectorAll('.gp-mini-thumb'),
        { scale: 0, opacity: 0, transformOrigin: tOrigin },
        { scale: 1, opacity: 1, duration: 0.4, stagger: 0.08, ease: 'back.out(1.5)', overwrite: true }
      );
    } else {
      container.querySelectorAll('.gp-mini-thumb').forEach(img => {
        img.style.opacity = 1;
      });
    }
  });

  window.addEventListener('gpCardHoverLeave', (e) => {
    const { el } = e.detail;
    const container = el.querySelector('.gp-thumb-container');
    if (container) {
      if (window.gsap) {
        gsap.to(container.querySelectorAll('.gp-mini-thumb'), {
          scale: 0.5, opacity: 0, duration: 0.25, stagger: 0.04, ease: 'power2.in',
          onComplete: () => {
            if (container.parentNode) container.remove();
          }
        });
      } else {
        container.remove();
      }
    }
  });


  // --- 2. LIGHTBOX MODAL LOGIC ---
  const DOM = {};
  let isLightboxActive = false;
  let activeCardEl = null;
  let activeCardRect = null;
  let currentMainSrc = null;
  const zoomState = {
    scale: 1,
    maxScale: 1,
    baseWidth: 0,
    baseHeight: 0,
    panX: 0,
    panY: 0,
    startPanX: 0,
    startPanY: 0,
    startClientX: 0,
    startClientY: 0,
    isDragging: false,
    pointerDown: false,
    moved: false,
    skipClick: false
  };

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function getMagnifierIcon() {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"></circle>
        <path d="M16 16L21 21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
        <path d="M11 8v6M8 11h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
      </svg>
    `;
  }

  function getTargetViewportState() {
    const isCompact = window.innerWidth <= 780;
    const sidebarReserve = isCompact ? 0 : Math.min(146, window.innerWidth * 0.11);
    const horizontalPadding = isCompact ? 18 : 30;
    const verticalPadding = isCompact ? 152 : 72;
    const width = Math.max(
      260,
      Math.min(window.innerWidth - sidebarReserve - (horizontalPadding * 2), window.innerWidth * (isCompact ? 0.94 : 0.82))
    );
    const height = Math.max(
      180,
      Math.min(window.innerHeight - verticalPadding, window.innerHeight * (isCompact ? 0.7 : 0.9))
    );

    return {
      left: isCompact ? (window.innerWidth / 2) : ((window.innerWidth - sidebarReserve) / 2),
      top: isCompact ? (window.innerHeight * 0.42) : (window.innerHeight / 2),
      width,
      height
    };
  }

  function setViewportToRect(rect) {
    const safeRect = rect || {
      left: window.innerWidth / 2,
      top: window.innerHeight / 2,
      width: Math.min(window.innerWidth * 0.4, 420),
      height: Math.min(window.innerHeight * 0.4, 320)
    };

    const centerX = safeRect.left + (safeRect.width / 2);
    const centerY = safeRect.top + (safeRect.height / 2);

    applyStyleTargets(DOM.viewport, {
      left: centerX,
      top: centerY,
      width: safeRect.width,
      height: safeRect.height,
      opacity: 1
    });
  }

  function getContainedMediaSize(viewportWidth, viewportHeight, naturalWidth, naturalHeight) {
    const fitRatio = Math.min(viewportWidth / naturalWidth, viewportHeight / naturalHeight, 1);
    return {
      width: Math.max(1, Math.round(naturalWidth * fitRatio)),
      height: Math.max(1, Math.round(naturalHeight * fitRatio)),
      maxScale: fitRatio < 1 ? Math.max(1, Number((1 / fitRatio).toFixed(3))) : 1
    };
  }

  function setViewportTarget(animated = true) {
    const target = getTargetViewportState();
    const naturalWidth = DOM.mainImg.naturalWidth || DOM.mainMedia.offsetWidth || target.width;
    const naturalHeight = DOM.mainImg.naturalHeight || DOM.mainMedia.offsetHeight || target.height;
    const mediaTarget = getContainedMediaSize(target.width, target.height, naturalWidth, naturalHeight);

    if (!animated) {
      applyStyleTargets(DOM.viewport, target);
      applyStyleTargets(DOM.mainMedia, { width: mediaTarget.width, height: mediaTarget.height });
      measureMainMedia();
      return;
    }

    if (!hasGsap()) {
      applyStyleTargets(DOM.viewport, target);
      applyStyleTargets(DOM.mainMedia, { width: mediaTarget.width, height: mediaTarget.height });
      measureMainMedia();
      return;
    }

    window.gsap.to(DOM.viewport, {
      ...target,
      duration: 0.56,
      ease: 'expo.inOut',
      onComplete: measureMainMedia
    });

    window.gsap.to(DOM.mainMedia, {
      width: mediaTarget.width,
      height: mediaTarget.height,
      duration: 0.56,
      ease: 'expo.inOut',
      onComplete: measureMainMedia
    });
  }

  function clampPan() {
    const maxX = Math.max(0, ((zoomState.baseWidth * zoomState.scale) - DOM.viewport.clientWidth) / 2);
    const maxY = Math.max(0, ((zoomState.baseHeight * zoomState.scale) - DOM.viewport.clientHeight) / 2);
    zoomState.panX = clamp(zoomState.panX, -maxX, maxX);
    zoomState.panY = clamp(zoomState.panY, -maxY, maxY);
  }

  function updateZoomHintState() {
    const canZoom = zoomState.maxScale > 1.02;
    DOM.viewport.classList.toggle('gp-can-zoom', canZoom);
    DOM.zoomHint.hidden = !canZoom;
    DOM.zoomHintText.textContent = zoomState.scale > 1.02 ? 'Click to fit' : 'Click to zoom';
  }

  function applyZoom() {
    clampPan();
    DOM.mainMedia.style.width = `${Math.max(1, Math.round(zoomState.baseWidth * zoomState.scale))}px`;
    DOM.mainMedia.style.height = `${Math.max(1, Math.round(zoomState.baseHeight * zoomState.scale))}px`;
    DOM.mainMedia.style.transform = `translate(${zoomState.panX}px, ${zoomState.panY}px)`;
    DOM.viewport.classList.toggle('gp-is-zoomed', zoomState.scale > 1.02);
    DOM.viewport.classList.toggle('gp-is-dragging', zoomState.isDragging);
    updateZoomHintState();
  }

  function resetZoom() {
    zoomState.scale = 1;
    zoomState.panX = 0;
    zoomState.panY = 0;
    zoomState.isDragging = false;
    applyZoom();
  }

  function zoomTo(scale, clientX, clientY) {
    const nextScale = clamp(scale, 1, zoomState.maxScale || 1);
    if (Math.abs(nextScale - zoomState.scale) < 0.001) return;

    const prevScale = zoomState.scale;
    const viewportRect = DOM.viewport.getBoundingClientRect();
    const originX = Number.isFinite(clientX) ? clientX - viewportRect.left - (viewportRect.width / 2) : 0;
    const originY = Number.isFinite(clientY) ? clientY - viewportRect.top - (viewportRect.height / 2) : 0;
    const delta = nextScale / prevScale;

    zoomState.panX -= originX * (delta - 1);
    zoomState.panY -= originY * (delta - 1);
    zoomState.scale = nextScale;
    applyZoom();
  }

  function handleViewportPointerDown(event) {
    if (!isLightboxActive || zoomState.maxScale <= 1.02) return;
    zoomState.pointerDown = true;
    zoomState.moved = false;
    zoomState.skipClick = false;
    zoomState.startPanX = zoomState.panX;
    zoomState.startPanY = zoomState.panY;
    zoomState.startClientX = event.clientX;
    zoomState.startClientY = event.clientY;
    zoomState.isDragging = zoomState.scale > 1.02;
    if (zoomState.isDragging) {
      DOM.viewport.setPointerCapture?.(event.pointerId);
    }
    applyZoom();
  }

  function handleViewportPointerMove(event) {
    if (!zoomState.pointerDown) return;
    const deltaX = event.clientX - zoomState.startClientX;
    const deltaY = event.clientY - zoomState.startClientY;
    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      zoomState.moved = true;
    }
    if (!zoomState.isDragging || !zoomState.moved) return;
    zoomState.panX = zoomState.startPanX + deltaX;
    zoomState.panY = zoomState.startPanY + deltaY;
    applyZoom();
  }

  function handleViewportPointerUp(event) {
    if (!zoomState.pointerDown) return;
    zoomState.pointerDown = false;
    zoomState.isDragging = false;
    zoomState.skipClick = zoomState.moved;
    DOM.viewport.releasePointerCapture?.(event.pointerId);
    applyZoom();
    zoomState.moved = false;
  }

  function handleViewportClick(event) {
    if (!isLightboxActive || zoomState.maxScale <= 1.02) return;
    if (zoomState.skipClick) {
      zoomState.skipClick = false;
      return;
    }
    if (zoomState.scale > 1.02) {
      resetZoom();
      return;
    }
    zoomTo(zoomState.maxScale, event.clientX, event.clientY);
  }

  function measureMainMedia() {
    const viewportWidth = DOM.viewport.clientWidth;
    const viewportHeight = DOM.viewport.clientHeight;
    const naturalWidth = DOM.mainImg.naturalWidth || viewportWidth;
    const naturalHeight = DOM.mainImg.naturalHeight || viewportHeight;

    if (!viewportWidth || !viewportHeight || !naturalWidth || !naturalHeight) return;

    const mediaSize = getContainedMediaSize(viewportWidth, viewportHeight, naturalWidth, naturalHeight);
    zoomState.baseWidth = mediaSize.width;
    zoomState.baseHeight = mediaSize.height;
    zoomState.maxScale = mediaSize.maxScale;
    resetZoom();
  }

  function primeMainImageDimensions(width, height) {
    DOM.mainMedia.style.width = `${Math.max(1, Math.round(width))}px`;
    DOM.mainMedia.style.height = `${Math.max(1, Math.round(height))}px`;
  }

  function syncActiveThumb(btnEl) {
    DOM.sidebar.querySelectorAll('.gp-lightbox-thumb-btn').forEach(btn => btn.classList.remove('gp-active-thumb'));
    if (btnEl) btnEl.classList.add('gp-active-thumb');
  }

  function replaceMainImage(newSrc, altText = 'Project Image') {
    warmImage(newSrc).finally(() => {
      const previousImg = DOM.mainImg;
      const nextImg = previousImg.cloneNode(false);
      nextImg.decoding = 'async';
      nextImg.fetchPriority = 'high';
      nextImg.src = newSrc;
      nextImg.alt = altText;
      nextImg.style.opacity = '0';
      DOM.mainMedia.appendChild(nextImg);

      const finalizeSwap = () => {
        currentMainSrc = newSrc;
        DOM.mainImg = nextImg;
        measureMainMedia();

        if (hasGsap()) {
          window.gsap.to(previousImg, {
            opacity: 0,
            duration: 0.22,
            ease: 'power2.inOut',
            onComplete: () => previousImg.remove()
          });
          window.gsap.to(nextImg, {
            opacity: 1,
            duration: 0.22,
            ease: 'power2.inOut'
          });
        } else {
          previousImg.remove();
          nextImg.style.opacity = '1';
        }
      };

      if (nextImg.complete) {
        finalizeSwap();
      } else {
        nextImg.addEventListener('load', finalizeSwap, { once: true });
        nextImg.addEventListener('error', finalizeSwap, { once: true });
      }
    });
  }

  // Init DOM structure once
  function initLightboxDOM() {
    const lb = document.createElement('div');
    lb.className = 'gp-lightbox';
    lb.innerHTML = `
      <div class="gp-lightbox-bg"></div>
      <button class="gp-lightbox-close" type="button" aria-label="Close lightbox">✕</button>
      <div class="gp-lightbox-main-wrapper">
        <div class="gp-lightbox-main-viewport">
          <div class="gp-lightbox-main-media">
            <img class="gp-lightbox-main-img" src="" alt="Project Image" />
          </div>
          <div class="gp-lightbox-zoom-hint" hidden>
            ${getMagnifierIcon()}
            <span>Click to zoom</span>
          </div>
        </div>
      </div>
      <div class="gp-lightbox-sidebar"></div>
    `;
    document.body.appendChild(lb);

    DOM.lb = lb;
    DOM.bg = lb.querySelector('.gp-lightbox-bg');
    DOM.closeBtn = lb.querySelector('.gp-lightbox-close');
    DOM.viewport = lb.querySelector('.gp-lightbox-main-viewport');
    DOM.mainMedia = lb.querySelector('.gp-lightbox-main-media');
    DOM.mainImg = lb.querySelector('.gp-lightbox-main-img');
    DOM.zoomHint = lb.querySelector('.gp-lightbox-zoom-hint');
    DOM.zoomHintText = DOM.zoomHint.querySelector('span');
    DOM.sidebar = lb.querySelector('.gp-lightbox-sidebar');

    DOM.closeBtn.addEventListener('click', closeLightbox);
    DOM.bg.addEventListener('click', closeLightbox);
    DOM.lb.addEventListener('click', (event) => {
      const clickedInsideViewport = event.target.closest('.gp-lightbox-main-viewport');
      const clickedInsideSidebar = event.target.closest('.gp-lightbox-sidebar');
      const clickedCloseButton = event.target.closest('.gp-lightbox-close');
      if (clickedInsideViewport || clickedInsideSidebar || clickedCloseButton) return;
      closeLightbox();
    });
    DOM.viewport.addEventListener('pointerdown', handleViewportPointerDown);
    DOM.viewport.addEventListener('pointermove', handleViewportPointerMove);
    DOM.viewport.addEventListener('pointerup', handleViewportPointerUp);
    DOM.viewport.addEventListener('pointercancel', handleViewportPointerUp);
    DOM.viewport.addEventListener('pointerleave', handleViewportPointerUp);
    DOM.viewport.addEventListener('click', handleViewportClick);
  }

  initLightboxDOM();

  window.addEventListener('resize', () => {
    if (!isLightboxActive) return;
    setViewportTarget(false);
  });

  document.addEventListener('keydown', (event) => {
    if (!isLightboxActive) return;
    if (event.key === 'Escape') {
      closeLightbox();
    }
  });

  // Listen for clicks on the gallery canvas to open modal
  const gp_canvas = document.getElementById('gp-canvas');
  if (gp_canvas) {
    gp_canvas.addEventListener('click', (e) => {
      const targetCard = e.target.closest('.gp-card:not(.gp-title-card)');
      if (!targetCard || isLightboxActive) return;
      openLightbox(targetCard);
    });
  }

  function openLightbox(cardEl) {
    const cardId = parseInt(cardEl.getAttribute('data-id'), 10);
    const cardData = window.gp_cardsData.find(c => c.id === cardId);
    const imgEl = cardEl.querySelector('img');

    if (!cardData || !imgEl) return;

    activeCardEl = cardEl;
    activeCardRect = imgEl.getBoundingClientRect();
    isLightboxActive = true;
    document.body.style.overflow = 'hidden';

    const thumbCont = cardEl.querySelector('.gp-thumb-container');
    if (thumbCont) thumbCont.style.display = 'none';

    const mediaItems = [
      { thumbSrc: cardData.img, fullSrc: cardData.full || cardData.img, alt: `${cardData.label} image 1` },
      ...(cardData.children || [])
    ].filter((item) => item && item.fullSrc);
    if (!mediaItems.length) return;
    warmSources(mediaItems.map((item) => item.thumbSrc));
    warmSources(mediaItems.map((item) => item.fullSrc));

    DOM.lb.classList.add('gp-lightbox-active');
    setViewportToRect(activeCardRect);
    primeMainImageDimensions(activeCardRect.width, activeCardRect.height);

    DOM.sidebar.innerHTML = '';
    mediaItems.forEach((item, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'gp-lightbox-thumb-btn' + (idx === 0 ? ' gp-active-thumb' : '');
      btn.setAttribute('aria-label', `Open image ${idx + 1}`);
      const img = document.createElement('img');
      img.src = item.thumbSrc || item.fullSrc;
      img.alt = item.alt || `${cardData.label} image ${idx + 1}`;
      img.decoding = 'async';
      img.loading = 'eager';
      btn.appendChild(img);
      btn.addEventListener('click', () => {
        if (currentMainSrc === item.fullSrc) return;
        syncActiveThumb(btn);
        replaceMainImage(item.fullSrc, item.alt || `${cardData.label} image ${idx + 1}`);
      });
      DOM.sidebar.appendChild(btn);
    });

    DOM.mainImg.src = mediaItems[0].fullSrc;
    DOM.mainImg.alt = mediaItems[0].alt || `${cardData.label} image 1`;
    DOM.mainImg.decoding = 'async';
    DOM.mainImg.fetchPriority = 'high';
    DOM.mainImg.style.opacity = '1';
    currentMainSrc = mediaItems[0].fullSrc;

    if (hasGsap()) {
      window.gsap.to(DOM.bg, { opacity: 1, duration: 0.6, ease: 'power2.out' });
      window.gsap.to(DOM.closeBtn, { opacity: 1, duration: 0.6, delay: 0.28, ease: 'power2.out' });
    } else {
      applyStyleTargets([DOM.bg, DOM.closeBtn], { opacity: 1 });
    }
    if (DOM.mainImg.complete) {
      setViewportTarget(true);
    } else {
      DOM.mainImg.addEventListener('load', () => setViewportTarget(true), { once: true });
      DOM.mainImg.addEventListener('error', () => setViewportTarget(true), { once: true });
    }

    if (hasGsap()) {
      window.gsap.fromTo(
        DOM.sidebar.querySelectorAll('.gp-lightbox-thumb-btn'),
        { x: window.innerWidth <= 780 ? 0 : 26, y: window.innerWidth <= 780 ? 18 : 0, opacity: 0 },
        { x: 0, y: 0, opacity: 1, duration: 0.55, stagger: 0.07, ease: 'power3.out', delay: 0.42 }
      );
    } else {
      applyStyleTargets(DOM.sidebar.querySelectorAll('.gp-lightbox-thumb-btn'), { opacity: 1 });
    }
  }

  function closeLightbox() {
    if (!isLightboxActive) return;

    document.body.style.overflow = '';
    resetZoom();

    if (hasGsap()) {
      window.gsap.to(DOM.bg, { opacity: 0, duration: 0.45, ease: 'power2.out' });
      window.gsap.to(DOM.closeBtn, { opacity: 0, duration: 0.28 });
      window.gsap.to(DOM.sidebar.querySelectorAll('.gp-lightbox-thumb-btn'), {
        x: window.innerWidth <= 780 ? 0 : 22,
        y: window.innerWidth <= 780 ? 14 : 0,
        opacity: 0,
        duration: 0.28,
        stagger: -0.04,
        ease: 'power2.in'
      });
    } else {
      applyStyleTargets([DOM.bg, DOM.closeBtn], { opacity: 0 });
      applyStyleTargets(DOM.sidebar.querySelectorAll('.gp-lightbox-thumb-btn'), { opacity: 0 });
    }

    if (activeCardRect) {
      const targetRect = activeCardRect;
      if (hasGsap()) {
        window.gsap.to(DOM.viewport, {
          left: targetRect.left + (targetRect.width / 2),
          top: targetRect.top + (targetRect.height / 2),
          width: targetRect.width,
          height: targetRect.height,
          duration: 0.82,
          ease: 'power3.inOut',
          onComplete: resetModalState
        });
        window.gsap.to(DOM.mainMedia, {
          width: targetRect.width,
          height: targetRect.height,
          duration: 0.82,
          ease: 'power3.inOut'
        });
      } else {
        applyStyleTargets(DOM.viewport, {
          left: targetRect.left + (targetRect.width / 2),
          top: targetRect.top + (targetRect.height / 2),
          width: targetRect.width,
          height: targetRect.height
        });
        applyStyleTargets(DOM.mainMedia, {
          width: targetRect.width,
          height: targetRect.height
        });
        resetModalState();
      }
    } else {
      resetModalState();
    }
  }

  function resetModalState() {
    DOM.lb.classList.remove('gp-lightbox-active');
    DOM.sidebar.innerHTML = '';
    if (activeCardEl) {
      const thumbCont = activeCardEl.querySelector('.gp-thumb-container');
      if (thumbCont) thumbCont.style.display = '';
    }
    activeCardEl = null;
    activeCardRect = null;
    isLightboxActive = false;
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
