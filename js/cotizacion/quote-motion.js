'use strict';

/* =========================================================
   COTIZACIÓN · MOVIMIENTO
   - desktop (>=1025px, mouse, sin reduced-motion): GSAP + ScrollTrigger
     (se descargan solo aquí; en móvil/tablet no se carga nada).
   - móvil / tablet: ligero, solo CSS (fade + slide) con IntersectionObserver.
   - reduced-motion: sin animaciones.
   ========================================================= */
(function () {
  const A = (window.ArqQuote = window.ArqQuote || {});

  const GSAP_URL = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';
  const ST_URL = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js';

  const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop = () => window.matchMedia('(min-width: 1025px) and (hover: hover) and (pointer: fine)').matches;

  function mode() {
    if (reduce()) return 'static';
    return desktop() ? 'gsap' : 'lite';
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = resolve; s.onerror = () => reject(new Error('No se pudo cargar ' + src));
      document.head.appendChild(s);
    });
  }

  /** Resuelve con { gsap, ScrollTrigger } o null si falla / tarda demasiado. */
  function loadGsap(timeout = 5000) {
    if (window.gsap && window.ScrollTrigger) return Promise.resolve({ gsap: window.gsap, ScrollTrigger: window.ScrollTrigger });
    const load = loadScript(GSAP_URL).then(() => loadScript(ST_URL))
      .then(() => ({ gsap: window.gsap, ScrollTrigger: window.ScrollTrigger }));
    const guard = new Promise((res) => setTimeout(() => res(null), timeout));
    return Promise.race([load, guard]).catch(() => null);
  }

  // ---------------------------------------------------------
  // Común (todos los modos): barra fija
  // ---------------------------------------------------------
  function initSticky(root) {
    const sticky = root.querySelector('#q-sticky');
    const marker = root.querySelector('#q-hero-end');
    if (!sticky || !marker || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => {
      const past = !e.isIntersecting && e.boundingClientRect.top < 0;
      sticky.classList.toggle('is-on', past);
      document.body.classList.toggle('q-has-sticky', past);
    }, { threshold: 0 });
    io.observe(marker);
  }

  // ---------------------------------------------------------
  // Lite (móvil / tablet): fade + slide con CSS
  // ---------------------------------------------------------
  function initLite(root) {
    root.classList.add('q-lite');
    const els = root.querySelectorAll('[data-reveal]');
    els.forEach((el) => { if (el.dataset.d) el.style.setProperty('--d', el.dataset.d + 's'); });
    return {
      // Se llama cuando la cortina de carga ya se levantó
      start() {
        if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('is-in')); return; }
        const io = new IntersectionObserver((entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          });
        }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
        els.forEach((el) => io.observe(el));
      }
    };
  }

  function initStatic(root) {
    root.classList.add('q-static');
  }

  // ---------------------------------------------------------
  // Desktop: GSAP
  // ---------------------------------------------------------
  function initGsap(root, g) {
    const { gsap, ScrollTrigger } = g;
    gsap.registerPlugin(ScrollTrigger);
    root.classList.add('q-gsap');

    const locale = A.i18n.locale;
    const q = (sel, ctx) => Array.from((ctx || root).querySelectorAll(sel));
    const hero = root.querySelector('.q-hero');
    const inHero = (el) => hero && hero.contains(el);

    // --- Formato de contadores ---
    const fmt = {
      int: (n) => String(Math.round(n)),
      time: (n) => { const s = Math.round(n); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; },
      money: (n, el) => {
        try { return new Intl.NumberFormat(locale, { style: 'currency', currency: el.dataset.cur || 'MXN' }).format(n); }
        catch (_) { return String(Math.round(n)); }
      }
    };
    const counters = q('[data-count]').map((el) => {
      const final = el.textContent;
      const to = parseFloat(el.dataset.count) || 0;
      const from = el.dataset.from !== undefined ? parseFloat(el.dataset.from) : 0;   // data-from > valor: cuenta regresiva
      const f = fmt[el.dataset.fmt] || fmt.int;
      el.textContent = f(from, el);
      return { el, final, to, f, state: { v: from } };
    });
    const runCounter = (c, delay = 0) => gsap.to(c.state, {
      v: c.to, duration: 1.8, delay, ease: 'power2.out',
      onUpdate: () => { c.el.textContent = c.f(c.state.v, c.el); },
      onComplete: () => { c.el.textContent = c.final; }
    });

    // --- Estados iniciales (se fijan antes de levantar la cortina) ---
    const reveals = q('[data-reveal]').filter((el) => !inHero(el));
    gsap.set(reveals, { opacity: 0, y: 38 });
    const secTitles = q('.q-h2 .q-wi');
    gsap.set(secTitles, { yPercent: 118 });
    gsap.set('.q-paybar i', { scaleX: 0, transformOrigin: 'left center' });
    gsap.set('.q-weeks li', { scaleY: 0, transformOrigin: 'center bottom' });
    gsap.set('.q-steps__line i', { scaleY: 0, transformOrigin: 'top center' });

    // --- Hero (cronología pausada; se reproduce al levantar la cortina) ---
    const heroEls = q('[data-reveal]').filter(inHero);
    gsap.set(heroEls, { opacity: 0, y: 26 });
    gsap.set('.q-title .q-wi', { yPercent: 118 });
    gsap.set('.q-hero__media img', { scale: 1.18 });
    const heroTl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
    heroTl
      .to('.q-hero__media img', { scale: 1.02, duration: 2.8, ease: 'power2.out' }, 0)
      .to('.q-title .q-wi', { yPercent: 0, duration: 1.2, stagger: 0.08, ease: 'power4.out' }, 0.15)
      .to(heroEls, { opacity: 1, y: 0, duration: 1, stagger: 0.09, clearProps: 'transform' }, 0.3);
    counters.filter((c) => inHero(c.el)).forEach((c) => heroTl.add(() => runCounter(c), 1.1));

    // Parallax y desvanecido suave del hero
    gsap.to('.q-hero__media img', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.q-hero__inner', { y: -50, opacity: 0.25, ease: 'none', scrollTrigger: { trigger: hero, start: 'center top', end: 'bottom top', scrub: true } });

    // --- Revelados por scroll ---
    ScrollTrigger.batch(reveals, {
      start: 'top 90%', once: true,
      onEnter: (batch) => gsap.to(batch, {
        opacity: 1, y: 0, duration: 0.95, stagger: 0.08, ease: 'power3.out', overwrite: true, clearProps: 'transform'
      })
    });
    q('.q-h2').forEach((h) => {
      const words = q('.q-wi', h);
      ScrollTrigger.create({
        trigger: h, start: 'top 88%', once: true,
        onEnter: () => gsap.to(words, { yPercent: 0, duration: 1.1, stagger: 0.07, ease: 'power4.out' })
      });
    });

    // --- Contadores fuera del hero ---
    counters.filter((c) => !inHero(c.el)).forEach((c) => {
      ScrollTrigger.create({ trigger: c.el, start: 'top 90%', once: true, onEnter: () => runCounter(c) });
    });

    // --- Proceso: línea que se dibuja + paso activo ---
    const steps = root.querySelector('.q-steps');
    if (steps) {
      gsap.to('.q-steps__line i', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: steps, start: 'top 62%', end: 'bottom 62%', scrub: 0.5 } });
      q('.q-step').forEach((s) => ScrollTrigger.create({ trigger: s, start: 'top 64%', end: 'bottom 40%', toggleClass: { targets: s, className: 'is-active' } }));
    }

    // --- Semanas ---
    const weeks = root.querySelector('.q-weeks');
    if (weeks) {
      ScrollTrigger.create({
        trigger: weeks, start: 'top 90%', once: true,
        onEnter: () => gsap.to('.q-weeks li', { scaleY: 1, duration: 0.7, stagger: 0.07, ease: 'back.out(1.6)' })
      });
    }

    // --- Total: aparición elegante (sin conteo incremental) ---
    const total = root.querySelector('.q-total');
    if (total) {
      const val = total.querySelector('strong');
      const line = root.querySelector('.q-total__line');
      gsap.set(val, { opacity: 0, y: 34, filter: 'blur(10px)' });
      if (line) gsap.set(line, { scaleX: 0, transformOrigin: 'right center' });
      ScrollTrigger.create({
        trigger: total, start: 'top 88%', once: true,
        onEnter: () => {
          gsap.to(val, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.6, ease: 'expo.out', delay: 0.25, clearProps: 'filter' });
          if (line) gsap.to(line, { scaleX: 1, duration: 1.4, ease: 'expo.out', delay: 0.5 });
        }
      });
    }

    // --- Pagos ---
    const bar = root.querySelector('.q-paybar');
    if (bar) {
      ScrollTrigger.create({
        trigger: bar, start: 'top 92%', once: true,
        onEnter: () => gsap.to('.q-paybar i', { scaleX: 1, duration: 1.2, stagger: 0.18, ease: 'power3.out' })
      });
    }

    // --- Cinta de portafolio (marquesina con pausa al pasar el mouse) ---
    const strip = root.querySelector('[data-strip]');
    const track = strip && strip.querySelector('.q-strip__track');
    if (track) {
      Array.from(track.children).forEach((n) => track.appendChild(n.cloneNode(true)));
      strip.classList.add('is-marquee');
      const tween = gsap.to(track, { xPercent: -50, duration: 80, ease: 'none', repeat: -1 });
      strip.addEventListener('mouseenter', () => gsap.to(tween, { timeScale: 0.12, duration: 0.8 }));
      strip.addEventListener('mouseleave', () => gsap.to(tween, { timeScale: 1, duration: 0.8 }));
      ScrollTrigger.create({ trigger: strip, start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive ? tween.resume() : tween.pause()) });
    }

    // --- Inclinación sutil de las tarjetas de entregables ---
    q('.q-card').forEach((card) => {
      const rx = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3.out' });
      const ry = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3.out' });
      gsap.set(card, { transformPerspective: 900 });
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * 6);
        rx(-((e.clientY - r.top) / r.height - 0.5) * 6);
      });
      card.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });

    // --- Barra de progreso de lectura ---
    gsap.to('.q-progress i', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.2 } });

    window.addEventListener('load', () => ScrollTrigger.refresh());
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());

    return { start: () => heroTl.play() };
  }

  /**
   * Prepara el modo adecuado. Devuelve { start() } que se llama cuando la
   * cortina de carga ya se levantó.
   */
  function init(root, m, g) {
    initSticky(root);
    if (m === 'gsap' && g) return initGsap(root, g);
    if (m === 'static') { initStatic(root); return { start() { } }; }
    return initLite(root);   // móvil/tablet, o desktop sin GSAP (fallback)
  }

  A.motion = { mode, loadGsap, init };
})();
