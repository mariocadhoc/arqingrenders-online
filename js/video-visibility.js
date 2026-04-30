document.addEventListener('DOMContentLoaded', () => {
  const videos = Array.from(document.querySelectorAll('video'));
  if (!videos.length) return;

  const visibleVideos = new Set();
  let playbackRetryQueued = false;

  const syncAutoplayAttributes = (video) => {
    if (video.hasAttribute('muted')) {
      video.muted = true;
      video.defaultMuted = true;
    }

    if (video.hasAttribute('autoplay')) {
      video.autoplay = true;
    }

    if (video.hasAttribute('playsinline')) {
      video.playsInline = true;
    }
  };

  const loadAndPlay = (video) => {
    syncAutoplayAttributes(video);

    if (video.dataset.videoLoaded !== 'true') {
      video.preload = 'metadata';
      video.load();
      video.dataset.videoLoaded = 'true';
    }

    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch((error) => {
        if (error?.name === 'NotAllowedError') {
          queuePlaybackRetry();
        }
      });
    }
  };

  const retryVisibleVideos = () => {
    playbackRetryQueued = false;
    visibleVideos.forEach((video) => loadAndPlay(video));
  };

  const queuePlaybackRetry = () => {
    if (playbackRetryQueued) return;
    playbackRetryQueued = true;

    ['pointerdown', 'touchstart', 'keydown', 'scroll'].forEach((eventName) => {
      window.addEventListener(eventName, retryVisibleVideos, { once: true, passive: true });
    });
    window.addEventListener('pageshow', retryVisibleVideos, { once: true });
  };

  const pauseVideo = (video) => {
    video.pause();
  };

  if (!('IntersectionObserver' in window)) {
    videos.forEach((video) => loadAndPlay(video));
    return;
  }

  videos.forEach((video) => {
    video.preload = 'none';
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        const inView = entry.isIntersecting && entry.intersectionRatio > 0;

        if (inView) {
          visibleVideos.add(video);
          loadAndPlay(video);
          return;
        }

        visibleVideos.delete(video);
        pauseVideo(video);
      });
    },
    {
      root: null,
      rootMargin: '250px 0px',
      threshold: 0.01
    }
  );

  videos.forEach((video) => observer.observe(video));

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      videos.forEach((video) => pauseVideo(video));
      return;
    }

    visibleVideos.forEach((video) => loadAndPlay(video));
  });
});
