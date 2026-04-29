const MOBILE_BREAKPOINT = 768;
const PORTRAIT_PROGRESS_SCROLL_FACTOR = 1 / 0.3;

class TeamEngine {
    constructor() {
        this.page = document.querySelector('.team-page');
        this.hero = document.querySelector('.team-hero');
        this.title = document.querySelector('.team-title');
        this.profiles = Array.from(document.querySelectorAll('.team-profile[data-profile]'));
        this.bioBlocks = Array.from(document.querySelectorAll('.team-bio'));
        this.rules = Array.from(document.querySelectorAll('.team-rule'));
        this.reel = document.querySelector('.team-reel-transition');
        this.cta = document.querySelector('.team-cta');
        this.isMobile = window.innerWidth <= MOBILE_BREAKPOINT;

        if (!this.page || !this.title || !this.profiles.length) {
            return;
        }

        this.handleResize = this.debounce(this.handleResize.bind(this), 10);
        this.handleScroll = this.debounce(this.handleScroll.bind(this), 10);

        this.init();
    }

    init() {
        document.body.classList.add('grain');

        this.splitHeroTitle();
        this.prepareBios();
        this.createObservers();
        this.handleResize();
        this.syncPortraitFrames();

        window.addEventListener('resize', this.handleResize);
        window.addEventListener('scroll', this.handleScroll, { passive: true });

        if (document.fonts?.ready) {
            document.fonts.ready.then(() => this.syncPortraitFrames());
        }

        window.addEventListener('load', () => this.syncPortraitFrames(), { once: true });

        requestAnimationFrame(() => {
            this.hero?.classList.add('is-ready');

            window.setTimeout(() => {
                this.hero?.classList.add('show-scroll-cue');
            }, 1200);
        });
    }

    splitHeroTitle() {
        const text = (this.title.dataset.title || this.title.textContent || '').trim();
        if (!text) return;

        this.title.textContent = '';

        text.split('').forEach((character, index) => {
            const letter = document.createElement('span');
            letter.className = 'team-title-letter';
            letter.style.setProperty('--letter-index', index);

            const inner = document.createElement('span');
            inner.className = 'team-title-letter-char';
            inner.textContent = character;

            letter.appendChild(inner);
            this.title.appendChild(letter);
        });
    }

    prepareBios() {
        this.bioBlocks.forEach((bio) => {
            const originalText = bio.textContent.replace(/\s+/g, ' ').trim();
            if (!originalText) return;

            bio.setAttribute('aria-label', originalText);
            bio.textContent = '';

            const fragment = document.createDocumentFragment();
            originalText.split(' ').forEach((word, index, words) => {
                const wordSpan = document.createElement('span');
                wordSpan.className = 'team-word';
                wordSpan.textContent = word;
                wordSpan.setAttribute('aria-hidden', 'true');
                wordSpan.style.setProperty('--word-index', index);
                fragment.appendChild(wordSpan);

                if (index < words.length - 1) {
                    fragment.appendChild(document.createTextNode(' '));
                }
            });

            bio.appendChild(fragment);
        });
    }

    createObservers() {
        this.mobileRevealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!this.isMobile) return;
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-mobile-visible', 'is-active');
            });
        }, {
            threshold: 0.22
        });

        this.bioObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, {
            threshold: 0.38
        });

        this.ruleObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, {
            threshold: 0.45
        });

        this.reelObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, {
            threshold: 0.55
        });

        this.ctaObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, {
            threshold: 0.3
        });

        this.profiles.forEach((profile) => this.mobileRevealObserver.observe(profile));
        this.bioBlocks.forEach((bio) => this.bioObserver.observe(bio));
        this.rules.forEach((rule) => this.ruleObserver.observe(rule));

        if (this.reel) {
            this.reelObserver.observe(this.reel);
        }

        if (this.cta) {
            this.ctaObserver.observe(this.cta);
        }
    }

    handleResize() {
        this.isMobile = window.innerWidth <= MOBILE_BREAKPOINT;

        if (!this.isMobile) {
            this.profiles.forEach((profile) => profile.classList.remove('is-mobile-visible'));
        }

        this.syncPortraitFrames();
        this.handleScroll();
    }

    syncPortraitFrames() {
        this.profiles.forEach((profile) => {
            if (this.isMobile) {
                profile.style.removeProperty('--portrait-frame-height');
                profile.style.removeProperty('--portrait-frame-y');
                return;
            }

            const portraitColumn = profile.querySelector('.team-portrait-column');
            const portraitShell = profile.querySelector('.team-portrait-shell');
            const copyColumn = profile.querySelector('.team-copy-column');
            const copyInner = profile.querySelector('.team-copy-inner');
            const name = profile.querySelector('.team-name');
            const rule = profile.querySelector('.team-rule');

            if (!portraitColumn || !portraitShell || !copyColumn || !copyInner || !name || !rule) {
                return;
            }

            profile.style.setProperty('--portrait-frame-y', '0px');

            const targetTop = copyColumn.offsetTop + copyInner.offsetTop + name.offsetTop + name.offsetHeight;
            const targetBottom = copyColumn.offsetTop + copyInner.offsetTop + rule.offsetTop + rule.offsetHeight;
            const targetHeight = Math.max(240, targetBottom - targetTop - 4);

            profile.style.setProperty('--portrait-frame-height', `${targetHeight}px`);

            const portraitTop = portraitColumn.offsetTop + portraitShell.offsetTop;
            const frameY = targetTop - portraitTop + 2;

            profile.style.setProperty('--portrait-frame-y', `${Math.round(frameY)}px`);
        });
    }

    handleScroll() {
        if (this.isMobile) {
            this.profiles.forEach((profile) => {
                profile.style.setProperty('--profile-progress', '1');
                profile.classList.remove('is-focused');
            });
            return;
        }

        const viewportHeight = Math.max(window.innerHeight, 1);

        this.profiles.forEach((profile) => {
            const rect = profile.getBoundingClientRect();
            const track = Math.max(profile.offsetHeight - viewportHeight, 1);
            const rawProgress = (-rect.top / track) * PORTRAIT_PROGRESS_SCROLL_FACTOR;
            const progress = Math.max(0, Math.min(1, rawProgress));

            profile.style.setProperty('--profile-progress', progress.toFixed(4));

            const isActive = rect.top <= viewportHeight * 0.72 && rect.bottom >= viewportHeight * 0.28;
            const isFocused = progress >= 0.46 && progress <= 0.9;

            profile.classList.toggle('is-active', isActive || progress > 0.14);
            profile.classList.toggle('is-focused', isFocused);
        });
    }

    debounce(callback, delay) {
        let timeoutId = 0;

        return (...args) => {
            if (timeoutId) {
                window.clearTimeout(timeoutId);
            }

            timeoutId = window.setTimeout(() => {
                callback(...args);
            }, delay);
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TeamEngine();
});

export default TeamEngine;
