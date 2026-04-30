export default class HeroRevealEngine {
    constructor() {
        this.heroContainer = document.getElementById('heroContainer');
        this.heroBadge = document.querySelector('.hero-logo-badge');
        this.heroVideo = this.heroContainer?.querySelector('video') || null;
        this.delayMs = 700; // Reduced ~30% from 1000ms for faster UX
        this.timerId = null;
        this.startScale = 0.24;
        this.hasQueuedPlaybackRetry = false;

        if (!this.heroContainer) return;
        this.init();
    }

    init() {
        this.applyInitialRevealState();

        // Set starting point to 7.5s for initial load
        const video = this.heroVideo;
        if (video) {
            this.prepareVideoForAutoplay(video);

            const setStartTime = () => { video.currentTime = 7.5; };
            if (video.readyState >= 1) {
                setStartTime();
            } else {
                video.addEventListener('loadedmetadata', setStartTime, { once: true });
            }
        }

        this.timerId = window.setTimeout(() => {
            if (!this.heroContainer) return;
            this.reveal();
        }, this.delayMs);
    }

    applyInitialRevealState() {
        const containerRect = this.heroContainer.getBoundingClientRect();
        const badgeRect = this.heroBadge?.getBoundingClientRect();
        const containerWidth = containerRect.width || this.heroContainer.offsetWidth;
        const badgeWidth = badgeRect?.width || this.heroBadge?.offsetWidth || 0;

        if (containerWidth > 0 && badgeWidth > 0) {
            const badgeRatio = badgeWidth / containerWidth;
            this.startScale = Math.max(0.22, Math.min(0.46, badgeRatio * 1.12));
        }

        this.heroContainer.style.transform = `translateZ(0) scale(${this.startScale})`;
        this.heroContainer.style.opacity = '0.08';

        if (this.heroVideo) {
            this.heroVideo.style.opacity = '0.35';
            this.heroVideo.style.transform = 'scale(1.52)';
        }
    }

    prepareVideoForAutoplay(video) {
        video.muted = true;
        video.defaultMuted = true;
        video.autoplay = true;
        video.playsInline = true;
        video.setAttribute('muted', '');
        video.setAttribute('autoplay', '');
        video.setAttribute('playsinline', '');
    }

    playHeroVideo() {
        const video = this.heroVideo;
        if (!video || !video.paused) return;

        this.prepareVideoForAutoplay(video);

        const playPromise = video.play();
        if (!playPromise || typeof playPromise.catch !== 'function') return;

        playPromise.catch(err => {
            if (err?.name !== 'NotAllowedError') {
                console.warn("Hero video autoplay failed:", err);
            }
            this.queuePlaybackRetry();
        });
    }

    queuePlaybackRetry() {
        if (this.hasQueuedPlaybackRetry) return;
        this.hasQueuedPlaybackRetry = true;

        const retry = () => {
            this.hasQueuedPlaybackRetry = false;
            this.playHeroVideo();
        };

        ['pointerdown', 'touchstart', 'keydown', 'scroll'].forEach(eventName => {
            window.addEventListener(eventName, retry, { once: true, passive: true });
        });
        window.addEventListener('pageshow', retry, { once: true });
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) retry();
        }, { once: true });
    }

    reveal() {
        this.heroContainer.classList.remove('hero-reveal-pending');
        this.heroContainer.classList.add('hero-reveal-active');

        // Ensure video plays when revealed
        const video = this.heroVideo;
        this.playHeroVideo();

        if (typeof gsap !== 'undefined') {
            gsap.killTweensOf(this.heroContainer);
            if (video) gsap.killTweensOf(video);

            const revealTimeline = gsap.timeline({
                defaults: {
                    transformOrigin: '50% 50%',
                    force3D: true
                }
            });

            revealTimeline
                .fromTo(
                    this.heroContainer,
                    {
                        scale: this.startScale,
                        opacity: 0.08
                    },
                    {
                        scale: 1,
                        opacity: 1,
                        duration: 1.0,
                        ease: 'expo.out',
                        clearProps: 'transform,opacity'
                    }
                );

            if (video) {
                gsap.fromTo(
                    video,
                    {
                        opacity: 0.35,
                        scale: 1.52,
                        force3D: true
                    },
                    {
                        opacity: 1,
                        scale: 1.37,
                        duration: 1.06,
                        ease: 'power2.out',
                        clearProps: 'opacity,transform'
                    }
                );
            }
        } else {
            this.heroContainer.style.transform = 'translateZ(0) scale(1)';
            this.heroContainer.style.opacity = '1';
            if (video) {
                video.style.opacity = '1';
                video.style.transform = 'scale(1.37)';
            }
        }

        // Signal to other engines that the hero has revealed
        window.dispatchEvent(new CustomEvent('heroRevealed'));
    }
}
