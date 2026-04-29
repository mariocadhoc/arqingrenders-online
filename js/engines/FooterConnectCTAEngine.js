export default class FooterConnectCTAEngine {
    constructor() {
        this.card = document.querySelector('.footer-cta-card');
        this.actionWrap = document.querySelector('.footer-cta-action');
        this.actionIcon = document.querySelector('.footer-cta-action-icon');
        this.isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
        this.revealObserver = null;

        this.defaultPointerX = '18%';
        this.defaultPointerY = '30%';

        this.handlePointerMove = this.handlePointerMove.bind(this);
        this.handlePointerEnter = this.handlePointerEnter.bind(this);
        this.handlePointerLeave = this.handlePointerLeave.bind(this);
        this.handleFocus = this.handleFocus.bind(this);
        this.handleBlur = this.handleBlur.bind(this);
        
        this.handleActionPointerMove = this.handleActionPointerMove.bind(this);
        this.handleActionPointerLeave = this.handleActionPointerLeave.bind(this);

        if (!this.card || this.card.dataset.footerCtaReady === 'true') return;

        this.card.dataset.footerCtaReady = 'true';
        this.init();
    }

    init() {
        this.setupReveal();
        this.setupPointerLight();
        this.setupMagneticAction();
    }

    setupReveal() {
        if (this.isReduced || typeof IntersectionObserver === 'undefined') {
            this.card.classList.add('is-visible');
            return;
        }

        this.revealObserver = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) continue;

                    this.card.classList.add('is-visible');

                    if (this.revealObserver) {
                        this.revealObserver.disconnect();
                        this.revealObserver = null;
                    }
                    break;
                }
            },
            {
                threshold: 0.35,
                rootMargin: '0px 0px -8% 0px'
            }
        );

        this.revealObserver.observe(this.card);
    }

    setupPointerLight() {
        this.card.style.setProperty('--footer-cta-x', this.defaultPointerX);
        this.card.style.setProperty('--footer-cta-y', this.defaultPointerY);

        this.card.addEventListener('focus', this.handleFocus);
        this.card.addEventListener('blur', this.handleBlur);

        if (this.isCoarsePointer) return;

        this.card.addEventListener('pointerenter', this.handlePointerEnter);
        this.card.addEventListener('pointermove', this.handlePointerMove);
        this.card.addEventListener('pointerleave', this.handlePointerLeave);
    }

    setupMagneticAction() {
        if (!this.actionWrap || !this.actionIcon || this.isReduced || this.isCoarsePointer) return;

        this.actionWrap.addEventListener('pointermove', this.handleActionPointerMove);
        this.actionWrap.addEventListener('pointerleave', this.handleActionPointerLeave);
    }

    handleActionPointerMove(event) {
        event.stopPropagation();
        
        const rect = this.actionWrap.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const distX = event.clientX - centerX;
        const distY = event.clientY - centerY;
        
        const maxDist = 20; 
        
        let moveX = distX * 0.5;
        let moveY = distY * 0.5;
        
        const currentDist = Math.sqrt(moveX * moveX + moveY * moveY);
        if (currentDist > maxDist) {
            moveX = (moveX / currentDist) * maxDist;
            moveY = (moveY / currentDist) * maxDist;
        }

        this.actionIcon.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
        this.actionIcon.style.transition = 'none';
    }

    handleActionPointerLeave() {
        this.actionIcon.style.transform = '';
        this.actionIcon.style.transition = 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.35s ease, color 0.35s ease';
    }

    handlePointerEnter() {
        this.card.classList.add('is-hovered');
    }

    handlePointerMove(event) {
        const rect = this.card.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;

        this.card.style.setProperty('--footer-cta-x', `${Math.max(0, Math.min(100, x)).toFixed(2)}%`);
        this.card.style.setProperty('--footer-cta-y', `${Math.max(0, Math.min(100, y)).toFixed(2)}%`);
    }

    handlePointerLeave() {
        this.card.classList.remove('is-hovered');
        this.card.style.setProperty('--footer-cta-x', this.defaultPointerX);
        this.card.style.setProperty('--footer-cta-y', this.defaultPointerY);
    }

    handleFocus() {
        this.card.classList.add('is-hovered');
    }

    handleBlur() {
        this.card.classList.remove('is-hovered');
    }
}
