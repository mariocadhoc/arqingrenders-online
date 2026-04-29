export class SubtitleLine2Animation {
    constructor(selector) {
        this.element = document.querySelector(selector);
        this.chars = [];
        this._onLine1Complete = this.handleLine1Complete.bind(this);

        if (this.element) this.init();
    }

    init() {
        this.splitText();

        if (typeof gsap !== 'undefined' && this.chars.length) {
            gsap.set(this.chars, {
                opacity: 0,
                scale: 0,
                rotation: -15,
                transformOrigin: 'center bottom'
            });
        }

        this.element.style.opacity = '1';
        window.addEventListener('line1Complete', this._onLine1Complete, { once: true });
    }

    handleLine1Complete() {
        this.animate();
    }

    splitText() {
        const text = (this.element.textContent || '').trim();
        this.element.innerHTML = '';
        this.element.style.whiteSpace = 'nowrap';

        const frag = document.createDocumentFragment();

        for (const char of text) {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.className = 'sub-char-2';
            span.style.display = 'inline-block';
            span.style.opacity = '0';
            frag.appendChild(span);
        }

        this.element.appendChild(frag);
        this.chars = Array.from(this.element.querySelectorAll('.sub-char-2'));
    }

    animate() {
        if (typeof gsap === 'undefined' || !this.chars.length) return;

        gsap.to(this.chars, {
            opacity: 1,
            scale: 1,
            rotation: 0,
            duration: 0.9,
            stagger: 0.03,
            ease: 'back.out(3)',
            onComplete: () => {
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
                            window.dispatchEvent(new CustomEvent('workSectionsRevealComplete'));
                        }
                    }
                );
            }
        });
    }
}
