/**
 * Aerial Zoom Reveal Engine
 * ─────────────────────────
 * Sequential reveal: each card zooms in + fades out completely,
 * then the next card fades in from transparent. No overlap.
 * The last card fades in and stays.
 *
 * Fully compatible with mobile & desktop via ScrollTrigger.
 */
export default class AerialZoomEngine {
    constructor() {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
        this.init();
    }

    init() {
        const triggerWrap = document.querySelector('.stacked-scroll-trigger');
        const cards = gsap.utils.toArray('.stacked-card');

        if (!triggerWrap || cards.length === 0) return;

        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        const cardTop = isMobile ? 'var(--work-mobile-gallery-top)' : 0;

        // --- Initial state ---
        // All cards stacked, only the first one visible
        cards.forEach((card, i) => {
            gsap.set(card, {
                zIndex: cards.length - i,
                x: 0,
                y: 0,
                top: cardTop,
                left: 0,
                scale: 1,
                opacity: i === 0 ? 1 : 0   // only first card visible
            });
        });

        // --- Build sequential timeline ---
        // Scroll distance per transition (shorter = snappier)
        const scrollPerCard = window.innerHeight * 0.8;
        const totalScroll = scrollPerCard * cards.length + window.innerHeight * 0.3;

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: triggerWrap,
                start: 'center center',
                end: () => '+=' + totalScroll,
                pin: true,
                scrub: 1,
                invalidateOnRefresh: true
            }
        });

        cards.forEach((card, i) => {
            const nextCard = cards[i + 1];

            // Current card: zoom in + fade out
            tl.to(card, {
                scale: 2.5,
                opacity: 0,
                ease: 'power1.in',
                duration: 1
            });

            // Next card: fade in (if exists)
            if (nextCard) {
                tl.to(nextCard, {
                    opacity: 1,
                    ease: 'power2.out',
                    duration: 0.4
                });
            }
        });
    }
}
