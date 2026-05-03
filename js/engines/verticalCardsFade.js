/**
 * Vertical Cards Fade Engine
 * ──────────────────────────
 * Fades the lower sticky card opacity when the next card
 * slides up and covers about 65% of it, un-fading when scrolling up.
 */
export function initVerticalCardsFade() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    // Fix 3 — Resolve the CSS custom property to a concrete px value at init time.
    // Passing the var() string to GSAP forces WebKit to recompute it on every layout
    // frame during scroll, which is a measurable source of jank in Safari iOS.
    function resolveGalleryTop() {
        const largeImages = document.querySelector('.large-images');
        const el = largeImages || document.documentElement;
        const raw = getComputedStyle(el).getPropertyValue('--work-mobile-gallery-top').trim();
        const px = parseFloat(raw);
        if (!isNaN(px)) return px;
        // Fallback: render the value into a probe element so the browser resolves clamp()
        const probe = document.createElement('div');
        probe.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;height:${raw || '84px'}`;
        document.body.appendChild(probe);
        const resolved = probe.offsetHeight || 84;
        document.body.removeChild(probe);
        return resolved;
    }

    function createStickyStage(wrap, stageClassName) {
        let stage = wrap.querySelector(`:scope > .${stageClassName}`);

        if (!stage) {
            stage = document.createElement('div');
            stage.className = `${stageClassName} work-scroll-sticky-stage`;

            while (wrap.firstChild) {
                stage.appendChild(wrap.firstChild);
            }

            wrap.appendChild(stage);
        }

        return stage;
    }

    function configureStickyScrollArea(wrap, stage, totalScroll) {
        wrap.style.position = 'relative';
        wrap.style.height = `${window.innerHeight + totalScroll}px`;
        wrap.style.overflow = 'visible';
        wrap.style.paddingTop = '0';
        wrap.style.paddingBottom = '0';

        stage.style.position = 'sticky';
        stage.style.top = '0px';
        stage.style.width = '100%';
        stage.style.height = '100vh';
        stage.style.overflow = 'hidden';
        stage.style.zIndex = '1';
    }

    const mobileTopOffset = isMobile ? resolveGalleryTop() : 10;
    const verticalWrap = document.querySelector('.vertical-scroll-container');
    const groups = [
        {
            wrap: verticalWrap,
            stage: verticalWrap ? createStickyStage(verticalWrap, 'vertical-cards-sticky-stage') : null,
            cardsSelector: '.large-image.vertical'
        }
    ];

    if (isMobile) {
        const horizontalWrap = document.querySelector('.horizontal-scroll-container');
        groups.unshift({
            wrap: horizontalWrap,
            stage: horizontalWrap ? horizontalWrap.querySelector('.horizontal-scroll-content') : null,
            cardsSelector: '.large-image.horizon'
        });
    }

    groups.forEach(({ wrap, stage, cardsSelector }) => {
        const cards = stage ? gsap.utils.toArray(stage.querySelectorAll(cardsSelector)) : [];
        if (!wrap || cards.length === 0) return;

        const scrollPerCard = window.innerHeight * 0.67;
        const totalScroll = scrollPerCard * (cards.length - 1);

        configureStickyScrollArea(wrap, stage, totalScroll);

        if (wrap.classList.contains('vertical-scroll-container') && !isMobile) {
            wrap.style.marginTop = '5vh';
            wrap.style.marginBottom = '20vh';
        }

        cards.forEach((card, i) => {
            gsap.set(card, {
                position: 'absolute',
                left: 0,
                top: mobileTopOffset,
                y: i === 0 ? 0 : window.innerHeight,
                zIndex: i,
                margin: 0,
                force3D: true
            });
        });

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: wrap,
                start: "top top",
                end: () => `+=${totalScroll}`,
                scrub: true,
                onRefreshInit: () => configureStickyScrollArea(wrap, stage, totalScroll),
                invalidateOnRefresh: true
            }
        });

        cards.forEach((card, index) => {
            if (index > 0) {
                const startTime = index - 1;

                tl.to(card, {
                    y: 0,
                    ease: "none",
                    duration: 1,
                    force3D: true
                }, startTime);

                const prevCard = cards[index - 1];
                if (prevCard) {
                    tl.to(prevCard, {
                        opacity: 0.05,
                        ease: "none",
                        duration: 0.35,
                        force3D: true
                    }, startTime + 0.65);
                }

                const prevPrevCard = cards[index - 2];
                if (prevPrevCard) {
                    tl.to(prevPrevCard, {
                        opacity: 0,
                        ease: "none",
                        duration: 0.35,
                        force3D: true
                    }, startTime + 0.65);
                }
            }
        });
    });
}
