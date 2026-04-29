import StillsCrossCTAEngine from './engines/stills-cross-cta.js';
import { initializeWorkPageIntro } from './engines/work-page-intro.js';

document.addEventListener('DOMContentLoaded', async () => {
    new StillsCrossCTAEngine();

    const { isMobile, subtitleRevealPromise } = await initializeWorkPageIntro({
        titleSelector: '.stills-title',
        subtitleSelector: '.stills-subtitle',
        fallbackDelayMobileMs: 1000
    });

    // Let sibling engines (gallery, etc.) respect the landing reveal order.
    subtitleRevealPromise.then(() => {
        window.__stillsSubtitleRevealDone = true;
        window.dispatchEvent(new CustomEvent('stillsSubtitleRevealComplete'));
    });

    if (typeof gsap !== 'undefined') {
        if (typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
        }

        // --- PROJECT SHOWCASE REVEALS ---
        const projects = document.querySelectorAll('.stills-project');

        projects.forEach((project, index) => {
            const imgLeft = project.querySelector('.stills-img-left');
            const imgRight = project.querySelector('.stills-img-right');
            const content = project.querySelector('.stills-project-content');

            if (!imgLeft || !imgRight || !content) return;

            const spreadDistance = isMobile
                ? Math.min(window.innerWidth * 0.22, 150)
                : Math.min(window.innerWidth * 0.34, 520);

            // Initial state layout: stacked close to center
            gsap.set(imgLeft, {
                x: isMobile ? -18 : -28,
                y: 0,
                rotation: -3,
                scale: 0.95,
                opacity: 0,
                transformOrigin: 'center center'
            });
            gsap.set(imgRight, {
                x: isMobile ? 18 : 28,
                y: 0,
                rotation: 3,
                scale: 0.95,
                opacity: 0,
                transformOrigin: 'center center'
            });
            gsap.set(content, {
                opacity: 0,
                y: isMobile ? 20 : 0,
                scale: isMobile ? 1 : 0.92
            });

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: project,
                    start: 'top center',
                    end: 'bottom center',
                    scrub: 1.1,
                    invalidateOnRefresh: true
                }
            });

            // Phase 1: Fade in the stacked images (applies to every project now).
            tl.to([imgLeft, imgRight], {
                opacity: 1,
                duration: 1,
                ease: 'none'
            }, 0);

            // Phase 2: Spread horizontally and clear the center for copy
            tl.to(imgLeft, {
                x: -spreadDistance,
                y: 0,
                rotation: -1,
                scale: 1,
                duration: 2.6,
                ease: 'power2.inOut'
            }, 0.85);

            tl.to(imgRight, {
                x: spreadDistance,
                y: 0,
                rotation: 1,
                scale: 1,
                duration: 2.6,
                ease: 'power2.inOut'
            }, 0.85);

            // Phase 3: Reveal the content in the opened center lane
            tl.to(content, {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 1.9,
                ease: 'power3.out'
            }, 1.25);

            // Phase 4: Fade out everything as the section scrolls up
            tl.to([imgLeft, imgRight, content], {
                opacity: 0,
                yPercent: -20,
                duration: 2,
                ease: 'power2.in'
            }, 3.45);
        });

        const refreshSelectedProjectTriggers = () => {
            if (typeof ScrollTrigger === 'undefined') return;
            ScrollTrigger.refresh();
        };

        window.addEventListener('gpCardsDataReady', refreshSelectedProjectTriggers, { once: true });

        if (window.__gpGalleryLayoutReady) {
            requestAnimationFrame(refreshSelectedProjectTriggers);
        }

        window.addEventListener('load', refreshSelectedProjectTriggers, { once: true });
    }
});
