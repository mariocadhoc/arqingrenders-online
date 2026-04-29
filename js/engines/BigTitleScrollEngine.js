export default class BigTitleScrollEngine {
    constructor() {
        this.section = document.querySelector('.section-big-title');
        this.title = document.getElementById('bigTitleScroll');

        if (!this.title || !this.section) return;

        // Ensure GSAP is loaded before initializing
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            console.warn('GSAP is required for BigTitleScrollEngine');
            return;
        }

        this.init();
    }

    init() {
        // Split text dynamically
        const text = (this.title.textContent || '').trim();
        this.title.innerHTML = '';

        // Prevent CSS compositing clip bug from the parent's gradient
        this.title.style.background = 'none';
        this.title.style.webkitTextFillColor = 'unset';
        this.title.style.color = 'var(--text)';

        const chars = [];
        for (let i = 0; i < text.length; i++) {
            const span = document.createElement('span');
            span.textContent = text[i];
            span.style.display = 'inline-block';
            span.style.willChange = 'transform, opacity, filter';
            span.style.transformOrigin = 'center center';

            // Re-apply the gradient to each character independently
            span.style.background = 'linear-gradient(135deg, #fff 0%, rgba(255, 255, 255, 0.4) 100%)';
            span.style.webkitBackgroundClip = 'text';
            span.style.webkitTextFillColor = 'transparent';

            this.title.appendChild(span);
            chars.push(span);
        }

        // --- 1. ENTRANCE ANIMATION (GSAP Cinematic Reveal) ---
        gsap.fromTo(chars,
            {
                opacity: 0,
                y: 120,
                scale: 0.8,
                rotationX: 90,
                filter: 'blur(20px)'
            },
            {
                scrollTrigger: {
                    trigger: this.section,
                    start: "top 80%", // Triggers when the top of the section hits 80% down the viewport
                    once: true,
                },
                duration: 2,
                opacity: 1,
                y: 0,
                scale: 1,
                rotationX: 0,
                filter: 'blur(0px)',
                stagger: 0.15,
                ease: "expo.out"
            }
        );

        // --- 2. SCROLL DRIVEN REACTION (Responsive dynamic scroll tracking) ---
        // Letter spacing expansion and scale on the container
        gsap.to(this.title, {
            scrollTrigger: {
                trigger: this.section,
                start: "center 55%", // Starts slightly before the text reaches the exact center
                end: "bottom top", // Ends when the section leaves the viewport entirely
                scrub: 1.2
            },
            letterSpacing: "0.5em",
            opacity: 0,
            scale: 1.05,
            ease: "power2.inOut" // Smooth speed ramp up and down during scroll
        });

        // Individual character effects (Floating up dynamically)
        gsap.to(chars, {
            scrollTrigger: {
                trigger: this.section,
                start: "center 55%",
                end: "bottom top",
                scrub: 1.2
            },
            filter: 'blur(12px)',
            y: (i) => {
                // Give a subtle arch effect: outer letters go slightly higher
                const middle = text.length / 2;
                const dist = Math.abs(i - middle + 0.5);
                return -(dist * 15 + 40);
            },
            ease: "none"
        });
    }
}
