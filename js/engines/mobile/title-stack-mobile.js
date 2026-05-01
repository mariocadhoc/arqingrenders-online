/**
 * TitleStackMobile.js
 * Mobile-optimized version of H1 animation.
 * Features:
 * - Vertical layout preserved (smaller scale)
 * - Sticky positioning
 * - Faster entrance
 * - Reduced motion
 */
export class TitleStackMobile {
    constructor(selector) {
        this.element = document.querySelector(selector);
        this.chars = [];
        this.ticking = false;

        if (this.element) {
            this.init();
        }
    }

    init() {
        this.splitText();

        if (typeof gsap !== 'undefined' && this.chars.length) {
            gsap.set(this.chars, {
                x: -30,
                opacity: 0
            });
        }

        this.setInitialStyles();
        this.element.style.opacity = '1';

        // Animate entrance immediately
        requestAnimationFrame(() => {
            this.animateEntrance();
        });

        // Scroll Opacity Fade
        window.addEventListener('scroll', this.handleScroll.bind(this));
    }

    splitText() {
        const text = this.element.textContent.trim();
        this.element.innerHTML = '';
        this.element.style.whiteSpace = 'nowrap'; // Initially horizontal to measure? No, let's just force vertical stack CSS.

        // Actually, for mobile vertical stack, we can just use block display for spans
        // But the original design split chars. Let's keep consistency.
        text.split('').forEach(char => {
            const span = document.createElement('span');
            span.textContent = char;
            span.classList.add('title-char');
            span.style.display = 'block'; // Force vertical
            span.style.textAlign = 'center';
            span.style.willChange = 'opacity, transform';
            span.style.opacity = '0';
            this.element.appendChild(span);
            this.chars.push(span);
        });
    }

    setInitialStyles() {
        // Sticky position for mobile
        this.element.style.position = 'sticky';
        this.element.style.top = '10vh'; // Sticks near top
        this.element.style.zIndex = '0';
        this.element.style.width = 'fit-content';
        this.element.style.margin = '0'; // Align left
    }

    animateEntrance() {
        if (typeof gsap === 'undefined') return;

        const tl = gsap.timeline();

        // Simple fade and slide in from left
        tl.to(this.chars, {
            opacity: 1,
            x: 0,
            duration: 0.45,
            stagger: 0.038,
            ease: "power2.out",
            onComplete: () => {
                // Trigger line 1
                window.dispatchEvent(new CustomEvent('titleAnimationComplete'));
            }
        });
    }

    handleScroll() {
        if (this.ticking) return;

        this.ticking = true;
        requestAnimationFrame(() => {
            const scrollY = window.scrollY;
            const viewportHeight = window.innerHeight;

            // Opacity Logic (Fade out as user scrolls deep)
            const fadeStart = viewportHeight * 0.2;
            const fadeEnd = viewportHeight * 0.8;
            const fadeDistance = fadeEnd - fadeStart;

            let opacity = 1;

            if (scrollY > fadeStart) {
                const progress = (scrollY - fadeStart) / fadeDistance;
                opacity = Math.max(0.1, 1 - progress);
            }

            this.element.style.opacity = opacity;
            this.ticking = false;
        });
    }
}
