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


document.addEventListener('DOMContentLoaded', () => {
    new ScrollInteractionEngine();
    new MouseTiltEngine();
    new EditorialRevealEngine();

    // Choose Testimonial Engine based on device width
    if (window.innerWidth <= 768) {
        new TestimonialCardsMobile();
    } else {
        new TestimonialCards();
    }

    new LabelSmokeEngine();
    new PortfolioTitleEngine();
    new HeroRevealEngine();
    new BigTitleEngine();
    new BigTitleScrollEngine();
    new BigTitleCinematicEngine();
    new VisualConfidenceEngine();

    if (window.innerWidth <= 768) {
        new MobileCollabReveal();
    } else {
        new CollabRevealEngine();
    }
});
