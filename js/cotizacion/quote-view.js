'use strict';

/* =========================================================
   COTIZACIÓN · VISTA
   Genera el HTML de la cotización (todo el contenido llega del
   modelo / Sheet; el HTML de la página está vacío).
   ========================================================= */
(function () {
  const A = (window.ArqQuote = window.ArqQuote || {});
  const { escapeHTML: esc, CONFIG } = A.data;
  const i18n = A.i18n;
  const T = i18n.t;

  const pad2 = (n) => String(n).padStart(2, '0');

  const icons = {
    stills: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="24" cy="24" r="16"/><circle cx="24" cy="24" r="5"/><path d="M24 8l7 12M40 24H27M35.3 35.3L28 26M24 40l-7-12M8 24h13M12.7 12.7L20 22"/></svg>',
    anim: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="11" width="36" height="26" rx="3"/><path d="M20 18.5v11l9-5.5-9-5.5z"/><path d="M6 17h4M6 24h4M6 31h4M38 17h4M38 24h4M38 31h4" opacity=".55"/></svg>',
    tours: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="24" cy="24" r="16"/><ellipse cx="24" cy="24" rx="7" ry="16"/><path d="M8 24h32M10.5 15h27M10.5 33h27"/></svg>',
    check: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10.5l4 4 8-9"/></svg>',
    arrow: '<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 13.5l9-9M6.75 4.5h6.75v6.75"/></svg>',
    down: '<svg viewBox="0 0 16 22" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="1" y="1" width="14" height="20" rx="7"/><path d="M8 5v4" class="q-cue__dot"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2a9.9 9.9 0 00-8.43 15.1L2 22l5.05-1.55A9.9 9.9 0 1012.04 2zm0 1.8a8.1 8.1 0 11-4.2 15.03l-.3-.18-3 .92.95-2.9-.2-.31A8.1 8.1 0 0112.04 3.8zM8.6 7.4c-.2 0-.5.07-.75.35-.26.28-1 .98-1 2.4s1.03 2.78 1.17 2.97c.15.2 2 3.2 4.93 4.36 2.43.96 2.93.77 3.46.72.53-.05 1.7-.7 1.94-1.37.24-.67.24-1.25.17-1.37-.07-.12-.26-.2-.55-.34-.29-.14-1.7-.84-1.96-.94-.27-.1-.46-.14-.65.14-.2.29-.75.94-.92 1.13-.17.2-.34.22-.63.08-.29-.15-1.22-.45-2.32-1.43-.86-.77-1.44-1.7-1.6-1.99-.17-.29-.02-.45.13-.59.13-.13.29-.34.43-.5.14-.17.2-.29.29-.48.1-.2.05-.36-.02-.5-.07-.15-.64-1.58-.9-2.16-.23-.5-.47-.5-.65-.5z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/></svg>',
    pdf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7.5 11l4.5 4.5 4.5-4.5M5 19.5h14"/></svg>'
  };

  // Cada palabra en su máscara (el modo desktop las anima; en lite se ven normales)
  const splitWords = (text) => String(text).trim().split(/\s+/)
    .map((w) => `<span class="q-w"><span class="q-wi">${esc(w)}</span></span>`).join(' ');

  const makeMoney = (currency) => {
    let f;
    try { f = new Intl.NumberFormat(i18n.locale, { style: 'currency', currency }); }
    catch (_) { f = new Intl.NumberFormat(i18n.locale, { style: 'currency', currency: 'MXN' }); }
    return (n) => f.format(n);
  };

  const wa = (text) => `https://wa.me/${CONFIG.company.waNumber}?text=${encodeURIComponent(text)}`;

  // ---------------------------------------------------------
  // Estados
  // ---------------------------------------------------------
  function loadingHTML() {
    return `
      <div class="q-curtain" id="q-curtain" role="status" aria-live="polite">
        <div class="q-curtain__in">
          <span class="q-curtain__ring" aria-hidden="true"></span>
          <p class="q-curtain__txt">${esc(T.loading)}</p>
        </div>
      </div>`;
  }

  function stateHTML(kind, opts = {}) {
    const map = {
      expired: [T.expiredTitle, T.expiredText],
      notfound: [T.notFoundTitle, T.notFoundText],
      error: [T.errorTitle, T.errorText]
    };
    const [title, text] = map[kind];
    const actions = [];
    if (kind === 'error') actions.push(`<button type="button" class="q-btn q-btn--solid" data-retry>${esc(T.retry)}</button>`);
    if (kind === 'expired') actions.push(`<a class="q-btn q-btn--solid" href="${esc(wa(T.waExpired))}" target="_blank" rel="noopener noreferrer">${icons.wa}<span>${esc(T.contactUs)}</span></a>`);
    if (kind === 'notfound') actions.push(`<a class="q-btn q-btn--solid" href="${esc(wa(T.waExpired))}" target="_blank" rel="noopener noreferrer">${icons.wa}<span>${esc(T.contactUs)}</span></a>`);
    actions.push(`<a class="q-btn" href="${esc(i18n.homeHref)}">${esc(T.backHome)}</a>`);
    return `
      <section class="q-state">
        <img class="q-state__logo" src="/assets/resources/logos/arqing_logo.webp" alt="Arqing" width="96" height="108">
        <h1 class="q-state__title">${esc(title)}</h1>
        <p class="q-state__text">${esc(opts.detail || text)}</p>
        <div class="q-actions">${actions.join('')}</div>
      </section>`;
  }

  // ---------------------------------------------------------
  // Cotización
  // ---------------------------------------------------------
  function pageHTML(m) {
    const money = makeMoney(m.currency);
    const msgCtx = { id: m.id, project: m.project, client: m.client };
    const acceptHref = wa(T.waAccept(msgCtx));
    const questionHref = wa(T.waQuestion(msgCtx));
    const taxNote = T.totalTax(m.ivaMode, m.ivaPct);
    const validText = T.validUntil(i18n.fmtDate(m.validUntil));
    const left = m.daysLeft <= 0 ? T.lastDay : T.daysLeft(m.daysLeft);
    let sec = 0;
    const idx = () => pad2(++sec);

    // ---- Hero ----
    const deliverText = m.modules.map((x) => i18n.t.moduleText(x)).join(' + ');
    const heroMeta = [
      deliverText ? { k: T.metaDeliver, v: esc(deliverText) } : null,
      m.weeks ? { k: T.metaTime, v: esc(m.weeks.text) } : null,
      { k: T.metaInvest, v: `<span>${esc(money(m.total))}</span> <small>${esc(m.currency)}</small>` }
    ].filter(Boolean);

    const hero = `
      <section class="q-hero" id="q-top">
        <div class="q-hero__media" aria-hidden="true"><img src="${esc(encodeURI(m.hero))}" alt="" fetchpriority="high" decoding="async"></div>
        <div class="q-hero__shade" aria-hidden="true"></div>
        <div class="q-wrap q-hero__inner">
          <div class="q-hero__top">
            <p class="q-kicker" data-reveal><span class="q-dot" aria-hidden="true"></span>${esc(T.kicker)}${m.id ? ` · ${esc(T.kickerNo(m.id))}` : ''} · ${esc(i18n.fmtDate(m.date))}</p>
            <p class="q-pill" data-reveal data-d=".1"><span>${esc(validText)}</span><i aria-hidden="true"></i><span>${esc(left)}</span></p>
          </div>
          <div class="q-hero__main">
            <p class="q-eyebrow" data-reveal data-d=".1">${esc(T.forClient)}</p>
            <h1 class="q-title" data-split>${splitWords(m.client)}</h1>
            <p class="q-project" data-reveal data-d=".15"><span class="q-project__k">${esc(T.project)}</span><span class="q-project__v">${esc(m.project)}</span>${m.location ? `<span class="q-project__loc">${esc(m.location)}</span>` : ''}</p>
            ${m.summary ? `<p class="q-summary" data-reveal data-d=".2">${esc(m.summary)}</p>` : ''}
          </div>
          <dl class="q-meta" data-reveal data-d=".25">
            ${heroMeta.map((x) => `<div class="q-meta__i"><dt>${esc(x.k)}</dt><dd>${x.v}</dd></div>`).join('')}
          </dl>
        </div>
        <a class="q-cue" href="#q-next" aria-label="${esc(T.scroll)}">${icons.down}</a>
      </section>
      <div class="q-hero-end" id="q-hero-end" aria-hidden="true"></div>`;

    // ---- Entregables ----
    let scope = '';
    if (m.modules.length || m.includes.length) {
      const cards = m.modules.map((x) => {
        const isTime = x.type === 'anim';
        const count = isTime
          ? `<span data-count="${x.value}" data-fmt="time">${esc(x.display)}</span><small>${esc(T.minutesUnit)}</small>`
          : `<span data-count="${x.value}" data-fmt="int">${esc(x.display)}</span>`;
        const specs = (x.specs || []).length
          ? `<ul class="q-chips">${x.specs.map((s) => `<li><b>${esc(s.k)}</b>${esc(s.v)}</li>`).join('')}</ul>` : '';
        return `
          <article class="q-card q-card--${x.type}" data-reveal>
            <span class="q-card__frame" aria-hidden="true"></span>
            <span class="q-card__icon">${icons[x.type]}</span>
            <p class="q-num">${count}</p>
            <h3 class="q-card__label">${esc(x.label)}</h3>
            ${specs}
          </article>`;
      }).join('');
      const incl = m.includes.length ? `
        <div class="q-incl">
          <h3 class="q-sub" data-reveal>${esc(T.includesTitle)}</h3>
          <ul class="q-incl__list">
            ${m.includes.map((c, i) => `
              <li data-reveal data-d="${(i % 3) * 0.06}">
                <span class="q-incl__ic">${icons.check}</span>
                <div><h4>${esc(c.title)}</h4>${c.text ? `<p>${esc(c.text)}</p>` : ''}</div>
              </li>`).join('')}
          </ul>
        </div>` : '';
      scope = `
        <section class="q-sec q-scope" id="q-next">
          <div class="q-wrap">
            <header class="q-head">
              <span class="q-idx" data-reveal>${idx()}</span>
              <div><h2 class="q-h2" data-split>${splitWords(T.scopeTitle)}</h2><p class="q-lede" data-reveal>${esc(T.scopeIntro)}</p></div>
            </header>
            ${cards ? `<div class="q-cards q-cards--${m.modules.length}">${cards}</div>` : ''}
            ${incl}
          </div>
        </section>`;
    }

    // ---- Proceso + tiempo ----
    let process = '';
    if (m.process.length || m.weeks) {
      const steps = m.process.length ? `
        <ol class="q-steps">
          <span class="q-steps__line" aria-hidden="true"><i></i></span>
          ${m.process.map((c, i) => `
            <li class="q-step" data-reveal>
              <span class="q-step__n">${pad2(i + 1)}</span>
              <div><h3>${esc(c.title)}</h3>${c.text ? `<p>${esc(c.text)}</p>` : ''}</div>
            </li>`).join('')}
        </ol>` : '';
      let time = '';
      if (m.weeks) {
        const cells = Array.from({ length: Math.max(m.weeks.max, 1) }, (_, i) =>
          `<li class="on"><span>${i + 1}</span></li>`).join('');
        // La cuenta baja desde una cifra mayor hasta el valor real (se lee como "se acorta")
        const from = Math.max(25, Math.round(m.weeks.max * 2.5));
        const wk = (n) => `<span data-count="${n}" data-from="${from}" data-fmt="int">${n}</span>`;
        const big = m.weeks.min === m.weeks.max ? wk(m.weeks.min) : `${wk(m.weeks.min)}<em>–</em>${wk(m.weeks.max)}`;
        time = `
          <div class="q-time" data-reveal>
            <div class="q-time__l">
              <h3 class="q-sub">${esc(T.timeTitle)}</h3>
              <p class="q-time__big">${big}<small>${esc(T.weeksUnit(m.weeks.min, m.weeks.max))}</small></p>
            </div>
            <div class="q-time__r">
              <ol class="q-weeks" aria-hidden="true">${cells}</ol>
              ${m.timeNote && m.timeNote.text ? `<p class="q-note">${esc(m.timeNote.text)}</p>` : ''}
            </div>
          </div>`;
      }
      process = `
        <section class="q-sec q-process">
          <div class="q-wrap">
            <div class="q-split">
              <header class="q-head q-head--sticky">
                <span class="q-idx" data-reveal>${idx()}</span>
                <div><h2 class="q-h2" data-split>${splitWords(T.processTitle)}</h2><p class="q-lede" data-reveal>${esc(T.processIntro)}</p></div>
              </header>
              ${steps}
            </div>
            ${time}
          </div>
        </section>`;
    }

    // ---- Portafolio ----
    const strip = m.work.map((src) =>
      `<figure class="q-work__i"><img src="${esc(encodeURI(src))}" alt="${esc(T.workAlt)}" loading="lazy" decoding="async"></figure>`).join('');
    const vids = m.workAnim.map((v) => `
      <button type="button" class="q-vid" data-play="${esc(v.id)}" data-title="${esc(v.title)}" aria-label="${esc(T.play)}: ${esc(v.title)}">
        <span class="q-vid__img"><img src="https://vumbnail.com/${esc(v.id)}.jpg" alt="" loading="lazy" decoding="async"><i class="q-vid__play" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg></i></span>
        <span class="q-vid__t">${esc(v.title)}</span>
      </button>`).join('');
    const tab = (id, label) => `<button type="button" role="tab" class="q-tab${m.workDefault === id ? ' is-on' : ''}" id="q-tab-${id}" data-tab="${id}" aria-selected="${m.workDefault === id}" aria-controls="q-panel-${id}">${esc(label)}</button>`;
    const work = `
      <section class="q-sec q-work">
        <div class="q-wrap">
          <header class="q-head">
            <span class="q-idx" data-reveal>${idx()}</span>
            <div><h2 class="q-h2" data-split>${splitWords(T.workTitle)}</h2><p class="q-lede" data-reveal>${esc(T.workIntro)}</p></div>
          </header>
          <div class="q-tabs" role="tablist" aria-label="${esc(T.tabsLabel)}" data-reveal>${tab('stills', T.tabStills)}${tab('anim', T.tabAnim)}</div>
        </div>
        <div class="q-panel" id="q-panel-stills" role="tabpanel" aria-labelledby="q-tab-stills"${m.workDefault === 'stills' ? '' : ' hidden'}>
          <div class="q-strip" data-strip aria-hidden="true"><div class="q-strip__track">${strip}</div></div>
        </div>
        <div class="q-panel" id="q-panel-anim" role="tabpanel" aria-labelledby="q-tab-anim"${m.workDefault === 'anim' ? '' : ' hidden'}>
          <div class="q-strip q-strip--vid"><div class="q-strip__track">${vids}</div></div>
        </div>
        <div class="q-wrap"><a class="q-link" id="q-worklink" href="${esc(i18n.workHref[m.workDefault])}" data-reveal><span>${esc(T.workCta[m.workDefault])}</span>${icons.arrow}</a></div>
      </section>
      <div class="q-modal" id="q-modal" role="dialog" aria-modal="true" aria-label="${esc(T.tabAnim)}" hidden>
        <button type="button" class="q-modal__bg" data-close aria-label="${esc(T.close)}"></button>
        <div class="q-modal__box"><button type="button" class="q-modal__x" data-close aria-label="${esc(T.close)}">×</button><div class="q-modal__frame"></div></div>
      </div>`;

    // ---- Inversión ----
    const rows = [];
    m.lines.forEach((l) => rows.push(`<li><span>${esc(l.label || T.concept)}</span><b>${esc(money(l.amount))}</b></li>`));
    if (m.discount > 0) rows.push(`<li class="q-ledger__sub"><span>${esc(T.discount(m.discountPct))}</span><b>− ${esc(money(m.discount))}</b></li>`);
    if (m.ivaMode === 'mas') {
      rows.push(`<li class="q-ledger__sub"><span>${esc(T.subtotal)}</span><b>${esc(money(m.subtotal))}</b></li>`);
      rows.push(`<li class="q-ledger__sub"><span>${esc(T.vat(m.ivaPct))}</span><b>${esc(money(m.iva))}</b></li>`);
    } else if (m.ivaMode === 'incluido') {
      rows.push(`<li class="q-ledger__sub"><span>${esc(T.subtotal)}</span><b>${esc(money(m.subtotal))}</b></li>`);
      rows.push(`<li class="q-ledger__sub"><span>${esc(T.vatIncluded(m.ivaPct))}</span><b>${esc(money(m.iva))}</b></li>`);
    }
    const bar = m.payments.map((p) => `<i style="--w:${p.pct}%"><span>${esc(String(Math.round(p.pct * 100) / 100))}%</span></i>`).join('');
    const payRows = m.payments.map((p) => `
      <li data-reveal>
        <b>${esc(String(Math.round(p.pct * 100) / 100))}%</b>
        <span>${esc(p.label)}</span>
        <em>${esc(money(p.amount))}</em>
      </li>`).join('');
    const pdfBtn = m.pdfUrl
      ? `<a class="q-btn" href="${esc(m.pdfUrl)}" target="_blank" rel="noopener noreferrer" data-pdf>${icons.pdf}<span>${esc(T.pdfCta)}</span></a>` : '';
    const invest = `
      <section class="q-sec q-invest" id="q-invest">
        <div class="q-wrap">
          <header class="q-head">
            <span class="q-idx" data-reveal>${idx()}</span>
            <div><h2 class="q-h2" data-split>${splitWords(T.investTitle)}</h2><p class="q-lede" data-reveal>${esc(T.investIntro)}</p></div>
          </header>
          <div class="q-invest__grid">
            <div class="q-ledger" data-reveal>
              <ul class="q-ledger__rows">${rows.join('')}</ul>
              <div class="q-total">
                <span>${esc(T.total)}</span>
                <strong><span>${esc(money(m.total))}</span><small>${esc(m.currency)}</small></strong>
              </div>
              <i class="q-total__line" aria-hidden="true"></i>
              <p class="q-total__tax">${esc(taxNote)}</p>
              ${m.notes ? `<div class="q-notes"><h4>${esc(T.notes)}</h4><p>${esc(m.notes)}</p></div>` : ''}
            </div>
            <div class="q-pay" data-reveal data-d=".1">
              <h3 class="q-sub">${esc(T.scheduleTitle)}</h3>
              <div class="q-paybar" aria-hidden="true">${bar}</div>
              <ol class="q-payrows">${payRows}</ol>
            </div>
          </div>
          <aside class="q-callout" data-reveal>
            <div class="q-callout__txt">
              <h3>${esc(m.payInfo ? m.payInfo.title : '')}</h3>
              <p>${esc(m.payInfo ? m.payInfo.text : '')}</p>
            </div>
            <div class="q-actions">
              <a class="q-btn q-btn--solid" href="${esc(acceptHref)}" target="_blank" rel="noopener noreferrer" data-accept>${icons.wa}<span>${esc(T.acceptCta)}</span></a>
              ${pdfBtn}
            </div>
          </aside>
        </div>
      </section>`;

    // ---- Condiciones ----
    let terms = '';
    if (m.conditions.length || m.excludes.length) {
      terms = `
        <section class="q-sec q-terms">
          <div class="q-wrap">
            <header class="q-head">
              <span class="q-idx" data-reveal>${idx()}</span>
              <div><h2 class="q-h2" data-split>${splitWords(T.termsTitle)}</h2><p class="q-lede" data-reveal>${esc(T.termsIntro)}</p></div>
            </header>
            ${m.conditions.length ? `<ol class="q-cond">${m.conditions.map((c, i) => `
              <li data-reveal data-d="${(i % 2) * 0.06}">
                <span class="q-cond__n">${i + 1}</span>
                <div><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p></div>
              </li>`).join('')}</ol>` : ''}
            ${m.excludes.length ? `
              <div class="q-excl" data-reveal>
                <h3 class="q-sub">${esc(T.excludesTitle)}</h3>
                <ul class="q-tags">${m.excludes.map((c) => `<li>${esc(c.title)}</li>`).join('')}</ul>
              </div>` : ''}
          </div>
        </section>`;
    }

    // ---- Cierre ----
    const c = CONFIG.company;
    const closing = `
      <section class="q-sec q-close">
        <div class="q-wrap">
          ${m.closing && m.closing.text ? `<p class="q-close__txt" data-reveal>${esc(m.closing.text)}</p>` : ''}
          <div class="q-close__grid">
            <div class="q-sign" data-reveal>
              <p class="q-sign__lead">${esc(T.signoff)}</p>
              <p class="q-sign__name">${esc(T.signer)}</p>
              <p class="q-sign__co">${esc(T.company)}</p>
              <address class="q-addr">${c.address.map(esc).join('<br>')}<br><a href="https://${esc(c.site)}" target="_blank" rel="noopener noreferrer">${esc(c.site)}</a></address>
            </div>
            <div class="q-contact" data-reveal data-d=".1">
              <h3 class="q-sub">${esc(T.questions)}</h3>
              <div class="q-actions q-actions--col">
                <a class="q-btn q-btn--solid" href="${esc(questionHref)}" target="_blank" rel="noopener noreferrer" data-wa>${icons.wa}<span>${esc(T.whatsapp)}</span></a>
                <a class="q-btn" href="mailto:${esc(c.email)}">${icons.mail}<span>${esc(c.email)}</span></a>
              </div>
              <p class="q-phone">${esc(c.phone)}</p>
            </div>
          </div>
        </div>
      </section>
      <footer class="q-foot">
        <div class="q-wrap"><p>© 2011–${new Date().getFullYear()} Arqing. ${esc(T.rights)}</p><p>${esc(T.confidential)}</p></div>
      </footer>`;

    // ---- Barra fija ----
    const sticky = `
      <div class="q-sticky" id="q-sticky">
        <div class="q-sticky__in">
          <div class="q-sticky__id"><strong>${esc(m.project)}</strong><small>${esc(validText)}</small></div>
          <div class="q-sticky__tot"><small>${esc(T.total)}</small><b>${esc(money(m.total))} <i>${esc(m.currency)}</i></b></div>
          <a class="q-btn q-btn--solid q-btn--sm" href="${esc(acceptHref)}" target="_blank" rel="noopener noreferrer" data-accept aria-label="${esc(T.acceptCta)}"><span class="q-btn__full">${esc(T.acceptCta)}</span><span class="q-btn__short" aria-hidden="true">${esc(T.acceptShort)}</span></a>
        </div>
      </div>`;

    return `<div class="q-progress" aria-hidden="true"><i></i></div>
      <article class="q-page" data-slug="${esc(m.slug)}">${hero}${scope}${process}${work}${invest}${terms}${closing}</article>
      ${sticky}`;
  }

  A.view = { loadingHTML, stateHTML, pageHTML };
})();
