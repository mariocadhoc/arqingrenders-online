/**
 * BlogRevealEngine
 * Shared motion primitives for the Blog section: index and every
 * article page (EN today, ES twin later) import this single file so
 * the reveal/parallax logic never forks between languages.
 */
export default class BlogRevealEngine {
    constructor() {
        this.isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.hasGSAP = typeof window.gsap !== 'undefined';
        this.hasScrollTrigger = typeof window.ScrollTrigger !== 'undefined';

        if (this.hasGSAP && this.hasScrollTrigger) {
            window.gsap.registerPlugin(window.ScrollTrigger);
        }
    }

    /* Split a heading into per-character spans for a cinematic reveal. */
    splitTitle(el) {
        if (!el || el.dataset.btSplit === 'true') return [];
        const raw = el.textContent.trim();
        if (!raw) return [];

        el.setAttribute('aria-label', raw);
        el.textContent = '';

        const words = raw.split(/\s+/).filter(Boolean);
        const chars = [];

        words.forEach((word, wordIndex) => {
            const wordSpan = document.createElement('span');
            wordSpan.className = 'bt-word';

            Array.from(word).forEach((ch) => {
                const charSpan = document.createElement('span');
                charSpan.className = 'bt-char';
                charSpan.textContent = ch;
                charSpan.setAttribute('aria-hidden', 'true');
                wordSpan.appendChild(charSpan);
                chars.push(charSpan);
            });

            el.appendChild(wordSpan);
            if (wordIndex < words.length - 1) {
                el.appendChild(document.createTextNode(' '));
            }
        });

        el.dataset.btSplit = 'true';
        return chars;
    }

    /* Animate the split title into view (GSAP if available, CSS fallback otherwise). */
    revealTitle(el, { delay = 0, onComplete, sequenceCallback, sequenceProgress = 0.33 } = {}) {
        if (!el) return;
        const chars = this.splitTitle(el);
        if (!chars.length) {
            if (sequenceCallback) sequenceCallback();
            if (onComplete) onComplete();
            return;
        }

        if (this.isReduced) {
            chars.forEach((c) => {
                c.style.opacity = '1';
                c.style.transform = 'none';
            });
            if (sequenceCallback) sequenceCallback();
            if (onComplete) onComplete();
            return;
        }

        if (this.hasGSAP) {
            window.gsap.set(chars, { opacity: 0, y: '0.6em', rotateX: -35, filter: 'blur(6px)' });
            const totalDuration = delay + 0.9 + (chars.length - 1) * 0.016;

            if (sequenceCallback) {
                const triggerTime = delay + totalDuration * sequenceProgress;
                window.gsap.delayedCall(triggerTime, sequenceCallback);
            }

            window.gsap.to(chars, {
                opacity: 1,
                y: '0em',
                rotateX: 0,
                filter: 'blur(0px)',
                duration: 0.9,
                ease: 'power3.out',
                stagger: 0.016,
                delay,
                onComplete
            });
            return;
        }

        const lastDelay = delay + (chars.length - 1) * 0.015;
        if (sequenceCallback) {
            const triggerDelay = delay + (lastDelay + 0.6 - delay) * sequenceProgress;
            window.setTimeout(sequenceCallback, triggerDelay * 1000);
        }

        chars.forEach((c, i) => {
            const d = delay + i * 0.015;
            c.style.transition = `opacity .6s ease ${d}s, transform .6s cubic-bezier(.19,1,.22,1) ${d}s`;
            requestAnimationFrame(() => {
                c.style.opacity = '1';
                c.style.transform = 'translateY(0)';
            });
        });

        if (onComplete) {
            window.setTimeout(onComplete, (lastDelay + 0.6) * 1000);
        }
    }

    /*
     * Reveal long-form editorial copy word by word. The cadence borrows from
     * the Team bios, but is deliberately quicker so it never holds up reading.
     */
    revealProse(selector = '.blog-prose') {
        if (this.isReduced || !this.hasGSAP || !this.hasScrollTrigger) return;

        const textBlocks = Array.from(document.querySelectorAll(
            `${selector} > p, ${selector} > h2, ${selector} > ul > li`
        ));

        textBlocks.forEach((block) => {
            const words = this.splitEditorialWords(block);
            if (!words.length) return;

            const stagger = Math.min(0.018, 0.58 / Math.max(words.length - 1, 1));

            window.gsap.fromTo(words,
                {
                    opacity: 0.12,
                    y: '0.45em'
                },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.38,
                    ease: 'power2.out',
                    stagger,
                    clearProps: 'transform,opacity',
                    scrollTrigger: {
                        trigger: block,
                        start: 'top 88%',
                        once: true
                    }
                }
            );
        });
    }

    /* Split only text nodes so inline emphasis and other editorial markup survive. */
    splitEditorialWords(el) {
        if (!el || el.dataset.blogWordsSplit === 'true') return [];

        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        const textNodes = [];

        while (walker.nextNode()) {
            if (walker.currentNode.nodeValue.trim()) {
                textNodes.push(walker.currentNode);
            }
        }

        const words = [];

        textNodes.forEach((textNode) => {
            const fragment = document.createDocumentFragment();
            const tokens = textNode.nodeValue.match(/\S+|\s+/g) || [];

            tokens.forEach((token) => {
                if (/^\s+$/.test(token)) {
                    fragment.appendChild(document.createTextNode(token));
                    return;
                }

                const word = document.createElement('span');
                word.className = 'blog-prose-word';
                word.textContent = token;
                fragment.appendChild(word);
                words.push(word);
            });

            textNode.replaceWith(fragment);
        });

        el.dataset.blogWordsSplit = 'true';
        return words;
    }

    /* Generic scroll-triggered reveal: adds .is-visible to matched elements once in view. */
    observe(selector, { root = document, threshold = 0.2, once = true } = {}) {
        const els = Array.from(root.querySelectorAll(selector));
        if (!els.length) return;

        if (this.isReduced) {
            els.forEach((el) => el.classList.add('is-visible'));
            return;
        }

        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    if (once) io.unobserve(entry.target);
                } else if (!once) {
                    entry.target.classList.remove('is-visible');
                }
            });
        }, { threshold, rootMargin: '0px 0px -8% 0px' });

        els.forEach((el) => io.observe(el));
    }

    /* Subtle scrub parallax on feature imagery. */
    initParallax(selector, { speed = 0.15 } = {}) {
        if (this.isReduced || !this.hasGSAP || !this.hasScrollTrigger) return;

        document.querySelectorAll(selector).forEach((el) => {
            window.gsap.to(el, {
                yPercent: speed * 100,
                ease: 'none',
                scrollTrigger: {
                    trigger: el.parentElement,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true
                }
            });
        });
    }

    /* Fixed top progress bar tracking scroll depth. */
    initProgressBar(el) {
        if (!el) return;
        const update = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const pct = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
            el.style.width = pct + '%';
        };
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        update();
    }
}
