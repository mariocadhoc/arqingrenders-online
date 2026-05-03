import { initMinimap } from './engines/minimap.js';
import { initGalleryOffsets } from './engines/galleryOffsets.js';
import { initVerticalCardsFade } from './engines/verticalCardsFade.js';
import AerialZoomEngine from './engines/aerialZoom.js';

let horizontalTween = null;
let workGalleryInteractionsInitialized = false;
const MOBILE_WORK_MEDIA_QUERY = '(max-width: 768px)';

function isMobileWorkViewport() {
    return window.matchMedia(MOBILE_WORK_MEDIA_QUERY).matches;
}

function scrollToAllWorkSection({ behavior = 'auto' } = {}) {
    const targetElement = document.querySelector('#all-work');
    if (!targetElement) return false;

    const rect = targetElement.getBoundingClientRect();
    const offsetTop = rect.top + window.scrollY - (window.innerHeight * 0.08);

    window.scrollTo({
        top: offsetTop,
        behavior
    });

    return true;
}

function ensureAllWorkScroll({
    behavior = 'auto',
    attempts = 8,
    intervalMs = 140
} = {}) {
    const targetElement = document.querySelector('#all-work');
    if (!targetElement) return;

    let remainingAttempts = attempts;

    const tick = () => {
        const rect = targetElement.getBoundingClientRect();
        const desiredTop = rect.top + window.scrollY - (window.innerHeight * 0.08);
        const distance = Math.abs(window.scrollY - desiredTop);

        if (distance <= 6) return;

        window.scrollTo({
            top: desiredTop,
            behavior: remainingAttempts === attempts ? behavior : 'auto'
        });

        remainingAttempts -= 1;
        if (remainingAttempts > 0) {
            window.setTimeout(tick, intervalMs);
        }
    };

    tick();
}

function revealWorkSectionsImmediately() {
    document.querySelectorAll('.section-work').forEach((section) => {
        section.style.opacity = '1';
        section.style.removeProperty('transform');
    });

    if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
    }
}

function initHorizontalGallery() {
    if (isMobileWorkViewport()) return;

    const wrap = document.querySelector('.horizontal-scroll-container');
    const content = document.querySelector('.horizontal-scroll-content');
    const galleryColumn = document.querySelector('.large-images');

    if (!wrap || !content || !galleryColumn) return;

    const cards = content.querySelectorAll('.horizon');
    if (!cards.length) return;

    function syncGalleryWidth() {
        const width = galleryColumn.clientWidth || wrap.clientWidth;
        if (width > 0) {
            galleryColumn.style.setProperty('--work-gallery-width', `${width}px`);
        }
        return width;
    }

    function getScrollAmount() {
        syncGalleryWidth();
        // Exact geometry: to bring card N into view from card 1,
        // translate left by (N-1) × (cardWidth + gap).
        // This avoids any scrollWidth ambiguity.
        const cardWidth = cards[0].offsetWidth;
        const gap = parseFloat(getComputedStyle(content).columnGap) || 40;
        return (cards.length - 1) * (cardWidth + gap);
    }

    syncGalleryWidth();

    function syncHorizontalScrollStage() {
        const scrollDistance = getScrollAmount() * 0.7;

        wrap.style.position = 'relative';
        wrap.style.display = 'block';
        wrap.style.height = `${window.innerHeight + scrollDistance}px`;
        wrap.style.overflow = 'visible';

        content.style.position = 'sticky';
        content.style.top = '0px';
        content.style.height = '100vh';
        content.style.willChange = 'transform';

        return scrollDistance;
    }

    syncHorizontalScrollStage();

    horizontalTween = gsap.to(content, {
        x: () => -getScrollAmount(),
        ease: "none"
    });

    // Horizontal gallery snap is temporarily disabled for debugging.
    // Reactivate by changing this flag to true.
    const ENABLE_HORIZONTAL_SCROLL_SNAP = false;
    const horizontalScrollSnapConfig = {
        snapTo: 1 / (cards.length > 1 ? cards.length - 1 : 1),
        duration: { min: 0.2, max: 0.5 },
        delay: 0.01,
        ease: "power1.inOut"
    };

    ScrollTrigger.create({
        trigger: wrap,
        start: "top top",
        end: () => `+=${syncHorizontalScrollStage()}`,
        animation: horizontalTween,
        scrub: 1,
        ...(ENABLE_HORIZONTAL_SCROLL_SNAP ? { snap: horizontalScrollSnapConfig } : {}),
        onRefreshInit: syncHorizontalScrollStage,
        invalidateOnRefresh: true
    });

    let resizeFrame = null;
    window.addEventListener('resize', () => {
        if (resizeFrame) cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(() => {
            resizeFrame = null;
            syncHorizontalScrollStage();
            if (typeof ScrollTrigger !== 'undefined') {
                ScrollTrigger.refresh();
            }
        });
    }, { passive: true });
}

function initWorkGalleryInteractions() {
    if (workGalleryInteractionsInitialized) return;
    workGalleryInteractionsInitialized = true;

    initGalleryOffsets();
    initHorizontalGallery();
    initVerticalCardsFade();
    if (!isMobileWorkViewport()) {
        initMinimap();
    }
    new AerialZoomEngine();

    if (typeof ScrollTrigger !== 'undefined') {
        requestAnimationFrame(() => ScrollTrigger.refresh());
    }
}

function initWorkCardCursor() {
    const cursorWrapper = document.getElementById('work-card-cursor-wrapper');
    const cursor = document.getElementById('work-card-cursor');
    const links = document.querySelectorAll('.section-work#all-work .work-item[data-cursor-label]');
    const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

    if (isTouch || !cursorWrapper || !cursor || !links.length) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let cursorX = mouseX;
    let cursorY = mouseY;

    document.addEventListener('mousemove', (event) => {
        mouseX = event.clientX;
        mouseY = event.clientY;
    }, { passive: true });

    const renderCursor = () => {
        cursorX += (mouseX - cursorX) * 0.15;
        cursorY += (mouseY - cursorY) * 0.15;
        cursorWrapper.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
        requestAnimationFrame(renderCursor);
    };

    requestAnimationFrame(renderCursor);

    links.forEach((link) => {
        link.addEventListener('mouseenter', () => {
            cursor.textContent = link.dataset.cursorLabel || '';
            cursor.classList.add('is-active');
        });

        link.addEventListener('mouseleave', () => {
            cursor.classList.remove('is-active');
        });
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    initWorkCardCursor();

    // Register GSAP Plugins
    if (typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }

    const shouldDeferAllWorkNavigation = window.location.hash === '#all-work';
    const shouldSkipWorkIntro = Boolean(window.__ARQ_SKIP_WORK_INTRO__);

    const isMobile = isMobileWorkViewport();

    if (!shouldSkipWorkIntro && isMobile) {
        // --- MOBILE OPTIMIZED ANIMATIONS ---
        const { TitleStackMobile } = await import('./engines/mobile/title-stack-mobile.js');
        const { SubtitleLine1Mobile } = await import('./engines/mobile/subtitle-line1-mobile.js');
        const { SubtitleLine2Mobile } = await import('./engines/mobile/subtitle-line2-mobile.js');

        new TitleStackMobile('.work-title');
        new SubtitleLine1Mobile('.work-subtitle-line-1');
        new SubtitleLine2Mobile('.work-subtitle-line-2');

    } else if (!shouldSkipWorkIntro) {
        // --- DESKTOP ANIMATIONS ---
        const { TitleStackAnimation } = await import('./engines/title-stack-animation.js');
        const { SubtitleLine1Animation } = await import('./engines/subtitle-line1-animation.js');
        const { SubtitleLine2Animation } = await import('./engines/subtitle-line2-animation.js');

        new TitleStackAnimation('.work-title');
        new SubtitleLine1Animation('.work-subtitle-line-1');
        new SubtitleLine2Animation('.work-subtitle-line-2');
    }

    if (shouldSkipWorkIntro) {
        revealWorkSectionsImmediately();
        initWorkGalleryInteractions();

        if (shouldDeferAllWorkNavigation) {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    ensureAllWorkScroll({ behavior: 'auto', attempts: 12, intervalMs: 160 });
                });
            });
        }
    } else {
        requestAnimationFrame(initWorkGalleryInteractions);
        window.addEventListener('workSectionsRevealComplete', initWorkGalleryInteractions, { once: true });
        window.setTimeout(initWorkGalleryInteractions, 3150);
    }

    if (shouldDeferAllWorkNavigation) {
        let hasNavigatedToAllWork = false;

        const navigateToAllWork = () => {
            if (hasNavigatedToAllWork) return;
            hasNavigatedToAllWork = true;
            ensureAllWorkScroll({ behavior: 'smooth', attempts: 10, intervalMs: 160 });
        };

        if (!shouldSkipWorkIntro) {
            window.addEventListener('workSectionsRevealComplete', navigateToAllWork, { once: true });

            window.setTimeout(() => {
                navigateToAllWork();
            }, 2700);
        }
    }

    window.addEventListener('hashchange', () => {
        if (window.location.hash === '#all-work') {
            ensureAllWorkScroll({ behavior: 'smooth', attempts: 10, intervalMs: 160 });
        }
    });

    window.addEventListener('load', () => {
        if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh();
        }

        if (window.location.hash === '#all-work') {
            ensureAllWorkScroll({ behavior: 'auto', attempts: 6, intervalMs: 180 });
        }
    }, { once: true });

    window.addEventListener('pageshow', (event) => {
        if (window.location.hash !== '#all-work') return;

        requestAnimationFrame(() => {
            ensureAllWorkScroll({
                behavior: event.persisted ? 'auto' : 'smooth',
                attempts: 10,
                intervalMs: 180
            });
        });
    });
});
