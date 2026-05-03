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
        const stage = triggerWrap ? triggerWrap.querySelector('.stacked-scroll-cards') : null;
        const cards = stage ? gsap.utils.toArray(stage.querySelectorAll('.stacked-card')) : [];

        if (!triggerWrap || !stage || cards.length === 0) return;

        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        const cardTop = isMobile ? 'var(--work-mobile-gallery-top)' : 0;
        const getTotalScroll = () => (window.innerHeight * 0.64 * cards.length) + (window.innerHeight * 0.24);

        function configureStickyStage() {
            const totalScroll = getTotalScroll();

            triggerWrap.style.position = 'relative';
            triggerWrap.style.height = `${window.innerHeight + totalScroll}px`;
            triggerWrap.style.overflow = 'visible';

            stage.style.position = 'sticky';
            stage.style.top = '0px';
            stage.style.width = '100%';
            stage.style.height = '100vh';
            stage.style.overflow = 'hidden';

            return totalScroll;
        }

        configureStickyStage();

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
                transformOrigin: '50% 50%',
                opacity: i === 0 ? 1 : 0   // only first card visible
            });
        });

        // --- Build sequential timeline ---
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: triggerWrap,
                start: 'top top',
                end: () => '+=' + configureStickyStage(),
                scrub: 1,
                onRefreshInit: configureStickyStage,
                invalidateOnRefresh: true
            }
        });

        cards.forEach((card, i) => {
            const nextCard = cards[i + 1];

            // Current card: zoom in + fade out
            tl.to(card, {
                scale: 2.5,
                opacity: 0,
                transformOrigin: '50% 50%',
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
