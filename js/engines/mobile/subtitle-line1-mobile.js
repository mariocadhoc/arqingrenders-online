/**
 * SubtitleLine1Mobile.js
 * Mobile-optimized Line 1 animation.
 * Theme: Fade + Slide (Option B) - Clean and fast.
 */
export class SubtitleLine1Mobile {
    constructor(selector) {
        this.element = document.querySelector(selector);

        if (this.element) {
            this.init();
        }
    }

    init() {
        this.splitText();

        if (typeof gsap !== 'undefined') {
            const words = this.element.querySelectorAll('span');
            if (words.length) {
                gsap.set(words, {
                    y: -20,
                    opacity: 0
                });
            }
        }

        this.element.style.opacity = '1';

        // Wait for title animation to complete
        window.addEventListener('titleAnimationComplete', () => {
            this.animate();
        });
    }

    splitText() {
        // Words for cleaner animation
        const text = this.element.textContent.trim();
        const words = text.split(' ');

        this.element.innerHTML = '';

        words.forEach(word => {
            const span = document.createElement('span');
            span.textContent = word;
            span.style.display = 'inline-block';
            span.style.opacity = '0';
            span.style.marginRight = '0.3em';
            this.element.appendChild(span);
        });
    }

    animate() {
        if (typeof gsap === 'undefined') return;

        const words = this.element.querySelectorAll('span');

        gsap.to(words, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.075, // Fast sequential
            ease: "power2.out",
            onComplete: () => {
                window.dispatchEvent(new CustomEvent('line1Complete'));
            }
        });
    }
}
