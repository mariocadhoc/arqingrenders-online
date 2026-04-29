export default class TestimonialCardsMobile {
    constructor() {
        this.init();
    }

    init() {
        const section = document.querySelector('.section-testimonials-stack');
        if (!section) return;

        // Mobile uses a static flow layout from CSS to avoid pinning/sticky scroll behavior.
        section.classList.add('testimonials-mobile-static');
    }
}
