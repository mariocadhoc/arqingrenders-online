export default class EditorialRevealEngine {
    constructor() {
        this.target = document.querySelector('.editorial-text');
        this.words = [];
        this.timeouts = [];
        this.hasPlayed = false;
        this.isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!this.target) return;

        if (this.isReduced) {
            this.target.classList.add('is-visible-static');
            return;
        }

        this.init();
    }

    init() {
        this.splitText();
        this.createObserver();
    }

    splitText() {
        const originalNodes = Array.from(this.target.childNodes);
        const frag = document.createDocumentFragment();

        for (const node of originalNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                const parts = node.textContent.match(/\S+|\s+/g) || [];
                for (const part of parts) {
                    if (/^\s+$/.test(part)) {
                        frag.appendChild(document.createTextNode(part));
                    } else {
                        const span = document.createElement('span');
                        span.className = 'editorial-word';
                        span.textContent = part;
                        frag.appendChild(span);
                    }
                }
            } else {
                frag.appendChild(node);
            }
        }

        this.target.innerHTML = '';
        this.target.appendChild(frag);
        this.words = Array.from(this.target.querySelectorAll('.editorial-word'));
    }

    createObserver() {
        this.observer = new IntersectionObserver(
            entries => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        this.play();
                    } else if (entry.boundingClientRect.top > 0) {
                        this.reset();
                    }
                }
            },
            { threshold: 0.2 }
        );

        this.observer.observe(this.target);
    }

    play() {
        if (!this.words.length || this.hasPlayed) return;

        this.hasPlayed = true;
        this.clearTimers();

        const indices = Array.from({ length: this.words.length }, (_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }

        const spreadMs = 400;
        for (let i = 0; i < indices.length; i++) {
            const word = this.words[indices[i]];
            const delay = (i / Math.max(indices.length, 1)) * spreadMs;
            const id = setTimeout(() => word.classList.add('is-visible'), delay);
            this.timeouts.push(id);
        }
    }

    reset() {
        this.clearTimers();
        for (const word of this.words) {
            word.classList.remove('is-visible');
        }
        this.hasPlayed = false;
    }

    clearTimers() {
        for (const id of this.timeouts) clearTimeout(id);
        this.timeouts.length = 0;
    }
}
