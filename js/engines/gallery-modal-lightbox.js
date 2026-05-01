const imageCache = new Map();
const DOM = {};
let isLightboxActive = false;
let activeSourceRect = null;
let activeOnClose = null;
let currentMainSrc = null;
const DEFAULT_UI_TEXT = {
  closeLightbox: 'Close lightbox',
  clickToZoom: 'Click to zoom',
  clickToFit: 'Click to fit',
  openImage: (index) => `Open image ${index + 1}`,
  projectImage: 'Project Image',
  imageLabel: (label, index) => `${label} image ${index + 1}`
};
let activeUiText = DEFAULT_UI_TEXT;

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

function hasGsap() {
  return typeof window.gsap !== 'undefined';
}

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

export function warmImage(src) {
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

export function warmSources(sources) {
  sources.filter(Boolean).forEach((src) => {
    queueIdle(() => {
      warmImage(src);
    });
  });
}

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

  if (!animated || !hasGsap()) {
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
  DOM.zoomHintText.textContent = zoomState.scale > 1.02 ? activeUiText.clickToFit : activeUiText.clickToZoom;
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

function preventGestureDefault(event) {
  if (event.cancelable) event.preventDefault();
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
    preventGestureDefault(event);
    DOM.viewport.setPointerCapture?.(event.pointerId);
  }
  applyZoom();
}

function handleViewportPointerMove(event) {
  if (!zoomState.pointerDown) return;
  if (zoomState.scale > 1.02) preventGestureDefault(event);

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

function replaceMainImage(newSrc, altText = activeUiText.projectImage) {
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

function initLightboxDOM() {
  if (DOM.lb) return;

  const lb = document.createElement('div');
  lb.className = 'gp-lightbox';
  lb.innerHTML = `
    <div class="gp-lightbox-bg"></div>
    <button class="gp-lightbox-close" type="button" aria-label="${DEFAULT_UI_TEXT.closeLightbox}">✕</button>
    <div class="gp-lightbox-main-wrapper">
      <div class="gp-lightbox-main-viewport">
        <div class="gp-lightbox-main-media">
          <img class="gp-lightbox-main-img" src="" alt="${DEFAULT_UI_TEXT.projectImage}" />
        </div>
        <div class="gp-lightbox-zoom-hint" hidden>
          ${getMagnifierIcon()}
          <span>${DEFAULT_UI_TEXT.clickToZoom}</span>
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

  DOM.closeBtn.addEventListener('click', closeGalleryLightbox);
  DOM.bg.addEventListener('click', closeGalleryLightbox);
  DOM.lb.addEventListener('click', (event) => {
    const clickedInsideViewport = event.target.closest('.gp-lightbox-main-viewport');
    const clickedInsideSidebar = event.target.closest('.gp-lightbox-sidebar');
    const clickedCloseButton = event.target.closest('.gp-lightbox-close');
    if (clickedInsideViewport || clickedInsideSidebar || clickedCloseButton) return;
    closeGalleryLightbox();
  });
  DOM.viewport.addEventListener('pointerdown', handleViewportPointerDown);
  DOM.viewport.addEventListener('pointermove', handleViewportPointerMove);
  DOM.viewport.addEventListener('pointerup', handleViewportPointerUp);
  DOM.viewport.addEventListener('pointercancel', handleViewportPointerUp);
  DOM.viewport.addEventListener('pointerleave', handleViewportPointerUp);
  DOM.viewport.addEventListener('click', handleViewportClick);

  window.addEventListener('resize', () => {
    if (!isLightboxActive) return;
    setViewportTarget(false);
  });

  document.addEventListener('keydown', (event) => {
    if (!isLightboxActive) return;
    if (event.key === 'Escape') {
      closeGalleryLightbox();
    }
  });
}

function buildSidebar(mediaItems, activeIndex) {
  DOM.sidebar.innerHTML = '';
  mediaItems.forEach((item, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gp-lightbox-thumb-btn' + (idx === activeIndex ? ' gp-active-thumb' : '');
    btn.setAttribute('aria-label', activeUiText.openImage(idx));
    const img = document.createElement('img');
    img.src = item.thumbSrc || item.fullSrc;
    img.alt = item.alt || activeUiText.imageLabel(activeUiText.projectImage, idx);
    img.decoding = 'async';
    img.loading = 'eager';
    btn.appendChild(img);
    btn.addEventListener('click', () => {
      if (currentMainSrc === item.fullSrc) return;
      syncActiveThumb(btn);
      replaceMainImage(item.fullSrc, item.alt || activeUiText.imageLabel(activeUiText.projectImage, idx));
    });
    DOM.sidebar.appendChild(btn);
  });
}

export function openGalleryLightbox({
  mediaItems,
  sourceRect,
  initialIndex = 0,
  onOpen,
  onClose,
  uiText = {}
}) {
  const items = Array.isArray(mediaItems)
    ? mediaItems.filter((item) => item && item.fullSrc)
    : [];
  if (!items.length || isLightboxActive) return;

  initLightboxDOM();
  activeUiText = { ...DEFAULT_UI_TEXT, ...uiText };
  DOM.closeBtn.setAttribute('aria-label', activeUiText.closeLightbox);
  DOM.zoomHintText.textContent = activeUiText.clickToZoom;

  const activeIndex = Math.min(Math.max(initialIndex, 0), items.length - 1);
  const initialItem = items[activeIndex];
  activeSourceRect = sourceRect || null;
  activeOnClose = typeof onClose === 'function' ? onClose : null;
  isLightboxActive = true;
  document.body.style.overflow = 'hidden';
  onOpen?.();

  warmSources(items.map((item) => item.thumbSrc));
  warmSources(items.map((item) => item.fullSrc));

  DOM.lb.classList.add('gp-lightbox-active');
  setViewportToRect(activeSourceRect);
  primeMainImageDimensions(activeSourceRect?.width || 280, activeSourceRect?.height || 220);
  buildSidebar(items, activeIndex);

  DOM.mainImg.src = initialItem.fullSrc;
  DOM.mainImg.alt = initialItem.alt || activeUiText.imageLabel(activeUiText.projectImage, activeIndex);
  DOM.mainImg.decoding = 'async';
  DOM.mainImg.fetchPriority = 'high';
  DOM.mainImg.style.opacity = '1';
  currentMainSrc = initialItem.fullSrc;

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

export function closeGalleryLightbox() {
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

  if (activeSourceRect) {
    const targetRect = activeSourceRect;
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
      return;
    }

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
  }

  resetModalState();
}

function resetModalState() {
  DOM.lb.classList.remove('gp-lightbox-active');
  DOM.sidebar.innerHTML = '';
  activeOnClose?.();
  activeUiText = DEFAULT_UI_TEXT;
  activeOnClose = null;
  activeSourceRect = null;
  isLightboxActive = false;
}
