export class NYTitleEngine {
    constructor(selector) {
        this.element = document.querySelector(selector);
        this.chars = [];
        this.heartChar = null;

        if (this.element) this.init();
    }

    init() {
        this.splitText();
        this.setInitialStyles();
        this.ensureElementOpacity();

        requestAnimationFrame(() => {
            this.animateEntrance();
            this.setupScrollAnimation();
        });
    }

    setupScrollAnimation() {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
        
        // Ensure the origin is at the top so it doesn't move visually downward when scaling
        gsap.set(this.element, { transformOrigin: "top center" });

        gsap.to(this.element, {
            scale: 0.5,
            opacity: 0.65,
            ease: "none",
            scrollTrigger: {
                trigger: this.element,
                start: "top 5vh", // Exactly when it hits the sticky margin
                end: "+=200", // Happens over 200px of scroll
                scrub: true
            }
        });
    }

    splitText() {
        // Remove multiple spaces, maybe
        const text = (this.element.textContent || '').trim().replace(/\s+/g, ' ');
        this.element.innerHTML = '';
        this.element.style.whiteSpace = 'nowrap';

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const span = document.createElement('span');
            span.textContent = char;
            span.classList.add('title-char');
            span.style.display = 'inline-block';
            span.style.willChange = 'transform, opacity';
            span.style.opacity = '0';
            
            if (char === ' ') {
                span.style.whiteSpace = 'pre';
            }
            if (char === '♡' || char === '🤍') {
                span.classList.add('ny-heart');
                this.heartChar = span;
            }

            this.element.appendChild(span);
            this.chars.push(span);
        }
    }

    setInitialStyles() {
        // Ensuring relativity isn't messing with the sticky class
        this.element.style.zIndex = '100';
    }

    ensureElementOpacity() {
        this.element.style.removeProperty('opacity');
        this.element.style.opacity = '1';
        this.element.style.setProperty('opacity', '1', 'important');
    }

    animateEntrance() {
        if (typeof gsap === 'undefined') return;

        const tl = gsap.timeline();

        gsap.set(this.chars, {
            opacity: 0,
            y: 50,
            scale: 0.8,
            rotation: 0
        });

        tl.to(this.chars, {
            opacity: 1,
            y: 0,
            scale: 1,
            stagger: 0.05,
            duration: 0.8,
            ease: 'back.out(1.7)',
            onComplete: () => {
                window.dispatchEvent(new CustomEvent('titleAnimationComplete'));
                if (this.heartChar) {
                    this.startHeartbeatLoop();
                }
            }
        });
    }

    startHeartbeatLoop() {
        // Wait a brief moment before first heartbeat
        setTimeout(() => {
            this.playHeartbeat();
        }, 1000);

        setInterval(() => {
            this.playHeartbeat();
        }, 5000);
    }

    playHeartbeat() {
        if (!this.heartChar || typeof gsap === 'undefined') return;

        const tl = gsap.timeline();
        
        tl.to(this.heartChar, {
            scale: 1.25,
            duration: 0.15,
            ease: "power2.out"
        })
        .to(this.heartChar, {
            scale: 1,
            duration: 0.15,
            ease: "power2.in"
        })
        .to(this.heartChar, {
            scale: 1.25,
            duration: 0.15,
            ease: "power2.out"
        })
        .to(this.heartChar, {
            scale: 1,
            duration: 0.3,
            ease: "power2.inOut"
        });
    }
}
