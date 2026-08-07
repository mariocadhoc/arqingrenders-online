// js/scroll-arrow.js
// Robust scroll-down indicator that coordinates with the hero reveal animation.
// Fades in subtly after the growing circle video animation completes.

document.addEventListener("DOMContentLoaded", () => {
    const arrow = document.getElementById("scrollDownArrow");
    if (!arrow) return;

    const heroContainer = document.getElementById("heroContainer");
    if (heroContainer) {
        heroContainer.style.zIndex = "5";
    }

    const FADE_START = 30;
    const FADE_END = 180;
    let heroRevealed = false;
    let arrowDismissed = false;

    function isAlreadyScrolled() {
        return (window.scrollY || window.pageYOffset) > FADE_START;
    }

    function updateArrowOpacity() {
        const scrollY = window.scrollY || window.pageYOffset;

        if (!heroRevealed || arrowDismissed) return;

        if (scrollY >= FADE_END) {
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

    function onHeroRevealed() {
        heroRevealed = true;

        if (isAlreadyScrolled()) {
            arrowDismissed = true;
            arrow.style.opacity = "0";
            return;
        }

        // Delay ~500ms after circle reveal starts so line enters right after circle completes growing
        window.setTimeout(() => {
            if (!isAlreadyScrolled()) {
                arrow.classList.add("is-visible");
            }
        }, 500);
    }

    window.addEventListener("heroRevealed", onHeroRevealed, { once: true });

    if (heroContainer && heroContainer.classList.contains("hero-reveal-active")) {
        onHeroRevealed();
    }

    window.addEventListener("scroll", updateArrowOpacity, { passive: true });
    updateArrowOpacity();
});

