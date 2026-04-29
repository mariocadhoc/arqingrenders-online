export default class MouseTiltEngine {
    constructor() {
        this.state = {
            x: 0,
            y: 0,
            lastX: null,
            lastY: null,
            isReduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
            isMobile: window.innerWidth < 768
        };

        this.dom = {
            canvas: document.getElementById('collageCanvas'),
            items: Array.from(document.querySelectorAll('.collage-item')),
            header: document.getElementById('highlightHeader')
        };

        this.auto = {
            active: false,
            played: false,
            startTime: 0,
            duration: 2000,
            radius: 0.35,
            startAngle: -Math.PI / 4
        };

        this.rafId = null;
        this.observer = null;

        this.onMouseMove = this.handleMouseMove.bind(this);
        this.loopBound = this.loop.bind(this);

        this.init();
    }

    init() {
        if (this.state.isMobile || this.state.isReduced) return;

        window.addEventListener('mousemove', this.onMouseMove, { passive: true });

        if (this.dom.canvas) {
            this.observer = new IntersectionObserver(
                entries => {
                    for (const entry of entries) {
                        if (entry.isIntersecting && !this.auto.played) {
                            this.startAutoAnimation();
                        }
                    }
                },
                { threshold: 0.4 }
            );
            this.observer.observe(this.dom.canvas);
        }

        this.rafId = requestAnimationFrame(this.loopBound);
    }

    handleMouseMove(e) {
        if (this.auto.active) return;
        this.state.x = (e.clientX / window.innerWidth) - 0.5;
        this.state.y = (e.clientY / window.innerHeight) - 0.5;
    }

    startAutoAnimation() {
        this.auto.active = true;
        this.auto.played = true;
        this.auto.startTime = performance.now();
    }

    loop() {
        const now = performance.now();

        if (this.auto.active) {
            const elapsed = now - this.auto.startTime;
            const progress = Math.min(elapsed / this.auto.duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            const angle = this.auto.startAngle + (ease * 2 * Math.PI);

            this.state.x = Math.cos(angle) * this.auto.radius;
            this.state.y = Math.sin(angle) * this.auto.radius;

            if (progress >= 1) this.auto.active = false;
        }

        const xChanged = this.state.lastX === null || Math.abs(this.state.x - this.state.lastX) > 1e-4;
        const yChanged = this.state.lastY === null || Math.abs(this.state.y - this.state.lastY) > 1e-4;

        if (xChanged || yChanged) {
            this.render();
            this.state.lastX = this.state.x;
            this.state.lastY = this.state.y;
        }

        this.rafId = requestAnimationFrame(this.loopBound);
    }

    render() {
        const { x, y } = this.state;

        if (this.dom.canvas) {
            this.dom.canvas.style.transform = `rotateY(${x * 22}deg) rotateX(${y * -15}deg)`;
        }

        for (const item of this.dom.items) {
            const speed = parseFloat(item.dataset.speed) || 0;
            item.style.transform = `translate(${x * speed * 1200}px, ${y * speed * 600}px)`;

            const img = item.querySelector('img');
            if (img) img.style.transform = `translateX(${x * speed * 250}px)`;
        }

        if (this.dom.header) {
            this.dom.header.style.transform = `translate(${x * 60}px, ${y * 20}px)`;
        }
    }
}
