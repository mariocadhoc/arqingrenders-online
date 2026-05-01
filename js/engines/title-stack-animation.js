export class TitleStackAnimation {
    constructor(selector) {
        this.element = document.querySelector(selector);
        this.chars = [];

        this.stackedState = [];
        this.ticking = false;

        this.footerEl = null;
        this._lastOpacity = null;

        this.onResize = this.handleResize.bind(this);
        this.onScroll = this.handleScroll.bind(this);

        if (this.element) this.init();
    }

    init() {
        this.splitText();

        if (typeof gsap !== 'undefined') {
            gsap.set(this.chars, {
                opacity: 0,
                y: 50,
                scale: 0.8,
                rotation: 0
            });
        }

        this.setInitialStyles();
        this.footerEl = document.querySelector('footer') || document.querySelector('#footer');
        this.element.style.opacity = '1';

        requestAnimationFrame(() => {
            this.measureStates();
            this.animate();
        });

        window.addEventListener('resize', this.onResize);
        window.addEventListener('scroll', this.onScroll, { passive: true });
    }

    splitText() {
        const text = (this.element.textContent || '').trim();
        this.element.innerHTML = '';
        this.element.style.whiteSpace = 'nowrap';

        for (const char of text) {
            const span = document.createElement('span');
            span.textContent = char;
            span.classList.add('title-char');
            span.style.display = 'inline-block';
            span.style.willChange = 'transform, top, left, font-size';
            span.style.opacity = '0';
            this.element.appendChild(span);
            this.chars.push(span);
        }
    }

    setInitialStyles() {
        this.element.style.position = 'relative';
        this.element.style.zIndex = '100';
    }

    measureStates() {
        this.stackedState = this.calculateStackedState();
    }

    calculateStackedState() {
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const charCount = this.chars.length;

        const leftMargin = Math.max(viewportWidth * 0.05, 20);
        const availableHeight = viewportHeight * 0.7;

        const customLineHeight = this.element.dataset.lineHeight;
        const lineHeight = customLineHeight ? parseFloat(customLineHeight) : 0.85;
        let targetFontSize = availableHeight / Math.max(charCount * lineHeight, 1);
        targetFontSize = Math.min(Math.max(targetFontSize, 40), 120);

        const totalStackHeight = charCount * targetFontSize * lineHeight;
        const startY = (viewportHeight - totalStackHeight) / 2;

        return this.chars.map((_, index) => ({
            top: startY + (index * targetFontSize * lineHeight),
            left: leftMargin,
            fontSize: targetFontSize
        }));
    }

    animate() {
        if (typeof gsap === 'undefined') return;

        const tl = gsap.timeline();

        tl.to(this.chars, {
            opacity: 1,
            y: 0,
            scale: 1,
            stagger: 0.038,
            duration: 0.6,
            ease: 'back.out(1.7)'
        });

        tl.add(() => {
            const currentRects = this.chars.map(char => char.getBoundingClientRect());

            this.chars.forEach((char, i) => {
                const rect = currentRects[i];
                char.style.position = 'fixed';
                char.style.left = `${rect.left}px`;
                char.style.top = `${rect.top}px`;
                char.style.margin = '0';
                char.style.width = 'auto';

                gsap.set(char, { x: 0, y: 0, scale: 1, transform: 'none' });
            });
        });

        tl.to(this.chars, {
            top: i => this.stackedState[i].top,
            left: i => this.stackedState[i].left,
            fontSize: i => this.stackedState[i].fontSize,
            duration: 0.9,
            ease: 'expo.inOut',
            stagger: 0.03,
            onComplete: () => {
                this.element.classList.add('is-stacked');
            }
        });

        tl.add(() => {
            window.dispatchEvent(new CustomEvent('titleAnimationComplete'));
        }, '-=0.56');
    }

    handleScroll() {
        if (this.ticking) return;
        this.ticking = true;

        requestAnimationFrame(() => {
            if (!this.element.classList.contains('is-stacked')) {
                this.ticking = false;
                return;
            }

            const scrollY = window.scrollY;
            const viewportHeight = window.innerHeight;

            const fadeEnd = viewportHeight * 0.5;
            const fadeDistance = Math.max(fadeEnd, 1);

            let opacity = 1;
            if (scrollY <= fadeEnd) {
                const progress = scrollY / fadeDistance;
                opacity = 1 - (progress * 0.75);
            } else {
                opacity = 0.1;
            }

            let verticalShift = 0;
            const footer = this.footerEl || (this.footerEl = document.querySelector('footer') || document.querySelector('#footer'));

            if (footer && this.chars.length) {
                const footerRect = footer.getBoundingClientRect();
                const lastIdx = this.chars.length - 1;
                const lastCharState = this.stackedState[lastIdx];

                const baseTop = lastCharState.top;
                const charHeight = lastCharState.fontSize * 0.85;
                const bottomEdge = baseTop + charHeight;

                const gap = 50;
                if (footerRect.top < (bottomEdge + gap)) {
                    verticalShift = (bottomEdge + gap) - footerRect.top;
                }
            }

            if (this._lastOpacity !== opacity) {
                this.element.style.opacity = `${opacity}`;
                this._lastOpacity = opacity;
            }

            for (let i = 0; i < this.chars.length; i++) {
                const char = this.chars[i];
                const baseTop = this.stackedState[i].top;
                char.style.top = `${baseTop - verticalShift}px`;
            }

            this.ticking = false;
        });
    }

    handleResize() {
        if (!this.element.classList.contains('is-stacked')) return;

        this.stackedState = this.calculateStackedState();

        if (typeof gsap === 'undefined') {
            for (let i = 0; i < this.chars.length; i++) {
                const char = this.chars[i];
                char.style.top = `${this.stackedState[i].top}px`;
                char.style.left = `${this.stackedState[i].left}px`;
                char.style.fontSize = `${this.stackedState[i].fontSize}px`;
            }
            return;
        }

        for (let i = 0; i < this.chars.length; i++) {
            const char = this.chars[i];
            gsap.to(char, {
                top: this.stackedState[i].top,
                left: this.stackedState[i].left,
                fontSize: this.stackedState[i].fontSize,
                duration: 0.4
            });
        }
    }
}
