/**
 * NY.JS
 * Reveal Animation for NY Landing Page
 */



document.addEventListener('DOMContentLoaded', async () => {
    // Register GSAP Plugins
    if (typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }

    const { NYTitleEngine } = await import('./engines/NYTitleEngine.js');
    new NYTitleEngine('h1.work-title.ny-title');

    // Cipher-decode subtitle (same engine for mobile & desktop — lightweight)
    const { CipherSubtitleEngine } = await import('./engines/CipherSubtitleEngine.js');
    new CipherSubtitleEngine('.ny-subtitle');

    // NY Map Logic Below... (existing code handled in HTML script tag currently)
});
