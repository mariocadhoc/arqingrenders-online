/* =========================================
   360.JS
   Interactions for 360 experiences page
   ========================================= */

import StillsCrossCTAEngine from './engines/stills-cross-cta.js';
import { initializeWorkPageIntro } from './engines/work-page-intro.js';

document.addEventListener("DOMContentLoaded", async () => {
    new StillsCrossCTAEngine();

    const { subtitleRevealPromise } = await initializeWorkPageIntro({
        titleSelector: '.gallery-title',
        subtitleSelector: '.gallery-subtitle',
        fallbackDelayMobileMs: 1000
    });

    const gallerySection = document.querySelector('.vr-showcase-section');

    subtitleRevealPromise.then(() => {
        if (!gallerySection) return;

        if (typeof gsap !== 'undefined') {
            gsap.to(gallerySection, { opacity: 1, duration: 1.5, ease: "power2.out" });
            return;
        }

        gallerySection.style.opacity = '1';
    });

    // 2. 3D Tilt Effect and Custom Cursor Logic
    const cards = document.querySelectorAll(".vr-card");
    const cursorWrapper = document.getElementById("vr-cursor-wrapper");
    const cursor = document.getElementById("vr-cursor");
    const links = document.querySelectorAll(".vr-card-link");

    // Check if it's a touch device / mobile
    const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;

    if (!isTouch && cursorWrapper && cursor) {
        // --- Custom Cursor Logic ---
        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let cursorX = mouseX;
        let cursorY = mouseY;

        document.addEventListener("mousemove", (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        const renderCursor = () => {
            cursorX += (mouseX - cursorX) * 0.15;
            cursorY += (mouseY - cursorY) * 0.15;
            
            cursorWrapper.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
            
            requestAnimationFrame(renderCursor);
        };
        requestAnimationFrame(renderCursor);

        // --- Tilt Logic & Cursor Activation ---
        links.forEach(link => {
            const card = link.querySelector(".vr-card");

            link.addEventListener("mouseenter", () => {
                cursor.classList.add("active");
            });

            link.addEventListener("mouseleave", () => {
                cursor.classList.remove("active");
                // Reset tilt
                gsap.to(card, {
                    rotateX: 0,
                    rotateY: 0,
                    duration: 0.5,
                    ease: "power3.out"
                });
            });

            link.addEventListener("mousemove", (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left; // x position within the element
                const y = e.clientY - rect.top;  // y position within the element

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                // Calculate rotation (max 5 degrees)
                const rotateX = ((y - centerY) / centerY) * -5;
                const rotateY = ((x - centerX) / centerX) * 5;

                gsap.to(card, {
                    rotateX: rotateX,
                    rotateY: rotateY,
                    duration: 0.1,
                    ease: "none"
                });
            });
        });
    }

    // 3. Scroll Reveal for Cards (premium feel)
    cards.forEach((card) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: "top 85%",
            },
            y: 60,
            opacity: 0,
            duration: 1.2,
            ease: "power3.out"
        });
    });
});
