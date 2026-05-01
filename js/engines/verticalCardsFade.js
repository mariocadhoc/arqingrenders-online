/**
 * Vertical Cards Fade Engine
 * ──────────────────────────
 * Fades the lower sticky card opacity when the next card
 * slides up and covers about 65% of it, un-fading when scrolling up.
 */
export function initVerticalCardsFade() {
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

    const mobileTopOffset = isMobile ? resolveGalleryTop() : 10;
    const groups = [
        {
            wrap: document.querySelector('.vertical-scroll-container'),
            cards: gsap.utils.toArray('.vertical-scroll-container .large-image.vertical')
        }
    ];

    if (isMobile) {
        groups.unshift({
            wrap: document.querySelector('.horizontal-scroll-container'),
            cards: gsap.utils.toArray('.horizontal-scroll-container .large-image.horizon')
        });
    }

    groups.forEach(({ wrap, cards }) => {
        if (!wrap || cards.length === 0) return;

        // Remove sticky behavior and switch to absolute stacking for the pin
        cards.forEach((card, i) => {
            gsap.set(card, {
                position: 'absolute',
                top: mobileTopOffset,
                y: i === 0 ? 0 : window.innerHeight, // place off-screen
                zIndex: i,
                margin: 0 // remove CSS margins to prevent offset bugs
            });
        });

        gsap.set(wrap, {
            position: 'relative',
            height: '100vh',
            background: 'transparent'
        });

        // 33% reduction in scroll down distance
        // Original equivalent scroll distance per card was 100vh. Now it's 67vh.
        const scrollPerCard = window.innerHeight * 0.67;
        const totalScroll = scrollPerCard * (cards.length - 1);

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: wrap,
                start: "top top",
                end: () => `+=${totalScroll}`,
                pin: true,
                // Fix 1 — Use transform-based pinning instead of position:fixed for mobile only.
                // position:fixed is processed on a separate WebKit compositor thread,
                // causing a ~1-frame desync with touch scroll on Safari iOS.
                // However, on desktop, "transform" causes jitter with smooth mouse wheel scroll,
                // so we fallback to the default "fixed" pinning on desktop.
                pinType: isMobile ? "transform" : "fixed",
                scrub: true,
                invalidateOnRefresh: true
            }
        });

        // Animate the cards upwards natively mimicking the sticky behavior
        cards.forEach((card, index) => {
            if (index > 0) {
                const startTime = index - 1;

                tl.to(card, {
                    y: 0,
                    ease: "none",
                    duration: 1,
                    // Fix 4 — Prevent GSAP from dropping the 3D matrix mid-animation.
                    // Without force3D:true GSAP may revert to a 2D matrix when it decides
                    // the 3D promotion is no longer needed, which causes WebKit to demote
                    // the GPU compositing layer and repaint — visible as a 1-frame flash.
                    force3D: true
                }, startTime);

                // Replicate original fade effect when a card approaches the top
                const prevCard = cards[index - 1];
                if (prevCard) {
                    // Starts fading when the incoming card is at 35% from the top (i.e. has completed 65% of its 1-second journey)
                    tl.to(prevCard, {
                        opacity: 0.05,
                        ease: "none",
                        duration: 0.35,
                        force3D: true // Fix 4 — keep GPU layer alive during opacity fade
                    }, startTime + 0.65);
                }

                const prevPrevCard = cards[index - 2];
                if (prevPrevCard) {
                    tl.to(prevPrevCard, {
                        opacity: 0,
                        ease: "none",
                        duration: 0.35,
                        force3D: true // Fix 4 — keep GPU layer alive during opacity fade
                    }, startTime + 0.65);
                }
            }
        });
    });
}
