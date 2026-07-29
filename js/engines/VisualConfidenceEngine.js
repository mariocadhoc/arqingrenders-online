export default class VisualConfidenceEngine {
    constructor() {
        this.heading = document.querySelector('.section-collab h2');
        this.isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.observer = null;
        this.timeouts = [];

        if (!this.heading) return;

        if (this.isReduced) {
            this.heading.classList.add('is-visible-static');
            return;
        }

        this.init();
    }

    init() {
        this.prepareHeading();
        this.createObserver();
    }

    prepareHeading() {
        this.heading.classList.add('visual-confidence-title');

        const reelWindow = this.heading.querySelector('.headline-reel-window');
        if (!reelWindow) return;

        const childNodes = Array.from(this.heading.childNodes);
        const firstLineNodes = [];

        for (const node of childNodes) {
            if (node === reelWindow) break;
            if (node.nodeName === 'BR') continue;
            firstLineNodes.push(node);
        }

        const line1 = document.createElement('div');
        line1.className = 'vc-line';
        const inner1 = document.createElement('span');
        inner1.className = 'vc-line-inner';

        for (const node of firstLineNodes) {
            inner1.appendChild(node);
        }
        line1.appendChild(inner1);

        const line2 = document.createElement('div');
        line2.className = 'vc-line';
        const inner2 = document.createElement('span');
        inner2.className = 'vc-line-inner vc-line-reel';
        inner2.appendChild(reelWindow);
        line2.appendChild(inner2);

        const frag = document.createDocumentFragment();
        frag.appendChild(line1);
        frag.appendChild(line2);

        this.heading.innerHTML = '';
        this.heading.appendChild(frag);
    }

    createObserver() {
        this.observer = new IntersectionObserver(
            entries => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        this.play();
                        if (this.observer) this.observer.unobserve(entry.target);
                    }
                }
            },
            { threshold: 0.3 }
        );

        this.observer.observe(this.heading);
    }

    play() {
        const lines = this.heading.querySelectorAll('.vc-line-inner');

        lines.forEach((line, index) => {
            const id = window.setTimeout(() => {
                line.classList.add('is-revealed');
            }, index * 200);

            this.timeouts.push(id);
        });
    }
}
