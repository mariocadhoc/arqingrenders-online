import BlogRevealEngine from './engines/BlogRevealEngine.js';

document.addEventListener('DOMContentLoaded', async () => {
    const engine = new BlogRevealEngine();

    // Hero sequence, strictly top-to-bottom: title begins typing, then the
    // dek and meta row fade in early at 1/3 (33%) into the title animation,
    // then the feature image follows shortly after.
    const heroTitle = document.querySelector('.blog-post-title');
    const revealHeroSequence = () => {
        document.querySelector('.blog-post-dek')?.classList.add('is-visible');
        document.querySelector('.blog-post-meta-row')?.classList.add('is-visible');

        window.setTimeout(() => {
            document.querySelector('.blog-post-feature')?.classList.add('is-visible');
        }, 250);
    };
    if (heroTitle) {
        engine.revealTitle(heroTitle, { sequenceCallback: revealHeroSequence, sequenceProgress: 0.33 });
    } else {
        revealHeroSequence();
    }

    // Reading progress bar
    engine.initProgressBar(document.querySelector('.blog-post-progress-bar'));

    // Scroll reveals across the rest of the article body
    engine.revealProse('.blog-prose');
    engine.observe('.blog-stat-intro');
    engine.observe('.blog-stat-band');
    engine.observe('.blog-row');
    engine.observe('.blog-pull-quote');
    engine.observe('.blog-cta-band');
    engine.observe('.blog-end-divider');
    engine.observe('.blog-related .blog-grid');

    // Subtle parallax on the full-bleed feature image
    engine.initParallax('.blog-post-feature img', { speed: 0.12 });

    // Before / after compare sliders (an article can carry more than one)
    const compareEls = document.querySelectorAll('.blog-compare');
    if (compareEls.length) {
        const { default: BeforeAfterEngine } = await import('./engines/BeforeAfterEngine.js');
        compareEls.forEach((el) => new BeforeAfterEngine(el));
    }
});
