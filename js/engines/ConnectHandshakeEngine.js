export class ConnectHandshakeEngine {
    constructor() {
        this.baseText = document.getElementById('connectExperiment');
        this.section = document.querySelector('.connect-experience');
        this.methodsWrapper = document.querySelector('.connect-methods-wrapper');
        this.resizeTimer = 0;
        
        if (!this.section || !this.baseText) return;

        this.init();
    }

    init() {
        this.setupInteractions();
        this.setupResizeHandling();
        
        document.fonts.ready.then(() => {
            this.measureCards();
            setTimeout(() => {
                this.playEntrance();
            }, 100);
        });
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
        
        const nLeft = document.getElementById('nLeft');
        const nRight = document.getElementById('nRight');
        const partCon = document.getElementById('partCon');
        const partNect = document.getElementById('partNect');
        
        const subtitle = document.querySelector('.connect-subtitle');
        const earthModel = document.querySelector('.earth-model-wrapper');
        const desc = document.querySelectorAll('.connect-desc');
        
        const modelViewer = earthModel ? earthModel.querySelector('model-viewer') : null;
        let orbitProxy = { rotation: 0 };
        if (modelViewer) {
            modelViewer.cameraOrbit = `0deg 75deg auto`;
        }

        gsap.set(partCon, { x: '-15vw', opacity: 0 });
        gsap.set(partNect, { x: '15vw', opacity: 0 });
        gsap.set(nLeft, { rotationZ: -90, transformOrigin: '50% 10%' });
        gsap.set(nRight, { rotationZ: 90, transformOrigin: '50% 10%' });
        
        if (subtitle) gsap.set(subtitle, { opacity: 0, y: 20 });
        if (earthModel) gsap.set(earthModel, { opacity: 0, y: 20 });
        if (desc.length) gsap.set(desc, { opacity: 0, y: 20 });
        if (this.methodsWrapper) gsap.set(this.methodsWrapper, { opacity: 0, y: 20 });

        // Phase 1: Come together
        tl.to([partCon, partNect], {
            x: 0,
            opacity: 1,
            duration: 1.2,
            ease: "power2.inOut"
        })
        // Phase 2: Rotate Ns down as pendulum
        .to([nLeft, nRight], {
            rotationZ: 0,
            duration: 2.0,
            ease: "elastic.out(1, 0.15)"
        }, "+=0.1")
        // H2 appears during the tail end of the Ns elastic animation (immediately after main impact)
        .to(subtitle, {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out"
        }, "-=1.0")
        // GLB and P appear slightly after h2
        .to(earthModel, {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out"
        }, "-=0.4")
        // 360 spin animation for the model
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
        // Show methods UI block — fades in AFTER globe + desc finish
        .to(this.methodsWrapper, {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out"
        }, "+=0.15");
    }
}
