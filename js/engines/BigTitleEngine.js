export default class BigTitleEngine {
    constructor() {
        this.dom = {
            section: document.querySelector('.section-big-title'),
            title: document.getElementById('bigTitleHeader')
        };
        if (!this.dom.title || !this.dom.section) return;

        this.state = {
            x: 0,
            y: 0,
            lastX: 0,
            lastY: 0,
            isReduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
            isMobile: window.innerWidth < 768
        };

        this.auto = {
            active: false,
            played: false,
            startTime: 0,
            duration: 2500,
            radius: 0.8,
            startAngle: -Math.PI / 2
        };

        this.rafId = null;
        this.observer = null;
        this.onMouseMove = this.handleMouseMove.bind(this);
        this.loopBound = this.loop.bind(this);

        this.init();
    }

    init() {
        // Initial state
        this.dom.title.style.opacity = '0';
        this.dom.title.style.transform = 'scale(0.8) translateY(100px)';
        this.dom.title.style.letterSpacing = '0.3em';
        
        // CSS transition for the reveal
        this.dom.title.style.transition = 'opacity 1.5s ease-out, transform 1.5s cubic-bezier(0.16, 1, 0.3, 1), letter-spacing 1.5s cubic-bezier(0.16, 1, 0.3, 1)';

        if (!this.state.isReduced && !this.state.isMobile) {
            window.addEventListener('mousemove', this.onMouseMove, { passive: true });
        }

        this.observer = new IntersectionObserver(
            entries => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        if (!this.auto.played) {
                            // Trigger Reveal
                            setTimeout(() => {
                                this.dom.title.style.opacity = '1';
                                this.dom.title.style.transform = 'scale(1) translateY(0) translate3d(0,0,0) rotateX(0) rotateY(0)';
                                this.dom.title.style.letterSpacing = '-0.04em';
                            }, 100);

                            if (!this.state.isReduced && !this.state.isMobile) {
                                // Start autopilot slightly after reveal
                                setTimeout(() => {
                                    this.startAutoAnimation();
                                }, 1200);
                            }
                            this.auto.played = true; // completely mark as played
                        }
                    }
                }
            },
            { threshold: 0.5 }
        );
        this.observer.observe(this.dom.section);

        if (!this.state.isReduced && !this.state.isMobile) {
            this.rafId = requestAnimationFrame(this.loopBound);
        }
    }

    handleMouseMove(e) {
        if (this.auto.active || !this.auto.played) return;
        
        // Track mouse position mapped between -1 and 1
        this.state.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.state.y = (e.clientY / window.innerHeight) * 2 - 1;

        // Clamp values
        this.state.x = Math.max(-1, Math.min(1, this.state.x));
        this.state.y = Math.max(-1, Math.min(1, this.state.y));
    }

    startAutoAnimation() {
        this.auto.active = true;
        this.auto.startTime = performance.now();
        // Remove the CSS transition to allow programmatic control
        this.dom.title.style.transition = 'none';
        
        this.state.x = 0;
        this.state.y = 0;
        this.state.lastX = 0;
        this.state.lastY = 0;
    }

    loop() {
        const now = performance.now();

        if (this.auto.active) {
            const elapsed = now - this.auto.startTime;
            const progress = Math.min(elapsed / this.auto.duration, 1);

            // Full circle animation
            const angle = this.auto.startAngle + (progress * 2 * Math.PI); 
            
            // Radius goes from 0 to max and back to 0 perfectly smoothed
            const rad = this.auto.radius * Math.sin(progress * Math.PI); 

            const targetX = Math.cos(angle) * rad;
            const targetY = Math.sin(angle) * rad;

            this.state.x = targetX;
            this.state.y = targetY;

            if (progress >= 1) {
                this.auto.active = false;
                this.state.x = 0;
                this.state.y = 0;
            }
        }

        // Apply smoothing
        const dx = this.state.x - this.state.lastX;
        const dy = this.state.y - this.state.lastY;
        
        this.state.lastX += dx * 0.08;
        this.state.lastY += dy * 0.08;

        if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001 || this.auto.active) {
            this.render();
        }

        this.rafId = requestAnimationFrame(this.loopBound);
    }

    render() {
        const x = this.state.lastX;
        const y = this.state.lastY;
        
        const rotY = x * 30; // max 30deg
        const rotX = y * -30; // max 30deg

        const transX = x * 40; 
        const transY = y * 40; 

        // Shadow opposite to mouse
        const shadowX = x * -50;
        const shadowY = y * -50;
        const shadowDist = Math.sqrt(x*x + y*y);

        this.dom.title.style.transform = `translate3d(${transX}px, ${transY}px, 0) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${1 + shadowDist * 0.1})`;
        
        this.dom.title.style.filter = `drop-shadow(${shadowX * 0.5}px ${shadowY * 0.5}px 30px rgba(255,255,255,${shadowDist * 0.3}))`;
    }
}
