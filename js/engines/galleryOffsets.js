/**
 * Gallery Offsets Engine
 * ──────────────────────
 * Applies random horizontal offsets to vertical gallery images
 * for a more organic, staggered layout feel.
 */
export function initGalleryOffsets() {
    const largeImages = document.querySelectorAll('.large-image');

    largeImages.forEach((img) => {
        if (img.classList.contains('vertical')) {
            const randomPercent = Math.random() * 10;
            img.style.setProperty('--offset', `${randomPercent}%`);
        } else {
            img.style.setProperty('--offset', '0%');
        }
    });
}
