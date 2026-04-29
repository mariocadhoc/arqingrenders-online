export function initMinimap() {
    const largeImages = document.querySelectorAll('.large-image');
    const thumbs = document.querySelectorAll('.thumb');
    const container = document.querySelector('.large-images');

    if (!largeImages.length || !thumbs.length || !container) return;
    
    // Global flag for fade transitions to prevent overlapping clicks
    let isTransitioning = false;

    // Apply random offsets to each thumb
    thumbs.forEach((thumb) => {
        const randomPercent = Math.random() * 10;
        const thumbPx = randomPercent * 2.5;
        thumb.style.setProperty('--offset', `${thumbPx}px`);
    });

    function updateActiveThumb() {
        let activeIndex = 0;
        const triggerPoint = window.innerHeight * 0.6;
        const horizonTrigger = window.innerWidth * 0.75 * 0.5;

        // Pre-compute which stacked card is active via ScrollTrigger progress
        let activeStackedGlobalIdx = -1;
        if (window.ScrollTrigger) {
            const wrap = document.querySelector('.stacked-scroll-trigger');
            const st = ScrollTrigger.getAll().find(t => t.trigger === wrap);
            if (st && st.isActive) {
                const stackedCards = document.querySelectorAll('.stacked-card');
                const n = stackedCards.length;
                const zoomDur = 1, fadeDur = 0.4;
                const totalDur = n * zoomDur + (n - 1) * fadeDur;
                const cardIdx = Math.min(
                    Math.floor(st.progress * totalDur / (zoomDur + fadeDur)),
                    n - 1
                );
                // Map local stacked index to global largeImages index
                const stackedArray = Array.from(stackedCards);
                const globalImages = Array.from(largeImages);
                activeStackedGlobalIdx = globalImages.indexOf(stackedArray[cardIdx]);
            } else if (st && st.progress >= 1) {
                // Scrolled past the stacked section — keep last aerial active
                const stackedCards = document.querySelectorAll('.stacked-card');
                const lastCard = stackedCards[stackedCards.length - 1];
                const globalImages = Array.from(largeImages);
                activeStackedGlobalIdx = globalImages.indexOf(lastCard);
            }
        }

        largeImages.forEach((img, index) => {
            const rect = img.getBoundingClientRect();

            if (img.classList.contains('vertical')) {
                if (rect.top <= triggerPoint) {
                    activeIndex = index;
                }
            } else if (img.classList.contains('horizon')) {
                if (rect.left <= horizonTrigger) {
                    activeIndex = index;
                }
            } else if (img.classList.contains('stacked')) {
                // Use pre-computed active stacked card
                if (index === activeStackedGlobalIdx) {
                    activeIndex = index;
                }
            }
        });

        thumbs.forEach((thumb, index) => {
            if (index === activeIndex) {
                thumb.classList.add('active');
            } else {
                thumb.classList.remove('active');
            }
        });
    }

    window.addEventListener('scroll', updateActiveThumb, { passive: true });
    window.addEventListener('resize', updateActiveThumb, { passive: true });

    updateActiveThumb();

    thumbs.forEach((thumb, index) => {
        thumb.addEventListener('click', () => {
            if (isTransitioning) return;
            const targetElement = largeImages[index];

            if (targetElement && container) {
                let scrollTarget = -1;
                let isSmoothFallback = false;
                let triggerAnimation = null;
                let triggerProgress = null;

                if (targetElement.classList.contains('vertical')) {
                    if (window.ScrollTrigger) {
                        const wrap = document.querySelector('.vertical-scroll-container');
                        const strig = ScrollTrigger.getAll().find(t => t.trigger === wrap);

                        if (strig) {
                            const verticalCards = document.querySelectorAll('.vertical-scroll-container .large-image.vertical');
                            const verticalArray = Array.from(verticalCards);
                            const idx = verticalArray.indexOf(targetElement);

                            const n = verticalCards.length;
                            const progress = n > 1 ? idx / (n - 1) : 0;
                            scrollTarget = strig.start + (strig.end - strig.start) * Math.min(progress, 1);
                            
                            triggerAnimation = strig.animation;
                            triggerProgress = Math.min(progress, 1);
                        }
                    }

                    if (scrollTarget === -1) {
                        const containerRect = document.querySelector('.vertical-scroll-container').getBoundingClientRect();
                        scrollTarget = containerRect.top + window.scrollY;
                        isSmoothFallback = true;
                    }
                } else if (targetElement.classList.contains('horizon')) {
                    const targetLeft = targetElement.offsetLeft;

                    if (window.ScrollTrigger) {
                        const wrap = document.querySelector('.horizontal-scroll-container');
                        const strig = ScrollTrigger.getAll().find(t => t.trigger === wrap);

                        if (strig) {
                            const cards = document.querySelectorAll('.horizon');
                            const idx = Array.from(cards).indexOf(targetElement);
                            const progress = cards.length > 1 ? idx / (cards.length - 1) : 0;
                            scrollTarget = strig.start + ((strig.end - strig.start) * progress);
                            
                            triggerAnimation = strig.animation;
                            triggerProgress = progress;
                        }
                    }

                    if (scrollTarget === -1) {
                        const containerRect = document.querySelector('.horizontal-scroll-container').getBoundingClientRect();
                        scrollTarget = containerRect.top + window.scrollY + targetLeft;
                        isSmoothFallback = true;
                    }
                } else if (targetElement.classList.contains('stacked')) {
                    if (window.ScrollTrigger) {
                        const wrap = document.querySelector('.stacked-scroll-trigger');
                        const strig = ScrollTrigger.getAll().find(t => t.trigger === wrap);

                        if (strig) {
                            const stackedCards = document.querySelectorAll('.stacked-card');
                            const stackedArray = Array.from(stackedCards);
                            const idx = stackedArray.indexOf(targetElement);

                            const zoomDur = 1;
                            const fadeDur = 0.4;
                            const n = stackedCards.length;
                            const totalDur = n * zoomDur + (n - 1) * fadeDur;
                            const progress = idx * (zoomDur + fadeDur) / totalDur;
                            scrollTarget = strig.start + (strig.end - strig.start) * Math.min(progress, 1);
                            
                            triggerAnimation = strig.animation;
                            triggerProgress = Math.min(progress, 1);
                        }
                    }

                    if (scrollTarget === -1) {
                        const containerRect = document.querySelector('.stacked-scroll-trigger').getBoundingClientRect();
                        scrollTarget = containerRect.top + window.scrollY;
                        isSmoothFallback = true;
                    }
                }

                if (scrollTarget !== -1) {
                    if (isSmoothFallback) {
                        window.scrollTo({
                            top: scrollTarget,
                            behavior: 'smooth'
                        });
                    } else {
                        isTransitioning = true;
                        
                        // Elegantly fade out the entire viewport of images
                        gsap.to(container, {
                            opacity: 0,
                            duration: 0.25,
                            ease: "power2.inOut",
                            onComplete: () => {
                                // Instantly jump the scroll distance to bypass the chaotic scrub viewing
                                window.scrollTo({
                                    top: scrollTarget,
                                    behavior: 'auto'
                                });
                                
                                // Force sync the animation with our instant destination
                                if (triggerAnimation && triggerProgress !== null) {
                                    triggerAnimation.progress(triggerProgress);
                                }
                                
                                if (window.ScrollTrigger) {
                                    ScrollTrigger.update();
                                }
                                
                                // Elegantly fade the new image back in
                                requestAnimationFrame(() => {
                                    gsap.to(container, {
                                        opacity: 1,
                                        duration: 0.4,
                                        ease: "power2.out",
                                        onComplete: () => {
                                            isTransitioning = false;
                                        }
                                    });
                                });
                            }
                        });
                    }
                }
            }
        });
    });

    // --- ADDED TEXT LABELS ---
    const minimapContainer = document.querySelector('.minimap');
    if (minimapContainer && thumbs.length > 0) {
        const textLabels = [
            { text: 'Interiors', insertBeforeIndex: 0 },
            { text: 'Exteriors', insertBeforeIndex: 5 },
            { text: 'Aerials', insertBeforeIndex: 10 },
            {
                text: 'All Work',
                isSectionLink: true,
                targetSelector: '#all-work',
                children: [
                    { text: 'Stills', href: '/work/stills/' },
                    { text: 'Animations', href: '/work/animations/' },
                    { text: '360°', href: '/work/360/' }
                ]
            }
        ];

        textLabels.forEach(labelData => {
            const label = document.createElement('div');
            label.classList.add('minimap-label');
            label.textContent = labelData.text;

            const randomPercent = Math.random() * 10;
            const textPx = randomPercent * 2.5;
            label.style.setProperty('--minimap-offset', `${textPx}px`);

            label.addEventListener('click', () => {
                if (labelData.isSectionLink) {
                    if (isTransitioning) return;
                    
                    const targetElement = document.querySelector(labelData.targetSelector);
                    if (targetElement) {
                        const targetSection = targetElement.closest('.section-work') || targetElement;
                        const rect = targetSection.getBoundingClientRect();
                        // Dejar ~8vh de margen superior
                        const offsetTop = rect.top + window.scrollY - (window.innerHeight * 0.08);
                        
                        isTransitioning = true;
                        
                        // Elegantly fade out the viewport and jump to the All Work section
                        gsap.to(container, {
                            opacity: 0,
                            duration: 0.25,
                            ease: "power2.inOut",
                            onComplete: () => {
                                window.scrollTo({ top: offsetTop, behavior: 'auto' });
                                
                                if (window.ScrollTrigger) {
                                    ScrollTrigger.update();
                                }
                                
                                requestAnimationFrame(() => {
                                    gsap.to(container, {
                                        opacity: 1,
                                        duration: 0.4,
                                        ease: "power2.out",
                                        onComplete: () => {
                                            isTransitioning = false;
                                        }
                                    });
                                });
                            }
                        });
                    }
                } else if (thumbs[labelData.insertBeforeIndex]) {
                    thumbs[labelData.insertBeforeIndex].click();
                }
            });

            if (labelData.insertBeforeIndex !== undefined && thumbs[labelData.insertBeforeIndex]) {
                minimapContainer.insertBefore(label, thumbs[labelData.insertBeforeIndex]);
            } else {
                minimapContainer.appendChild(label);
            }

            if (Array.isArray(labelData.children) && labelData.children.length > 0) {
                const childrenWrapper = document.createElement('div');
                childrenWrapper.classList.add('minimap-children');
                childrenWrapper.style.setProperty('--minimap-offset', `${textPx}px`);

                labelData.children.forEach((child) => {
                    const childLink = document.createElement('a');
                    childLink.classList.add('minimap-child-link');
                    childLink.textContent = child.text;
                    childLink.href = child.href;

                    childrenWrapper.appendChild(childLink);
                });

                minimapContainer.insertBefore(childrenWrapper, label.nextSibling);
            }
        });
    }
}
