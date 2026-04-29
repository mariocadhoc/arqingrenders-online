export default class TestimonialCards {
    constructor() {
        this.section = null;
        this.cards = [];
        this.timeline = null;
        this.init();
    }

    init() {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
        gsap.registerPlugin(ScrollTrigger);

        this.section = document.querySelector('.section-testimonials-stack');
        this.cards = Array.from(document.querySelectorAll('.testimonial-stack-card'));

        if (!this.section || this.cards.length < 4) return;

        const leftCards = [this.cards[0], this.cards[2]];
        const rightCards = [this.cards[1], this.cards[3]];

        // Create the main pinned gallery timeline
        this.timeline = gsap.timeline({
            scrollTrigger: {
                trigger: this.section,
                pin: true,
                start: 'top top',
                end: '+=120%',
                scrub: 1,
                invalidateOnRefresh: true
            }
        });

        // The lower cards start slightly farther away so each column reads as one motion with a subtle delay.
        gsap.set(this.cards[0], { xPercent: -82, opacity: 0 });
        gsap.set(this.cards[2], { xPercent: -104, opacity: 0 });
        gsap.set(this.cards[1], { xPercent: 82, opacity: 0 });
        gsap.set(this.cards[3], { xPercent: 104, opacity: 0 });

        this.timeline
            .to(leftCards, {
                xPercent: 0,
                opacity: 1,
                duration: 1,
                ease: 'power2.out',
                stagger: 0.08
            })
            .to(rightCards, {
                xPercent: 0,
                opacity: 1,
                duration: 1,
                ease: 'power2.out',
                stagger: 0.08
            }, '-=0.24');
    }
}
