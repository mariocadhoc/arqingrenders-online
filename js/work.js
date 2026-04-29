import { initMinimap } from './engines/minimap.js';
import { initGalleryOffsets } from './engines/galleryOffsets.js';
import { initVerticalCardsFade } from './engines/verticalCardsFade.js';
import AerialZoomEngine from './engines/aerialZoom.js';

let horizontalTween = null;

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
        section.style.transform = 'translateY(0)';
    });

    if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
    }
}

function initHorizontalGallery() {
    const wrap = document.querySelector('.horizontal-scroll-container');
    const content = document.querySelector('.horizontal-scroll-content');

    if (!wrap || !content) return;

    const cards = content.querySelectorAll('.horizon');
    if (!cards.length) return;

    function getScrollAmount() {
        // Exact geometry: to bring card N into view from card 1,
        // translate left by (N-1) × (cardWidth + gap).
        // This avoids any scrollWidth ambiguity.
        const cardWidth = cards[0].offsetWidth;
        const gap = parseFloat(getComputedStyle(content).columnGap) || 40;
        return (cards.length - 1) * (cardWidth + gap);
    }

    horizontalTween = gsap.to(content, {
        x: () => -getScrollAmount(),
        ease: "none"
    });

    ScrollTrigger.create({
        trigger: wrap,
        start: "top top",
        end: () => `+=${getScrollAmount() * 0.7}`,
        pin: true,
        animation: horizontalTween,
        scrub: 1,
        snap: {
            snapTo: 1 / (cards.length > 1 ? cards.length - 1 : 1),
            duration: { min: 0.2, max: 0.5 },
            delay: 0.01,
            ease: "power1.inOut"
        },
        invalidateOnRefresh: true
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    // Register GSAP Plugins
    if (typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }

    const shouldDeferAllWorkNavigation = window.location.hash === '#all-work';
    const shouldSkipWorkIntro = Boolean(window.__ARQ_SKIP_WORK_INTRO__);

    const isMobile = window.innerWidth <= 768;

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

    initGalleryOffsets();
    initHorizontalGallery();
    initVerticalCardsFade();
    initMinimap();
    new AerialZoomEngine();

    if (shouldSkipWorkIntro) {
        revealWorkSectionsImmediately();

        if (shouldDeferAllWorkNavigation) {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    ensureAllWorkScroll({ behavior: 'auto', attempts: 12, intervalMs: 160 });
                });
            });
        }
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
            }, 3600);
        }
    }

    window.addEventListener('hashchange', () => {
        if (window.location.hash === '#all-work') {
            ensureAllWorkScroll({ behavior: 'smooth', attempts: 10, intervalMs: 160 });
        }
    });

    window.addEventListener('load', () => {
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
