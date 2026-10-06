'use strict';

/* =========================================================
   COTIZACIÓN · DATOS
   Lee el Google Sheet (GViz), arma el modelo de la cotización
   y resuelve las cláusulas ES/EN. No toca el DOM.
   ========================================================= */
(function () {
  const A = (window.ArqQuote = window.ArqQuote || {});
  const b64 = (s) => { try { return atob(s); } catch (_) { return ''; } };

  // ---------------------------------------------------------
  // Configuración
  // ---------------------------------------------------------
  const CONFIG = {
    sheetId: b64('MWc3V1VDUHN4dEtQQjZKbHpXTTVUT1hFRFphRUUxajltT3YxMVlnbEpHcDg='),
    quoteSheet: 'Cotizador_Arqingrenders',
    clauseSheet: 'Cotizador_Clausulas',
    slugCol: 'B',                                   // la columna Slug del Sheet DEBE ser la B
    mockBase: '/es/cotizacion/_dev/',               // solo se usa en localhost con ?mock=1
    enPageReady: false,                             // pasar a true cuando exista /quotation/
    company: {
      waNumber: b64('NTIyMjkyNDIyMTQ4'),
      email: b64('c3R1ZGlvQGFycWluZ3JlbmRlcnMuY29t'),
      phone: '+52 229 242 2148',
      site: 'www.arqingrenders.com',
      address: ['Juan Enríquez #1937 Int. 10', 'Veracruz, México']
    },
    // Imagen de portada por defecto según Tipo_Proyecto (rutas de /assets)
    heroByType: {
      residencial: '/assets/img/work/Tulum-1_-1200w.webp',
      comercial: '/assets/img/work/Caesars Palace-1200w.webp',
      hospitalidad: '/assets/img/work/Tulum-1_-1200w.webp',
      interiores: '/assets/img/home/NJ_GF_LOUNGE_2-1200w.webp',
      mixto: '/assets/img/home/blue_hour-1200w.webp',
      _default: '/assets/img/home/blue_hour-1200w.webp'
    },
    // Animaciones del portafolio (Vimeo): [id, título ES, título EN]
    animations: [
      ['1215990306', 'Vista Lago Residencial · Chihuahua', 'Vista Lago Residencial · Chihuahua'],
      ['486910808', 'Cima del Pedregal · Chihuahua', 'Cima del Pedregal · Chihuahua'],
      ['266600406', 'Acantto Urban Living · México', 'Acantto Urban Living · Mexico'],
      ['1006689611', 'Pedregal del Encino · Chihuahua', 'Pedregal del Encino · Chihuahua'],
      ['405954025', 'Nuevo Campus Universitario · CDMX', 'New University Campus · Mexico City']
    ],
    // Cinta de portafolio: [ruta, etiquetas por las que se prioriza]
    portfolio: [
      ['/assets/img/work/Tulum-1_-800w.webp', ['residencial', 'hospitalidad']],
      ['/assets/img/work/Caesars Palace-Aerial-800w.webp', ['comercial', 'mixto']],
      ['/assets/img/home/wythe-rooftop-800w.webp', ['hospitalidad', 'residencial']],
      ['/assets/img/home/interior-800w.webp', ['interiores', 'residencial']],
      ['/assets/img/work/Brooklyn-800w.webp', ['mixto', 'comercial']],
      ['/assets/img/work/CPR-Bedroom-800w.webp', ['interiores', 'residencial']],
      ['/assets/img/home/blue_hour-800w.webp', ['comercial', 'mixto']],
      ['/assets/img/work/Tulum-bedroom-800w.webp', ['interiores', 'hospitalidad']],
      ['/assets/img/home/6411-queensblvd-800w.webp', ['comercial', 'mixto']],
      ['/assets/img/work/LIC_small-800w.webp', ['interiores', 'residencial']]
    ]
  };

  // ---------------------------------------------------------
  // Utilidades
  // ---------------------------------------------------------
  const escapeHTML = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const has = (v) => v !== '' && v !== null && v !== undefined;

  const num = (v) => {
    if (typeof v === 'number') return isFinite(v) ? v : 0;
    if (!has(v)) return 0;
    const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ''));
    return isFinite(n) ? n : 0;
  };

  const bool = (v) => v === true || /^(true|verdadero|si|sí|1|x)$/i.test(String(v ?? '').trim());
  const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
  const stripAccents = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  function getSlug() {
    const raw = new URLSearchParams(window.location.search).get('slug');
    if (!raw) return null;
    return /^[a-z0-9-]{3,90}$/i.test(raw) ? raw.toLowerCase() : null;
  }

  function parseDate(v) {
    if (!has(v)) return null;
    if (v instanceof Date) return isNaN(v) ? null : v;
    const s = String(v).trim();
    let m = /^Date\((\d{4}),\s*(\d{1,2}),\s*(\d{1,2})/.exec(s);        // GViz (mes 0-11)
    if (m) return new Date(+m[1], +m[2], +m[3]);
    m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    m = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(s);
    if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
    return null;
  }

  const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  function fill(str, vars) {
    return String(str ?? '').replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
  }

  function safeImagePath(p) {
    const s = String(p ?? '').trim();
    if (!s || s.startsWith('//') || s.includes('..') || !s.startsWith('/')) return null;
    return /\.(avif|webp|jpe?g|png)$/i.test(s) ? s : null;
  }

  function safePdfUrl(u) {
    try {
      const url = new URL(String(u ?? '').trim());
      if (url.protocol !== 'https:') return null;
      if (!/(^|\.)google\.com$/i.test(url.hostname)) return null;
      return url.href;
    } catch (_) { return null; }
  }

  // ---------------------------------------------------------
  // Carga (GViz)
  // ---------------------------------------------------------
  function parseGviz(text) {
    const marker = text.indexOf('setResponse(');
    if (marker === -1) throw new Error('GViz: formato inesperado');
    const start = text.indexOf('{', marker);
    const end = text.lastIndexOf('}');
    if (start === -1 || end <= start) throw new Error('GViz: llaves no encontradas');
    const json = JSON.parse(text.slice(start, end + 1));
    if (json.status === 'error') throw new Error('GViz: ' + (json.errors?.[0]?.detailed_message || 'error'));
    if (!json.table || !Array.isArray(json.table.rows)) throw new Error('GViz: estructura inválida');
    return json;
  }

  function gvizRows(json) {
    const cols = (json.table.cols || []).map((c) => (c.label || '').trim());
    return json.table.rows.map((r) => {
      const o = {};
      (r.c || []).forEach((cell, i) => { if (cols[i]) o[cols[i]] = cell && cell.v !== null && cell.v !== undefined ? cell.v : ''; });
      return o;
    });
  }

  // Si el nombre de la hoja no existe, Google devuelve la PRIMERA hoja del documento
  // (la del cotizador de México). Se exige la firma de columnas propia de esta hoja.
  function assertColumns(json, required, what) {
    const labels = (json.table.cols || []).map((c) => (c.label || '').trim());
    const missing = required.filter((r) => !labels.includes(r));
    if (missing.length) throw new Error(`La hoja de ${what} no tiene las columnas esperadas (${missing.join(', ')})`);
  }

  const QUOTE_COLS = ['Slug', 'Cliente', 'Proyecto_Titulo', 'Stills_Cant', 'IVA_Modo', 'Pagos'];

  const isMock = () => /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && new URLSearchParams(location.search).has('mock');

  async function fetchText(url, retries = 3, delay = 600) {
    for (let i = 0; i < retries; i++) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 10000);
      try {
        const res = await fetch(url, { cache: 'no-store', signal: ctrl.signal });
        clearTimeout(timer);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return await res.text();
      } catch (err) {
        clearTimeout(timer);
        if (i === retries - 1) throw err;
        await new Promise((r) => setTimeout(r, delay * Math.pow(2, i)));
      }
    }
    return null;
  }

  const gvizUrl = (sheet, tq) =>
    `https://docs.google.com/spreadsheets/d/${CONFIG.sheetId}/gviz/tq?tqx=out:json&headers=1` +
    `&sheet=${encodeURIComponent(sheet)}${tq ? '&tq=' + encodeURIComponent(tq) : ''}&_=${Date.now()}`;

  /** Devuelve la fila de la cotización, null si no existe. Lanza si hay error de red. */
  async function loadQuoteRow(slug) {
    const text = isMock()
      ? await fetchText(CONFIG.mockBase + 'quote.gviz.txt', 1)
      // Se consulta SOLO la fila de este slug: el Sheet no se descarga completo
      : await fetchText(gvizUrl(CONFIG.quoteSheet, `select * where ${CONFIG.slugCol} = '${slug}'`));
    const json = parseGviz(text);
    assertColumns(json, QUOTE_COLS, 'cotizaciones');
    return gvizRows(json).find((r) => String(r.Slug).toLowerCase() === slug) || null;
  }

  /** Cláusulas: si fallan, la cotización se muestra igual con lo que haya. */
  async function loadClauses() {
    try {
      const text = isMock()
        ? await fetchText(CONFIG.mockBase + 'clausulas.gviz.txt', 1)
        : await fetchText(gvizUrl(CONFIG.clauseSheet, ''));
      const json = parseGviz(text);
      assertColumns(json, ['Categoria', 'Clave'], 'cláusulas');
      return gvizRows(json);
    } catch (err) {
      console.warn('[Cotización] No se pudieron cargar las cláusulas:', err.message);
      return [];
    }
  }

  // ---------------------------------------------------------
  // Modelo
  // ---------------------------------------------------------
  function validate(row) {
    const missing = ['Cliente', 'Proyecto_Titulo', 'Slug'].filter((k) => !has(row[k]) || String(row[k]).trim() === '');
    if (missing.length) { console.warn('[Cotización] Campos faltantes:', missing); return false; }
    if (!parseDate(row.Fecha)) { console.warn('[Cotización] Fecha inválida'); return false; }
    return true;
  }

  function buildModel(row, clauseRows, i18n) {
    const L = i18n.lang.toUpperCase();
    const other = L === 'ES' ? 'EN' : 'ES';
    const loc = (base) => {
      const a = row[`${base}_${L}`], b = row[`${base}_${other}`];
      return has(a) && String(a).trim() ? String(a).trim() : (has(b) ? String(b).trim() : '');
    };

    // --- Cláusulas ---
    const clauses = {};
    clauseRows.forEach((c) => {
      const cat = String(c.Categoria || '').trim().toUpperCase();
      const key = String(c.Clave || '').trim().toUpperCase();
      if (!cat || !key) return;
      const pick = (base) => {
        const a = c[`${base}_${L}`], b = c[`${base}_${other}`];
        return has(a) && String(a).trim() ? String(a).trim() : (has(b) ? String(b).trim() : '');
      };
      (clauses[cat] = clauses[cat] || {})[key] = { key, order: num(c.Orden) || 999, title: pick('Titulo'), text: pick('Texto') };
    });
    const clauseList = (cat) => Object.values(clauses[cat] || {}).sort((a, b) => a.order - b.order);
    const clauseOf = (cat, key) => (clauses[cat] || {})[key] || null;

    // --- Fechas y estado ---
    const fecha = parseDate(row.Fecha);
    const dias = num(row.Vigencia_Dias) || 20;
    let vigencia = parseDate(row.Vigencia);
    if (!vigencia) { vigencia = new Date(fecha); vigencia.setDate(vigencia.getDate() + dias); }
    const now = new Date();
    const inactive = /inactiv/i.test(String(row.Estatus || ''));
    const expired = now > endOfDay(vigencia);
    const msDay = 86400000;
    const dayStart = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const daysLeft = Math.max(0, Math.round((dayStart(vigencia) - dayStart(now)) / msDay));

    // --- Entregables ---
    const modules = [];
    const stills = num(row.Stills_Cant);
    const animMin = num(row.Anim_Min);
    const tours = num(row.Tours360_Cant);
    if (stills > 0) modules.push({ type: 'stills', value: stills, display: String(stills), label: i18n.t.stills(stills) });
    if (animMin > 0) {
      const secs = Math.round(animMin * 60);
      modules.push({
        type: 'anim', value: secs, display: `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`,
        label: loc('Anim_Etiqueta') || i18n.t.anim,
        specs: [
          has(row.Anim_Resolucion) && String(row.Anim_Resolucion).trim() ? { k: i18n.t.specResolution, v: String(row.Anim_Resolucion).trim() } : null,
          has(row.Anim_Formato) && String(row.Anim_Formato).trim() ? { k: i18n.t.specFormat, v: String(row.Anim_Formato).trim() } : null
        ].filter(Boolean)
      });
    }
    if (tours > 0) modules.push({ type: 'tours', value: tours, display: String(tours), label: i18n.t.tours(tours) });

    const resumen = loc('Resumen') || modules.map((m) => i18n.t.moduleText(m)).join(i18n.t.joiner);

    // --- Casillas -> cláusulas (P_, I_, X_) ---
    const checked = (prefix, cat) => Object.keys(row)
      .filter((k) => k.toUpperCase().startsWith(prefix) && bool(row[k]))
      .map((k) => clauseOf(cat, k.slice(prefix.length).toUpperCase()))
      .filter(Boolean)
      .sort((a, b) => a.order - b.order);
    const proceso = checked('P_', 'PROCESO');
    const incluye = checked('I_', 'INCLUYE');
    const excluye = checked('X_', 'EXCLUYE');

    // --- Tiempos ---
    const wMin = Math.round(num(row.Semanas_Min));
    const wMaxRaw = Math.round(num(row.Semanas_Max));
    const wMax = wMaxRaw >= wMin ? wMaxRaw : wMin;
    const weeks = wMin > 0 ? { min: wMin, max: wMax, text: i18n.t.weeks(wMin, wMax) } : null;

    // --- Dinero ---
    const currency = (String(row.Moneda || 'MXN').trim().toUpperCase().match(/^[A-Z]{3}$/) || ['MXN'])[0];
    const modeRaw = stripAccents(String(row.IVA_Modo || '')).toLowerCase();
    const ivaMode = modeRaw.includes('incluid') ? 'incluido' : (modeRaw.includes('sin') ? 'sin' : 'mas');
    const ivaPct = has(row.IVA_Pct) ? num(row.IVA_Pct) : 16;

    const lines = [1, 2, 3].map((n) => ({ label: loc(`Concepto_${n}`), amount: num(row[`Monto_${n}`]) }))
      .filter((l) => l.amount > 0)
      .map((l) => ({ ...l, label: l.label || '' }));
    const sum = round2(lines.reduce((a, l) => a + l.amount, 0));
    const discPct = num(row.Descuento_Pct);
    let discount = has(row.Descuento) ? num(row.Descuento) : round2(sum * discPct / 100);
    let subtotal, iva, total;
    if (has(row.Total) && num(row.Total) > 0) {
      total = num(row.Total);
      iva = has(row.IVA) ? num(row.IVA) : 0;
      subtotal = has(row.Subtotal) && num(row.Subtotal) > 0 ? num(row.Subtotal) : round2(total - iva);
    } else {
      const base = round2(sum - discount);
      if (ivaMode === 'incluido') { total = base; subtotal = round2(base / (1 + ivaPct / 100)); iva = round2(total - subtotal); }
      else if (ivaMode === 'sin') { subtotal = base; iva = 0; total = base; }
      else { subtotal = base; iva = round2(base * ivaPct / 100); total = round2(subtotal + iva); }
    }
    // Control interno: avisa en consola si las fórmulas del Sheet no cuadran con los renglones
    if (lines.length) {
      const base = round2(sum - discount);
      const expected = ivaMode === 'mas' ? round2(base + round2(base * ivaPct / 100)) : base;
      if (Math.abs(expected - total) > 0.011) console.warn('[Cotización] El Total del Sheet no coincide con los renglones:', { expected, total });
    }

    // --- Pagos ---
    let pcts = String(row.Pagos ?? '').split(/[\/|,;\s]+/).map((x) => parseFloat(x)).filter((x) => isFinite(x) && x > 0);
    if (!pcts.length || Math.abs(pcts.reduce((a, b) => a + b, 0) - 100) > 0.01) {
      if (pcts.length) console.warn('[Cotización] Pagos no suma 100, se usa 50/50:', row.Pagos);
      pcts = [50, 50];
    }
    const hito = (key) => (clauseOf('HITO', key) || {}).title || '';
    let acc = 0;
    const payments = pcts.map((p, i) => {
      const isLast = i === pcts.length - 1;
      const amount = isLast ? round2(total - acc) : round2(total * p / 100);
      acc = round2(acc + amount);
      const label = hito(i === 0 ? 'INICIO' : (isLast ? 'FINAL' : 'MEDIO'));
      return { pct: p, amount, label };
    });

    // --- Condiciones (todas, en orden; IMPUESTOS_* según el modo) ---
    const taxKey = { mas: 'IMPUESTOS_MAS_IVA', incluido: 'IMPUESTOS_IVA_INCLUIDO', sin: 'IMPUESTOS_SIN_IVA' }[ivaMode];
    const fmtPct = (n) => String(Math.round(n * 100) / 100);
    const vars = {
      moneda: currency,
      moneda_nombre: i18n.currencyNames[currency] || currency,
      iva_pct: fmtPct(ivaPct),
      vigencia_dias: String(dias),
      vigencia: i18n.fmtDate(vigencia),
      anticipo_pct: fmtPct(pcts[0]),
      resto_pct: fmtPct(100 - pcts[0]),
      cliente: String(row.Cliente).trim(),
      proyecto: String(row.Proyecto_Titulo).trim()
    };
    const conditions = clauseList('CONDICION')
      .filter((c) => !c.key.startsWith('IMPUESTOS_') || c.key === taxKey)
      .map((c) => ({ title: fill(c.title, vars), text: fill(c.text, vars) }));
    const nota = (key) => { const c = clauseOf('NOTA', key); return c ? { title: fill(c.title, vars), text: fill(c.text, vars) } : null; };

    // --- Portada y portafolio ---
    const tipo = stripAccents(String(row.Tipo_Proyecto || '')).toLowerCase().trim();
    const hero = safeImagePath(row.Hero_Asset) || CONFIG.heroByType[tipo] || CONFIG.heroByType._default;
    const work = CONFIG.portfolio
      .map(([src, tags], i) => ({ src, rank: tags.includes(tipo) ? 0 : 1, i }))
      .sort((a, b) => a.rank - b.rank || a.i - b.i)
      .map((x) => x.src);

    return {
      slug: String(row.Slug).trim().toLowerCase(),
      id: has(row.ID) ? String(row.ID).trim() : '',
      client: String(row.Cliente).trim(),
      project: String(row.Proyecto_Titulo).trim(),
      location: has(row.Ubicacion) ? String(row.Ubicacion).trim() : '',
      summary: resumen,
      date: fecha, validUntil: vigencia, validDays: dias, daysLeft,
      inactive, expired,
      hero, work,
      workAnim: CONFIG.animations.map(([id, es, en]) => ({ id, title: L === 'EN' ? en : es })),
      workDefault: modules.length && modules[0].type === 'anim' ? 'anim' : 'stills',
      modules, weeks,
      process: proceso, includes: incluye, excludes: excluye,
      lines, discount, discountPct: discPct, subtotal, iva, ivaMode, ivaPct, total, currency,
      payments,
      conditions,
      notes: loc('Notas'),
      payInfo: nota('PAGO_INFO'),
      timeNote: nota('TIEMPO_NOTA'),
      closing: nota('CIERRE'),
      pdfUrl: safePdfUrl(row.PDF_URL),
      hasClauses: clauseRows.length > 0
    };
  }

  A.data = { CONFIG, escapeHTML, getSlug, loadQuoteRow, loadClauses, validate, buildModel, num, isMock };
})();
