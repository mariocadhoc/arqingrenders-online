import BlogRevealEngine from './engines/BlogRevealEngine.js';

document.addEventListener('DOMContentLoaded', () => {
    const engine = new BlogRevealEngine();

    // Hero title char reveal
    const heroTitle = document.querySelector('.blog-hero-title');
    if (heroTitle) engine.revealTitle(heroTitle);

    // Card grid stagger reveal
    engine.observe('.blog-grid');
});
