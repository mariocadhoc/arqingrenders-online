document.addEventListener('DOMContentLoaded', () => {
  const videos = Array.from(document.querySelectorAll('video'));
  if (!videos.length) return;

  const visibleVideos = new Set();

  const loadAndPlay = (video) => {
    if (video.dataset.videoLoaded !== 'true') {
      video.preload = 'metadata';
      video.load();
      video.dataset.videoLoaded = 'true';
    }

    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        // Ignore autoplay policy errors on browsers with stricter rules.
      });
    }
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
