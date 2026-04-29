export default class MobileCollabReveal {
    constructor() {
        // Only run on mobile or when mobile content is visible check
        this.steps = document.querySelectorAll('.collab-mobile-step');
        this.images = document.querySelectorAll('.step-fade-img-m');
        this.init();
    }

    init() {
        if (!this.steps.length) return;

        const updatedObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');

                    // Retrieve step index
                    const stepIndex = entry.target.getAttribute('data-m-step');
                    if (stepIndex !== null && this.images.length > 0) {
                        this.images.forEach((img, idx) => {
                            if (idx === parseInt(stepIndex, 10)) {
                                img.classList.add('is-active');
                            } else {
                                img.classList.remove('is-active');
                            }
                        });
                    }
                }
            });
        }, {
            root: null,
            rootMargin: '-30% 0px -30% 0px', // Trigger when step is near middle of viewport
            threshold: 0
        });

        this.steps.forEach(step => updatedObserver.observe(step));
    }
}
