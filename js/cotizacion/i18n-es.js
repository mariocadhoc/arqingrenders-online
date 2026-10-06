'use strict';

/* =========================================================
   COTIZACIÓN · TEXTOS DE INTERFAZ (ES)
   Solo "chrome" de la UI. Todo lo que es información de la
   cotización o texto legal viene del Google Sheet.
   Para inglés: crear i18n-en.js con las mismas llaves.
   ========================================================= */
(function () {
  const A = (window.ArqQuote = window.ArqQuote || {});

  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const monthsShort = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  A.i18n = {
    lang: 'es',
    locale: 'es-MX',
    htmlLang: 'es-MX',
    homeHref: '/es/',
    portfolioHref: '/es/proyectos/',
    workHref: { stills: '/es/proyectos/renders/', anim: '/es/proyectos/animaciones/' },

    currencyNames: { MXN: 'Pesos Mexicanos', USD: 'Dólares estadounidenses', EUR: 'Euros' },

    fmtDate: (d) => `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`,
    fmtDateShort: (d) => `${d.getDate()} ${monthsShort[d.getMonth()]} ${d.getFullYear()}`,

    t: {
      pageTitle: (project) => `Cotización · ${project} | Arqing`,
      loading: 'Preparando su cotización',
      skip: 'Ir al contenido',

      // Hero
      kicker: 'Cotización',
      kickerNo: (id) => `Nº ${id}`,
      forClient: 'Cotización para',
      project: 'Proyecto',
      metaDeliver: 'Entregables',
      metaTime: 'Tiempo de entrega',
      metaInvest: 'Inversión',
      metaWithTax: 'Total',
      validUntil: (date) => `Válida hasta el ${date}`,
      daysLeft: (n) => (n === 1 ? 'queda 1 día' : `quedan ${n} días`),
      lastDay: 'último día',
      scroll: 'Desplácese',

      // Entregables
      scopeTitle: 'Lo que recibirá',
      scopeIntro: 'El alcance de esta cotización, de forma clara y sin letra pequeña.',
      stills: (n) => (n === 1 ? 'Render fijo' : 'Renders fijos'),
      anim: 'Animación',
      tours: (n) => (n === 1 ? 'Recorrido 360°' : 'Recorridos 360°'),
      minutesUnit: 'min',
      specResolution: 'Resolución',
      specFormat: 'Formato',
      includesTitle: 'Incluye',
      joiner: ' y ',
      moduleText: (m) => {
        if (m.type === 'stills') return `${m.value} ${m.label.toLowerCase()}`;
        if (m.type === 'anim') return `${m.display} min de ${m.label.toLowerCase()}`;
        return `${m.value} ${m.label.toLowerCase()}`;
      },

      // Proceso y tiempos
      processTitle: 'Cómo trabajaremos',
      processIntro: 'Un proceso transparente, con revisiones en cada etapa.',
      timeTitle: 'Tiempo de entrega',
      weeks: (min, max) => (min === max ? (min === 1 ? '1 semana' : `${min} semanas`) : `${min} a ${max} semanas`),
      weeksUnit: (min, max) => ((max || min) === 1 ? 'semana' : 'semanas'),
      week: 'Sem.',

      // Portafolio
      workTitle: 'Nuestro trabajo',
      workIntro: 'Una muestra de los proyectos que hemos visualizado.',
      workCta: { stills: 'Ver renders', anim: 'Ver animaciones' },
      tabStills: 'Renders',
      tabAnim: 'Animaciones',
      tabsLabel: 'Tipo de trabajo',
      play: 'Reproducir',
      close: 'Cerrar',
      workAlt: 'Render arquitectónico de Arqing',

      // Inversión
      investTitle: 'Inversión',
      investIntro: 'Desglose del monto y calendario de pagos.',
      concept: 'Concepto',
      discount: (pct) => (pct ? `Descuento (${pct}%)` : 'Descuento'),
      subtotal: 'Subtotal',
      vat: (pct) => `IVA (${pct}%)`,
      vatIncluded: (pct) => `IVA incluido (${pct}%)`,
      noVat: 'Sin IVA',
      totalTax: (mode, pct) => (mode === 'sin' ? 'Sin IVA' : (mode === 'incluido' ? `IVA (${pct}%) incluido en el total` : `Incluye IVA (${pct}%)`)),
      total: 'Total',
      scheduleTitle: 'Calendario de pagos',
      acceptCta: 'Aceptar cotización',
      acceptShort: 'Aceptar',
      pdfCta: 'Descargar PDF',
      notes: 'Notas',

      // Condiciones
      termsTitle: 'Condiciones comerciales',
      termsIntro: 'Lo que rige esta cotización.',
      excludesTitle: 'No incluye',

      // Cierre
      signoff: 'Atentamente',
      signer: 'Arq. Mary Carmen Simonín',
      company: 'Arqing Renders',
      whatsapp: 'Escribir por WhatsApp',
      email: 'Enviar correo',
      questions: '¿Alguna duda?',
      rights: 'Todos los derechos reservados.',
      confidential: 'Documento confidencial dirigido al destinatario.',

      // Mensajes de WhatsApp
      waAccept: (p) => `Hola, deseamos aceptar la cotización${p.id ? ` Nº ${p.id}` : ''} del proyecto ${p.project} (${p.client}). ¿Nos pueden compartir la información de los métodos de pago para el anticipo?`,
      waQuestion: (p) => `Hola, tengo una duda sobre la cotización${p.id ? ` Nº ${p.id}` : ''} del proyecto ${p.project} (${p.client}).`,

      // Estados
      expiredTitle: 'Esta cotización ha expirado',
      expiredText: 'Esta cotización ya no se encuentra vigente. Contáctenos y con gusto le preparamos una versión actualizada.',
      notFoundTitle: 'Cotización no encontrada',
      notFoundText: 'El enlace no es válido o los datos están incompletos. Verifique que el enlace esté completo o contáctenos.',
      errorTitle: 'No pudimos cargar la cotización',
      errorText: 'No fue posible conectar con el servidor. Revise su conexión e intente de nuevo en unos momentos.',
      retry: 'Reintentar',
      backHome: 'Ir al inicio',
      contactUs: 'Contactar por WhatsApp',
      waExpired: 'Hola, quisiera solicitar la actualización de una cotización que ya expiró.'
    }
  };
})();
