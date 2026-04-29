export class ConnectStickyEngine {
    constructor() {
        this.baseText = document.getElementById('connectBase');
        this.section = document.querySelector('.connect-experience');
        this.methodsWrapper = document.querySelector('.connect-methods-wrapper');
        
        if (!this.section) return;

        this.init();
    }

    init() {
        this.splitBaseText();
        this.setupInteractions();
        
        // Let fonts load so width measurement is accurate
        document.fonts.ready.then(() => {
            this.measureCards();
            setTimeout(() => {
                this.playEntrance();
            }, 100);
        });
    }

    splitBaseText() {
        const text = this.baseText.textContent;
        this.baseText.innerHTML = '';
        
        text.split('').forEach(char => {
            const span = document.createElement('span');
            span.className = 'connect-char';
            span.textContent = char;
            if (char === ' ') {
                span.style.whiteSpace = 'pre';
            }
            this.baseText.appendChild(span);
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

    measureCards() {
        if (!this.cardWhatsapp || !this.cardEmail) return;
        
        // Measure exact widths to animate without jumping
        gsap.set(this.cardWhatsapp, { width: 'auto', opacity: 1, display: 'flex' });
        this.whatsappWidth = this.cardWhatsapp.offsetWidth;
        gsap.set(this.cardWhatsapp, { width: 0, opacity: 0 });

        gsap.set(this.cardEmail, { width: 'auto', opacity: 1, display: 'flex' });
        this.emailWidth = this.cardEmail.offsetWidth;
        gsap.set(this.cardEmail, { width: 0, opacity: 0 });
    }

    toggleMethod(method) {
        if (this.activeMethod === method) {
            // Close the currently open method
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
            }, 0); // Position 0 to crossfade/overlap animations nicely
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
        const chars = document.querySelectorAll('.connect-char');
        
        gsap.set(chars, {
            y: '1em',
            rotationZ: 30,
            opacity: 0
        });

        const tl = gsap.timeline();
        
        tl.to(chars, {
            y: 0,
            rotationZ: 0,
            opacity: 1,
            duration: 0.95,
            stagger: 0.04,
            ease: "circ.out"
        })
        // Heartbeat (pum-pum)
        .to(this.baseText, {
            scale: 1.04,
            duration: 0.15,
            ease: "power2.out"
        }, "+=0.25")
        .to(this.baseText, {
            scale: 1,
            duration: 0.15,
            ease: "power2.in"
        })
        .to(this.baseText, {
            scale: 1.04,
            duration: 0.15,
            ease: "power2.out"
        })
        .to(this.baseText, {
            scale: 1,
            duration: 0.3,
            ease: "power2.inOut"
        })
        // Show methods UI block
        .to(this.methodsWrapper, {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out"
        }, "+=0.1");
    }
}
