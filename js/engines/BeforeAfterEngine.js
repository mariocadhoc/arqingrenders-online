/**
 * BeforeAfterEngine
 * Accessible drag/tap compare slider used by the "Google Earth to
 * drone-realistic render" article, built generically so any future
 * Blog post (EN or ES) can drop in a `.blog-compare` block and reuse it.
 */
export default class BeforeAfterEngine {
    constructor(root) {
        this.root = root;
        this.handle = root.querySelector('.blog-compare-handle');
        if (!this.handle) return;

        this.isDragging = false;
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onClick = this.onClick.bind(this);

        this.bind();
        this.set(50);
    }

    bind() {
        this.handle.setAttribute('tabindex', '0');
        this.handle.setAttribute('role', 'slider');
        this.handle.setAttribute('aria-label', 'Compare reveal position');
        this.handle.setAttribute('aria-valuemin', '0');
        this.handle.setAttribute('aria-valuemax', '100');

        this.handle.addEventListener('pointerdown', this.onPointerDown);
        window.addEventListener('pointermove', this.onPointerMove);
        window.addEventListener('pointerup', this.onPointerUp);
        this.handle.addEventListener('keydown', this.onKeyDown);
        this.root.addEventListener('click', this.onClick);
    }

    onPointerDown(e) {
        this.isDragging = true;
        this.root.classList.add('is-dragging');
        try { this.handle.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
        this.moveTo(e.clientX);
    }

    onPointerMove(e) {
        if (!this.isDragging) return;
        this.moveTo(e.clientX);
    }

    onPointerUp() {
        this.isDragging = false;
        this.root.classList.remove('is-dragging');
    }

    onClick(e) {
        if (e.target.closest('.blog-compare-handle')) return;
        this.moveTo(e.clientX);
    }

    onKeyDown(e) {
        const current = parseFloat(this.root.style.getPropertyValue('--pos')) || 50;
        if (e.key === 'ArrowLeft') { this.set(current - 4); e.preventDefault(); }
        if (e.key === 'ArrowRight') { this.set(current + 4); e.preventDefault(); }
        if (e.key === 'Home') { this.set(0); e.preventDefault(); }
        if (e.key === 'End') { this.set(100); e.preventDefault(); }
    }

    moveTo(clientX) {
        const rect = this.root.getBoundingClientRect();
        const pct = ((clientX - rect.left) / rect.width) * 100;
        this.set(pct);
    }

    set(pct) {
        const clamped = Math.min(96, Math.max(4, pct));
        this.root.style.setProperty('--pos', clamped + '%');
        this.handle.setAttribute('aria-valuenow', String(Math.round(clamped)));
    }
}
