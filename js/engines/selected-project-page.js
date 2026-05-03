import { initProjectMap } from './map-gps.js';
import { openGalleryLightbox } from './gallery-modal-lightbox.js';

async function loadProjectData() {
    if (window.projectData) return window.projectData;

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

function setText(selector, value) {
    if (!value) return;
    document.querySelectorAll(selector).forEach((node) => {
        node.textContent = value;
    });
}

function prepareHeroTitleAnimation() {
    const title = document.querySelector('.sp-title');
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

function prepareBackLinkHover() {
    const backLink = document.querySelector('.sp-back-link');
    const label = backLink?.querySelector('.sp-back-link-label');
    if (!backLink || !label) return;

    const rawText = label.textContent || '';
    const chars = Array.from(rawText);
    label.setAttribute('aria-hidden', 'true');
    label.textContent = '';

    chars.forEach((char) => {
        const charNode = document.createElement('span');
        charNode.className = char === ' ' ? 'sp-back-char sp-back-char-space' : 'sp-back-char';
        charNode.textContent = char;
        charNode.dataset.scale = '1';
        label.appendChild(charNode);
    });

    const charNodes = Array.from(label.querySelectorAll('.sp-back-char'));

    const resetScales = () => {
        charNodes.forEach((charNode) => {
            charNode.style.setProperty('--back-char-scale', '1');
        });
    };

    const applyProximityScale = (event) => {
        const pointerX = event.clientX;

        charNodes.forEach((charNode) => {
            if (charNode.classList.contains('sp-back-char-space')) {
                charNode.style.setProperty('--back-char-scale', '1');
                return;
            }

            const rect = charNode.getBoundingClientRect();
            const charCenter = rect.left + (rect.width / 2);
            const distance = Math.abs(pointerX - charCenter);
            let scale = 1;

            if (distance <= 18) scale = 1.12;
            else if (distance <= 36) scale = 1.09;
            else if (distance <= 56) scale = 1.06;

            charNode.style.setProperty('--back-char-scale', scale.toFixed(3));
        });
    };

    backLink.addEventListener('pointermove', applyProximityScale);
    backLink.addEventListener('pointerleave', resetScales);
    backLink.addEventListener('blur', resetScales, true);
    resetScales();
}

function toFrameLabel(index) {
    return `Frame ${String(index + 1).padStart(2, '0')}`;
}

function hydrateProjectMeta(data) {
    if (data.skipHydration) return;

    const galleryCount = Array.isArray(data.gallery) ? data.gallery.length : 0;
    const fallbackDescription = `${data.name} is presented through a curated still sequence for ${data.client}.`;
    const description = data.description || fallbackDescription;
    const gallerySummary = data.gallerySummary || `${galleryCount} renders linked in one continuous lightbox sequence.`;

    document.title = `${data.name} | Selected Projects | Arqing`;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
        metaDescription.setAttribute('content', description);
    }

    setText('[data-project-eyebrow]', data.eyebrow || 'Selected Projects');
    setText('[data-project-name]', data.name);
    setText('[data-project-location]', data.location);
    setText('[data-project-client]', data.client);
    setText('[data-project-description]', description);
    setText('[data-project-address]', data.address || data.location);
    setText('[data-gallery-summary]', gallerySummary);
}

function classifyAspect(aspectRatio) {
    if (aspectRatio >= 1.42) return 'wide';
    if (aspectRatio >= 1.06) return 'landscape';
    if (aspectRatio <= 0.78) return 'portrait';
    return 'square';
}

function getGalleryColumns() {
    if (window.innerWidth <= 780) return 2;
    if (window.innerWidth <= 1120) return 6;
    return 12;
}

function getColumnSpan(index, aspectRatio, total, columns) {
    if (columns === 2) {
        if (index === 0 || aspectRatio > 1.08) return 2;
        return 1;
    }

    if (columns === 6) {
        if (index === 0) return aspectRatio > 1.04 ? 6 : 3;
        if (aspectRatio >= 1.42) return 4;
        if (aspectRatio <= 0.78) return index % 2 === 0 ? 2 : 3;
        return index % 3 === 0 ? 4 : 3;
    }

    if (index === 0) return aspectRatio > 1.12 ? 7 : 5;
    if (total === 2) return index === 1 ? 5 : 7;

    const aspectType = classifyAspect(aspectRatio);
    const sequences = {
        wide: [5, 4, 6, 4, 5, 3],
        landscape: [4, 5, 4, 3, 5, 4],
        portrait: [4, 3, 4, 5, 3, 4],
        square: [4, 4, 5, 3, 4, 5]
    };

    return sequences[aspectType][index % sequences[aspectType].length];
}

function getHeightMultiplier(index, aspectRatio, columns) {
    if (columns === 2) return aspectRatio <= 0.82 ? 1.08 : 1;
    if (index === 0) return aspectRatio > 1.18 ? 1.08 : 1.16;
    if (aspectRatio >= 1.42) return 0.94;
    if (aspectRatio <= 0.78) return 1.12;

    return [1, 0.96, 1.08, 0.94, 1.04, 0.98][index % 6];
}

function getOffset(index, columns) {
    if (columns < 12) return 0;
    return [0, 52, -34, 26, -18, 44, -10, 18][index % 8];
}

function getTilt(index, columns) {
    if (columns < 12) return 0;
    return [0, -0.8, 0.55, -0.45, 0.7, -0.62, 0.3, -0.24][index % 8];
}

function getGalleryItemDataFromButton(button, index) {
    const image = button.querySelector('.sp-gallery-image');
    const caption = button.querySelector('.sp-gallery-caption strong')?.textContent?.trim();
    const title = button.dataset.title || caption || toFrameLabel(index);
    const src = image?.currentSrc || image?.getAttribute('src') || '';

    return {
        thumbSrc: button.dataset.thumbSrc || src,
        fullSrc: button.dataset.fullSrc || src,
        alt: image?.getAttribute('alt') || title,
        caption: caption || toFrameLabel(index),
        title
    };
}

function getLightboxUiText() {
    const isSpanish = (document.documentElement.lang || '').toLowerCase().startsWith('es');
    if (!isSpanish) return {};

    return {
        closeLightbox: 'Cerrar visor',
        clickToZoom: 'Clic para acercar',
        clickToFit: 'Clic para ajustar',
        openImage: (index) => `Abrir imagen ${index + 1}`,
        projectImage: 'Imagen del proyecto',
        imageLabel: (label, index) => `${label} imagen ${index + 1}`
    };
}

function connectGalleryItems(gallery, items, mediaItems) {
    let layoutFrame = null;

    function applyGalleryLayout() {
        layoutFrame = null;
        const columns = getGalleryColumns();
        const styles = window.getComputedStyle(gallery);
        const gap = parseFloat(styles.columnGap || styles.gap) || 20;
        const rowUnit = parseFloat(styles.gridAutoRows) || 28;
        const columnWidth = (gallery.clientWidth - (gap * (columns - 1))) / columns;

        items.forEach((item, index) => {
            const aspectRatio = Number.parseFloat(item.dataset.aspect) || 1.15;
            const columnSpan = Math.min(columns, Math.max(1, getColumnSpan(index, aspectRatio, items.length, columns)));
            const width = (columnWidth * columnSpan) + (gap * (columnSpan - 1));
            const height = Math.max(220, (width / aspectRatio) * getHeightMultiplier(index, aspectRatio, columns));
            const rowSpan = Math.max(columns === 2 ? 10 : 8, Math.round(height / rowUnit));

            item.style.setProperty('--col-span', `${columnSpan}`);
            item.style.setProperty('--row-span', `${rowSpan}`);
            item.style.setProperty('--offset-y', `${getOffset(index, columns)}px`);
            item.style.setProperty('--tilt', `${getTilt(index, columns)}deg`);
        });
    }

    function queueGalleryLayout() {
        if (layoutFrame) cancelAnimationFrame(layoutFrame);
        layoutFrame = requestAnimationFrame(() => {
            applyGalleryLayout();
            if (typeof window.ScrollTrigger !== 'undefined') {
                window.ScrollTrigger.refresh();
            }
        });
    }

    const revealObserver = 'IntersectionObserver' in window
        ? new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;

                entry.target.classList.add('is-gallery-visible');

                if (entry.target.classList.contains('is-image-ready')) {
                    entry.target.classList.add('is-image-loaded');
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 })
        : null;

    items.forEach((button, index) => {
        const image = button.querySelector('.sp-gallery-image');
        if (!image) return;

        const markImageReady = () => {
            button.classList.remove('is-image-loading');
            button.classList.add('is-image-ready');

            if (button.classList.contains('is-gallery-visible')) {
                button.classList.add('is-image-loaded');
                revealObserver?.unobserve(button);
            }
        };

        button.classList.add('is-image-loading');

        if (revealObserver) {
            revealObserver.observe(button);
        } else {
            button.classList.add('is-gallery-visible');
        }

        const updateAspect = () => {
            const naturalWidth = image.naturalWidth || image.width || 1;
            const naturalHeight = image.naturalHeight || image.height || 1;
            button.dataset.aspect = String(naturalWidth / naturalHeight);

            markImageReady();
            queueGalleryLayout();
        };

        if (image.complete) {
            updateAspect();
        } else {
            image.addEventListener('load', updateAspect, { once: true });
            image.addEventListener('error', updateAspect, { once: true });
        }

        button.addEventListener('pointermove', (event) => {
            const rect = button.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * 100;
            const y = ((event.clientY - rect.top) / rect.height) * 100;
            button.style.setProperty('--mx', `${x}%`);
            button.style.setProperty('--my', `${y}%`);
        });

        button.addEventListener('pointerleave', () => {
            button.style.removeProperty('--mx');
        });

        button.addEventListener('pointerleave', () => {
            button.style.removeProperty('--my');
        });

        button.addEventListener('click', () => {
            const rect = button.getBoundingClientRect();
            openGalleryLightbox({
                mediaItems,
                sourceRect: rect,
                initialIndex: index,
                uiText: getLightboxUiText()
            });
        });
    });

    queueGalleryLayout();
    window.addEventListener('resize', queueGalleryLayout, { passive: true });
}

function buildGallery(galleryItems) {
    const gallery = document.getElementById('selected-project-gallery');
    if (!gallery) return { items: [], lightbox: null };

    const existingItems = Array.from(gallery.querySelectorAll('.sp-gallery-item'));
    if (existingItems.length) {
        const normalizedItems = existingItems.map(getGalleryItemDataFromButton).filter((item) => item.fullSrc);

        if (normalizedItems.length) {
            connectGalleryItems(gallery, existingItems, normalizedItems);
        }

        return { items: existingItems, lightbox: null };
    }

    if (!Array.isArray(galleryItems) || galleryItems.length === 0) {
        gallery.innerHTML = '<p class="sp-section-copy">No renders have been assigned to this selected project yet.</p>';
        return { items: [], lightbox: null };
    }

    const normalizedItems = galleryItems.map((item, index) => ({
        thumbSrc: item.thumbSrc || item.thumb || item.src,
        fullSrc: item.fullSrc || item.full || item.src,
        alt: item.alt || `${item.name || 'Project render'} ${index + 1}`,
        caption: item.caption || toFrameLabel(index),
        meta: item.meta || 'Selected Projects',
        title: item.title || 'Project render',
        width: item.width,
        height: item.height
    })).filter((item) => item.fullSrc);

    const fragment = document.createDocumentFragment();

    normalizedItems.forEach((item, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'sp-gallery-item';
        button.dataset.index = String(index);
        button.dataset.aspect = '1.15';
        button.setAttribute('aria-label', `Open ${item.caption}`);
        const sizeAttrs = item.width && item.height ? ` width="${item.width}" height="${item.height}"` : '';
        button.innerHTML = `
            <span class="sp-gallery-frame">
                <img class="sp-gallery-image" src="${item.thumbSrc || item.fullSrc}" alt="${item.alt}" ${index < 2 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"${sizeAttrs}>
                <span class="sp-gallery-caption">
                    <span>
                        <strong>${item.caption}</strong>
                        <span>${item.meta}</span>
                    </span>
                    <span class="sp-gallery-index">${String(index + 1).padStart(2, '0')}</span>
                </span>
            </span>
        `;

        fragment.appendChild(button);
    });

    gallery.innerHTML = '';
    gallery.appendChild(fragment);

    const items = Array.from(gallery.querySelectorAll('.sp-gallery-item'));
    connectGalleryItems(gallery, items, normalizedItems);

    return { items, lightbox: null };
}

function initAnimations(items) {
    if (typeof window.gsap === 'undefined') return;

    if (typeof window.ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(window.ScrollTrigger);
    }

    const heroTimeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
    const titleChars = document.querySelectorAll('.sp-title-char');

    heroTimeline
        .fromTo('.sp-kicker', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.72 }, 0)
        .fromTo('.sp-kicker', { '--kicker-line-scale': 0.2 }, { '--kicker-line-scale': 1, duration: 0.85, ease: 'expo.out' }, 0)
        .fromTo('.sp-title', { opacity: 1 }, { opacity: 1, duration: 0.01 }, 0)
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
        .fromTo('.sp-intro', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.6')
        .fromTo('.sp-meta-card', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.65, stagger: 0.12 }, '-=0.45')
        .fromTo('.sp-map-card', { opacity: 0, y: 34, scale: 0.985 }, { opacity: 1, y: 0, scale: 1, duration: 0.9 }, '-=0.6');

    const sectionHead = document.querySelector('.sp-section-head');
    if (sectionHead && typeof window.ScrollTrigger !== 'undefined') {
        gsap.fromTo(sectionHead,
            { opacity: 0, y: 28 },
            {
                opacity: 1,
                y: 0,
                duration: 0.85,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: sectionHead,
                    start: 'top 84%'
                }
            }
        );
    }

    const backLink = document.querySelector('.sp-back-link');
    if (backLink) {
        if (typeof window.ScrollTrigger === 'undefined') {
            gsap.fromTo(backLink,
                { opacity: 0, y: 30, scale: 0.985 },
                { opacity: 1, y: 0, scale: 1, duration: 0.85, ease: 'power3.out', delay: 0.15 }
            );
        } else {
            gsap.fromTo(backLink,
                { opacity: 0, y: 34, scale: 0.985 },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.9,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: backLink,
                        start: 'top 92%'
                    }
                }
            );
        }
    }

    items.forEach((item, index) => {
        if (typeof window.ScrollTrigger === 'undefined') {
            gsap.fromTo(item, { opacity: 0, y: 32 }, { opacity: 1, y: 0, duration: 0.8, delay: index * 0.04 });
            return;
        }

        gsap.fromTo(item,
            { opacity: 0, y: 44, scale: 0.985 },
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
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const data = await loadProjectData();

    if (data) {
        hydrateProjectMeta(data);
    }

    prepareHeroTitleAnimation();
    prepareBackLinkHover();
    initProjectMap(data || {});

    const { items } = buildGallery(data?.gallery || []);
    initAnimations(items);
});
