import { openGalleryLightbox } from './engines/gallery-modal-lightbox.js';
import StillsCrossCTAEngine from './engines/stills-cross-cta.js';
import { initProjectMap } from './engines/map-gps.js';

async function loadProjectData() {
    const pageRoot = document.querySelector('[data-selected-project-slug]');
    const projectSlug = pageRoot?.dataset.selectedProjectSlug;
    if (!projectSlug) return null;

    try {
        const module = await import(`/js/engines/selected-project-data/${projectSlug}.js`);
        return module.default || module.projectData || null;
    } catch (error) {
        console.error(`Selected project data could not be loaded for "${projectSlug}".`, error);
        return null;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize CTA Engine
    new StillsCrossCTAEngine();

    // 2. Wrap hero title into words/characters for animation
    prepareTitleAnimation();

    // 3. Set up gallery lightbox
    setupGalleryLightbox();

    // 4. Initialize Leaflet Map
    const data = await loadProjectData();
    if (data) {
        initProjectMap(data);
    }

    // 5. Initialize GSAP ScrollReveals
    initScrollReveals();
});

function prepareTitleAnimation() {
    const title = document.querySelector('.arq-cs-title');
    if (!title) return;

    const rawText = title.textContent || '';
    const words = rawText.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return;

    title.setAttribute('aria-label', rawText.trim());
    title.textContent = '';

    words.forEach((word, wordIndex) => {
        const wordNode = document.createElement('span');
        wordNode.className = 'sp-title-word';
        wordNode.setAttribute('aria-hidden', 'true');

        Array.from(word).forEach((char) => {
            const charNode = document.createElement('span');
            charNode.className = 'sp-title-char';
            charNode.textContent = char;
            wordNode.appendChild(charNode);
        });

        title.appendChild(wordNode);

        if (wordIndex < words.length - 1) {
            const gapNode = document.createElement('span');
            gapNode.className = 'sp-title-gap';
            gapNode.textContent = ' ';
            gapNode.setAttribute('aria-hidden', 'true');
            title.appendChild(gapNode);
        }
    });
}

function setupGalleryLightbox() {
    const galleryItems = Array.from(document.querySelectorAll('.arq-cs-gallery-item'));
    if (!galleryItems.length) return;

    const mediaItems = galleryItems.map((item, index) => {
        const img = item.querySelector('img');
        const meta = item.querySelector('.arq-cs-gallery-meta')?.textContent || '';
        const caption = item.querySelector('.arq-cs-gallery-caption')?.textContent || '';
        return {
            thumbSrc: img.getAttribute('src'),
            fullSrc: img.getAttribute('src'),
            alt: img.getAttribute('alt') || caption,
            caption: caption,
            meta: meta,
            title: caption
        };
    });

    galleryItems.forEach((button, index) => {
        button.addEventListener('click', () => {
            const rect = button.getBoundingClientRect();
            openGalleryLightbox({
                mediaItems,
                sourceRect: rect,
                initialIndex: index
            });
        });

        // Add mouse move variables for radial hover highlight
        button.addEventListener('pointermove', (event) => {
            const rect = button.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * 100;
            const y = ((event.clientY - rect.top) / rect.height) * 100;
            button.style.setProperty('--mx', `${x}%`);
            button.style.setProperty('--my', `${y}%`);
        });

        button.addEventListener('pointerleave', () => {
            button.style.removeProperty('--mx');
            button.style.removeProperty('--my');
        });
    });
}

function initScrollReveals() {
    if (typeof gsap === 'undefined') return;

    if (typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }

    // --- Hero Entrance Timeline ---
    const heroTimeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
    const titleChars = document.querySelectorAll('.sp-title-char');

    heroTimeline
        .fromTo('.arq-cs-hero .arq-cs-kicker', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.72 }, 0)
        .fromTo('.arq-cs-title', { opacity: 1 }, { opacity: 1, duration: 0.01 }, 0)
        .fromTo(titleChars,
            {
                yPercent: 112,
                opacity: 0,
                rotate: 7,
                filter: 'blur(10px)'
            },
            {
                yPercent: 0,
                opacity: 1,
                rotate: 0,
                filter: 'blur(0px)',
                duration: 1.15,
                stagger: 0.045,
                ease: 'expo.out'
            },
            0.02
        )
        .fromTo('.arq-cs-intro', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.6')
        .fromTo('.arq-cs-meta-card', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.65, stagger: 0.12 }, '-=0.45')
        .fromTo('.arq-cs-site-card .arq-cs-site-glass-card', { opacity: 0, y: 34, scale: 0.985 }, { opacity: 1, y: 0, scale: 1, duration: 0.9 }, '-=0.6');

    // --- Press block reveals ---
    const pressRows = document.querySelectorAll('.arq-cs-press-row');
    pressRows.forEach((row) => {
        const img = row.querySelector('.arq-cs-press-img');
        const copy = row.querySelector('.arq-cs-press-copy');

        if (img && typeof ScrollTrigger !== 'undefined') {
            gsap.fromTo(img,
                { opacity: 0, y: 44, scale: 0.98 },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.9,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: img,
                        start: 'top 85%'
                    }
                }
            );
        }

        if (copy && typeof ScrollTrigger !== 'undefined') {
            gsap.fromTo(copy,
                { opacity: 0, y: 34 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.85,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: copy,
                        start: 'top 85%'
                    }
                }
            );

            const p = copy.querySelector('p');
            if (p) {
                const originalText = p.textContent.trim();
                p.textContent = '';
                p.style.minHeight = '3.5em'; // Reserve height to prevent layout shifting

                const textObj = { charIndex: 0 };
                gsap.to(textObj, {
                    charIndex: originalText.length,
                    duration: 1.5,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: p,
                        start: 'top 88%',
                        once: true
                    },
                    onUpdate: () => {
                        p.textContent = originalText.slice(0, Math.ceil(textObj.charIndex));
                    }
                });
            }
        }
    });

    // --- Gallery reveal ---
    const galleryHead = document.querySelector('.arq-cs-gallery .arq-cs-section-head');
    if (galleryHead && typeof ScrollTrigger !== 'undefined') {
        gsap.fromTo(galleryHead,
            { opacity: 0, y: 28 },
            {
                opacity: 1,
                y: 0,
                duration: 0.85,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: galleryHead,
                    start: 'top 85%'
                }
            }
        );
    }

    const galleryItems = document.querySelectorAll('.arq-cs-gallery-item');
    galleryItems.forEach((item) => {
        if (typeof ScrollTrigger !== 'undefined') {
            gsap.fromTo(item,
                { opacity: 0, y: 44, scale: 0.98 },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.9,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: item,
                        start: 'top 90%'
                    }
                }
            );
        }
    });

    // --- CTA block reveal ---
    const ctaSection = document.querySelector('.arq-cs-cta');
    if (ctaSection && typeof ScrollTrigger !== 'undefined') {
        const ctaHeading = ctaSection.querySelector('h2');
        const ctaPara = ctaSection.querySelector('p');

        if (ctaHeading) {
            gsap.fromTo(ctaHeading, { opacity: 0, y: 24 }, {
                opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: {
                    trigger: ctaHeading, start: 'top 85%'
                }
            });
        }
        if (ctaPara) {
            gsap.fromTo(ctaPara, { opacity: 0, y: 20 }, {
                opacity: 1, y: 0, duration: 0.8, delay: 0.15, ease: 'power3.out', scrollTrigger: {
                    trigger: ctaHeading, start: 'top 85%'
                }
            });
        }
    }

    // --- Related case studies reveals ---
    const relatedHead = document.querySelector('.arq-cs-related .arq-cs-section-head');
    if (relatedHead && typeof ScrollTrigger !== 'undefined') {
        gsap.fromTo(relatedHead,
            { opacity: 0, y: 28 },
            {
                opacity: 1,
                y: 0,
                duration: 0.85,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: relatedHead,
                    start: 'top 85%'
                }
            }
        );
    }

    const relatedCards = document.querySelectorAll('.arq-cs-related-card');
    relatedCards.forEach((item) => {
        if (typeof ScrollTrigger !== 'undefined') {
            gsap.fromTo(item,
                { opacity: 0, y: 44, scale: 0.98 },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.95,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: item,
                        start: 'top 88%'
                    }
                }
            );
        }
    });

    // --- Portfolio categories reveals ---
    const portfolioHead = document.querySelector('.arq-cs-portfolio .arq-cs-section-head');
    if (portfolioHead && typeof ScrollTrigger !== 'undefined') {
        gsap.fromTo(portfolioHead,
            { opacity: 0, y: 28 },
            {
                opacity: 1,
                y: 0,
                duration: 0.85,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: portfolioHead,
                    start: 'top 85%'
                }
            }
        );
    }

    const portfolioItems = document.querySelectorAll('.arq-cs-portfolio .work-item');
    portfolioItems.forEach((item) => {
        if (typeof ScrollTrigger !== 'undefined') {
            gsap.fromTo(item,
                { opacity: 0, y: 44, scale: 0.98 },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.95,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: item,
                        start: 'top 88%'
                    }
                }
            );
        }
    });
}
