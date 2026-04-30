/**
 * Vertical Cards Fade Engine
 * ──────────────────────────
 * Fades the lower sticky card opacity when the next card
 * slides up and covers about 65% of it, un-fading when scrolling up.
 */
export function initVerticalCardsFade() {
    const groups = [
        {
            wrap: document.querySelector('.vertical-scroll-container'),
            cards: gsap.utils.toArray('.vertical-scroll-container .large-image.vertical')
        }
    ];

    if (window.matchMedia('(max-width: 768px)').matches) {
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
                top: '10px',
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
                    duration: 1
                }, startTime);

                // Replicate original fade effect when a card approaches the top
                const prevCard = cards[index - 1];
                if (prevCard) {
                    // Starts fading when the incoming card is at 35% from the top (i.e. has completed 65% of its 1-second journey)
                    tl.to(prevCard, {
                        opacity: 0.05,
                        ease: "none",
                        duration: 0.35
                    }, startTime + 0.65);
                }

                const prevPrevCard = cards[index - 2];
                if (prevPrevCard) {
                    tl.to(prevPrevCard, {
                        opacity: 0,
                        ease: "none",
                        duration: 0.35
                    }, startTime + 0.65);
                }
            }
        });
    });
}
