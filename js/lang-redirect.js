/**
 * Client-side language detection & redirect.
 *
 * Spanish-language browsers landing on an English page from outside the site
 * are redirected to the Spanish equivalent declared in that page's
 * <link rel="alternate" hreflang="es"> tag.
 *
 * Rules:
 *  - EN -> ES only. Never redirects /es/ pages, so search engine renderers
 *    (which typically run with en-US) can never bounce the Spanish site
 *    out of the index.
 *  - An explicit choice made with the EN/ES header switcher is stored in
 *    localStorage and always wins over browser detection.
 *  - Only fires on external entries (direct visits, search, shared links).
 *    Internal navigation is never intercepted.
 *  - Pages without a real Spanish equivalent (no hreflang="es") are left alone.
 *
 * Loaded synchronously in <head>, before the stylesheets, so the redirect
 * happens before anything is painted.
 */
(function () {
  var STORAGE_KEY = "arq-lang";

  // Remember explicit choices made via the EN/ES header switcher.
  // Delegated on document because the header is injected after load.
  document.addEventListener("click", function (event) {
    if (!event.target || !event.target.closest) return;
    var link = event.target.closest("[data-lang-link]");
    if (!link) return;
    try {
      localStorage.setItem(STORAGE_KEY, link.getAttribute("data-lang-link"));
    } catch (e) { /* storage unavailable */ }
  }, true);

  try {
    var path = window.location.pathname;
    var isSpanishPage = path === "/es" || path.indexOf("/es/") === 0;
    if (isSpanishPage) return;

    // Never redirect crawlers / link-preview fetchers that execute JS.
    if (/bot|crawl|spider|slurp|bingpreview|duckduck|baidu|yandex|facebookexternalhit|embedly|pinterest|slackbot|whatsapp|telegram|discord|lighthouse|headless/i.test(navigator.userAgent)) {
      return;
    }

    var stored = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch (e) { /* storage unavailable */ }

    // The visitor explicitly chose English at some point: respect it.
    if (stored === "en") return;

    // No explicit ES choice either: fall back to the browser language.
    if (stored !== "es") {
      var lang = (navigator.languages && navigator.languages[0]) || navigator.language || "";
      if (String(lang).toLowerCase().indexOf("es") !== 0) return;
    }

    // Only redirect external entries; internal clicks are intentional.
    if (document.referrer) {
      var ref = document.createElement("a");
      ref.href = document.referrer;
      if (ref.host === window.location.host) return;
    }

    var alt = document.querySelector('link[rel="alternate"][hreflang="es"]');
    if (!alt || !alt.href) return;

    var target = new URL(alt.href, window.location.href);
    if (target.pathname === path) return;

    window.location.replace(target.pathname + window.location.search + window.location.hash);
  } catch (e) { /* never break the page over a redirect */ }
})();
