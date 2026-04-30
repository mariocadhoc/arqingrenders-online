/**
 * BigTitleMobile.js
 * ─────────────────
 * Mobile-only replacement for BigTitleCinematicEngine.
 * Uses GSAP ScrollTrigger (already loaded on the page) for reliable
 * fade-in animation — no complex scatter, no sticky pinning.
 *
 * Layout injected directly into .section-big-title:
 *   ┌────────────────────────────────┐
 *   │   "ARQING"                     │  ← fades up on scroll-enter
 *   │                                │
 *   │   "stories beyond pixels"      │  ← fades up 300ms after
 *   └────────────────────────────────┘
 */
export default class BigTitleMobile {
    constructor() {
        this.section  = document.querySelector('.section-big-title');
        this.titleEl  = document.getElementById('bigTitleCinematic');

        if (!this.section || !this.titleEl) return;

        this.primaryText   = this.titleEl.textContent.trim();
        this.secondaryText = this.titleEl.dataset.morphText || 'Stories Beyond Pixels';

        this._build();
        this._animate();
    }

    /* ── Build DOM ── */
    _build() {
        // Clear original h1 content & any inline styles
        this.titleEl.textContent = '';
        this.titleEl.removeAttribute('data-morph-text');
        this.titleEl.style.cssText = '';
        this.titleEl.removeAttribute('style');

        // Mark section for mobile-specific CSS
        this.section.classList.add('big-title-mobile-mode');

        // Primary phrase — e.g. "Arqing"
        this._primary = document.createElement('span');
        this._primary.className  = 'btm-primary';
        this._primary.textContent = this.primaryText;

        // Secondary phrase — e.g. "stories beyond pixels"
        this._secondary = document.createElement('span');
        this._secondary.className = 'btm-secondary';
        this._secondary.textContent = this.secondaryText.toLowerCase();

        this.titleEl.appendChild(this._primary);
        this.titleEl.appendChild(this._secondary);
    }

    /* ── Animate via GSAP ScrollTrigger ── */
    _animate() {
        // Guard: GSAP must be available (it's loaded via CDN before this module)
        if (typeof gsap === 'undefined') {
            // Fallback: just make them visible immediately
            this._primary.style.opacity   = '1';
            this._secondary.style.opacity = '1';
            return;
        }

        // Set hidden initial state through GSAP (avoids CSS specificity fights)
        gsap.set(this._primary,   { opacity: 0, y: 22 });
        gsap.set(this._secondary, { opacity: 0, y: 16 });

        // Primary: fade + rise in when section top enters 85% of viewport
        gsap.to(this._primary, {
            scrollTrigger: {
                trigger: this.section,
                start:   'top 85%',
                once:    true,
            },
            opacity:  1,
            y:        0,
            duration: 0.95,
            ease:     'power3.out',
        });

        // Secondary: same trigger but delayed 350 ms
        gsap.to(this._secondary, {
            scrollTrigger: {
                trigger: this.section,
                start:   'top 85%',
                once:    true,
            },
            opacity:  1,
            y:        0,
            delay:    0.35,
            duration: 1.05,
            ease:     'power3.out',
        });
    }
}
