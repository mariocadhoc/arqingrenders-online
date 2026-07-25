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
        this.map = L.map(this.mapEl, { attributionControl: false }).setView([40.7128, -74.0060], 11);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(this.map);

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

            const borough = project.borough || 'Other NYC';
            if (!this.markersByBorough.has(borough)) {
                this.markersByBorough.set(borough, []);
            }
            this.markersByBorough.get(borough).push(marker);
        });

        this.applyFilter('All', { fit: true });
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
