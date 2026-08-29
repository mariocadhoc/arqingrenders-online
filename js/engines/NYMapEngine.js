/**
 * NYMapEngine.js
 * ───────────────────────────────────────────────
 * NYC projects map for /studio/ny/.
 * Loads project data from /studio/ny/projects-nyc.json,
 * renders clustered Leaflet pins, conditional popup cards,
 * and the borough filter bar.
 * ───────────────────────────────────────────────
 */

const BOROUGHS = ['All', 'Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island', 'Other NYC'];

export class NYMapEngine {
    constructor(mapId = 'nyc-map') {
        this.mapEl = document.getElementById(mapId);
        if (!this.mapEl || typeof L === 'undefined') return;

        this.map = null;
        this.clusterGroup = null;
        this.projects = [];
        this.markersByBorough = new Map();
        this.activeBorough = 'All';

        this.icon = L.icon({
            iconUrl: 'https://cdn.prod.website-files.com/663aba57330d80e57a76f190/679bb94f9a839bcd88664149_Grey%20sin%20texto_Small.avif',
            iconSize: [28, 32],
            iconAnchor: [14, 32],
            popupAnchor: [0, -30]
        });

        this.init();
    }

    async init() {
        try {
            const res = await fetch('/studio/ny/projects-nyc.json');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            this.projects = Array.isArray(data.projects) ? data.projects : [];
        } catch (err) {
            console.error('[NYMapEngine] Failed to load /studio/ny/projects-nyc.json — map not rendered.', err);
            return;
        }

        this.initMap();
        this.renderPins();
        this.buildFilterBar();
        // Phase 2 (future): typology filter would be wired here,
        // reading project.typology against the /work/stills labels
        // (Commercial · Residential · Mixed-Use · Hospitality).
    }

    initMap() {
        this.map = L.map(this.mapEl, { attributionControl: true }).setView([40.7128, -74.0060], 11);
        this.map.attributionControl.setPrefix('');

        // Esri's light gray canvas, not CARTO: CARTO now stamps
        // "API KEY REQUIRED" across its free basemap tiles. Esri serves the
        // same minimal look without a key, and only asks for attribution,
        // which is why the control is on and styled down in ny.css.
        L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
            {
                attribution: 'Esri, HERE, Garmin, &copy; OpenStreetMap contributors',
                maxZoom: 16
            }
        ).addTo(this.map);

        this.clusterGroup = L.markerClusterGroup({ showCoverageOnHover: false });
        this.map.addLayer(this.clusterGroup);

        setTimeout(() => this.map.invalidateSize(), 200);
    }

    renderPins() {
        this.projects.forEach((project) => {
            if (!Number.isFinite(project.lat) || !Number.isFinite(project.lng)) return;

            const marker = L.marker([project.lat, project.lng], { icon: this.icon });
            marker.bindPopup(this.buildPopupHtml(project), {
                className: 'ny-popup',
                maxWidth: 280,
                closeButton: true
            });

            // Hover label for delivered work only. Projects still in progress
            // stay anonymous pins, so no client's unbuilt site is ever named.
            const label = this.buildTooltipHtml(project);
            if (label) {
                marker.bindTooltip(label, {
                    className: 'ny-map-tooltip',
                    direction: 'top',
                    offset: [0, -30],
                    opacity: 1
                });
            }

            const borough = project.borough || 'Other NYC';
            if (!this.markersByBorough.has(borough)) {
                this.markersByBorough.set(borough, []);
            }
            this.markersByBorough.get(borough).push(marker);
        });

        this.applyFilter('All', { fit: true });
    }

    buildTooltipHtml(project) {
        if (!project.built) return '';

        const esc = (value) => String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');

        const name = (project.commercialName || '').trim();
        const address = (project.address || '').trim();
        if (!name && !address) return '';

        // Named buildings lead with the name and carry the address underneath;
        // the rest show the address alone.
        const rows = [];
        if (name) {
            rows.push(`<span class="ny-tip-name">${esc(name)}</span>`);
            if (address) rows.push(`<span class="ny-tip-address">${esc(address)}</span>`);
        } else {
            rows.push(`<span class="ny-tip-name">${esc(address)}</span>`);
        }
        return `<span class="ny-tip">${rows.join('')}</span>`;
    }

    buildPopupHtml(project) {
        const esc = (value) => String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');

        const parts = [];
        parts.push(`<p class="ny-popup-name">${esc(project.name)}</p>`);

        const metaBits = [`<span class="ny-popup-borough">${esc(project.borough)}</span>`];
        if (project.typology) metaBits.push(`<span class="ny-popup-typology">${esc(project.typology)}</span>`);
        if (project.year) metaBits.push(`<span class="ny-popup-year">${esc(project.year)}</span>`);
        parts.push(`<p class="ny-popup-meta">${metaBits.join('<span class="ny-popup-dot" aria-hidden="true">·</span>')}</p>`);

        if (project.status) {
            parts.push(`<p class="ny-popup-status">${esc(project.status)}</p>`);
        }
        if (project.description) {
            parts.push(`<p class="ny-popup-description">${esc(project.description)}</p>`);
        }
        if (project.projectUrl) {
            parts.push(`<a class="ny-popup-link" href="${esc(project.projectUrl)}" target="_blank" rel="noopener">Project website &#8599;</a>`);
        }

        return `<article class="ny-popup-card">${parts.join('')}</article>`;
    }

    buildFilterBar() {
        const container = document.getElementById('ny-borough-filters');
        if (!container) return;

        container.textContent = '';
        container.setAttribute('role', 'group');
        container.setAttribute('aria-label', 'Filter projects by borough');

        BOROUGHS.forEach((borough) => {
            // Skip boroughs with no projects (except "All")
            if (borough !== 'All' && !this.markersByBorough.has(borough)) return;

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'ny-filter-btn' + (borough === 'All' ? ' is-active' : '');
            btn.textContent = borough;
            btn.setAttribute('data-borough', borough);
            btn.addEventListener('click', () => {
                if (this.activeBorough === borough) return;
                container.querySelectorAll('.ny-filter-btn').forEach((b) => b.classList.remove('is-active'));
                btn.classList.add('is-active');
                this.applyFilter(borough, { fit: true });
            });
            container.appendChild(btn);
        });
    }

    applyFilter(borough, { fit = false } = {}) {
        this.activeBorough = borough;
        this.clusterGroup.clearLayers();

        this.markersByBorough.forEach((markers, key) => {
            if (borough === 'All' || key === borough) {
                markers.forEach((marker) => this.clusterGroup.addLayer(marker));
            }
        });

        if (fit && this.clusterGroup.getLayers().length > 0) {
            this.map.fitBounds(this.clusterGroup.getBounds(), { padding: [50, 50], maxZoom: 14 });
        }
    }
}
