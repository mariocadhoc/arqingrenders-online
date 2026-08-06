export class ConnectHandshakeEngineEs {
    constructor() {
        this.baseText = document.getElementById('connectExperiment');
        this.section = document.querySelector('.connect-experience');
        this.methodsWrappers = document.querySelectorAll('.connect-methods-wrapper, .connect-mobile-methods');
        this.resizeTimer = 0;
        
        if (!this.section || !this.baseText) return;

        this.init();
    }

    init() {
        this.prepareEntrance();
        this.setupInteractions();
        this.setupResizeHandling();

        document.fonts.ready.then(() => {
            this.measureCards();
            this.playEntrance();
        });
    }

    prepareEntrance() {
        const tLeft = document.getElementById('tLeft');
        const tRight = document.getElementById('tRight');
        const partCont = document.getElementById('partCon');
        const partTacto = document.getElementById('partNect');
        const subtitle = document.querySelector('.connect-subtitle');
        const earthModel = document.querySelector('.earth-model-wrapper');
        const desc = document.querySelectorAll('.connect-desc');

        if (partCont) gsap.set(partCont, { x: '-15vw', opacity: 0 });
        if (partTacto) gsap.set(partTacto, { x: '15vw', opacity: 0 });
        if (tLeft) gsap.set(tLeft, { rotationZ: -90, transformOrigin: '50% 0%' });
        if (tRight) gsap.set(tRight, { rotationZ: 90, transformOrigin: '50% 0%' });

        if (subtitle) gsap.set(subtitle, { opacity: 0, y: 20 });
        if (earthModel) gsap.set(earthModel, { opacity: 0, y: 20 });
        if (desc.length) gsap.set(desc, { opacity: 0, y: 20 });
        if (this.methodsWrappers.length) gsap.set(this.methodsWrappers, { opacity: 0, y: 20 });
    }

    setupInteractions() {
        this.btnWhatsapp = document.getElementById('btnWhatsapp');
        this.btnEmail = document.getElementById('btnEmail');
        this.cardWhatsapp = document.getElementById('whatsappCard');
        this.cardEmail = document.getElementById('emailCard');
        
        this.activeMethod = null;

        if (this.btnWhatsapp) {
            this.btnWhatsapp.addEventListener('click', () => this.toggleMethod('whatsapp'));
        }
        if (this.btnEmail) {
            this.btnEmail.addEventListener('click', () => this.toggleMethod('email'));
        }
    }

    setupResizeHandling() {
        const remeasure = () => {
            window.clearTimeout(this.resizeTimer);
            this.resizeTimer = window.setTimeout(() => {
                this.measureCards();

                if (!this.activeMethod) return;

                const activeCard = this.activeMethod === 'whatsapp' ? this.cardWhatsapp : this.cardEmail;
                const activeWidth = this.activeMethod === 'whatsapp' ? this.whatsappWidth : this.emailWidth;

                if (activeCard) {
                    gsap.set(activeCard, { width: activeWidth, opacity: 1 });
                }
            }, 120);
        };

        window.addEventListener('resize', remeasure, { passive: true });
        window.addEventListener('orientationchange', remeasure, { passive: true });
    }

    measureCards() {
        if (!this.cardWhatsapp || !this.cardEmail) return;
        
        const activeMethod = this.activeMethod;

        gsap.set(this.cardWhatsapp, { width: 'auto', opacity: 1, display: 'flex' });
        this.whatsappWidth = this.getCardWidth(this.cardWhatsapp);
        gsap.set(this.cardWhatsapp, {
            width: activeMethod === 'whatsapp' ? this.whatsappWidth : 0,
            opacity: activeMethod === 'whatsapp' ? 1 : 0
        });

        gsap.set(this.cardEmail, { width: 'auto', opacity: 1, display: 'flex' });
        this.emailWidth = this.getCardWidth(this.cardEmail);
        gsap.set(this.cardEmail, {
            width: activeMethod === 'email' ? this.emailWidth : 0,
            opacity: activeMethod === 'email' ? 1 : 0
        });
    }

    getCardWidth(card) {
        const inner = card.querySelector('.method-card-inner');
        const contentWidth = inner ? inner.scrollWidth : card.scrollWidth;
        const availableWidth = this.getAvailableCardWidth(card);

        return Math.min(contentWidth, availableWidth);
    }

    getAvailableCardWidth(card) {
        const half = card.closest('.method-half');
        const icon = half ? half.querySelector('.method-icon-btn') : null;
        const halfWidth = half ? half.clientWidth : window.innerWidth;
        const iconWidth = icon ? icon.offsetWidth : 0;
        const computed = window.getComputedStyle(card);
        const cssMaxWidth = computed.maxWidth.endsWith('px') ? parseFloat(computed.maxWidth) : Infinity;
        const viewportWidth = Math.max(0, window.innerWidth - 40);

        return Math.max(0, Math.min(halfWidth - iconWidth, cssMaxWidth, viewportWidth));
    }

    toggleMethod(method) {
        if (this.activeMethod === method) {
            this.animateCards(method, false);
            this.activeMethod = null;
            return;
        }

        const previousMethod = this.activeMethod;
        this.activeMethod = method;

        const tl = gsap.timeline();
        
        if (previousMethod) {
            this.animateCardTL(tl, previousMethod, false);
        }

        this.animateCardTL(tl, method, true);
    }

    animateCards(method, isOpen) {
        const tl = gsap.timeline();
        this.animateCardTL(tl, method, isOpen);
    }

    animateCardTL(tl, method, isOpen) {
        const card = method === 'whatsapp' ? this.cardWhatsapp : this.cardEmail;
        const targetWidth = method === 'whatsapp' ? this.whatsappWidth : this.emailWidth;
        const btn = method === 'whatsapp' ? this.btnWhatsapp : this.btnEmail;
        
        if (isOpen) {
            btn.classList.add('is-active');
            tl.to(card, {
                width: targetWidth,
                opacity: 1,
                duration: 0.6,
                ease: "power2.inOut"
            }, 0); 
        } else {
            btn.classList.remove('is-active');
            tl.to(card, {
                width: 0,
                opacity: 0,
                duration: 0.6,
                ease: "power2.inOut"
            }, 0);
        }
    }

    playEntrance() {
        const tl = gsap.timeline();
        
        // tLeft  = last 't' of "cont"  → ID: tLeft
        // tRight = first 't' of "tacto" → ID: tRight
        const tLeft  = document.getElementById('tLeft');
        const tRight = document.getElementById('tRight');
        const partCont  = document.getElementById('partCon');   // "con" + tLeft half
        const partTacto = document.getElementById('partNect');  // tRight + "acto" half
        
        const subtitle = document.querySelector('.connect-subtitle');
        const earthModel = document.querySelector('.earth-model-wrapper');
        const desc = document.querySelectorAll('.connect-desc');
        
        const modelViewer = earthModel ? earthModel.querySelector('model-viewer') : null;
        let orbitProxy = { rotation: 0 };
        if (modelViewer) {
            modelViewer.cameraOrbit = `0deg 75deg auto`;
        }

        // --- T handshake geometry ---
        // The letter 't' has a vertical stroke with a tail at the bottom.
        // tLeft  rotated -90° (CCW): tail points LEFT  → approaches from the left side
        // tRight rotated +90° (CW) : tail points RIGHT → approaches from the right side
        // transformOrigin '50% 0%': pivot at the TOP of the element so they swing DOWN
        // like pendulums when rotating back to 0°, making the tails appear to meet
        // then fall down together with elastic wobble.

        this.prepareEntrance();
        document.documentElement.classList.remove('connect-preparing');

        // Phase 1: word halves slide in from opposite sides
        tl.to([partCont, partTacto], {
            x: 0,
            opacity: 1,
            duration: 1.2,
            ease: "power2.inOut"
        })
        // Phase 2: 't' letters rotate back to upright — tails fall DOWN like pendulums
        .to([tLeft, tRight], {
            rotationZ: 0,
            duration: 2.0,
            ease: "elastic.out(1, 0.15)"
        }, "+=0.1")
        // Subtitle appears during the tail end of the 't' elastic animation
        .to(subtitle, {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out"
        }, "-=1.0")
        // Globe and paragraph appear slightly after subtitle
        .to(earthModel, {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out"
        }, "-=0.4")
        // 360 spin for the globe model
        .to(orbitProxy, {
            rotation: 360,
            duration: 1.66,
            ease: "power2.inOut",
            onUpdate: () => {
                if (modelViewer) {
                    modelViewer.cameraOrbit = `${orbitProxy.rotation}deg 75deg auto`;
                }
            }
        }, "-=0.8")
        .to(desc, {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out"
        }, "-=0.6")
        // Show methods UI block (desktop & mobile) — fades in AFTER globe + desc finish
        .to(this.methodsWrappers, {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out"
        }, "+=0.15");
    }
}
