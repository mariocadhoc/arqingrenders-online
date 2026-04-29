export default class StillsCrossCTAEngine {
    constructor() {
        this.buttons = Array.from(document.querySelectorAll('.stills-cross-link.final-cta-btn'));
        this.resizeTimer = null;
        this.cursorWrapper = null;
        this.cursor = null;
        this.cursorX = 0;
        this.cursorY = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.rafId = null;
        this.activeText = null;

        if (!this.buttons.length) return;
        this.init();
    }

    init() {
        this.buildStructures();
        this.setupObserver();
        this.setupResizeHandler();
        this.setupCursor();
        this.setupClickPulse();
    }

    buildStructures() {
        const svgNS = 'http://www.w3.org/2000/svg';

        this.buttons.forEach((btn) => {
            if (!btn.querySelector('.final-cta-svg-border')) {
                const svg = document.createElementNS(svgNS, 'svg');
                svg.classList.add('final-cta-svg-border');
                svg.setAttribute('aria-hidden', 'true');
                svg.setAttribute('preserveAspectRatio', 'none');

                const rect = document.createElementNS(svgNS, 'rect');
                svg.appendChild(rect);
                btn.insertBefore(svg, btn.firstChild);
            }

            if (!btn.querySelector('.final-cta-fill')) {
                const fill = document.createElement('span');
                fill.classList.add('final-cta-fill');
                fill.setAttribute('aria-hidden', 'true');
                btn.insertBefore(fill, btn.firstChild);
            }

            if (!btn.querySelector('.final-cta-arrow')) {
                const arrowWrap = document.createElement('span');
                arrowWrap.classList.add('final-cta-arrow');
                arrowWrap.setAttribute('aria-hidden', 'true');
                arrowWrap.innerHTML = `
                    <span class="final-cta-arrow-dot">
                        <svg viewBox="0 0 24 24">
                            <path d="M5 12h14M13 6l6 6-6 6"/>
                        </svg>
                    </span>`;
                btn.appendChild(arrowWrap);
            }
        });
    }

    syncSvgRect(btn) {
        const svg = btn.querySelector('.final-cta-svg-border');
        const rect = svg?.querySelector('rect');
        if (!svg || !rect) return 0;

        const w = btn.offsetWidth;
        const h = btn.offsetHeight;
        const r = Math.min(w, h) / 2;

        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        rect.setAttribute('x', '0.5');
        rect.setAttribute('y', '0.5');
        rect.setAttribute('width', w - 1);
        rect.setAttribute('height', h - 1);
        rect.setAttribute('rx', r);
        rect.setAttribute('ry', r);

        return 2 * (w - 1) + 2 * (h - 1);
    }

    drawBorder(btn) {
        if (btn.dataset.ctaDrawn === 'true') return;
        btn.dataset.ctaDrawn = 'true';

        const rect = btn.querySelector('.final-cta-svg-border rect');
        if (!rect) return;

        const perimeter = this.syncSvgRect(btn);
        rect.style.strokeDasharray = `${perimeter}`;
        rect.style.strokeDashoffset = `${perimeter}`;

        void rect.getBoundingClientRect();

        rect.style.transition = 'stroke-dashoffset 4.2s cubic-bezier(0.19, 1, 0.22, 1)';
        rect.style.strokeDashoffset = '0';
    }

    setupObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;

                const btn = entry.target;
                btn.classList.add('is-visible');

                setTimeout(() => {
                    this.syncSvgRect(btn);
                    this.drawBorder(btn);
                }, 620);

                observer.unobserve(btn);
            });
        }, { threshold: 0.3 });

        this.buttons.forEach((btn) => observer.observe(btn));
    }

    setupResizeHandler() {
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimer);
            this.resizeTimer = setTimeout(() => {
                this.buttons.forEach((btn) => {
                    const rect = btn.querySelector('.final-cta-svg-border rect');
                    const perimeter = this.syncSvgRect(btn);

                    if (btn.dataset.ctaDrawn === 'true' && rect) {
                        rect.style.transition = 'none';
                        rect.style.strokeDasharray = `${perimeter}`;
                        rect.style.strokeDashoffset = '0';
                    }
                });
            }, 120);
        });
    }

    setupCursor() {
        const isTouchDevice = window.matchMedia('(hover: none)').matches;
        if (isTouchDevice) return;

        this.cursorWrapper = document.createElement('div');
        this.cursorWrapper.classList.add('cta-cursor-wrapper');
        this.cursorWrapper.setAttribute('aria-hidden', 'true');
        this.cursorWrapper.innerHTML = `
            <div class="cta-cursor" id="stillsCtaCursor">
                <div class="cta-cursor-ring"></div>
                <div class="cta-cursor-icon"></div>
            </div>`;
        document.body.appendChild(this.cursorWrapper);

        this.cursor = this.cursorWrapper.querySelector('#stillsCtaCursor');

        document.addEventListener('mousemove', (event) => {
            this.targetX = event.clientX;
            this.targetY = event.clientY;
        });

        this.buttons.forEach((btn) => {
            btn.addEventListener('mouseenter', (event) => {
                this.activeText = btn.querySelector('.final-cta-text');
                this.cursorX = event.clientX;
                this.cursorY = event.clientY;
                this.targetX = event.clientX;
                this.targetY = event.clientY;
                this.cursorWrapper.style.transform = `translate(${this.cursorX}px, ${this.cursorY}px)`;
                this.cursor.classList.add('is-active');
                
                const rect = btn.getBoundingClientRect();
                const x = event.clientX - rect.left - rect.width / 2;
                const y = event.clientY - rect.top - rect.height / 2;
                this.updateChromaticAberration(this.activeText, x, y);
                
                if (!this.rafId) this.lerpCursor();
            });

            btn.addEventListener('mousemove', (event) => {
                const rect = btn.getBoundingClientRect();
                const x = event.clientX - rect.left - rect.width / 2;
                const y = event.clientY - rect.top - rect.height / 2;
                this.updateChromaticAberration(this.activeText, x, y);
            });

            btn.addEventListener('mouseleave', () => {
                this.toggleChromaticAberration(this.activeText, false);
                this.activeText = null;
                this.cursor.classList.remove('is-active');
                cancelAnimationFrame(this.rafId);
                this.rafId = null;
            });
        });
    }

    lerpCursor() {
        this.cursorX += (this.targetX - this.cursorX) * 0.34;
        this.cursorY += (this.targetY - this.cursorY) * 0.34;
        this.cursorWrapper.style.transform = `translate(${this.cursorX}px, ${this.cursorY}px)`;
        this.rafId = requestAnimationFrame(() => this.lerpCursor());
    }

    updateChromaticAberration(textEl, x, y) {
        if (!textEl) return;

        const factor = 0.02;
        const maxOffset = 3;
        const offsetX = Math.max(-maxOffset, Math.min(maxOffset, x * factor));
        const offsetY = Math.max(-maxOffset, Math.min(maxOffset, y * factor));

        textEl.style.filter = `
            drop-shadow(${-offsetX}px ${offsetY}px 0px rgba(255, 0, 0, 0.42))
            drop-shadow(${offsetX}px ${-offsetY}px 0px rgba(0, 255, 255, 0.42))
        `;
    }

    toggleChromaticAberration(textEl, isActive) {
        if (!textEl) return;

        if (!isActive) {
            textEl.style.filter = '';
        }
    }

    setupClickPulse() {
        this.buttons.forEach((btn) => {
            btn.addEventListener('click', () => {
                btn.style.transition = 'transform 0.12s ease';
                btn.style.transform = 'scale(0.97)';

                setTimeout(() => {
                    btn.style.transform = '';
                    setTimeout(() => {
                        btn.style.transition = '';
                    }, 200);
                }, 120);
            });
        });
    }
}
