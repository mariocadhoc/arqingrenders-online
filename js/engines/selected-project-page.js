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

function createMapPin() {
    if (typeof window.L === 'undefined') return null;

    return window.L.divIcon({
        className: 'sp-map-pin',
        html: '<span></span>',
        iconSize: [18, 18],
        iconAnchor: [9, 9]
    });
}

function createMapPointer(mapElement, isMobile) {
    const pointer = document.createElement('button');
    pointer.type = 'button';
    pointer.className = 'sp-map-pointer';
    pointer.setAttribute('aria-label', 'Center map on project');
    pointer.innerHTML = `
        <span class="sp-map-pointer-ring">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M12 3L19 17H5L12 3Z"></path>
            </svg>
        </span>
    `;

    mapElement.appendChild(pointer);

    if (isMobile) {
        pointer.addEventListener('touchend', (event) => {
            event.preventDefault();
        }, { passive: false });
    }

    return pointer;
}

function initProjectMap(data) {
    const mapElement = document.getElementById('selected-project-map');
    const emptyState = document.querySelector('[data-map-empty]');
    const mapData = data.map || {};

    if (!mapElement) return;

    if (!Number.isFinite(mapData.lat) || !Number.isFinite(mapData.lng) || typeof window.L === 'undefined') {
        mapElement.classList.add('hidden');
        emptyState?.classList.remove('hidden');
        return;
    }

    emptyState?.classList.add('hidden');
    mapElement.classList.remove('hidden');

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const initialZoom = Number.isFinite(mapData.initialZoom)
        ? mapData.initialZoom
        : Math.max(1, (mapData.zoom || 15) - (isMobile ? 2.8 : 4.2));
    const finalZoom = Number.isFinite(mapData.finalZoom)
        ? mapData.finalZoom
        : (isMobile ? Math.min(mapData.zoom || 15, 16) : (mapData.zoom || 15));

    const map = window.L.map(mapElement, {
        attributionControl: false,
        zoomControl: true,
        zoomSnap: 0.1,
        zoomDelta: 0.5,
        scrollWheelZoom: false,
        touchZoom: true,
        tap: !window.L.Browser.mobile,
        tapTolerance: 15,
        dragging: true
    }).setView([mapData.lat, mapData.lng], initialZoom);

    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    const marker = window.L.marker([mapData.lat, mapData.lng], {
        icon: createMapPin()
    }).addTo(map);

    if (data.address || data.name) {
        marker.bindTooltip(data.address || data.name, {
            direction: 'top',
            offset: [0, -12]
        });
    }

    const pointer = createMapPointer(mapElement, isMobile);

    const updatePointer = () => {
        const markerLatLng = marker.getLatLng();
        if (map.getBounds().contains(markerLatLng)) {
            pointer.classList.remove('visible');
            return;
        }

        pointer.classList.add('visible');

        const mapSize = map.getSize();
        const centerPoint = map.latLngToContainerPoint(map.getCenter());
        const targetPoint = map.latLngToContainerPoint(markerLatLng);
        const dx = targetPoint.x - centerPoint.x;
        const dy = targetPoint.y - centerPoint.y;
        const angle = Math.atan2(dy, dx);
        const edgePadding = isMobile ? 28 : 22;
        const radiusX = Math.max(24, (mapSize.x / 2) - edgePadding);
        const radiusY = Math.max(24, (mapSize.y / 2) - edgePadding);

        pointer.style.left = `${(radiusX * Math.cos(angle)) + (mapSize.x / 2)}px`;
        pointer.style.top = `${(radiusY * Math.sin(angle)) + (mapSize.y / 2)}px`;
        pointer.style.transform = `translate(-50%, -50%) rotate(${angle * (180 / Math.PI) + 90}deg)`;
    };

    map.on('move zoom resize', updatePointer);
    pointer.addEventListener(isMobile ? 'touchend' : 'click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        map.panTo(marker.getLatLng(), { animate: true, duration: 0.5 });
    });

    marker.on(isMobile ? 'touchend' : 'click', () => {
        map.panTo(marker.getLatLng(), { animate: true, duration: 0.5 });
    });

    const runIntroZoom = () => {
        map.flyTo([mapData.lat, mapData.lng], finalZoom, {
            animate: true,
            duration: isMobile ? 1.5 : 2.4,
            easeLinearity: 0.25
        });
    };

    setTimeout(() => map.invalidateSize(), 220);
    window.addEventListener('resize', () => map.invalidateSize(), { passive: true });

    map.once('zoomend', updatePointer);
    setTimeout(() => {
        map.invalidateSize();
        runIntroZoom();
        updatePointer();
    }, 1000);
}

class SelectedProjectLightbox {
    constructor(items) {
        this.items = items;
        this.dom = {};
        this.isOpen = false;
        this.activeIndex = 0;
        this.sourceRect = null;
        this.zoom = {
            scale: 1,
            maxScale: 1,
            baseWidth: 0,
            baseHeight: 0,
            panX: 0,
            panY: 0,
            startPanX: 0,
            startPanY: 0,
            startClientX: 0,
            startClientY: 0,
            isDragging: false,
            pointerDown: false,
            moved: false,
            skipClick: false
        };

        this.handleResize = this.handleResize.bind(this);
        this.handleKeydown = this.handleKeydown.bind(this);
        this.handlePointerMove = this.handlePointerMove.bind(this);
        this.handlePointerUp = this.handlePointerUp.bind(this);

        this.buildDOM();
        this.bindEvents();
        this.renderThumbs();
    }

    getMagnifierIcon() {
        return `
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"></circle>
                <path d="M16 16L21 21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
                <path d="M11 8v6M8 11h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
            </svg>
        `;
    }

    buildDOM() {
        const root = document.createElement('div');
        root.className = 'sp-lightbox';
        root.innerHTML = `
            <div class="sp-lightbox-bg"></div>
            <button class="sp-lightbox-close" type="button" aria-label="Close lightbox">✕</button>
            <div class="sp-lightbox-stage">
                <div class="sp-lightbox-viewport">
                    <div class="sp-lightbox-media">
                        <img class="sp-lightbox-image" src="" alt="Project render">
                    </div>
                    <div class="sp-lightbox-zoom-hint" hidden>
                        ${this.getMagnifierIcon()}
                        <span>Click to zoom</span>
                    </div>
                </div>
            </div>
            <div class="sp-lightbox-sidebar"></div>
        `;

        document.body.appendChild(root);

        this.dom.root = root;
        this.dom.bg = root.querySelector('.sp-lightbox-bg');
        this.dom.close = root.querySelector('.sp-lightbox-close');
        this.dom.viewport = root.querySelector('.sp-lightbox-viewport');
        this.dom.media = root.querySelector('.sp-lightbox-media');
        this.dom.img = root.querySelector('.sp-lightbox-image');
        this.dom.zoomHint = root.querySelector('.sp-lightbox-zoom-hint');
        this.dom.zoomHintText = this.dom.zoomHint.querySelector('span');
        this.dom.sidebar = root.querySelector('.sp-lightbox-sidebar');
    }

    bindEvents() {
        this.dom.close.addEventListener('click', () => this.close());
        this.dom.bg.addEventListener('click', () => this.close());
        this.dom.viewport.addEventListener('pointerdown', (event) => this.handlePointerDown(event));
        this.dom.viewport.addEventListener('pointermove', this.handlePointerMove);
        this.dom.viewport.addEventListener('pointerup', this.handlePointerUp);
        this.dom.viewport.addEventListener('pointercancel', this.handlePointerUp);
        this.dom.viewport.addEventListener('pointerleave', this.handlePointerUp);
        this.dom.viewport.addEventListener('click', (event) => this.handleViewportClick(event));
        window.addEventListener('resize', this.handleResize, { passive: true });
        document.addEventListener('keydown', this.handleKeydown);
    }

    renderThumbs() {
        this.dom.sidebar.innerHTML = '';

        this.items.forEach((item, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'sp-lightbox-thumb';
            button.setAttribute('aria-label', `Open ${item.caption || toFrameLabel(index)}`);
            button.innerHTML = `<img src="${item.src}" alt="${item.alt || `${item.title || 'Project render'} ${index + 1}`}">`;
            button.addEventListener('click', () => this.setImage(index));
            this.dom.sidebar.appendChild(button);
        });
    }

    getTargetViewportState() {
        const compact = window.innerWidth <= 780;
        const sidebarReserve = compact ? 0 : Math.min(182, window.innerWidth * 0.16);
        const horizontalPadding = compact ? 18 : 56;
        const verticalPadding = compact ? 168 : 120;
        const width = Math.max(
            260,
            Math.min(window.innerWidth - sidebarReserve - (horizontalPadding * 2), window.innerWidth * (compact ? 0.92 : 0.68))
        );
        const height = Math.max(
            180,
            Math.min(window.innerHeight - verticalPadding, window.innerHeight * (compact ? 0.64 : 0.8))
        );

        return {
            left: compact ? (window.innerWidth / 2) : ((window.innerWidth - sidebarReserve) / 2),
            top: compact ? (window.innerHeight * 0.42) : (window.innerHeight / 2),
            width,
            height
        };
    }

    getContainedMediaSize(viewportWidth, viewportHeight, naturalWidth, naturalHeight) {
        const fitRatio = Math.min(viewportWidth / naturalWidth, viewportHeight / naturalHeight, 1);
        return {
            width: Math.max(1, Math.round(naturalWidth * fitRatio)),
            height: Math.max(1, Math.round(naturalHeight * fitRatio)),
            maxScale: fitRatio < 1 ? Math.max(1, Number((1 / fitRatio).toFixed(3))) : 1
        };
    }

    setViewportToRect(rect) {
        const safeRect = rect || {
            left: window.innerWidth * 0.5,
            top: window.innerHeight * 0.5,
            width: Math.min(window.innerWidth * 0.4, 420),
            height: Math.min(window.innerHeight * 0.4, 320)
        };

        const centerX = safeRect.left + (safeRect.width / 2);
        const centerY = safeRect.top + (safeRect.height / 2);

        gsap.set(this.dom.viewport, {
            left: centerX,
            top: centerY,
            width: safeRect.width,
            height: safeRect.height,
            xPercent: -50,
            yPercent: -50,
            opacity: 1
        });
    }

    setTargetViewport(animated = true) {
        const target = this.getTargetViewportState();
        const naturalWidth = this.dom.img.naturalWidth || this.dom.media.offsetWidth || target.width;
        const naturalHeight = this.dom.img.naturalHeight || this.dom.media.offsetHeight || target.height;
        const mediaTarget = this.getContainedMediaSize(target.width, target.height, naturalWidth, naturalHeight);

        if (!animated) {
            gsap.set(this.dom.viewport, target);
            gsap.set(this.dom.media, { width: mediaTarget.width, height: mediaTarget.height });
            this.measureMedia();
            return;
        }

        gsap.to(this.dom.viewport, {
            ...target,
            duration: 0.56,
            ease: 'expo.inOut',
            onComplete: () => this.measureMedia()
        });

        gsap.to(this.dom.media, {
            width: mediaTarget.width,
            height: mediaTarget.height,
            duration: 0.56,
            ease: 'expo.inOut',
            onComplete: () => this.measureMedia()
        });
    }

    primeMediaDimensions(width, height) {
        this.dom.media.style.width = `${Math.max(1, Math.round(width))}px`;
        this.dom.media.style.height = `${Math.max(1, Math.round(height))}px`;
    }

    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    clampPan() {
        const maxX = Math.max(0, ((this.zoom.baseWidth * this.zoom.scale) - this.dom.viewport.clientWidth) / 2);
        const maxY = Math.max(0, ((this.zoom.baseHeight * this.zoom.scale) - this.dom.viewport.clientHeight) / 2);
        this.zoom.panX = this.clamp(this.zoom.panX, -maxX, maxX);
        this.zoom.panY = this.clamp(this.zoom.panY, -maxY, maxY);
    }

    updateZoomHint() {
        const canZoom = this.zoom.maxScale > 1.02;
        this.dom.viewport.classList.toggle('can-zoom', canZoom);
        this.dom.zoomHint.hidden = !canZoom;
        this.dom.zoomHintText.textContent = this.zoom.scale > 1.02 ? 'Click to fit' : 'Click to zoom';
    }

    applyZoom() {
        this.clampPan();
        this.dom.media.style.transform = `translate(${this.zoom.panX}px, ${this.zoom.panY}px) scale(${this.zoom.scale})`;
        this.dom.viewport.classList.toggle('is-zoomed', this.zoom.scale > 1.02);
        this.dom.viewport.classList.toggle('is-dragging', this.zoom.isDragging);
        this.updateZoomHint();
    }

    resetZoom() {
        this.zoom.scale = 1;
        this.zoom.panX = 0;
        this.zoom.panY = 0;
        this.zoom.isDragging = false;
        this.applyZoom();
    }

    zoomTo(scale, clientX, clientY) {
        const nextScale = this.clamp(scale, 1, this.zoom.maxScale || 1);
        if (Math.abs(nextScale - this.zoom.scale) < 0.001) return;

        const previousScale = this.zoom.scale;
        const viewportRect = this.dom.viewport.getBoundingClientRect();
        const originX = Number.isFinite(clientX) ? clientX - viewportRect.left - (viewportRect.width / 2) : 0;
        const originY = Number.isFinite(clientY) ? clientY - viewportRect.top - (viewportRect.height / 2) : 0;
        const delta = nextScale / previousScale;

        this.zoom.panX -= originX * (delta - 1);
        this.zoom.panY -= originY * (delta - 1);
        this.zoom.scale = nextScale;
        this.applyZoom();
    }

    handlePointerDown(event) {
        if (!this.isOpen || this.zoom.maxScale <= 1.02) return;
        this.zoom.pointerDown = true;
        this.zoom.moved = false;
        this.zoom.skipClick = false;
        this.zoom.startPanX = this.zoom.panX;
        this.zoom.startPanY = this.zoom.panY;
        this.zoom.startClientX = event.clientX;
        this.zoom.startClientY = event.clientY;
        this.zoom.isDragging = this.zoom.scale > 1.02;
        if (this.zoom.isDragging) {
            this.dom.viewport.setPointerCapture?.(event.pointerId);
        }
        this.applyZoom();
    }

    handlePointerMove(event) {
        if (!this.zoom.pointerDown) return;
        const deltaX = event.clientX - this.zoom.startClientX;
        const deltaY = event.clientY - this.zoom.startClientY;
        if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
            this.zoom.moved = true;
        }
        if (!this.zoom.isDragging || !this.zoom.moved) return;
        this.zoom.panX = this.zoom.startPanX + deltaX;
        this.zoom.panY = this.zoom.startPanY + deltaY;
        this.applyZoom();
    }

    handlePointerUp(event) {
        if (!this.zoom.pointerDown) return;
        this.zoom.pointerDown = false;
        this.zoom.isDragging = false;
        this.zoom.skipClick = this.zoom.moved;
        this.dom.viewport.releasePointerCapture?.(event.pointerId);
        this.applyZoom();
        this.zoom.moved = false;
    }

    handleViewportClick(event) {
        if (!this.isOpen || this.zoom.maxScale <= 1.02) return;
        if (this.zoom.skipClick) {
            this.zoom.skipClick = false;
            return;
        }
        if (this.zoom.scale > 1.02) {
            this.resetZoom();
            return;
        }
        this.zoomTo(this.zoom.maxScale, event.clientX, event.clientY);
    }

    measureMedia() {
        const viewportWidth = this.dom.viewport.clientWidth;
        const viewportHeight = this.dom.viewport.clientHeight;
        const naturalWidth = this.dom.img.naturalWidth || viewportWidth;
        const naturalHeight = this.dom.img.naturalHeight || viewportHeight;

        if (!viewportWidth || !viewportHeight || !naturalWidth || !naturalHeight) return;

        const mediaSize = this.getContainedMediaSize(viewportWidth, viewportHeight, naturalWidth, naturalHeight);
        this.zoom.baseWidth = mediaSize.width;
        this.zoom.baseHeight = mediaSize.height;
        this.zoom.maxScale = mediaSize.maxScale;

        this.dom.media.style.width = `${this.zoom.baseWidth}px`;
        this.dom.media.style.height = `${this.zoom.baseHeight}px`;
        this.resetZoom();
    }

    syncThumbs() {
        this.dom.sidebar.querySelectorAll('.sp-lightbox-thumb').forEach((button, index) => {
            button.classList.toggle('is-active', index === this.activeIndex);
        });
    }

    loadInitialImage(index) {
        const item = this.items[index];
        this.activeIndex = index;
        this.syncThumbs();
        this.dom.img.src = item.src;
        this.dom.img.alt = item.alt || `${item.title || 'Project render'} ${index + 1}`;
        this.dom.img.style.opacity = '1';

        this.updateZoomHint();
    }

    setImage(index) {
        if (!this.isOpen || index === this.activeIndex) return;

        const item = this.items[index];
        const previous = this.dom.img;
        const next = previous.cloneNode(false);

        this.activeIndex = index;
        this.syncThumbs();

        next.src = item.src;
        next.alt = item.alt || `${item.title || 'Project render'} ${index + 1}`;
        next.style.opacity = '0';
        this.dom.media.appendChild(next);

        const finalizeSwap = () => {
            this.dom.img = next;
            this.measureMedia();

            gsap.to(previous, {
                opacity: 0,
                duration: 0.35,
                ease: 'power2.inOut',
                onComplete: () => previous.remove()
            });

            gsap.to(next, {
                opacity: 1,
                duration: 0.35,
                ease: 'power2.inOut'
            });
        };

        if (next.complete) {
            finalizeSwap();
        } else {
            next.addEventListener('load', finalizeSwap, { once: true });
            next.addEventListener('error', finalizeSwap, { once: true });
        }
    }

    open(index, sourceRect) {
        if (!this.items.length) return;

        this.isOpen = true;
        this.sourceRect = sourceRect;
        document.body.style.overflow = 'hidden';
        this.dom.root.classList.add('is-active');

        this.setViewportToRect(sourceRect);
        this.primeMediaDimensions(sourceRect?.width || 280, sourceRect?.height || 220);
        this.loadInitialImage(index);

        gsap.to(this.dom.bg, { opacity: 1, duration: 0.6, ease: 'power2.out' });
        gsap.to(this.dom.close, { opacity: 1, duration: 0.6, delay: 0.28, ease: 'power2.out' });
        if (this.dom.img.complete) {
            this.setTargetViewport(true);
        } else {
            this.dom.img.addEventListener('load', () => this.setTargetViewport(true), { once: true });
            this.dom.img.addEventListener('error', () => this.setTargetViewport(true), { once: true });
        }

        gsap.fromTo(
            this.dom.sidebar.querySelectorAll('.sp-lightbox-thumb'),
            { x: window.innerWidth <= 780 ? 0 : 26, y: window.innerWidth <= 780 ? 18 : 0, opacity: 0 },
            { x: 0, y: 0, opacity: 1, duration: 0.55, stagger: 0.07, ease: 'power3.out', delay: 0.42 }
        );
    }

    close() {
        if (!this.isOpen) return;

        document.body.style.overflow = '';
        this.resetZoom();

        gsap.to(this.dom.bg, { opacity: 0, duration: 0.45, ease: 'power2.out' });
        gsap.to(this.dom.close, { opacity: 0, duration: 0.28 });
        gsap.to(this.dom.sidebar.querySelectorAll('.sp-lightbox-thumb'), {
            x: window.innerWidth <= 780 ? 0 : 22,
            y: window.innerWidth <= 780 ? 14 : 0,
            opacity: 0,
            duration: 0.28,
            stagger: -0.04,
            ease: 'power2.in'
        });

        if (this.sourceRect) {
            gsap.to(this.dom.viewport, {
                left: this.sourceRect.left + (this.sourceRect.width / 2),
                top: this.sourceRect.top + (this.sourceRect.height / 2),
                width: this.sourceRect.width,
                height: this.sourceRect.height,
                duration: 0.82,
                ease: 'power3.inOut',
                onComplete: () => this.reset()
            });
            gsap.to(this.dom.media, {
                width: this.sourceRect.width,
                height: this.sourceRect.height,
                duration: 0.82,
                ease: 'power3.inOut'
            });
            return;
        }

        this.reset();
    }

    reset() {
        this.dom.root.classList.remove('is-active');
        this.isOpen = false;
        this.sourceRect = null;
    }

    handleResize() {
        if (!this.isOpen) return;
        this.setTargetViewport(false);
    }

    handleKeydown(event) {
        if (!this.isOpen) return;

        if (event.key === 'Escape') {
            this.close();
        } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            this.setImage((this.activeIndex + 1) % this.items.length);
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            this.setImage((this.activeIndex - 1 + this.items.length) % this.items.length);
        }
    }
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

function buildGallery(galleryItems) {
    const gallery = document.getElementById('selected-project-gallery');
    if (!gallery) return { items: [], lightbox: null };

    if (!Array.isArray(galleryItems) || galleryItems.length === 0) {
        gallery.innerHTML = '<p class="sp-section-copy">No renders have been assigned to this selected project yet.</p>';
        return { items: [], lightbox: null };
    }

    const normalizedItems = galleryItems.map((item, index) => ({
        src: item.src,
        alt: item.alt || `${item.name || 'Project render'} ${index + 1}`,
        caption: item.caption || toFrameLabel(index),
        meta: item.meta || 'Selected Projects',
        title: item.title || 'Project render'
    })).filter((item) => item.src);

    const lightbox = new SelectedProjectLightbox(normalizedItems);
    const fragment = document.createDocumentFragment();

    normalizedItems.forEach((item, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'sp-gallery-item';
        button.dataset.index = String(index);
        button.dataset.aspect = '1.15';
        button.setAttribute('aria-label', `Open ${item.caption}`);
        button.innerHTML = `
            <span class="sp-gallery-frame">
                <img class="sp-gallery-image" src="${item.src}" alt="${item.alt}" ${index < 2 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">
                <span class="sp-gallery-caption">
                    <span>
                        <strong>${item.caption}</strong>
                        <span>${item.meta}</span>
                    </span>
                    <span class="sp-gallery-index">${String(index + 1).padStart(2, '0')}</span>
                </span>
            </span>
        `;

        const image = button.querySelector('.sp-gallery-image');
        const updateAspect = () => {
            const naturalWidth = image.naturalWidth || image.width || 1;
            const naturalHeight = image.naturalHeight || image.height || 1;
            button.dataset.aspect = String(naturalWidth / naturalHeight);
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
            button.style.removeProperty('--my');
        });

        button.addEventListener('click', () => {
            const rect = button.getBoundingClientRect();
            lightbox.open(index, rect);
        });

        fragment.appendChild(button);
    });

    gallery.innerHTML = '';
    gallery.appendChild(fragment);

    const items = Array.from(gallery.querySelectorAll('.sp-gallery-item'));
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
        layoutFrame = requestAnimationFrame(applyGalleryLayout);
    }

    queueGalleryLayout();
    window.addEventListener('resize', queueGalleryLayout, { passive: true });

    return { items, lightbox };
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
    if (!data) return;

    hydrateProjectMeta(data);
    prepareHeroTitleAnimation();
    prepareBackLinkHover();
    initProjectMap(data);

    const { items } = buildGallery(data.gallery || []);
    initAnimations(items);
});
