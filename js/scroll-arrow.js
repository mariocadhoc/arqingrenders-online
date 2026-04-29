// js/scroll-arrow.js
// Robust scroll-down indicator that coordinates with the hero reveal animation.
// If the user scrolls before the hero reveals, the arrow never shows (or hides immediately).

document.addEventListener("DOMContentLoaded", () => {
    // 1. Inject styles
    const style = document.createElement("style");
    style.innerHTML = `
        #scrollDownArrow {
            position: fixed;
            bottom: 5vh;
            left: 50%;
            transform: translateX(-50%);
            z-index: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-family: var(--font-sans, sans-serif);
            font-size: 0.70rem;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.6s ease;
        }

        .scroll-arrow-text {
            margin-bottom: 12px;
            font-weight: 300;
        }

        .scroll-arrow-line {
            width: 1px;
            height: 45px;
            background: rgba(255, 255, 255, 0.2);
            position: relative;
            overflow: hidden;
        }

        .scroll-arrow-line::after {
            content: '';
            position: absolute;
            top: -100%;
            left: 0;
            width: 100%;
            height: 100%;
            background: #fff;
            animation: scrollLineDrop 2s cubic-bezier(0.77, 0, 0.175, 1) infinite;
        }

        @keyframes scrollLineDrop {
            0% { transform: translateY(0); }
            100% { transform: translateY(200%); }
        }
    `;
    document.head.appendChild(style);

    // 2. Give the hero container a higher z-index so it covers the arrow on scroll
    const heroContainer = document.getElementById("heroContainer");
    if (heroContainer) {
        heroContainer.style.zIndex = "5";
    }

    // 3. Arrow element
    const arrow = document.getElementById("scrollDownArrow");
    if (!arrow) return;

    const FADE_START = 40;
    const FADE_END = 200;
    let heroRevealed = false;
    let arrowDismissed = false;

    // Check if user already scrolled before hero reveal
    function isAlreadyScrolled() {
        return (window.scrollY || window.pageYOffset) > FADE_START;
    }

    // Update arrow opacity based on scroll position
    function updateArrowOpacity() {
        const scrollY = window.scrollY || window.pageYOffset;

        // If user scrolled past threshold, dismiss permanently
        if (scrollY >= FADE_END) {
            arrow.style.opacity = "0";
            arrowDismissed = true;
            return;
        }

        // If arrow was dismissed or hero not yet revealed, keep hidden
        if (arrowDismissed || !heroRevealed) {
            arrow.style.opacity = "0";
            return;
        }

        if (scrollY <= FADE_START) {
            arrow.style.opacity = "1";
        } else {
            const progress = (scrollY - FADE_START) / (FADE_END - FADE_START);
            arrow.style.opacity = (1 - progress).toFixed(3);
        }
    }

    // When hero reveals, decide whether to show the arrow
    function onHeroRevealed() {
        heroRevealed = true;

        // If user already scrolled past the fade zone, don't show
        if (isAlreadyScrolled()) {
            arrowDismissed = true;
            arrow.style.opacity = "0";
            return;
        }

        // Fade in smoothly
        arrow.style.opacity = "1";
    }

    // Listen for the hero reveal event
    window.addEventListener("heroRevealed", onHeroRevealed, { once: true });

    // Also handle the case where hero might have already revealed before this runs
    // (e.g., if the hero-reveal-active class is already present)
    if (heroContainer && heroContainer.classList.contains("hero-reveal-active")) {
        onHeroRevealed();
    }

    // Listen for scroll to hide the arrow
    window.addEventListener("scroll", updateArrowOpacity, { passive: true });

    // Run once on load in case user refreshed mid-scroll
    updateArrowOpacity();
});
