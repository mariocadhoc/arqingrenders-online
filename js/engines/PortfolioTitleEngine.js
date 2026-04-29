export default class PortfolioTitleEngine {
    constructor() {
        this.title = document.querySelector('.highlight-header h2');
        this.isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.observer = null;
        this.timeouts = [];

        if (!this.title) return;

        if (this.isReduced) {
            this.title.classList.add('is-visible-static');
            return;
        }

        this.init();
    }

    init() {
        this.splitText();
        this.createObserver();
    }

    splitText() {
        const text = (this.title.textContent || '').trim();
        this.title.innerHTML = '';
        this.title.style.opacity = '1';

        const frag = document.createDocumentFragment();

        for (const char of text) {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.className = 'title-char';
            frag.appendChild(span);
        }

        this.title.appendChild(frag);
    }

    createObserver() {
        this.observer = new IntersectionObserver(
            entries => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        this.play(entry.target);
                        if (this.observer) this.observer.unobserve(entry.target);
                    }
                }
            },
            { threshold: 0.5 }
        );

        this.observer.observe(this.title);
    }

    play(title) {
        const chars = title.querySelectorAll('.title-char');

        chars.forEach((char, i) => {
            const delay = i * 35;
            const id = window.setTimeout(() => {
                char.classList.add('is-visible');
            }, delay);
            this.timeouts.push(id);
        });
    }
}
