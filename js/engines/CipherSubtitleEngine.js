/**
 * CipherSubtitleEngine.js
 * ───────────────────────────────────────────────
 * "Soft Veil" text reveal.
 * Each word gently emerges from a soft blur with a
 * slow upward drift — like text materializing through
 * morning fog. Calm, elegant, unhurried.
 *
 * Designed for premium architectural visualization clients.
 * ───────────────────────────────────────────────
 */

export class CipherSubtitleEngine {
    /**
     * @param {string} selector  CSS selector for the h2 wrapper
     * @param {object} opts
     * @param {string} opts.trigger  Event name to wait for before starting
     */
    constructor(selector, opts = {}) {
        this.wrapper = document.querySelector(selector);
        this.trigger = opts.trigger || 'titleAnimationComplete';
        this.lines = [];

        if (this.wrapper) this.init();
    }

    init() {
        this.lineEls = Array.from(this.wrapper.querySelectorAll('.cipher-line'));
        if (!this.lineEls.length) return;

        this.lineEls.forEach(lineEl => {
            const text = (lineEl.textContent || '').trim();
            const words = text.split(/\s+/);
            lineEl.innerHTML = '';
            lineEl.style.opacity = '1';
            lineEl.style.display = 'block';

            const wordSpans = [];
            words.forEach(word => {
                const span = document.createElement('span');
                span.className = 'cipher-word';
                span.textContent = word;
                span.style.display = 'inline-block';
                span.style.opacity = '0';
                span.style.filter = 'blur(8px)';
                span.style.marginRight = '0.35em';
                span.style.willChange = 'filter, opacity, transform';
                lineEl.appendChild(span);
                wordSpans.push(span);
            });

            this.lines.push({ el: lineEl, words: wordSpans });
        });

        window.addEventListener(this.trigger, () => this.play(), { once: true });
    }

    play() {
        if (typeof gsap === 'undefined') return;

        const masterTL = gsap.timeline({
            onComplete: () => {
                window.dispatchEvent(new CustomEvent('line1Complete'));

                // Reveal the map / work section
                gsap.fromTo('.section-work',
                    { opacity: 0, y: 30 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 1.5,
                        stagger: 0.2,
                        ease: 'power1.inOut',
                        clearProps: 'transform',
                        onComplete: () => {
                            if (typeof ScrollTrigger !== 'undefined') {
                                ScrollTrigger.refresh();
                            }
                        }
                    }
                );
            }
        });

        // Animate each line at the SAME time (position 0)
        // Wind sweeps left-to-right across both rows simultaneously
        this.lines.forEach(line => {
            masterTL.to(line.words, {
                opacity: 1,
                filter: 'blur(0px)',
                y: 0,
                duration: 1,
                ease: 'power2.out',
                stagger: 0.12,
                startAt: {
                    y: 14,
                    opacity: 0,
                    filter: 'blur(8px)'
                }
            }, 0); // position 0 = both lines start at the same instant
        });
    }
}
