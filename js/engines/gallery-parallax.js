/* =========================================
   GALLERY-PARALLAX.JS
   Floating Parallax Gallery — engine
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
  const GP_DATA_URL = '/assets/img/stills/gallery-parallax.json';
  const GP_MEDIA_BASE_URL = '/assets/img/stills/';
  const GP_DEFAULT_PARENT_CARD_SCALE = 2.015;
  const GP_CARD_SIZE_MULTIPLIER = 3;
  const GP_DISPLAY_CARD_SCALE_X = 1.0925 * GP_CARD_SIZE_MULTIPLIER;
  const GP_DISPLAY_CARD_SCALE_Y = 1.15 * GP_CARD_SIZE_MULTIPLIER;
  const GP_MAX_OVERLAP_RATIO = 0;
  const GP_MIN_PARALLAX_GAP = 52;

  window.gp_cardsData = [];

  // -------------------------------------------------------
  // CONFIG
  // -------------------------------------------------------
  const GP_CONFIG = {
    canvasMaxWidth: 1860,
    columns: 2,
    rowGap: 196,
    colPadding: 32,
    minColumnGap: 52,
    topPadding: 84,
    bottomPadding: 72,
    jitterX: 30,
    jitterY: 58
  };
  let gp_activeLayoutColumns = GP_CONFIG.columns;

  // -------------------------------------------------------
  // DOM REFS
  // -------------------------------------------------------
  const gp_canvas = document.getElementById('gp-canvas');
  const gp_scene = document.getElementById('gp-scene');
  const gp_filtersEl = document.getElementById('gp-filters');
  const gp_section = document.getElementById('gallery-parallax-section');
  const gp_sectionTitle = document.getElementById('gp-gallery-title');
  const gp_filtersWrapper = document.getElementById('gp-filters-wrapper');

  if (!gp_canvas || !gp_scene || !gp_filtersEl || !gp_section) return;

  // -------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------
  function gp_pickNumber(...values) {
    for (const value of values) {
      const parsed = Number(value);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return null;
  }

  function gp_pickText(...values) {
    for (const value of values) {
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return '';
  }

  function gp_pickObject(...values) {
    for (const value of values) {
      if (value && typeof value === 'object' && !Array.isArray(value)) return value;
    }
    return {};
  }

  function gp_pickMediaSrc(...values) {
    for (const value of values) {
      if (typeof value === 'string' && value.trim()) return gp_resolveMediaSrc(value.trim());
      if (value && typeof value === 'object') {
        const nested = gp_pickText(value.src, value.path, value.url);
        if (nested) return gp_resolveMediaSrc(nested);
      }
    }
    return '';
  }

  function gp_normalizeMediaObject(...values) {
    for (const value of values) {
      if (typeof value === 'string' && value.trim()) {
        return {
          src: gp_resolveMediaSrc(value.trim()),
          width: null,
          height: null,
          name: ''
        };
      }

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const src = gp_pickMediaSrc(value);
        if (!src) continue;
        return {
          src,
          width: gp_pickNumber(value.width, value.w),
          height: gp_pickNumber(value.height, value.h),
          name: gp_pickText(value.name)
        };
      }
    }

    return {
      src: '',
      width: null,
      height: null,
      name: ''
    };
  }

  function gp_resolveMediaSrc(src) {
    const trimmed = typeof src === 'string' ? src.trim() : '';
    if (!trimmed) return '';
    if (/^(?:[a-z]+:)?\/\//i.test(trimmed) || trimmed.startsWith('data:')) return trimmed;
    if (trimmed.startsWith('/')) return trimmed;
    if (trimmed.startsWith('assets/')) return `/${trimmed}`;
    const baseUrl = new URL(GP_MEDIA_BASE_URL, window.location.origin);
    return new URL(trimmed, baseUrl).pathname;
  }

  function gp_normalizeChildren(children) {
    if (!Array.isArray(children)) return [];

    return children
      .map((child) => {
        const thumb = gp_normalizeMediaObject(
          child && child.thumb,
          child && child.thumbnail,
          child && child.preview,
          child
        );
        const full = gp_normalizeMediaObject(
          child && child.full,
          child && child.lightbox,
          child && child.image,
          child && child.src,
          child
        );

        const thumbSrc = thumb.src || full.src;
        const fullSrc = full.src || thumb.src;

        if (!thumbSrc || !fullSrc) return null;

        return {
          thumbSrc,
          fullSrc,
          alt: gp_pickText(child && child.alt, child && child.name)
        };
      })
      .filter(Boolean);
  }

  function gp_normalizeCard(entry, index, parentCardScale) {
    if (!entry || typeof entry !== 'object') return null;

    if (entry.type === 'title' || entry.isTitle) {
      return {
        id: index,
        isTitle: true,
        text: gp_pickText(entry.text, entry.label, 'Selected Projects'),
        category: '_Title',
        w: gp_pickNumber(entry.width, entry.w, entry.size && entry.size.width, 300),
        h: gp_pickNumber(entry.height, entry.h, entry.size && entry.size.height, 100)
      };
    }

    const parent = gp_pickObject(
      entry.parent,
      entry.media && entry.media.parent,
      entry.images && entry.images.parent
    );
    const parentCard = gp_normalizeMediaObject(
      parent.card,
      parent.preview,
      parent.thumbnail,
      parent.src,
      entry.img
    );
    const parentFull = gp_normalizeMediaObject(
      parent.full,
      parent.lightbox,
      parent.original,
      parent.src,
      entry.parentSrc,
      entry.image,
      entry.img
    );
    const width = gp_pickNumber(
      parent.displayWidth,
      parent.width,
      parent.w,
      entry.width,
      entry.w,
      entry.size && entry.size.width,
      220
    );
    const height = gp_pickNumber(
      parent.displayHeight,
      parent.height,
      parent.h,
      entry.height,
      entry.h,
      entry.size && entry.size.height,
      280
    );
    const parentCardSrc = parentCard.src || parentFull.src;
    const parentFullSrc = parentFull.src || parentCard.src;

    if (!parentCardSrc || !parentFullSrc) return null;

    const children = gp_normalizeChildren(entry.children);

    return {
      id: index,
      layoutKey: gp_pickText(entry.slug, entry.label, parentCardSrc, `project-${index}`),
      category: gp_pickText(entry.category, 'Uncategorized'),
      label: gp_pickText(entry.label, entry.slug, `Project ${index + 1}`),
      w: Math.round(width * parentCardScale * GP_DISPLAY_CARD_SCALE_X),
      h: Math.round(height * parentCardScale * GP_DISPLAY_CARD_SCALE_Y),
      img: parentCardSrc,
      full: parentFullSrc,
      imgAlt: gp_pickText(parent.alt, entry.alt, entry.label, entry.slug, `Project ${index + 1}`),
      children
    };
  }

  async function gp_loadCardsData() {
    const response = await fetch(GP_DATA_URL);
    if (!response.ok) {
      throw new Error(`Failed to load ${GP_DATA_URL}: ${response.status}`);
    }

    const raw = await response.json();
    const parentCardScale = gp_pickNumber(
      raw && raw.meta && raw.meta.parentCardScale,
      raw && raw.parentCardScale,
      GP_DEFAULT_PARENT_CARD_SCALE
    );
    const rawCards = raw && Array.isArray(raw.cards) ? raw.cards : [];

    return rawCards
      .map((entry, index) => gp_normalizeCard(entry, index, parentCardScale))
      .filter(Boolean);
  }

  // -------------------------------------------------------
  // SEEDED RANDOM  — deterministic per card identity
  // -------------------------------------------------------
  function gp_seededRandom(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  function gp_hashString(value) {
    const str = String(value || '');
    let hash = 2166136261;

    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
  }

  function gp_stableNoise(key, salt = '') {
    const rng = gp_seededRandom(gp_hashString(`${key}:${salt}`) || 1);
    return rng();
  }

  // -------------------------------------------------------
  // GLOW BUILDER — white-only, depth-driven
  // -------------------------------------------------------
  function gp_buildGlow(depth, hovered = false) {
    const glowScale = 0.5;
    const backgroundDepthScale = depth < 0.35 ? 0.75 : 1;
    const boost = (hovered ? 0.15 : 0) * glowScale;
    if (depth < 0.35) {
      const alpha = Math.min((0.75 * glowScale * backgroundDepthScale) + boost, 1);
      const nearSpread = hovered ? 12 : 10;
      const nearBlur = hovered ? 26 : 22;
      return `0 ${nearSpread}px ${nearBlur}px rgba(255,255,255,${alpha}), 0 ${Math.round(nearSpread * 0.5)}px ${Math.round(nearBlur * 0.5)}px rgba(255,255,255,${(alpha * 0.6).toFixed(2)})`;
    } else if (depth < 0.65) {
      const alpha = (0.30 * glowScale + boost).toFixed(2);
      return `0 12px 32px rgba(255,255,255,${alpha}), 0 6px 14px rgba(255,255,255,${(parseFloat(alpha) * 0.45).toFixed(2)})`;
    }

    const alpha = ((0.12 + depth * 0.08) * glowScale + boost).toFixed(2);
    const spread = Math.round(24 + depth * 50);
    const blur = Math.round(50 + depth * 80);
    return `0 ${spread}px ${blur}px rgba(255,255,255,${alpha}), 0 ${Math.round(spread * 0.4)}px ${Math.round(blur * 0.4)}px rgba(255,255,255,${(parseFloat(alpha) * 0.5).toFixed(2)})`;
  }

  // -------------------------------------------------------
  // LAYOUT ENGINE — compute positions for a set of cards
  // -------------------------------------------------------
  function gp_getResponsiveConfig() {
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || GP_CONFIG.canvasMaxWidth;

    if (viewportWidth <= 640) {
      return {
        ...GP_CONFIG,
        columns: 1,
        rowGap: 72,
        colPadding: 0,
        minColumnGap: 8,
        topPadding: 32,
        bottomPadding: 48,
        jitterX: 0,
        jitterY: 18
      };
    }

    if (viewportWidth <= 1024) {
      return {
        ...GP_CONFIG,
        columns: 2,
        rowGap: 112,
        colPadding: 8,
        minColumnGap: 24,
        topPadding: 48,
        bottomPadding: 56,
        jitterX: 10,
        jitterY: 28
      };
    }

    if (viewportWidth <= 1440) {
      return {
        ...GP_CONFIG,
        columns: 2,
        rowGap: 152,
        colPadding: 12,
        minColumnGap: 36,
        topPadding: 64,
        bottomPadding: 64,
        jitterX: 16,
        jitterY: 40
      };
    }

    return {
      ...GP_CONFIG,
      columns: 2
    };
  }

  function gp_computeLayout(cards, containerWidth, layoutConfig) {
    const cols = layoutConfig.columns;
    const colWidth = (containerWidth - layoutConfig.colPadding * 2) / cols;
    const positions = [];
    const colBottoms = new Array(cols).fill(layoutConfig.topPadding);
    const colState = new Array(cols).fill(null).map(() => ({
      lastBucket: '',
      bucketRun: 0,
      cardCount: 0
    }));
    let previousCol = -1;
    let sameColRun = 0;

    cards.forEach((card) => {
      const key = card.layoutKey || card.label || card.id;
      const bucket = card.aspectBucket || 'neutral';
      const jitterLimitY = layoutConfig.columns === 1 ? layoutConfig.jitterY : layoutConfig.jitterY * 0.48;
      const visualJitterY = Math.round((gp_stableNoise(key, 'y') * 2 - 1) * jitterLimitY);
      const placementGap = Math.max(24, layoutConfig.rowGap * 0.72);
      let bestCol = 0;
      let bestScore = Number.POSITIVE_INFINITY;

      for (let c = 0; c < cols; c++) {
        const state = colState[c];
        const projectedBottom = Math.max(layoutConfig.topPadding, colBottoms[c] + visualJitterY) + card.h + placementGap;
        const projectedBottoms = colBottoms.map((bottom, index) => index === c ? projectedBottom : bottom);
        const imbalance = Math.max(...projectedBottoms) - Math.min(...projectedBottoms);
        const aspectPenalty = state.lastBucket === bucket
          ? layoutConfig.rowGap * (0.3 + Math.min(state.bucketRun, 2) * 0.24)
          : 0;
        const sameColumnPenalty = c === previousCol
          ? layoutConfig.rowGap * (0.22 + Math.min(sameColRun, 2) * 0.18)
          : 0;
        const countPenalty = state.cardCount * layoutConfig.rowGap * 0.08;
        const score = colBottoms[c] + aspectPenalty + sameColumnPenalty + countPenalty + (imbalance * 0.32);

        if (score < bestScore) {
          bestScore = score;
          bestCol = c;
        }
      }

      const colStart = layoutConfig.colPadding + bestCol * colWidth;
      const availableHalf = Math.max(0, (colWidth - card.w) / 2 - 2);
      const jitterRange = Math.min(layoutConfig.jitterX, availableHalf);
      const jx = (gp_stableNoise(key, 'x') * 2 - 1) * jitterRange;
      const centerX = colStart + (colWidth - card.w) / 2;
      const minX = colStart + 2;
      const maxX = Math.max(minX, colStart + colWidth - card.w - 2);
      const x = Math.round(Math.min(Math.max(centerX + jx, minX), maxX));
      const y = Math.round(Math.max(layoutConfig.topPadding, colBottoms[bestCol] + visualJitterY));
      const depth = parseFloat((gp_stableNoise(key, 'depth') * 0.85 + 0.1).toFixed(2));

      positions.push({ x, y, depth, colIndex: bestCol });
      colBottoms[bestCol] = y + card.h + placementGap;

      const state = colState[bestCol];
      state.bucketRun = state.lastBucket === bucket ? state.bucketRun + 1 : 1;
      state.lastBucket = bucket;
      state.cardCount += 1;

      if (bestCol === previousCol) {
        sameColRun += 1;
      } else {
        previousCol = bestCol;
        sameColRun = 1;
      }
    });

    return positions;
  }

  function gp_getLayoutCard(card, colWidth, layoutConfig) {
    const minCardWidth = layoutConfig.columns === 1 ? 220 : 160;
    const ratio = card.w / card.h;
    const aspectBucket = ratio > 1.18 ? 'wide' : (ratio < 0.86 ? 'tall' : 'neutral');
    const widthBias = aspectBucket === 'wide' ? 0.9 : (aspectBucket === 'tall' ? 0.76 : 0.82);
    const maxWidth = Math.max(minCardWidth, colWidth * widthBias - layoutConfig.minColumnGap);
    const scale = Math.min(1, maxWidth / card.w);

    return {
      ...card,
      w: Math.round(card.w * scale),
      h: Math.round(card.h * scale),
      aspectBucket
    };
  }

  function gp_buildFilterButtons(cardsData) {
    gp_filtersEl.textContent = '';

    const categories = [
      'All',
      ...Array.from(new Set(cardsData.map((card) => card.category))).filter((category) => category !== '_Title')
    ];

    categories.forEach((category) => {
      const btn = document.createElement('button');
      btn.className = 'gp-filter-btn' + (category === 'All' ? ' gp-active' : '');
      btn.textContent = category;
      btn.setAttribute('data-category', category);
      btn.type = 'button';
      gp_filtersEl.appendChild(btn);
    });
  }

  let gp_els = [];
  let gp_activeCategory = 'All';
  let gp_ticking = false;
  let gp_isAnimatingParallax = false;
  let gp_hasRevealedThumbs = false;

  function gp_attachHoverEvents(item) {
    if (item.cardData.isTitle) return;

    item.el.addEventListener('mouseenter', () => {
      item.el.style.boxShadow = gp_buildGlow(item.depth, true);
      item.el.style.zIndex = 99;
      window.dispatchEvent(new CustomEvent('gpCardHoverEnter', { detail: { el: item.el, item: item } }));
    });

    item.el.addEventListener('mouseleave', () => {
      item.el.style.boxShadow = gp_buildGlow(item.depth, false);
      item.el.style.zIndex = Math.round(item.depth * 10);
      window.dispatchEvent(new CustomEvent('gpCardHoverLeave', { detail: { el: item.el, item: item } }));
    });
  }

  function gp_buildCardElements(cardsData) {
    gp_canvas.textContent = '';
    gp_els = [];

    cardsData.forEach((cardData) => {
      if (cardData.isTitle) {
        // MVP standby: Floating Selected Projects CTA preserved for future launch. Do not delete.
        // Original CTA render:
        // const el = document.createElement('a');
        // el.className = 'gp-card gp-title-card gp-selected-projects-cta';
        // el.href = '#selected-projects';
        // el.setAttribute('aria-label', 'View selected projects');
        // el.innerHTML = `
        //   <span class="gp-cta-eyebrow">Go to Selected Projects</span>
        //   <span class="gp-cta-copy">Explore featured case studies</span>
        //   <span class="gp-cta-label">View Projects</span>
        // `;
        // End MVP standby: Floating Selected Projects CTA.
        return;
      }

      const el = document.createElement('div');
      el.className = 'gp-card';
      el.setAttribute('data-category', cardData.category);
      el.setAttribute('data-id', cardData.id);
      el.style.width = `${cardData.w}px`;
      el.style.height = `${cardData.h}px`;
      el.style.opacity = '0';

      const img = document.createElement('img');
      img.src = cardData.img;
      img.alt = cardData.imgAlt || cardData.label;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.width = cardData.w;
      img.height = cardData.h;

      const lbl = document.createElement('span');
      lbl.className = 'gp-card-label';
      lbl.textContent = cardData.label;

      el.appendChild(img);
      el.appendChild(lbl);

      gp_canvas.appendChild(el);

      const item = {
        el,
        cardData,
        baseY: 0,
        targetY: 0,
        depth: 0,
        currentY: 0,
        colIndex: 0,
        layoutW: cardData.w,
        layoutH: cardData.h
      };

      gp_attachHoverEvents(item);
      gp_els.push(item);
    });
  }

  function gp_revealThumbsAfterSubtitle() {
    if (gp_hasRevealedThumbs) return;
    gp_hasRevealedThumbs = true;

    const deferredUi = [gp_sectionTitle, gp_filtersWrapper].filter(Boolean);
    const thumbs = gp_els
      .filter((item) => !item.cardData.isTitle)
      .map((item) => item.el);

    deferredUi.forEach((el) => el.classList.add('gp-is-visible'));
    if (!thumbs.length && !deferredUi.length) return;

    if (typeof gsap !== 'undefined') {
      const revealTl = gsap.timeline();

      if (deferredUi.length) {
        revealTl.to(deferredUi, {
          opacity: 1,
          duration: 0.55,
          ease: 'power2.out'
        }, 0);
      }

      if (thumbs.length) {
        revealTl.to(thumbs, {
          opacity: 1,
          duration: 0.7,
          stagger: 0.045,
          ease: 'power2.out'
        }, 0);
      }
      return;
    }

    deferredUi.forEach((el) => {
      el.style.opacity = '1';
      el.style.visibility = 'visible';
    });

    thumbs.forEach((thumb) => {
      thumb.style.opacity = '1';
    });
  }

  function gp_waitForSubtitleRevealThenShowThumbs() {
    if (window.__stillsSubtitleRevealDone) {
      gp_revealThumbsAfterSubtitle();
      return;
    }

    window.addEventListener('stillsSubtitleRevealComplete', gp_revealThumbsAfterSubtitle, { once: true });
  }

  function gp_layoutCards({ applyParallax = true } = {}) {
    gp_isAnimatingParallax = false;
    const layoutConfig = gp_getResponsiveConfig();
    gp_activeLayoutColumns = layoutConfig.columns;
    window.gp_activeLayoutColumns = gp_activeLayoutColumns;
    const containerWidth = Math.min(layoutConfig.canvasMaxWidth, gp_scene.clientWidth);
    const colWidth = (containerWidth - layoutConfig.colPadding * 2) / layoutConfig.columns;
    const visibleIndices = [];

    gp_els.forEach((item, index) => {
      const isVisible =
        gp_activeCategory === 'All' ||
        item.cardData.category === gp_activeCategory ||
        item.cardData.category === '_Title';

      if (isVisible) {
        item.el.classList.remove('gp-hidden');
        item.el.setAttribute('aria-hidden', 'false');
        visibleIndices.push(index);
      } else {
        item.el.classList.add('gp-hidden');
        item.el.setAttribute('aria-hidden', 'true');
        item.el.style.top = '-9999px';
        item.el.style.left = '-9999px';
        item.baseY = 0;
        item.targetY = 0;
        item.currentY = 0;
        item.layoutW = 0;
        item.layoutH = 0;
      }
    });

    const visibleCards = visibleIndices.map((index) => gp_getLayoutCard(gp_els[index].cardData, colWidth, layoutConfig));
    const positions = gp_computeLayout(visibleCards, containerWidth, layoutConfig);
    let maxBottom = 0;

    visibleIndices.forEach((globalIdx, posIdx) => {
      const item = gp_els[globalIdx];
      const layoutCard = visibleCards[posIdx];
      const pos = positions[posIdx];

      item.el.style.width = `${layoutCard.w}px`;
      item.el.style.height = `${layoutCard.h}px`;
      item.el.style.left = `${pos.x}px`;
      item.el.style.top = `${pos.y}px`;
      item.el.style.zIndex = Math.round(pos.depth * 10);

      const glowStr = gp_buildGlow(pos.depth);
      if (item.cardData.isTitle) {
        item.el.style.textShadow = glowStr;
      } else {
        item.el.style.boxShadow = glowStr;
      }

      item.baseY = pos.y;
      item.targetY = pos.y;
      item.currentY = pos.y;
      item.depth = pos.depth;
      item.colIndex = pos.colIndex;
      item.layoutW = layoutCard.w;
      item.layoutH = layoutCard.h;
      item.el.setAttribute('data-col', pos.colIndex);

      const bottom = pos.y + layoutCard.h;
      if (bottom > maxBottom) maxBottom = bottom;
    });

    gp_canvas.style.height = `${maxBottom + layoutConfig.bottomPadding}px`;
    gp_ticking = false;
    if (applyParallax) {
      gp_applyParallax();
    }
  }

  function gp_ensureParallaxAnimation() {
    if (gp_isAnimatingParallax) return;
    gp_isAnimatingParallax = true;
    requestAnimationFrame(gp_animateParallax);
  }

  function gp_animateParallax() {
    let shouldContinue = false;

    gp_els.forEach((item) => {
      if (item.el.classList.contains('gp-hidden')) return;

      const delta = item.targetY - item.currentY;
      if (Math.abs(delta) > 0.35) {
        const ease = 0.075 + ((1 - item.depth) * 0.11);
        item.currentY += delta * ease;
        shouldContinue = true;
      } else {
        item.currentY = item.targetY;
      }

      item.el.style.top = `${item.currentY}px`;
    });

    if (shouldContinue) {
      requestAnimationFrame(gp_animateParallax);
      return;
    }

    gp_isAnimatingParallax = false;
  }

  function gp_applyParallax() {
    const rect = gp_section.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    if (rect.top <= windowHeight && rect.bottom >= 0) {
      const scrolled = windowHeight - rect.top;

      gp_els.forEach((item) => {
        if (item.el.classList.contains('gp-hidden')) return;
        const speed = 0.045 + item.depth * 0.28;
        item.targetY = item.baseY - scrolled * speed;
      });

      for (let c = 0; c < gp_activeLayoutColumns; c++) {
        const colItems = gp_els
          .filter((item) => !item.el.classList.contains('gp-hidden') && item.colIndex === c)
          .sort((a, b) => a.baseY - b.baseY);

        for (let i = 1; i < colItems.length; i++) {
          const prev = colItems[i - 1];
          const curr = colItems[i];
          const prevBottom = prev.targetY + prev.layoutH;
          const maxOverlap = curr.layoutH * GP_MAX_OVERLAP_RATIO;
          const limitY = prevBottom - maxOverlap + GP_MIN_PARALLAX_GAP;

          if (curr.targetY < limitY) {
            curr.targetY = limitY;
          }
        }
      }

      gp_ensureParallaxAnimation();
    }

    gp_ticking = false;
  }

  function gp_scrollGalleryTitleIntoView() {
    const target = gp_sectionTitle || gp_section;
    if (!target) return;

    const header = document.querySelector('header.site-header');
    const headerHeight = header ? header.getBoundingClientRect().height : 0;
    const isCompact = window.matchMedia('(max-width: 768px)').matches;
    const topPadding = headerHeight + (isCompact ? 14 : 24);
    const targetTop = target.getBoundingClientRect().top + window.scrollY - topPadding;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });
  }

  gp_filtersEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.gp-filter-btn');
    if (!btn) return;

    const category = btn.getAttribute('data-category');
    if (category === gp_activeCategory) {
      gp_scrollGalleryTitleIntoView();
      return;
    }

    gp_activeCategory = category;
    gp_filtersEl.querySelectorAll('.gp-filter-btn').forEach((button) => button.classList.remove('gp-active'));
    btn.classList.add('gp-active');
    gp_layoutCards({ applyParallax: false });
    requestAnimationFrame(gp_scrollGalleryTitleIntoView);
  });

  gp_canvas.addEventListener('click', (e) => {
    const cta = e.target.closest('.gp-selected-projects-cta');
    if (!cta) return;

    const selectedProjects = document.getElementById('selected-projects');
    if (!selectedProjects) return;

    e.preventDefault();
    selectedProjects.scrollIntoView({ behavior: 'smooth', block: 'start' });
    selectedProjects.focus({ preventScroll: true });
    history.pushState(null, '', '#selected-projects');
  });

  gp_canvas.addEventListener('keydown', (e) => {
    const cta = e.target.closest('.gp-selected-projects-cta');
    if (!cta || e.key !== ' ') return;

    e.preventDefault();
    cta.click();
  });

  window.addEventListener('scroll', () => {
    if (gp_ticking) return;
    requestAnimationFrame(gp_applyParallax);
    gp_ticking = true;
  }, { passive: true });

  let gp_resizeTimer = 0;

  function gp_handleViewportChange() {
    window.clearTimeout(gp_resizeTimer);
    gp_resizeTimer = window.setTimeout(() => {
      gp_layoutCards();
      gp_applyParallax();
    }, 160);
  }

  window.addEventListener('resize', gp_handleViewportChange, { passive: true });
  window.addEventListener('orientationchange', gp_handleViewportChange, { passive: true });

  window.gp_buildGlow = gp_buildGlow;

  async function gp_init() {
    try {
      window.gp_cardsData = await gp_loadCardsData();
    } catch (error) {
      console.error('Gallery parallax data could not be loaded.', error);
      gp_canvas.textContent = '';
      gp_filtersEl.textContent = '';
      return;
    }

    gp_activeCategory = 'All';
    gp_buildFilterButtons(window.gp_cardsData);
    gp_buildCardElements(window.gp_cardsData);
    gp_layoutCards();
    gp_waitForSubtitleRevealThenShowThumbs();
    window.__gpGalleryLayoutReady = true;
    window.dispatchEvent(new CustomEvent('gpCardsDataReady', { detail: { cardsData: window.gp_cardsData } }));
  }

  gp_init();
});
