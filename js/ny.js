/**
 * NY.JS
 * Page logic for the /studio/ny/ landing page.
 * Title entrance + heartbeat (NYTitleEngine), H2 reveal and
 * section scroll-reveals mirroring /studio/team, and the
 * JSON-driven NYC projects map (NYMapEngine).
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Register GSAP Plugins
    if (typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const { NYTitleEngine } = await import('./engines/NYTitleEngine.js');
    new NYTitleEngine('h1.work-title.ny-title');

    // Hero sequence: H1 entrance → cipher H2 → hero body (subline + CTA).
    // Fires on titleAnimationComplete (last letter landed); the heartbeat
    // runs independently on its own timer inside NYTitleEngine.
    const heroBody = document.querySelector('.ny-hero-body');
    const subtitle = document.querySelector('.ny-subtitle');
    const revealHero = () => {
        subtitle?.classList.add('is-visible');
        const heroBodyDelay = reduceMotion ? 0 : 1000; // cipher lines 0.8s + 0.18s offset
        setTimeout(() => heroBody?.classList.add('is-revealed'), heroBodyDelay);
    };

    if (typeof gsap === 'undefined') {
        // No GSAP → no entrance event will ever fire; show everything.
        revealHero();
    } else {
        window.addEventListener('titleAnimationComplete', revealHero, { once: true });
    }

    // Section scroll-reveals — IntersectionObserver pattern from /studio/team.
    // One observer drives every section entrance; per-element choreography
    // (column stagger, pill stagger, CTA cascade) lives in ny.css off .is-visible.

    // Proof-strip counters: count up once, preserving prefix/suffix ("$", "+", "M+").
    // With reduced motion the markup already holds the final values, so we skip.
    let countersPlayed = false;
    const playCounters = (strip) => {
        if (countersPlayed) return;
        countersPlayed = true;
        if (reduceMotion || typeof gsap === 'undefined') return;

        strip.querySelectorAll('.ny-stat-value').forEach((el, index) => {
            const match = (el.textContent || '').trim().match(/^([^0-9]*)(\d+)(.*)$/);
            if (!match) return;
            const prefix = match[1];
            const target = parseInt(match[2], 10);
            const suffix = match[3];
            const state = { value: 0 };

            el.textContent = prefix + '0' + suffix;
            gsap.to(state, {
                value: target,
                duration: 1.4,
                delay: index * 0.12,
                ease: 'power2.out',
                onUpdate: () => {
                    el.textContent = prefix + Math.round(state.value) + suffix;
                }
            });
        });
    };

    const revealSections = document.querySelectorAll('.section-work, .ny-proof, .ny-positioning, .ny-closing');
    if (revealSections.length) {
        const sectionObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
                if (entry.target.classList.contains('ny-proof')) {
                    playCounters(entry.target);
                }
                if (typeof ScrollTrigger !== 'undefined') {
                    ScrollTrigger.refresh();
                }
            });
        }, { threshold: 0.12 });

        revealSections.forEach((section) => sectionObserver.observe(section));
    }

    // NYC projects map (data from /studio/ny/projects-nyc.json)
    const { NYMapEngine } = await import('./engines/NYMapEngine.js');
    new NYMapEngine('nyc-map');
});
