export class SubtitleLine1Animation {
    constructor(selector) {
        this.element = document.querySelector(selector);
        this.wordBlocks = [];
        this._onTitleComplete = this.handleTitleComplete.bind(this);
        if (this.element) this.init();
    }

    init() {
        this.splitText();

        if (typeof gsap !== 'undefined' && this.wordBlocks.length) {
            gsap.set(this.wordBlocks, { opacity: 0, y: -150 });
        }

        this.setInitialStyles();
        window.addEventListener('titleAnimationComplete', this._onTitleComplete, { once: true });
    }

    handleTitleComplete() {
        this.animate();
    }

    splitText() {
        const text = (this.element.textContent || '').trim();
        const words = text ? text.split(/\s+/) : [];

        this.element.innerHTML = '';
        this.element.style.whiteSpace = 'nowrap';

        const frag = document.createDocumentFragment();

        for (const word of words) {
            const span = document.createElement('span');
            span.textContent = word;
            span.className = 'sub-word-block';
            span.style.display = 'inline-block';
            span.style.opacity = '0';
            span.style.marginRight = '0.3em';
            span.style.willChange = 'transform, opacity';
            frag.appendChild(span);
        }

        this.element.appendChild(frag);
        this.wordBlocks = Array.from(this.element.querySelectorAll('.sub-word-block'));
    }

    setInitialStyles() {
        this.element.style.opacity = '1';
        this.element.style.overflow = 'visible';
    }

    animate() {
        if (typeof gsap === 'undefined' || !this.wordBlocks.length) return;

        const tl = gsap.timeline({
            onComplete: () => {
                window.dispatchEvent(new CustomEvent('line1Complete'));
            }
        });

        this.wordBlocks.forEach((word, i) => {
            const startTime = i * 0.11;

            tl.to(
                word,
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.45,
                    ease: 'power4.in'
                },
                startTime
            );

            tl.to(
                word,
                {
                    y: -12,
                    duration: 0.075,
                    ease: 'power2.out',
                    yoyo: true,
                    repeat: 1
                },
                '>'
            );

            tl.set(word, { y: 0 });
        });
    }
}
