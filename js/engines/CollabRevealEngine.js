export default class CollabRevealEngine {
    constructor() {
        this.state = {
            scrollY: 0,
            lastScrollY: -1,
            h: window.innerHeight,
            isReduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        };

        this.dom = {
            items: Array.from(document.querySelectorAll('.collab-step')),
            strip: document.getElementById('numberStrip'),
            images: Array.from(document.querySelectorAll('.step-fade-img')),
            headlineReel: document.getElementById('headlineReel')
        };

        this._lastHeadlineStep = -1;
        this.rafId = null;

        this.onScroll = this.handleScroll.bind(this);
        this.onResize = this.handleResize.bind(this);
        this.loopBound = this.loop.bind(this);

        if (this.dom.items.length) {
            this.init();
        }
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
    }

    loop() {
        if (Math.abs(this.state.scrollY - this.state.lastScrollY) > 0.1) {
            this.render();
            this.state.lastScrollY = this.state.scrollY;
        }
        this.rafId = requestAnimationFrame(this.loopBound);
    }

    render() {
        const center = this.state.h / 2;
        const { items, strip, images, headlineReel } = this.dom;

        for (let i = 0; i < items.length; i++) {
            const step = items[i];
            const rect = step.getBoundingClientRect();
            const isActive = rect.top < center && rect.bottom > center;

            if (isActive) {
                step.classList.add('is-active');

                if (images && images[i]) {
                    images.forEach((img, idx) => {
                        if (idx === i) {
                            img.classList.add('is-active');
                        } else {
                            img.classList.remove('is-active');
                        }
                    });
                }

                if (strip && !this.state.isReduced) {
                    strip.style.transform = `translateY(-${i * 12}rem)`;
                }

                if (this._lastHeadlineStep !== i) {
                    this._lastHeadlineStep = i;
                    if (headlineReel) {
                        headlineReel.style.transform = `translateY(-${i * 1.05}em)`;
                    }
                }
            } else {
                step.classList.remove('is-active');
            }
        }
    }
}
