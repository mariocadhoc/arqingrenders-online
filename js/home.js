/**
 * HOME.JS (Entry Point)
 * Orchestrates the loading of individual interaction engines.
 */

import ScrollInteractionEngine from './engines/ScrollInteractionEngine.js';
import MouseTiltEngine from './engines/MouseTiltEngine.js';
import EditorialRevealEngine from './engines/EditorialRevealEngine.js';
import TestimonialCards from './engines/TestimonialCards.js';
import LabelSmokeEngine from './engines/LabelSmokeEngine.js';
import PortfolioTitleEngine from './engines/PortfolioTitleEngine.js';
import HeroRevealEngine from './engines/HeroRevealEngine.js';
import BigTitleEngine from './engines/BigTitleEngine.js';
import BigTitleScrollEngine from './engines/BigTitleScrollEngine.js';
import BigTitleCinematicEngine from './engines/BigTitleCinematicEngine.js';
import VisualConfidenceEngine from './engines/VisualConfidenceEngine.js';
import MobileCollabReveal from './engines/mobile/MobileCollabReveal.js';
import TestimonialCardsMobile from './engines/mobile/TestimonialCardsMobile.js';
import CollabRevealEngine from './engines/CollabRevealEngine.js';

const isMobile = window.innerWidth <= 768;

function initMobileBigTitleFade() {
    const section = document.querySelector('.section-big-title');
    if (!section) return;

    const reveal = () => section.classList.add('is-mobile-title-visible');

    if (typeof IntersectionObserver === 'undefined') {
        reveal();
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            reveal();
            observer.disconnect();
        });
    }, {
        threshold: 0.35,
        rootMargin: '0px 0px -12% 0px'
    });

    observer.observe(section);
}

document.addEventListener('DOMContentLoaded', () => {
    new ScrollInteractionEngine();
    new MouseTiltEngine();
    new EditorialRevealEngine();

    // Choose Testimonial Engine based on device width
    if (isMobile) {
        new TestimonialCardsMobile();
    } else {
        new TestimonialCards();
    }

    new LabelSmokeEngine();
    new PortfolioTitleEngine();
    new HeroRevealEngine();

    // Big Title: mobile is handled by static HTML/CSS; desktop keeps the cinematic morph.
    if (!isMobile) {
        new BigTitleEngine();
        new BigTitleScrollEngine();
        new BigTitleCinematicEngine();
    } else {
        initMobileBigTitleFade();
    }

    new VisualConfidenceEngine();

    if (isMobile) {
        new MobileCollabReveal();
    } else {
        new CollabRevealEngine();
    }
});
