import { TitleStackAnimation } from './title-stack-animation.js';

const MOBILE_BREAKPOINT = 768;

function revealWithoutGsap(lines) {
    lines.forEach((line) => {
        line.style.opacity = '1';
        line.style.transform = 'translateY(0)';
    });
}

export async function initializeWorkPageIntro({
    titleSelector,
    subtitleSelector,
    fallbackDelayMobileMs = 750,
    fallbackDelayDesktopMs = null,
    subtitleFrom = { opacity: 0, y: 30 },
    subtitleTo = { opacity: 1, y: 0, duration: 0.75, stagger: 0.15, ease: 'power3.out' },
    onSubtitleRevealStart,
    onSubtitleRevealComplete
} = {}) {
    if (!titleSelector || !subtitleSelector) {
        throw new Error('initializeWorkPageIntro requires titleSelector and subtitleSelector.');
    }

    if (typeof ScrollTrigger !== 'undefined' && typeof gsap !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }

    const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;

    if (isMobile) {
        const { TitleStackMobile } = await import('./mobile/title-stack-mobile.js');
        new TitleStackMobile(titleSelector);
    } else {
        new TitleStackAnimation(titleSelector);
    }

    const subtitleLines = Array.from(document.querySelectorAll(`${subtitleSelector} h2, ${subtitleSelector} p`));
    let hasStartedSubtitleReveal = false;
    let hasCompletedSubtitleReveal = false;

    let resolveSubtitleRevealPromise;
    const subtitleRevealPromise = new Promise((resolve) => {
        resolveSubtitleRevealPromise = resolve;
    });

    const completeSubtitleReveal = () => {
        if (hasCompletedSubtitleReveal) return;
        hasCompletedSubtitleReveal = true;
        onSubtitleRevealComplete?.({ isMobile, subtitleLines });
        resolveSubtitleRevealPromise();
    };

    const startSubtitleReveal = () => {
        if (hasStartedSubtitleReveal) return;
        hasStartedSubtitleReveal = true;
        onSubtitleRevealStart?.({ isMobile, subtitleLines });

        if (!subtitleLines.length) {
            completeSubtitleReveal();
            return;
        }

        if (typeof gsap === 'undefined') {
            revealWithoutGsap(subtitleLines);
            completeSubtitleReveal();
            return;
        }

        gsap.fromTo(
            subtitleLines,
            subtitleFrom,
            {
                ...subtitleTo,
                onComplete: completeSubtitleReveal
            }
        );
    };

    window.addEventListener('titleAnimationComplete', startSubtitleReveal, { once: true });

    const fallbackDelay = isMobile ? fallbackDelayMobileMs : fallbackDelayDesktopMs;
    if (typeof fallbackDelay === 'number' && fallbackDelay >= 0) {
        window.setTimeout(startSubtitleReveal, fallbackDelay);
    }

    return {
        isMobile,
        subtitleLines,
        subtitleRevealPromise,
        startSubtitleReveal
    };
}
