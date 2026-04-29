export default class LabelSmokeEngine {
    constructor() {
        this.labels = Array.from(document.querySelectorAll('.label'));
        this.isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.timeouts = [];
        this.observer = null;

        if (!this.labels.length) return;

        if (this.isReduced) {
            this.labels.forEach(label => label.classList.add('is-visible'));
            return;
        }

        this.init();
    }

    init() {
        this.splitText();
        this.createObserver();
    }

    splitText() {
        for (const label of this.labels) {
            const text = (label.textContent || '').trim();
            label.innerHTML = '';
            label.style.opacity = '1';

            const frag = document.createDocumentFragment();

            for (const char of text) {
                const span = document.createElement('span');
                span.textContent = char === ' ' ? '\u00A0' : char;
                span.className = 'smoke-letter';
                frag.appendChild(span);
            }

            label.appendChild(frag);
        }
    }

    createObserver() {
        this.observer = new IntersectionObserver(
            entries => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        this.play(entry.target);
                        this.observer.unobserve(entry.target);
                    }
                }
            },
            { threshold: 0.2, rootMargin: '0px' }
        );

        for (const label of this.labels) {
            this.observer.observe(label);
        }
    }

    play(label) {
        const letters = label.querySelectorAll('.smoke-letter');

        letters.forEach((letter, i) => {
            const baseDelay = i * 10;
            const randomDelay = Math.random() * 240;

            const id = window.setTimeout(() => {
                letter.classList.add('is-visible');
            }, baseDelay + randomDelay);

            this.timeouts.push(id);
        });
    }
}
