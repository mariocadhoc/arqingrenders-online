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

function parseFiniteDatasetValue(element, key) {
    const value = Number.parseFloat(element?.dataset?.[key] || '');
    return Number.isFinite(value) ? value : null;
}

export function initProjectMap(data = {}) {
    const mapElement = document.getElementById('selected-project-map');
    const emptyState = document.querySelector('[data-map-empty]');
    const mapData = data.map || {};

    if (!mapElement) return;

    const lat = parseFiniteDatasetValue(mapElement, 'mapLat') ?? mapData.lat;
    const lng = parseFiniteDatasetValue(mapElement, 'mapLng') ?? mapData.lng;
    const configuredInitialZoom = parseFiniteDatasetValue(mapElement, 'mapInitialZoom') ?? mapData.initialZoom;
    const configuredZoom = parseFiniteDatasetValue(mapElement, 'mapZoom') ?? mapData.zoom;
    const configuredFinalZoom = parseFiniteDatasetValue(mapElement, 'mapFinalZoom') ?? mapData.finalZoom;

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || typeof window.L === 'undefined') {
        mapElement.classList.add('hidden');
        emptyState?.classList.remove('hidden');
        return;
    }

    emptyState?.classList.add('hidden');
    mapElement.classList.remove('hidden');

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const zoom = Number.isFinite(configuredZoom) ? configuredZoom : 15;
    const initialZoom = Number.isFinite(configuredInitialZoom)
        ? configuredInitialZoom
        : Math.max(1, zoom - (isMobile ? 2.8 : 4.2));
    const finalZoom = Number.isFinite(configuredFinalZoom)
        ? configuredFinalZoom
        : (isMobile ? Math.min(zoom, 16) : zoom);

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
    }).setView([lat, lng], initialZoom);

    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    const marker = window.L.marker([lat, lng], {
        icon: createMapPin()
    }).addTo(map);

    const mapLabel = mapElement.dataset.mapLabel || data.address || data.name;
    if (mapLabel) {
        marker.bindTooltip(mapLabel, {
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
        map.flyTo([lat, lng], finalZoom, {
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
