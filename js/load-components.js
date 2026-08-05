document.addEventListener("DOMContentLoaded", () => {
  const isEsPath = window.location.pathname.startsWith("/es/") || window.location.pathname === "/es";
  const includes = [
    { id: "header", url: isEsPath ? "/components/header-es.html" : "/components/header.html", event: "header-loaded" },
    { id: "footer", url: isEsPath ? "/components/footer-es.html" : "/components/footer.html", event: "footer-loaded" }
  ];

  const hydrateLanguageLinks = (root) => {
    const enHref = root.dataset.langEn;
    const esHref = root.dataset.langEs;

    if (!enHref && !esHref) return;

    root.querySelectorAll('[data-lang-link="en"]').forEach(link => {
      if (enHref) link.href = enHref;
    });

    root.querySelectorAll('[data-lang-link="es"]').forEach(link => {
      if (esHref) link.href = esHref;
    });
  };

  includes.forEach(({ id, url, event }) => {
    const el = document.getElementById(id);
    if (el) {
      fetch(url)
        .then(res => res.text())
        .then(html => {
          el.innerHTML = html;
          if (id === "header") {
            hydrateLanguageLinks(el);
          }
          document.dispatchEvent(new Event(event));
        });
    }
  });
});

document.addEventListener("click", (event) => {
  const link = event.target.closest('a[data-return-all-work="true"]');
  if (!link) return;

  try {
    sessionStorage.setItem('arq-work-return-all-work', '1');
  } catch (error) {
    // Ignore storage failures and fall back to normal navigation.
  }
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(err => console.error('SW registration failed', err));
}


document.addEventListener("header-loaded", () => {
  // Highlight active link
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll(".nav-link");

  navLinks.forEach(link => {
    const linkPath = link.getAttribute("href");

    if ((linkPath === "/" && currentPath === "/") || (linkPath === "/es/" && currentPath === "/es/")) {
      link.classList.add("active");
    } else if (linkPath !== "/" && linkPath !== "/es/" && currentPath.startsWith(linkPath)) {
      link.classList.add("active");
    }
  });

  // Highlight active language
  const isEs = currentPath.startsWith("/es/") || currentPath === "/es";
  const langLinks = document.querySelectorAll(".lang-link");
  
  langLinks.forEach(link => {
    const lang = link.getAttribute("data-lang-link");
    if ((lang === "es" && isEs) || (lang === "en" && !isEs)) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    } else {
      link.classList.remove("is-active");
      link.removeAttribute("aria-current");
    }
  });
});

document.addEventListener("footer-loaded", async () => {
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  const scrollToTopBtn = document.querySelector(".scroll-top-btn");
  if (scrollToTopBtn && scrollToTopBtn.dataset.bound !== "true") {
    scrollToTopBtn.dataset.bound = "true";
    scrollToTopBtn.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  }

  try {
    const { default: FooterConnectCTAEngine } = await import("/js/engines/FooterConnectCTAEngine.js");
    new FooterConnectCTAEngine();
  } catch (error) {
    console.error("Footer CTA engine failed to load:", error);
  }
});

/* Global Media Protection (Right-click & Drag Prevention) */
const mediaProtectScript = document.createElement('script');
mediaProtectScript.src = '/js/engines/media-protect.js';
mediaProtectScript.defer = true;
document.head.appendChild(mediaProtectScript);

