export default class ScrollInteractionEngine {
    constructor() {
        this.state = {
            scrollY: 0,
            lastScrollY: -1,
            h: window.innerHeight,
            w: window.innerWidth,
            isReduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        };

        this.dom = {
            hero: {
                container: document.getElementById('heroContainer'),
                img: document.getElementById('heroImg'),
                badge: document.querySelector('.hero-logo-badge')
            },
            workMasks: Array.from(document.querySelectorAll('.work-mask')),
            parallax: Array.from(document.querySelectorAll('.parallax-el'))
        };

        this.rafId = null;

        this.onScroll = this.handleScroll.bind(this);
        this.onResize = this.handleResize.bind(this);
        this.loopBound = this.loop.bind(this);

        this.init();
    }

    init() {
        window.addEventListener('scroll', this.onScroll, { passive: true });
        window.addEventListener('resize', this.onResize, { passive: true });
        this.rafId = requestAnimationFrame(this.loopBound);
    }

    handleScroll() {
        this.state.scrollY = window.scrollY;
    }

    handleResize() {
        this.state.h = window.innerHeight;
        this.state.w = window.innerWidth;
        // Force a re-render immediately to recalculate bounds correctly
        this.render();
    }

    loop() {
        if (Math.abs(this.state.scrollY - this.state.lastScrollY) > 0.1) {
            this.render();
            this.state.lastScrollY = this.state.scrollY;
        }
        this.rafId = requestAnimationFrame(this.loopBound);
    }

    render() {
        const { scrollY, h, w } = this.state;
        this.updateHero(scrollY, h, w);

        if (!this.state.isReduced) {
            this.updateWork(h);
            this.updateParallax(h);
        }
    }

    updateHero(scrollY, h, w) {
        const { container, img, badge } = this.dom.hero;
        if (!container || !img || this.state.isReduced) return;

        // Don't apply scroll transforms until hero has been revealed
        // Otherwise we fight with the scale(0) pending state
        if (container.classList.contains('hero-reveal-pending')) return;

        // Reduced scroll distance by ~25%
        const progress = Math.min(scrollY / Math.max(h * 0.65, 1), 1);
        const vmin = Math.min(w, h);
        
        let startSize;
        if (w <= 768) {
            // Mobile: 85vw
            startSize = w * 0.85; 
        } else if (w <= 1024) {
            // Tablet: clamp(320px, 50vmin, 650px)
            startSize = Math.max(320, Math.min(vmin * 0.50, 650));
        } else if (w <= 1366) {
            // Small laptop: clamp(320px, 55vmin, 750px)
            startSize = Math.max(320, Math.min(vmin * 0.55, 750));
        } else {
            // Desktop: clamp(320px, 60vmin, 860px)
            startSize = Math.max(320, Math.min(vmin * 0.60, 860));
        }

        const currentW = startSize + (w - startSize) * progress;
        const currentH = startSize + (h - startSize) * progress;

        container.style.width = `${currentW}px`;
        container.style.height = `${currentH}px`;

        const radius = progress <= 0.7
            ? (currentW / 2) - (((currentW / 2) - 64) * (progress / 0.7))
            : 64 * (1 - ((progress - 0.7) / 0.3));

        container.style.borderRadius = `${radius}px`;
        img.style.transform = `scale(${1.37 - (0.37 * progress)}) translateY(${progress * 20}px)`;

        if (badge) {
            // Badge fades out right after expansion, happening 25% faster
            const holdP = Math.max(0, Math.min((scrollY - (h * 0.65)) / (h * 0.2), 1));
            badge.style.opacity = `${1 - holdP}`;
        }
    }



    updateWork(h) {
        for (const mask of this.dom.workMasks) {
            const rect = mask.getBoundingClientRect();
            if (rect.top < h && rect.bottom > 0) {
                const p = Math.min(Math.max(1 - (rect.top / h), 0), 1);
                mask.style.clipPath = `inset(${18 - (18 * p)}%)`;

                const img = mask.querySelector('.work-img');
                if (img) img.style.transform = `translateY(${-25 + (p * 20)}%)`;
            }
        }
    }

    updateParallax(h) {
        for (const el of this.dom.parallax) {
            const rect = el.getBoundingClientRect();
            if (rect.top < h && rect.bottom > 0) {
                el.style.transform = `translateY(${(1 - (rect.top / h)) * 100}px)`;
            }
        }
    }
}
