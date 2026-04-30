export default class BigTitleCinematicEngine {
    constructor() {
        this.section = document.querySelector('.section-big-title');
        this.title = document.getElementById('bigTitleCinematic');

        if (!this.title || !this.section) return;

        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            console.warn('GSAP + ScrollTrigger required for BigTitleCinematicEngine');
            return;
        }

        this.primaryText = this.title.dataset.primaryText || this.title.querySelector('.big-title-desktop-text')?.textContent.trim() || this.title.textContent.trim();
        this.secondaryText = this.title.dataset.morphText || 'Stories Beyond Pixels';

        this.init();
    }

    init() {
        this.buildDOM();
        this.createFullScrollTimeline();
    }

    /* ───────── DOM SETUP ───────── */
    buildDOM() {
        // Wrap h1 in sticky centering div (section is 200vh, h1 stays centered via sticky)
        const sticky = document.createElement('div');
        sticky.className = 'section-big-title-sticky';
        this.section.appendChild(sticky);
        sticky.appendChild(this.title);

        this.title.textContent = '';
        this.title.style.position = 'relative';
        this.title.style.background = 'none';
        this.title.style.webkitTextFillColor = 'unset';
        this.title.style.color = 'var(--text)';

        // Primary layer — "Arqing"
        this.primaryWrap = document.createElement('div');
        this.primaryWrap.className = 'gravity-primary';
        this.primaryWrap.style.transformOrigin = 'center center';

        this.primaryChars = [];
        for (const ch of this.primaryText) {
            const span = this._charSpan(ch, 'gravity-char-pri');
            this.primaryWrap.appendChild(span);
            this.primaryChars.push(span);
        }

        // Secondary layer — "stories beyond pixels"
        this.secondaryWrap = document.createElement('div');
        this.secondaryWrap.className = 'gravity-secondary';

        this.secondaryChars = [];
        const words = this.secondaryText.toLowerCase().split(' ');
        words.forEach((word, wi) => {
            const wSpan = document.createElement('span');
            wSpan.className = 'gravity-word';
            for (const ch of word) {
                const span = this._charSpan(ch, 'gravity-char-sec');
                wSpan.appendChild(span);
                this.secondaryChars.push(span);
            }
            this.secondaryWrap.appendChild(wSpan);
            if (wi < words.length - 1) {
                const sp = document.createElement('span');
                sp.className = 'gravity-space';
                sp.textContent = '\u00A0';
                this.secondaryWrap.appendChild(sp);
            }
        });

        // SR-only accessible text
        const sr = document.createElement('span');
        sr.textContent = this.primaryText;
        sr.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)';

        this.title.appendChild(this.primaryWrap);
        this.title.appendChild(this.secondaryWrap);
        this.title.appendChild(sr);

        // Add scroll hint arrow
        this.scrollHint = document.createElement('div');
        this.scrollHint.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>`;
        this.scrollHint.style.cssText = 'position: absolute; bottom: 8vh; left: 50%; transform: translateX(-50%); color: var(--gray-1, rgba(255,255,255,0.7)); animation: cinematicBounceDown 1.5s infinite; opacity: 1; will-change: opacity;';
        
        if (!document.getElementById('cinematicBounceKeyframes')) {
            const style = document.createElement('style');
            style.id = 'cinematicBounceKeyframes';
            style.innerHTML = `@keyframes cinematicBounceDown { 0%, 100% { transform: translate(-50%, 0); } 50% { transform: translate(-50%, 10px); } }`;
            document.head.appendChild(style);
        }

        sticky.appendChild(this.scrollHint);
    }

    _charSpan(ch, cls) {
        const s = document.createElement('span');
        s.textContent = ch;
        s.className = 'gravity-char ' + cls;
        s.style.display = 'inline-block';
        s.style.willChange = 'transform, opacity, filter';
        s.style.transformOrigin = 'center bottom';
        s.style.paddingBottom = '5px';
        s.style.background = 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.4) 100%)';
        s.style.webkitBackgroundClip = 'text';
        s.style.backgroundClip = 'text';
        s.style.webkitTextFillColor = 'transparent';
        return s;
    }

    /* ───────────────────────────────────────────────────────────
       SINGLE SCROLL-DRIVEN TIMELINE
       Everything is scrub-based so it works at any scroll speed.
       
       Timeline map (0 → 1 over the section's scroll range):
         0.00 → 0.15  :  Primary chars focus-pull entrance (blur → sharp)
         0.15 → 0.38  :  Hold — "Arqing" fully visible, slight scale up
         0.38 → 0.45  :  Primary chars disperse outward
         0.42 → 0.46  :  Gravitational pulse on title
         0.42 → 0.47  :  Secondary wrapper fades in
         0.47 → 0.58  :  Secondary chars assemble into place
         0.58 → 0.62  :  Subtle bloom on secondary chars
         0.62 → 1.00  :  Hold — "Stories Beyond Pixels" stays visible
       ─────────────────────────────────────────────────────────── */
    createFullScrollTimeline() {
        // ── Initial states ──
        gsap.set(this.secondaryWrap, { autoAlpha: 0 });

        gsap.set(this.primaryChars, {
            scale: 1.1,
            opacity: 0,
            filter: 'blur(16px)'
        });

        gsap.set(this.secondaryChars, {
            opacity: 0,
            y: () => gsap.utils.random(50, 90),
            x: () => gsap.utils.random(-40, 40),
            scale: 0.35,
            rotationX: () => gsap.utils.random(-60, 60),
            filter: 'blur(14px)'
        });

        // ── Single scrub timeline tied to section scroll ──
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: this.section,
                start: 'top top',
                end: 'bottom bottom',
                scrub: 1.2,
                snap: {
                    snapTo: [0, 0.15, 0.62, 1],
                    duration: { min: 0.3, max: 0.7 },
                    ease: "power2.inOut"
                }
            }
        });

        // ── PHASE A: "Arqing" entrance — cinematic focus pull ──
        // 0.00 → 0.15
        tl.to(this.primaryChars, {
            scale: 1,
            opacity: 1,
            filter: 'blur(0px)',
            duration: 0.15,
            stagger: {
                each: 0.02,
                from: 'center'
            },
            ease: 'power2.out'
        }, 0);

        // ── PHASE A.5: "Arqing" hold — slight scale up while user reads ──
        // 0.15 → 0.38
        tl.to(this.primaryWrap, {
            scale: 1.05,
            duration: 0.23,
            ease: 'none'
        }, 0.15);

        // ── PHASE B: "Arqing" disperses outward ──
        // 0.38 → 0.45
        const spreadY = [-110, 80, -130, 100, -70, 140];
        const spreadX = [-170, 130, -50, 70, -150, 190];

        tl.to(this.primaryChars, {
            opacity: 0,
            scale: 0.3,
            y: (i) => spreadY[i % spreadY.length],
            x: (i) => spreadX[i % spreadX.length],
            rotationX: (i) => (i % 2 ? 1 : -1) * (25 + i * 12),
            filter: 'blur(18px)',
            stagger: 0.015,
            ease: 'power3.in',
            duration: 0.07
        }, 0.38);

        // ── Midpoint pulse — gravitational shockwave ──
        // 0.42 → ~0.46
        tl.fromTo(
            this.title,
            { scale: 1 },
            { scale: 1.06, duration: 0.04, yoyo: true, repeat: 1, ease: 'power2.inOut' },
            0.42
        );

        // ── PHASE C: Secondary wrapper fades in ──
        // 0.42 → 0.47
        tl.to(this.secondaryWrap, {
            autoAlpha: 1,
            duration: 0.05
        }, 0.42);

        // ── PHASE D: Secondary chars assemble ──
        // 0.47 → 0.58
        tl.to(this.secondaryChars, {
            opacity: 1,
            y: 0,
            x: 0,
            scale: 1,
            rotationX: 0,
            filter: 'blur(0px)',
            duration: 0.11,
            stagger: { each: 0.005, from: 'start' },
            ease: 'power2.out'
        }, 0.47);

        // ── Subtle bloom after full assembly ──
        // 0.58 → 0.62
        tl.fromTo(
            this.secondaryChars,
            { filter: 'blur(0px) brightness(1)' },
            {
                filter: 'blur(0px) brightness(1.35) drop-shadow(0 0 12px rgba(255,255,255,0.18))',
                duration: 0.04,
                stagger: 0.005,
                ease: 'power1.out'
            },
            0.58
        );

        // ── PHASE E: "Stories Beyond Pixels" HOLD ──
        // 0.62 → 1.00 — Text stays fully visible while user scrolls
        // Fade out the scroll hint slightly before
        tl.to(this.scrollHint, {
            opacity: 0,
            duration: 0.05
        }, 0.58);
    }
}
