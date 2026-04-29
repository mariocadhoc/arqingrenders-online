/**
 * SubtitleLine2Mobile.js
 * Mobile-optimized Line 2 animation.
 * Theme: Simplified Elastic (Option A) - Reduced overshoot, faster.
 */
export class SubtitleLine2Mobile {
    constructor(selector) {
        this.element = document.querySelector(selector);

        if (this.element) {
            this.init();
        }
    }

    init() {
        this.splitText();

        if (typeof gsap !== 'undefined') {
            const chars = this.element.querySelectorAll('span');
            if (chars.length) {
                gsap.set(chars, {
                    opacity: 0,
                    scale: 0.5
                });
            }
        }

        this.element.style.opacity = '1';

        window.addEventListener('line1Complete', () => {
            this.animate();
        });
    }

    splitText() {
        const text = this.element.textContent.trim();
        this.element.innerHTML = '';

        // Split by chars for elastic effect, but simplistic
        text.split('').forEach(char => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.style.display = 'inline-block';
            span.style.opacity = '0';
            this.element.appendChild(span);
        });
    }

    animate() {
        if (typeof gsap === 'undefined') return;

        const chars = this.element.querySelectorAll('span');

        gsap.to(chars, {
            opacity: 1,
            scale: 1,
            duration: 0.6,
            stagger: 0.02, // Very fast stagger
            ease: "back.out(1.5)", // Reduced overshoot (was 3 or 1.7)
            onComplete: () => {
                // Reveal Grid Section
                gsap.fromTo('.section-work',
                    { opacity: 0, y: 30 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 1.2,
                        stagger: 0.2,
                        ease: "power1.inOut",
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
