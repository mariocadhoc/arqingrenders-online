import StillsCrossCTAEngine from './engines/stills-cross-cta.js';
import { initializeWorkPageIntro } from './engines/work-page-intro.js';

const DEFAULT_VIDEO_DESCRIPTION = 'Architectural animation by Arqing for digital displays, presentations, and video marketing.';
const CINEMA_VIDEOS_DATA_URL = '/work/animations/cinema-videos.json';
const DEFAULT_ACTIVE_VIDEO_TITLE = 'Navy Yard Hotel';

function normalizeCinemaVideos(rawVideos) {
    if (!Array.isArray(rawVideos)) return [];

    return rawVideos
        .filter((video) => video && typeof video.title === 'string' && typeof video.embedUrl === 'string')
        .map((video) => ({
            title: video.title.trim(),
            description: (typeof video.description === 'string' && video.description.trim())
                ? video.description.trim()
                : DEFAULT_VIDEO_DESCRIPTION,
            videoUrl: typeof video.videoUrl === 'string' ? video.videoUrl.trim() : '',
            embedUrl: video.embedUrl.trim()
        }))
        .filter((video) => video.title && video.embedUrl);
}

async function loadCinemaVideos() {
    try {
        const response = await fetch(CINEMA_VIDEOS_DATA_URL, { credentials: 'same-origin' });
        if (!response.ok) {
            throw new Error(`Failed to load cinema videos JSON (${response.status})`);
        }

        const data = await response.json();
        return normalizeCinemaVideos(data);
    } catch (error) {
        console.error('[animations] Unable to load cinema videos JSON:', error);
        return [];
    }
}

function getInitialActiveIndex(videos) {
    if (!videos.length) return 0;

    const preferredIndex = videos.findIndex((video) => video.title === DEFAULT_ACTIVE_VIDEO_TITLE);
    return preferredIndex >= 0 ? preferredIndex : 0;
}

function renderCinemaThumbs(thumbsContainer, videos, activeIndex) {
    thumbsContainer.innerHTML = '';

    videos.forEach((video, index) => {
        const button = document.createElement('button');
        const isActive = index === activeIndex;

        button.type = 'button';
        button.className = `cinema-thumb${isActive ? ' active' : ''}`;
        button.setAttribute('data-title', video.title);
        button.setAttribute('data-index', String(index));
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');

        const media = document.createElement('div');
        media.className = 'thumb-media';
        const thumbImg = document.createElement('div');
        thumbImg.className = 'thumb-img';
        media.appendChild(thumbImg);

        const title = document.createElement('span');
        title.className = 'thumb-title';
        title.textContent = video.title;

        button.appendChild(media);
        button.appendChild(title);
        thumbsContainer.appendChild(button);
    });
}

function createThumbnailUrl(embedUrl) {
    const url = new URL(embedUrl);

    if (url.hostname.includes('youtube.com')) {
        const videoId = url.pathname.split('/').filter(Boolean).pop();
        return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '';
    }

    if (url.hostname.includes('vimeo.com')) {
        const videoId = url.pathname.split('/').filter(Boolean).pop();
        return videoId ? `https://vumbnail.com/${videoId}.jpg` : '';
    }

    return '';
}

function createPlayerUrl(embedUrl, autoplay = false) {
    const url = new URL(embedUrl);

    if (url.hostname.includes('youtube.com')) {
        url.searchParams.set('autoplay', autoplay ? '1' : '0');
        url.searchParams.set('playsinline', '1');
        url.searchParams.set('rel', '0');
        url.searchParams.set('modestbranding', '1');
        url.searchParams.set('enablejsapi', '1');
    } else if (url.hostname.includes('vimeo.com')) {
        url.searchParams.set('autoplay', autoplay ? '1' : '0');
        url.searchParams.set('muted', '0');
        url.searchParams.set('title', '0');
        url.searchParams.set('byline', '0');
        url.searchParams.set('portrait', '0');
        url.searchParams.set('dnt', '1');
    }

    return url.toString();
}

function getProvider(embedUrl) {
    return embedUrl.includes('youtube.com') ? 'youtube' : 'vimeo';
}

function createConnectionHints(urls) {
    const seen = new Set();

    urls.forEach((url) => {
        if (!url) return;

        const origin = new URL(url).origin;
        if (seen.has(origin)) return;

        seen.add(origin);

        const dnsPrefetch = document.createElement('link');
        dnsPrefetch.rel = 'dns-prefetch';
        dnsPrefetch.href = origin;
        document.head.appendChild(dnsPrefetch);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    new StillsCrossCTAEngine();

    const { subtitleRevealPromise } = await initializeWorkPageIntro({
        titleSelector: '.animations-title',
        subtitleSelector: '.animations-subtitle',
        fallbackDelayMobileMs: 1000,
        fallbackDelayDesktopMs: 2400
    });

    const thumbsContainer = document.getElementById('cinemaThumbnails');
    const mainPlayer = document.getElementById('mainPlayer');
    const mainPlayerTitle = document.getElementById('cinemaTitle');
    const mainPoster = document.getElementById('cinemaPoster');
    const cinemaEmbed = document.getElementById('cinemaEmbed');
    const playButton = document.getElementById('cinemaPlayButton');
    const cinemaStage = document.querySelector('.cinema-main-stage');
    const cinemaThumbsWrapper = document.querySelector('.cinema-thumbnails-wrapper');
    const swipeHint = cinemaThumbsWrapper?.querySelector('.cinema-swipe-hint') || null;

    if (!thumbsContainer || !mainPlayer || !mainPlayerTitle || !mainPoster || !cinemaEmbed || !playButton || !cinemaStage) {
        return;
    }

    const cinemaVideos = await loadCinemaVideos();
    if (!cinemaVideos.length) {
        console.warn('[animations] No valid cinema videos were found in JSON.');
        return;
    }

    const initialActiveIndex = getInitialActiveIndex(cinemaVideos);
    renderCinemaThumbs(thumbsContainer, cinemaVideos, initialActiveIndex);
    const allThumbs = Array.from(thumbsContainer.querySelectorAll('.cinema-thumb'));
    if (!allThumbs.length) {
        return;
    }
    mainPlayerTitle.textContent = cinemaVideos[initialActiveIndex].title;

    createConnectionHints([
        'https://i.ytimg.com',
        'https://vumbnail.com',
        'https://www.youtube.com',
        'https://player.vimeo.com'
    ]);

    const stageRevealConfig = {
        duration: 1.2,
        stagger: 0.18,
        y: 40,
        ease: 'power3.out'
    };

    const state = {
        activeIndex: initialActiveIndex,
        isDragging: false,
        isPointerDown: false,
        hasDismissedSwipeHint: false,
        hasCinemaBeenRevealed: false,
        hasPlayerEnteredViewport: false,
        currentEmbedSrc: '',
        loadedThumbIndexes: new Set(),
        playedIndexes: new Set()
    };

    const stageRevealTargets = [cinemaThumbsWrapper, cinemaStage].filter(Boolean);

    if (stageRevealTargets.length && typeof gsap !== 'undefined') {
        gsap.set(stageRevealTargets, { opacity: 0, y: stageRevealConfig.y });
    }

    function getVideo(index = state.activeIndex) {
        return cinemaVideos[index] || null;
    }

    function dismissSwipeHint() {
        if (state.hasDismissedSwipeHint || !swipeHint) return;

        state.hasDismissedSwipeHint = true;
        swipeHint.classList.add('is-dismissed');
    }

    function setPosterImage(video) {
        if (!video) return;

        const thumbnailUrl = createThumbnailUrl(video.embedUrl);
        const posterSignature = thumbnailUrl || video.embedUrl;

        if (mainPoster.dataset.posterSignature === posterSignature) return;

        mainPoster.dataset.posterSignature = posterSignature;
        mainPoster.style.backgroundImage = thumbnailUrl
            ? `linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.12) 45%, rgba(0, 0, 0, 0.28) 100%), url("${thumbnailUrl}")`
            : 'radial-gradient(circle at center, rgba(30, 30, 35, 0.6) 0%, #0c0e10 100%)';
    }

    function loadThumbBackground(index) {
        if (state.loadedThumbIndexes.has(index)) return;

        const thumb = allThumbs[index];
        const thumbImage = thumb?.querySelector('.thumb-img');
        const video = getVideo(index);
        if (!thumbImage || !video) return;

        const thumbnailUrl = createThumbnailUrl(video.embedUrl);
        if (!thumbnailUrl) return;

        thumbImage.style.backgroundImage = `linear-gradient(to top, rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.1)), url("${thumbnailUrl}")`;
        state.loadedThumbIndexes.add(index);
    }

    function preloadThumbCluster(centerIndex, radius = 1) {
        for (let index = centerIndex - radius; index <= centerIndex + radius; index += 1) {
            if (index >= 0 && index < allThumbs.length) {
                loadThumbBackground(index);
            }
        }
    }

    function animateTitleChange(nextTitle) {
        if (mainPlayerTitle.textContent === nextTitle || typeof gsap === 'undefined') {
            mainPlayerTitle.textContent = nextTitle;
            return;
        }

        gsap.to(mainPlayerTitle, {
            opacity: 0,
            y: 10,
            duration: 0.25,
            onComplete: () => {
                mainPlayerTitle.textContent = nextTitle;
                gsap.to(mainPlayerTitle, {
                    opacity: 1,
                    y: 0,
                    duration: 0.35,
                    ease: 'power2.out'
                });
            }
        });
    }

    function hydratePlayer({ autoplay = false, force = false } = {}) {
        const video = getVideo();
        if (!video) return;

        if (!force && !autoplay && !state.hasPlayerEnteredViewport) {
            return;
        }

        const nextSrc = createPlayerUrl(video.embedUrl, autoplay);
        if (state.currentEmbedSrc === nextSrc) return;

        cinemaEmbed.title = `${video.title} video player`;
        cinemaEmbed.src = nextSrc;
        state.currentEmbedSrc = nextSrc;
    }

    function setPlayerState({ index, autoplay = false }) {
        const video = getVideo(index);
        if (!video) return;

        state.activeIndex = index;
        mainPlayer.dataset.provider = getProvider(video.embedUrl);
        mainPlayer.dataset.state = autoplay ? 'playing' : 'idle';
        mainPlayer.dataset.hasPlayed = state.playedIndexes.has(index) ? 'true' : 'false';
        animateTitleChange(video.title);

        if (state.hasCinemaBeenRevealed || state.hasPlayerEnteredViewport || autoplay) {
            setPosterImage(video);
        }

        preloadThumbCluster(index, 1);
        hydratePlayer({ autoplay, force: autoplay || state.hasPlayerEnteredViewport });

        if (typeof gsap !== 'undefined') {
            gsap.fromTo(
                mainPoster,
                { opacity: 0.55, scale: 0.985 },
                { opacity: autoplay ? 0 : 1, scale: 1, duration: 0.5, ease: 'power2.out' }
            );
        } else {
            mainPoster.style.opacity = autoplay ? '0' : '1';
        }
    }

    function centerThumb(index, behavior = 'smooth') {
        const thumb = allThumbs[index];
        if (!thumb) return;

        const targetLeft = thumb.offsetLeft - ((thumbsContainer.clientWidth - thumb.clientWidth) / 2);
        const maxLeft = Math.max(thumbsContainer.scrollWidth - thumbsContainer.clientWidth, 0);
        const left = Math.max(0, Math.min(targetLeft, maxLeft));

        thumbsContainer.scrollTo({ left, behavior });
    }

    function activateThumb(index, { autoplay = false, center = true, centerBehavior = 'smooth' } = {}) {
        allThumbs.forEach((thumb, thumbIndex) => {
            const isActive = thumbIndex === index;
            thumb.classList.toggle('active', isActive);
            thumb.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });

        setPlayerState({ index, autoplay });

        if (center) {
            centerThumb(index, centerBehavior);
        }
    }

    function updateCoverFlow() {
        const containerCenter = thumbsContainer.offsetWidth / 2;

        allThumbs.forEach((thumb) => {
            const thumbCenter = (thumb.offsetLeft - thumbsContainer.scrollLeft) + (thumb.offsetWidth / 2);
            const distanceFromCenter = thumbCenter - containerCenter;

            let normalized = distanceFromCenter / (thumbsContainer.offsetWidth / 2);
            normalized = Math.max(-1.5, Math.min(1.5, normalized));

            const angle = normalized * 55;
            const zTranslate = -Math.abs(normalized) * 200;
            const scale = 1 - Math.abs(normalized) * 0.1;
            const xTranslate = -normalized * 80;

            thumb.style.transform = `translate3d(${xTranslate}px, 0, ${zTranslate}px) rotateY(${angle}deg) scale(${scale})`;
            thumb.style.opacity = `${Math.max(0.3, 1 - Math.abs(normalized) * 0.6)}`;
            thumb.style.zIndex = `${Math.round(100 - Math.abs(distanceFromCenter))}`;
        });
    }

    if (typeof IntersectionObserver !== 'undefined') {
        const stageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;

                state.hasPlayerEnteredViewport = true;
                setPosterImage(getVideo());
                preloadThumbCluster(state.activeIndex, 2);
                if (state.hasCinemaBeenRevealed) {
                    hydratePlayer();
                }
                observer.unobserve(entry.target);
            });
        }, { rootMargin: '250px 0px' });

        stageObserver.observe(cinemaStage);

        const thumbObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;

                const index = Number(entry.target.getAttribute('data-index'));
                if (Number.isNaN(index)) return;

                loadThumbBackground(index);
                observer.unobserve(entry.target);
            });
        }, {
            root: thumbsContainer,
            rootMargin: '0px 35%'
        });

        allThumbs.forEach((thumb) => thumbObserver.observe(thumb));
    } else {
        preloadThumbCluster(state.activeIndex, 2);
    }

    thumbsContainer.addEventListener('scroll', () => requestAnimationFrame(updateCoverFlow));
    window.addEventListener('resize', () => requestAnimationFrame(updateCoverFlow));
    requestAnimationFrame(updateCoverFlow);
    setTimeout(() => requestAnimationFrame(updateCoverFlow), 100);

    let startX = 0;
    let scrollLeft = 0;
    let dragTargetScrollLeft = 0;
    let dragAnimationFrame = null;

    thumbsContainer.style.cursor = 'grab';

    thumbsContainer.addEventListener('wheel', dismissSwipeHint, { passive: true, once: true });
    thumbsContainer.addEventListener('touchmove', dismissSwipeHint, { passive: true, once: true });

    function clampThumbsScrollLeft(left) {
        const maxLeft = Math.max(thumbsContainer.scrollWidth - thumbsContainer.clientWidth, 0);
        return Math.max(0, Math.min(left, maxLeft));
    }

    function animateDragScroll() {
        const distance = dragTargetScrollLeft - thumbsContainer.scrollLeft;

        if (Math.abs(distance) < 0.5) {
            thumbsContainer.scrollLeft = dragTargetScrollLeft;
            dragAnimationFrame = null;

            if (!state.isPointerDown) {
                thumbsContainer.classList.remove('is-dragging');
            }

            requestAnimationFrame(updateCoverFlow);
            return;
        }

        thumbsContainer.scrollLeft += distance * 0.28;
        dragAnimationFrame = requestAnimationFrame(animateDragScroll);
    }

    function requestDragScrollUpdate() {
        if (dragAnimationFrame) return;
        dragAnimationFrame = requestAnimationFrame(animateDragScroll);
    }

    function endDragScroll() {
        state.isPointerDown = false;
        thumbsContainer.style.cursor = 'grab';

        if (!dragAnimationFrame) {
            thumbsContainer.classList.remove('is-dragging');
        }

        setTimeout(() => {
            state.isDragging = false;
        }, 0);
    }

    thumbsContainer.addEventListener('mousedown', (event) => {
        if (dragAnimationFrame) {
            cancelAnimationFrame(dragAnimationFrame);
            dragAnimationFrame = null;
        }

        state.isPointerDown = true;
        state.isDragging = false;
        thumbsContainer.style.cursor = 'grabbing';
        thumbsContainer.classList.add('is-dragging');
        startX = event.pageX - thumbsContainer.offsetLeft;
        scrollLeft = thumbsContainer.scrollLeft;
        dragTargetScrollLeft = scrollLeft;
    });

    thumbsContainer.addEventListener('mouseleave', () => {
        endDragScroll();
    });

    window.addEventListener('mouseup', () => {
        endDragScroll();
    });

    thumbsContainer.addEventListener('mousemove', (event) => {
        if (!state.isPointerDown) return;
        event.preventDefault();

        const x = event.pageX - thumbsContainer.offsetLeft;
        const walk = (x - startX) * 2;

        if (Math.abs(walk) > 5) {
            state.isDragging = true;
            dismissSwipeHint();
            dragTargetScrollLeft = clampThumbsScrollLeft(scrollLeft - walk);
            requestDragScrollUpdate();
        }
    });

    thumbsContainer.querySelectorAll('*').forEach((element) => {
        element.addEventListener('dragstart', (event) => event.preventDefault());
    });

    allThumbs.forEach((thumb, index) => {
        thumb.addEventListener('click', (event) => {
            if (state.isDragging) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }

            activateThumb(index, { autoplay: false });
        });
    });

    playButton.addEventListener('click', () => {
        state.playedIndexes.add(state.activeIndex);
        activateThumb(state.activeIndex, { autoplay: true, center: false });
    });

    mainPoster.addEventListener('click', () => {
        if (mainPlayer.dataset.state !== 'playing') {
            state.playedIndexes.add(state.activeIndex);
            activateThumb(state.activeIndex, { autoplay: true, center: false });
        }
    });

    activateThumb(state.activeIndex, { autoplay: false, center: true, centerBehavior: 'auto' });
    requestAnimationFrame(() => {
        centerThumb(state.activeIndex, 'auto');
        updateCoverFlow();
    });
    window.addEventListener('load', () => {
        centerThumb(state.activeIndex, 'auto');
        requestAnimationFrame(updateCoverFlow);
    }, { once: true });

    subtitleRevealPromise.then(() => {
        state.hasCinemaBeenRevealed = true;

        if (stageRevealTargets.length && typeof gsap !== 'undefined') {
            gsap.to(stageRevealTargets, {
                opacity: 1,
                y: 0,
                duration: stageRevealConfig.duration,
                stagger: stageRevealConfig.stagger,
                ease: stageRevealConfig.ease
            });
        } else {
            stageRevealTargets.forEach((element) => {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            });
        }

        if (state.hasPlayerEnteredViewport) {
            setPosterImage(getVideo());
            preloadThumbCluster(state.activeIndex, 2);
            hydratePlayer();
        }
    });
});
