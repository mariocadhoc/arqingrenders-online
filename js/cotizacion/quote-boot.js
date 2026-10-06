'use strict';

/* =========================================================
   COTIZACIÓN · ARRANQUE
   slug (?slug=) -> Sheet -> modelo -> render -> movimiento
   ========================================================= */
(function () {
  const A = window.ArqQuote;
  const { getSlug, loadQuoteRow, loadClauses, validate, buildModel, CONFIG } = A.data;
  const i18n = A.i18n;
  const T = i18n.t;

  const app = () => document.getElementById('quote-app');
  const curtainHost = () => document.getElementById('quote-curtain');

  function setMeta(project) {
    document.documentElement.lang = i18n.htmlLang;
    document.title = project ? T.pageTitle(project) : 'Arqing';
  }

  // Los enlaces EN/ES del header conservan el slug
  function hydrateLangLinks(slug) {
    const header = document.getElementById('header');
    if (!header || !slug) return;
    const q = '?slug=' + encodeURIComponent(slug);
    const es = '/es/cotizacion/' + q;
    const en = CONFIG.enPageReady ? '/quotation/' + q : '';
    header.dataset.langEs = es;
    if (en) header.dataset.langEn = en;
    const apply = () => {
      header.querySelectorAll('[data-lang-link="es"]').forEach((a) => { a.href = es; });
      if (en) header.querySelectorAll('[data-lang-link="en"]').forEach((a) => { a.href = en; });
    };
    apply();
    document.addEventListener('header-loaded', apply);
  }

  function showCurtain() {
    const host = curtainHost();
    if (host) host.innerHTML = A.view.loadingHTML();
  }

  function liftCurtain() {
    const c = document.getElementById('q-curtain');
    if (!c) return;
    c.classList.add('is-out');
    setTimeout(() => c.remove(), 800);
  }

  function track(event, extra) {
    try { if (typeof window.metricSend === 'function') window.metricSend('interaction', { interaction_event: event, ...extra }); } catch (_) { /* nunca romper la página */ }
  }

  // Portafolio: pestañas renders / animaciones y reproductor en ventana
  function initWork(root) {
    const modal = root.querySelector('#q-modal');
    const frame = modal && modal.querySelector('.q-modal__frame');
    let lastFocus = null;

    const closeModal = () => {
      if (!modal || modal.hidden) return;
      modal.hidden = true;
      frame.innerHTML = '';
      document.documentElement.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    };
    const openModal = (id, title, trigger) => {
      if (!/^\d{5,12}$/.test(id)) return;
      lastFocus = trigger;
      frame.innerHTML = `<iframe src="https://player.vimeo.com/video/${id}?autoplay=1&badge=0&autopause=0&dnt=1" title="${(title || '').replace(/"/g, '')}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
      modal.hidden = false;
      document.documentElement.style.overflow = 'hidden';
      modal.querySelector('.q-modal__x').focus();
    };

    root.addEventListener('click', (e) => {
      const tab = e.target.closest('[data-tab]');
      if (tab) {
        root.querySelectorAll('[data-tab]').forEach((t) => {
          const on = t === tab;
          t.classList.toggle('is-on', on);
          t.setAttribute('aria-selected', String(on));
          const panel = root.querySelector('#q-panel-' + t.dataset.tab);
          if (panel) panel.hidden = !on;
        });
        const link = root.querySelector('#q-worklink');
        if (link) {
          link.href = i18n.workHref[tab.dataset.tab];
          link.querySelector('span').textContent = T.workCta[tab.dataset.tab];
        }
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
        return;
      }
      const play = e.target.closest('[data-play]');
      if (play) { openModal(play.dataset.play, play.dataset.title, play); return; }
      if (e.target.closest('[data-close]')) closeModal();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  }

  function showState(kind, detail) {
    const el = app();
    el.innerHTML = A.view.stateHTML(kind, { detail });
    el.className = 'q-app q-app--state';
    liftCurtain();
    const retry = el.querySelector('[data-retry]');
    if (retry) retry.addEventListener('click', () => { init(); });
  }

  async function init() {
    const slug = getSlug();
    setMeta('');
    hydrateLangLinks(slug);
    showCurtain();
    document.body.classList.remove('q-has-sticky');

    if (!slug) { showState('notfound'); return; }

    const mode = A.motion.mode();
    const gsapPromise = mode === 'gsap' ? A.motion.loadGsap() : Promise.resolve(null);

    let row, clauseRows;
    try {
      [row, clauseRows] = await Promise.all([loadQuoteRow(slug), loadClauses()]);
    } catch (err) {
      console.error('[Cotización] Error de carga:', err);
      showState('error');
      return;
    }

    if (!row || !validate(row)) { showState('notfound'); return; }

    const model = buildModel(row, clauseRows, i18n);
    setMeta(model.project);
    if (model.inactive || model.expired) { showState('expired'); return; }

    const root = app();
    root.className = 'q-app';
    root.innerHTML = A.view.pageHTML(model);

    // Si la imagen de portada no carga, la portada queda en degradado
    const heroImg = root.querySelector('.q-hero__media img');
    if (heroImg) heroImg.addEventListener('error', () => root.querySelector('.q-hero').classList.add('q-hero--noimg'));

    initWork(root);

    const g = await gsapPromise;
    const motion = A.motion.init(root, g ? 'gsap' : (mode === 'gsap' ? 'lite' : mode), g);

    // Un frame para asentar estilos y luego se levanta la cortina
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    liftCurtain();
    setTimeout(() => motion.start(), 250);

    track('quote-view', { target: model.slug });
    root.addEventListener('click', (e) => {
      const a = e.target.closest('a[data-accept], a[data-pdf], a[data-wa]');
      if (!a) return;
      track(a.hasAttribute('data-accept') ? 'quote-accept-click' : (a.hasAttribute('data-pdf') ? 'quote-pdf-click' : 'quote-whatsapp-click'), { target: model.slug });
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
