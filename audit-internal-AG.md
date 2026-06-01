# Auditoría Interna SEO Técnico + GEO/AI Visibility
## Arqing Renders — arqingrenders.com
**Fecha:** 2026-05-25  
**Herramienta:** Claude Code (acceso completo al código fuente)  
**Scope:** Solo lo verificable desde el repositorio. Complementa la auditoría externa.

---

## 1. Resumen Ejecutivo

| # | Hallazgo | Severidad | Impacto |
|---|---|---|---|
| 1 | Schema/JSON-LD ausente en 11 de 13 páginas indexables | 🔴 Crítico | GEO, rich results, señal de autoridad para crawlers de AI |
| 2 | H1 duplicado confirmado en código: "Arqing Arqing stories beyond pixels" | 🔴 Crítico | Confusión de señal para Google; H1 no comunica servicio ni geografía |
| 3 | Cero redirects en el repo — legacy URLs no manejadas aquí | 🔴 Crítico | 200 falsas en /about, /portfolio, /ny, /contact — señal de contenido duplicado |
| 4 | Sin página 404 personalizada en el repo | 🟠 Alto | UX y crawl budget desperdiciados en URLs inexistentes |
| 5 | Google Fonts via `@import` en CSS — render-blocking, sin self-host | 🟠 Alto | LCP penalizado, 3rd-party DNS en ruta crítica de render |
| 6 | GSAP sin `defer`/`async` en todas las páginas — render-blocking | 🟠 Alto | Bloquea parseo del HTML antes de renderizar contenido visible |
| 7 | `manifest.webmanifest` no está vinculado desde ningún HTML | 🟡 Medio | PWA inoperable; señal de branding débil para buscadores |
| 8 | Nombres de archivo con espacios (5 imágenes en /work/) referenciados sin encode | 🟡 Medio | Riesgo en CDN/compartir URLs; técnicamente incorrecto |
| 9 | Alt texto de Mario inconsistente con el H2 ("Cámaras" vs "Crivelli") | 🟡 Medio | Error factual visible para screen readers y crawlers |
| 10 | Sin señal "New York" en title/description/H1 de ninguna página principal EN | 🟠 Alto | Pérdida crítica de relevancia geográfica para búsquedas locales NYC |

---

## 2. Hallazgos Críticos 🔴

### 🔴 C-1 — Schema/JSON-LD: 11 páginas indexables sin ningún schema

**Verificado en código:** Solo dos páginas tienen `<script type="application/ld+json">`:
- `/work/animations/` — `ItemList` + `VideoObject` × 7 ✓
- `/es/proyectos/animaciones/` — mismo schema en ES ✓

**Cero schema en:**
- `/` (home EN)
- `/es/` (home ES)
- `/work/` (portfolio padre)
- `/work/stills/`
- `/work/360/`
- `/studio/team/`
- `/connect/`
- Todos los equivalentes ES indexados

**Ausencias específicas de alto impacto:**
- Sin `Organization` o `ProfessionalService` con `areaServed: "New York City"` en ninguna página
- Sin `Person` schema para ningún founder (Mary Simonín, Mario Crivelli)
- Sin `Review` o `AggregateRating` schema sobre los 4 testimonios del home
- Sin `Service` schema en stills/animations/360
- Sin `ImageGallery` o `PhotographAction` en las galerías

**Consecuencia para GEO/AI:** Los LLMs y motores de AI Overviews no tienen datos estructurados para identificar con certeza qué es Arqing, qué hace, dónde está, quiénes son sus founders, ni a qué mercado sirve. Todo depende del texto plano, que además es thin en las páginas de servicio.

---

### 🔴 C-2 — H1 duplicado: "Arqing Arqing stories beyond pixels" — causa confirmada en código

**Causa raíz identificada en el código HTML del home:**

```html
<h1 id="bigTitleCinematic" data-primary-text="Arqing" data-morph-text="Stories Beyond Pixels">
  <span class="big-title-desktop-text">Arqing</span>
  <span class="big-title-mobile-static" aria-hidden="true">
    <span class="btm-primary">Arqing</span>
    <span class="btm-secondary">stories beyond pixels</span>
  </span>
</h1>
```

**Por qué Google lee "Arqing Arqing stories beyond pixels":** El atributo `aria-hidden="true"` en el span mobile oculta el contenido del árbol de accesibilidad (lectores de pantalla) pero NO del contenido de texto que Google extrae del DOM. Google concatena todo el text content del H1 sin importar `aria-hidden`.

**Lo que hace `BigTitleCinematicEngine.js` (confirmado en código):** La línea `this.title.textContent = ''` borra el H1 y lo reconstruye dinámicamente. Cuando Google renderiza con JS el resultado es la animación morphing ("Arqing" → "Stories Beyond Pixels"). Sin JS, el H1 estático es el problema. Google puede capturar ambos estados.

**Doble problema:** El H1 no contiene ninguna señal semántica sobre el servicio ("architectural visualization", "CGI", "renders") ni sobre la geografía ("New York City"). Es puro branding.

---

### 🔴 C-3 — Redirects de URLs legacy: NO manejados en este repositorio

**Verificado:** No existe ningún archivo de configuración de redirects en el repo:
- Sin `_redirects` (Netlify)
- Sin `vercel.json`
- Sin `netlify.toml`
- Sin `.htaccess`
- Sin `wrangler.toml` (Cloudflare Workers/Pages)
- Sin `cloudflare.json`

**Implicación:** Los 200s en `/about`, `/portfolio`, `/ny`, `/contact` (confirmados externamente) deben estar siendo manejados a nivel de servidor/hosting/CDN (probablemente Cloudflare Pages o equivalente). Esto significa que los 301s que se necesitan deben configurarse en la infraestructura, no en el código. **No se puede implementar desde este repo sin añadir un archivo de configuración de hosting.**

---

## 3. Hallazgos Altos 🟠

### 🟠 A-1 — Cero señal geográfica "New York" en titles, descriptions y H1 de páginas principales

**Verificado página por página:**

| Página | Title | Description | H1 | "New York" |
|---|---|---|---|---|
| Home EN | "Arqing \| High-End Architectural Visualization Studio" | "...in the United States." | "Arqing" | ❌ |
| Work | "Work \| Arqing" | "...premium real estate and design presentations." | "work" | ❌ |
| Stills | "Architectural Stills \| Arqing" | "...real estate developments, residential towers, and commercial architecture." | "Stills" | ❌ |
| Animations | "Animations \| Arqing" | "Blending cinematic visuals..." | "animations" | ❌ |
| 360 | "360° Immersive Experiences \| Arqing" | "Experience an artistic journey..." | "360°" | ❌ |
| Team | "Team \| Arqing" | "Meet the founders behind Arqing..." | "team" | ❌ |
| Connect | "Connect \| Arqing Renders" | "...Reach us via WhatsApp or email..." | "connect" | ❌ |

"New York" solo aparece como `card-location` en un testimonio del home y en proyectos del 360 y stills. El title y la meta description del home dicen "United States" — correcto geográficamente pero insuficiente para competir por búsquedas locales NYC.

---

### 🟠 A-2 — Google Fonts vía `@import` en CSS: render-blocking y sin self-host

**Confirmado en `/css/base.css`:**
```css
@import url('https://fonts.googleapis.com/css2?family=Josefin+Sans:...&family=Permanent+Marker&family=Poppins:...&family=Raleway:...&display=swap');
```

**Problemas:**
- `@import` en CSS es síncrono — bloquea el render hasta resolver la DNS + TCP + descarga
- 4 familias de fuentes en un solo request, con rangos de peso amplios
- Sin `<link rel="preconnect" href="https://fonts.googleapis.com">` ni `fonts.gstatic.com` en ningún HTML
- No self-hosted — dependencia de tercero en ruta crítica
- Sin `font-display: swap` aplicado en los `@font-face` propios (el parámetro `&display=swap` del URL funciona solo para el lado de Google Fonts, no para instancias locales)

**Impacto:** LCP penalizado por FOUT + tiempo extra de DNS. En una web que ya depende de GSAP sin defer, cada milisegundo cuenta.

---

### 🟠 A-3 — GSAP cargado sin `defer` ni `async` en todas las páginas

**Verificado en home, work, stills, animations, 360, connect, team:**
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
```

Sin `defer` ni `async` → el parser HTML se detiene hasta que los scripts descarguen y ejecuten. GSAP (≈67KB min+gzip) está en la ruta crítica de render de todas las páginas.

---

### 🟠 A-4 — OG image única para todo el sitio

**Confirmado:** `og_image_qeur.jpg` se repite en el `<meta property="og:image">` de todas las páginas sin excepción. No hay imágenes OG específicas por sección (stills, animations, 360, team, connect).

**Impacto:** Comparte de /work/stills/ en LinkedIn/Slack/WhatsApp muestra la misma imagen que el home. Oportunidad de CTR perdida.

---

### 🟠 A-5 — Sin señal "New York" en title/H1 — impacto en ranking local

*Ver C-2 y A-1 arriba. Este hallazgo se registra también como Alto porque impacta directamente las búsquedas de mayor intención commercial del mercado objetivo (NYC developers, architects, real estate).*

---

## 4. Hallazgos Medios 🟡

### 🟡 M-1 — `manifest.webmanifest` existe pero NO está vinculado desde ningún HTML

**Verificado:** El archivo `/manifest.webmanifest` existe con:
```json
{
  "name": "Arqing",
  "short_name": "Arqing",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0b0b0b",
  "theme_color": "#0b0b0b",
  "icons": []
}
```
Pero ningún HTML tiene `<link rel="manifest" href="/manifest.webmanifest">`. El array `icons: []` está vacío — sin iconos PWA definidos.

**Consecuencia:** PWA completamente no funcional. Buscadores no leen el manifest. `theme-color` no se aplica en Chrome Android.

---

### 🟡 M-2 — 5 archivos de imagen con espacios en nombre, referenciados sin URL-encode

**Lista exacta en `/assets/img/work/`:**
1. `34-49 Steinway St-Aerial.avif`
2. `34-49 Steinway St.avif`
3. `83 Wythe.avif`
4. `Caesars Palace-Aerial.avif`
5. `Caesars Palace.avif`

**Referenciados en HTML sin encode:**
```html
src="/assets/img/work/83 Wythe.avif"
src="/assets/img/work/Caesars Palace.avif"
```

Los navegadores toleran los espacios, pero CDNs, preloaders, y algunos parsers de sitemaps no los manejan correctamente. El estándar requiere `%20`.

---

### 🟡 M-3 — Alt text de Mario Crivelli contradice el H2 visible

**En `/studio/team/index.html` (y su equivalente ES):**
```html
<h2 class="team-name">Mario Crivelli</h2>
<img ... alt="Mario C&#225;maras, co-founder of Arqing Renders">
```
`&#225;` = `á` → alt dice "Mario Cámaras", H2 dice "Mario Crivelli". Error factual. Google y screen readers usan el alt para identificar al sujeto de la imagen — si algún día se añade Person schema, el nombre debe coincidir.

---

### 🟡 M-4 — Inconsistencia de nombre de marca en titles/OG

| Página | Título HTML | OG:title |
|---|---|---|
| Home | "Arqing \| High-End..." | "Arqing \| High-End..." |
| Work | "Work \| Arqing" | "Architectural Visualization Portfolio \| Arqing" |
| Team | "Team \| Arqing" | "Team \| Arqing Renders" |
| Connect | "Connect \| Arqing Renders" | "Connect \| Arqing Renders" |
| Contacto ES | "Contacto \| Arqing Renders" | "Contacto \| Arqing Renders" |

La marca oficial debe ser uniforme. Algunas páginas dicen "Arqing", otras "Arqing Renders". Inconsistencia de branding para buscadores y para AI summaries.

---

### 🟡 M-5 — Sitemap sin `lastmod`, `priority`, ni `changefreq`

**Contenido actual de `sitemap.xml`:** 14 URLs con solo `<loc>`. Sin:
- `<lastmod>` — Google lo usa para priorizar crawls
- `<priority>` — señal de importancia relativa entre páginas
- `<changefreq>` — hint de frecuencia de actualización
- Anotaciones `<xhtml:link>` para hreflang pairs (opcional pero recomendado para sitios bilingües)

---

### 🟡 M-6 — Robots.txt usa sintaxis no-estándar con `$` anchor

**En robots.txt:**
```
Disallow: /*.json$
Disallow: /*.md$
```

El `$` anchor (fin de string) es soportado por Google pero NO es parte del estándar RFC 9309. Bing, otros crawlers, y la mayoría de herramientas de auditoría lo ignoran. El archivo `audit-internal-AG.md` que genera esta auditoría quedará bloqueado si se añade a la raíz — confirmar si esa es la intención.

---

### 🟡 M-7 — Testimonios sin Review schema — oportunidad de rich result perdida

Los 4 testimonios (Archimaera, Brookline Real Estate, Solomon S., PDD Atlanta) están hardcodeados en HTML en home EN y ES, con estrellas (★★★★★) y blockquote. Sin `Review` ni `AggregateRating` schema, Google no puede generar rich stars en SERP.

---

### 🟡 M-8 — Stills/Animations: páginas thin sin texto descriptivo de servicio

**`/work/stills/`:** El contenido visible es prácticamente solo la galería de imágenes. El único texto semántico es:
- H1: "Stills"
- H2: "Visuals that Drive Decisions."
- P: "We go beyond rendering to build the visual foundation of your development."
- Subtitle de sección: "Gallery"

**`/work/animations/`:** Tiene más descripción gracias al schema de videos, pero el cuerpo de texto es igualmente thin.

**Consecuencia:** Estas son las páginas de servicio con mayor intención comercial. Un crawler de AI que evalúe qué ofrece Arqing Renders en NYC encontrará poca sustancia textual en las páginas de conversión.

---

## 5. Hallazgos Menores 🟢

### 🟢 m-1 — Favicon set incompleto

**Existe:**
- `favicon-32.png`, `Favicon_16.png` (32px y 16px en HTML)
- `Favicon_apple-touch-icon.png` (apple-touch-icon)

**Falta:**
- `<link rel="manifest">` (ver M-1)
- Ningún HTML tiene `<meta name="theme-color">` explícito
- No hay SVG favicon (opcional pero moderno)
- `manifest.webmanifest` tiene `icons: []` vacío — sin PWA icons

---

### 🟢 m-2 — Collage del home: 4 imágenes con el mismo alt text

```html
alt="View Arqing work portfolio"  <!-- × 4 imágenes distintas -->
```
Oportunidad de describir lo que se ve en cada imagen (proyecto, tipo de render, borough).

---

### 🟢 m-3 — `<link rel="preconnect">` para Google Fonts ausente

Ningún HTML incluye:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```
Pequeño win de performance que reduciría el tiempo hasta la primera solicitud de fuentes.

---

### 🟢 m-4 — `<meta name="author">` dice "Arqing" en todas las páginas

Consistente, pero minor. No tiene impacto SEO real. Mencionado por completitud.

---

### 🟢 m-5 — Service Worker se auto-destruye: diseño MVP intencional

`/sw.js` está diseñado para registrarse, limpiar todos los cachés, y luego desregistrarse. Esto es correcto para un MVP en desarrollo activo. No requiere acción ahora — reemplazar cuando el site se estabilice con una estrategia de cache versionada.

---

### 🟢 m-6 — Mario Crivelli: LinkedIn disponible pero sin sameAs en ninguna parte

El brief indica que Mario tiene LinkedIn. Si se añade `Person` schema en el futuro, incluir `"sameAs": "https://www.linkedin.com/in/mario-crivelli-..."`. No aplicable hasta que se implemente schema.

---

## 6. Diagnóstico Técnico Interno

### 6.1 Sitemap.xml — Estado

```
✅ Existe en /sitemap.xml
✅ Referenciado en robots.txt
✅ Incluye URLs EN y ES (14 en total)
✅ Excluye /studio/ny/ correctamente
✅ Excluye /studio/press/ correctamente
✅ Excluye /es/clientes/ correctamente
❌ Sin lastmod en ninguna URL
❌ Sin priority en ninguna URL
❌ Sin changefreq en ninguna URL
❌ Sin xhtml:link para hreflang pairs
⚠️  No incluye las 2 selected project pages — correctas con noindex activo
```

**Páginas indexables presentes en sitemap:** 14/14 URLs indexadas ✓

---

### 6.2 Robots.txt — Estado

```
✅ User-agent: * Allow: / — correcto
✅ Bloquea /clientes/ y /es/clientes/ (páginas privadas)
✅ Bloquea /components/ (fragments de HTML que no deben indexarse)
✅ Bloquea /.vscode/
✅ Referencia a sitemap incluida
⚠️  /*.json$ y /*.md$ usan $ anchor — no estándar (funciona en Google, no en todos)
⚠️  El archivo audit-internal-AG.md quedará bloqueado si se sirve desde la raíz
```

---

### 6.3 Redirects — Estado

```
❌ NINGÚN archivo de redirect en el repositorio
❌ Sin _redirects (Netlify)
❌ Sin vercel.json
❌ Sin netlify.toml
❌ Sin .htaccess
❌ Sin wrangler.toml
⚠️  Los 200s en URLs legacy DEBEN manejarse a nivel de hosting/CDN
⚠️  No es posible implementar 301s desde este repo sin añadir config de hosting
```

---

### 6.4 Schema / JSON-LD — Estado

| Página | Schema | Tipo |
|---|---|---|
| /work/animations/ | ✅ | ItemList + VideoObject × 7 |
| /es/proyectos/animaciones/ | ✅ | ItemList + VideoObject × 7 (mismo) |
| / (home EN) | ❌ | — |
| /es/ (home ES) | ❌ | — |
| /work/ | ❌ | — |
| /work/stills/ | ❌ | — |
| /work/360/ | ❌ | — |
| /studio/team/ | ❌ | — |
| /connect/ | ❌ | — |
| /es/proyectos/ | ❌ | — |
| /es/proyectos/renders/ | ❌ | — |
| /es/proyectos/360/ | ❌ | — |
| /es/estudio/nosotros/ | ❌ | — |
| /es/contacto/ | ❌ | — |

**Confirmado:** Cero injection de schema via JS (búsqueda global en todos los .js files). El único schema está hardcodeado en los dos archivos de animations.

---

### 6.5 Hreflang — Estado

```
✅ Presente en todas las páginas indexables (inline en cada <head>)
✅ Implementación correcta: cada página se auto-referencia + señala su par
✅ x-default apunta a la versión EN en todas las páginas
✅ Locale es-MX consistente en todas las páginas ES
❌ NO implementado en sistema modular — cada página lo hardcodea individualmente
❌ Un cambio de URL requiere editar 14+ archivos
⚠️  es-MX envía señal de México cuando la audiencia objetivo es NY
   (justificado dado que /es/ es secundario y México es el mercado ES real)
```

---

### 6.6 Internacionalización — Estado

**Arquitectura del switch EN/ES:**
- El switch se implementa via `load-components.js` detectando si la URL empieza con `/es/`
- Carga `header-es.html` o `header.html` según corresponda
- Los atributos `data-lang-en` y `data-lang-es` en el `<div id="header">` de cada página definen las URLs de destino para el switch de idioma
- Header y footer son completamente independientes por idioma ✓

**Paridad de contenido EN/ES:**

| Sección | Paridad |
|---|---|
| Home hero + collab | ✅ Completa (textos traducidos, mismas imágenes) |
| Testimonios | ✅ Completa (mismos 4 testimonios traducidos) |
| Work/Proyectos | ✅ Completa (mismas imágenes, textos traducidos) |
| Stills/Renders | ✅ Completa (incluyendo sección standby de proyectos seleccionados) |
| Animations/Animaciones | ✅ Completa (mismo schema, mismo player) |
| 360 | ✅ Completa |
| Team/Nosotros | ✅ Completa |
| Connect/Contacto | ✅ Completa |
| Footer | ✅ Completa |

**Páginas solo en ES sin equivalente EN indexado:**
- `/es/clientes/paseo-central/vista-lago/` — noindex, privada ✓

**Textos hardcodeados que no varían por idioma:**
- Nombres de proyectos (83 Wythe, Caesars Palace, etc.) — correcto, son nombres propios
- Nombres de clientes (Archimaera, Brookline Real Estate, etc.) — correcto

---

### 6.7 404 Handling — Estado

```
❌ Sin archivo 404.html en el repositorio
❌ Sin configuración de error page en archivos de hosting
⚠️  El manejo de 404s depende completamente del proveedor de hosting
⚠️  No se puede verificar qué ocurre en URLs inexistentes desde el código
```

---

### 6.8 Asset Hygiene — Estado

**Formatos de imagen:**
- Formato principal: `.avif` (moderno, correcto) ✓
- Team portraits: `.webp` ✓
- Logos: `.webp` ✓
- OG image: `.jpg` ✓
- Work diagrams (1-edges, 2-wireframe, 3-rgb): `.png` — justificado para diagramas técnicos

**Dimensiones declaradas:** Todas las imágenes tienen `width` y `height` declarados en HTML ✓

**Lazy loading:** Correcto en todas las imágenes excepto LCP (hero poster, team portraits) que tienen `fetchpriority="high"` ✓

**Videos:**
- Hero: `.webm` + `.mp4` fallback ✓, `poster` avif ✓, preload via `<link rel="preload">` ✓
- `preload="none"` en el elemento `<video>` ✓ (bueno para performance — el poster se preloada externamente)
- Sin versión móvil del hero video — mismo asset para todos los viewports

**Filenames con espacios (5 archivos problemáticos):**
- Referenciados en HTML sin encode (e.g., `src="/assets/img/work/83 Wythe.avif"`)
- El JS data file también los referencia sin encode: `src: '/assets/img/work/83 Wythe.avif'`

---

## 7. Mapa Real del Proyecto

### 7.1 Árbol completo de páginas reales

```
/ (EN) ────────────────────── index.html [lang="en"] [index, follow] ✅ en sitemap
/es/ ──────────────────────── es/index.html [lang="es-MX"] [index, follow] ✅ en sitemap

/work/ ────────────────────── work/index.html [lang="en"] [index, follow] ✅ en sitemap
/work/stills/ ─────────────── work/stills/index.html [lang="en"] [index, follow] ✅ en sitemap
/work/animations/ ─────────── work/animations/index.html [lang="en"] [index, follow] ✅ en sitemap
/work/360/ ────────────────── work/360/index.html [lang="en"] [index, follow] ✅ en sitemap

/work/stills/135-kent/ ──────  work/stills/135-kent/index.html [noindex, nofollow] ❌ no en sitemap
/work/stills/soho-lofts/ ────  work/stills/soho-lofts/index.html [noindex, nofollow] ❌ no en sitemap

/studio/team/ ─────────────── studio/team/index.html [lang="en"] [index, follow] ✅ en sitemap
/studio/ny/ ───────────────── studio/ny/index.html [lang="en"] [noindex, nofollow] ❌ no en sitemap (intencional)
/studio/press/ ────────────── studio/press/index.html [lang="en"] [noindex, nofollow] ❌ no en sitemap

/connect/ ─────────────────── connect/index.html [lang="en"] [index, follow] ✅ en sitemap

/es/proyectos/ ────────────── es/proyectos/index.html [lang="es-MX"] [index, follow] ✅ en sitemap
/es/proyectos/renders/ ─────── es/proyectos/renders/index.html [lang="es-MX"] [index, follow] ✅ en sitemap
/es/proyectos/animaciones/ ──  es/proyectos/animaciones/index.html [lang="es-MX"] [index, follow] ✅ en sitemap
/es/proyectos/360/ ─────────── es/proyectos/360/index.html [lang="es-MX"] [index, follow] ✅ en sitemap

/es/estudio/nosotros/ ─────── es/estudio/nosotros/index.html [lang="es-MX"] [index, follow] ✅ en sitemap
/es/contacto/ ─────────────── es/contacto/index.html [lang="es-MX"] [index, follow] ✅ en sitemap

/es/clientes/paseo-central/vista-lago/ ── [noindex, nofollow] ❌ no en sitemap, robots bloquea /es/clientes/
```

**Componentes (no páginas):**
- `/components/header.html` — robots bloquea ✓
- `/components/header-es.html` — robots bloquea ✓
- `/components/footer.html` — robots bloquea ✓
- `/components/footer-es.html` — robots bloquea ✓

---

### 7.2 Páginas huérfanas

**Definición: páginas accesibles en producción pero sin links entrantes desde la navegación principal.**

| Página | Estado de acceso | Motivo de exclusión |
|---|---|---|
| /studio/ny/ | Accesible directamente | noindex + nav comentada (MVP standby) |
| /studio/press/ | Accesible, vacía | noindex + nav comentada (MVP standby) |
| /work/stills/135-kent/ | Accesible directamente | noindex + link en `<template>` (standby) |
| /work/stills/soho-lofts/ | Accesible directamente | noindex + link en `<template>` (standby) |
| /es/clientes/paseo-central/vista-lago/ | Accesible, privada | noindex + robots disallow |

**Conclusión:** No hay páginas verdaderamente huérfanas con riesgo SEO. Las páginas en standby están correctamente protegidas con noindex. Las páginas de cliente tienen doble protección (noindex + robots.txt).

---

### 7.3 Paridad EN/ES

| Sección EN | Equivalente ES | Paridad |
|---|---|---|
| / | /es/ | ✅ Completa |
| /work/ | /es/proyectos/ | ✅ Completa |
| /work/stills/ | /es/proyectos/renders/ | ✅ Completa |
| /work/animations/ | /es/proyectos/animaciones/ | ✅ Completa |
| /work/360/ | /es/proyectos/360/ | ✅ Completa |
| /studio/team/ | /es/estudio/nosotros/ | ✅ Completa |
| /connect/ | /es/contacto/ | ✅ Completa |
| /studio/ny/ | (sin equivalente ES) | ⚠️ Intencional — página en dev |
| /studio/press/ | (sin equivalente ES) | ⚠️ Standby |

---

## 8. Estado de /studio/ny/

### 8.1 Qué hay

- **Página funcional:** HTML completo, estilos propios (`ny.css`), JS propio (`ny.js`)
- **H1:** "i ♡ ny" con animación cipher
- **H2:** "Bringing New York City to life... / Visualizing its energy and style"
- **Mapa Leaflet:** 34 coordenadas de proyectos NYC reales implementadas en JS inline
  - Coordenadas abarcan: Brooklyn, Queens, Manhattan, Bronx, Staten Island (amplia cobertura NYC)
  - Funciona con MarkerCluster para agrupar puntos cercanos
- **Iconos del mapa:** Cargados desde CDN de Webflow (`cdn.prod.website-files.com`) — dependencia externa
- **Descripción:** "Here you can see some of the places where we've completed projects in New York City"

### 8.2 Qué falta para ser publicable

- [ ] `data-lang-en`/`data-lang-es` en el `<div id="header">` (actualmente sin atributos → switch de idioma no funciona)
- [ ] Hreflang (actualmente sin ninguno)
- [ ] Equivalente ES (o decisión de que no habrá)
- [ ] OG tags completas (actualmente sin og:image, og:description, og:title)
- [ ] Reemplazar icon desde Webflow CDN por asset local
- [ ] Texto de cuerpo más sustancioso: actualmente solo una frase descriptiva además del mapa
- [ ] Nombres de proyectos visibles (el mapa muestra puntos anónimos, sin nombres ni links)
- [ ] `noindex` deberá cambiar a `index, follow` cuando se publique
- [ ] Eliminar emoji del title ("I 🤍 New York | Arqing") — los emojis en titles son poco confiables en SERP
- [ ] Añadir al sitemap al publicar

### 8.3 Exposición actual

```
noindex: ✅ SÍ — Google no indexará
nofollow: ✅ SÍ — Google no seguirá links
En sitemap: ✅ NO
En navegación: ✅ NO (comentada en header.html y header-es.html y footer.html)
Accesible en URL directa: ⚠️ SÍ — cualquiera que sepa la URL puede verla
```

**Conclusión:** /studio/ny/ está correctamente protegida para su estado de desarrollo. El mapa es el único componente funcional. Falta contenido textual real para cuando se publique.

---

## 9. Mantenibilidad SEO

### 9.1 Estructura actual del `<head>`: no es modular

**El head es independiente en cada página.** El sistema de componentes (header/footer via `load-components.js`) solo cubre el nav y el footer. El `<head>` completo — title, meta description, canonical, hreflang, OG tags, CSS — está hardcodeado en cada HTML.

**Consecuencias prácticas:**
- Cambiar el hreflang de `es-MX` a `es` requiere editar 14+ archivos
- Añadir un tag global (p.ej. `<link rel="preconnect">` para Google Fonts) requiere editar todos los HTML
- Añadir schema global (`Organization`) requiere editar cada página individualmente
- Una URL que cambie de nombre requiere actualizar hreflang en ambas páginas del par

### 9.2 ¿Es factible añadir schema/hreflang globalmente?

**Schema global (Organization):** 
- Se puede añadir vía JS dinámico. Crear un script que inserte `<script type="application/ld+json">` en el DOM on load. Podría integrarse en `load-components.js` o en un script separado incluido en todos los HTMLs.
- **Esfuerzo:** Bajo si se hace via JS. Requiere tocar un solo archivo.

**Schema por página (Service, ImageGallery, etc.):**
- Requiere tocar cada HTML individualmente. Sin sistema de templates, no hay otra vía.
- **Esfuerzo:** Medio — 14 páginas, pero cada una es diferente.

**Hreflang global:**
- Actualmente está inline. No hay forma de centralizarlo sin un sistema de templates (SSG, build step) o via HTTP headers (Cloudflare Workers podría inyectarlos).
- **Recomendación:** Mantener inline hasta que se adopte un SSG o build pipeline.

**Preconnect y recursos globales:**
- Requiere editar todos los HTML. Sin abstracción, es trabajo manual.
- **Alternativa rápida:** Usar Cloudflare Transform Rules para inyectar headers Link: rel=preconnect.

### 9.3 Recomendación de arquitectura del head

**Opción A (sin cambiar el stack):** Mantener heads inline pero crear un "head checklist" por página como comentario en el HTML, y centralizar los cambios globales via JS (`load-components.js`). Bajo costo, alta fricción para escalar.

**Opción B (mínima inversión):** Adoptar un script de build mínimo (p.ej. un `node generate.js` que procesa templates HTML con includes) sin cambiar el stack de hosting. Permite tener un `head-template.html` con variables por página.

**Opción C (a futuro):** Migrar a un SSG (Astro, Eleventy, Next.js static). Máxima flexibilidad para SEO, schema, i18n. Mayor inversión.

---

## 10. Lo que la auditoría externa NO pudo ver y ahora confirmamos

| Hallazgo | Lo que no podía verificarse externamente | Confirmación interna |
|---|---|---|
| H1 "Arqing Arqing stories beyond pixels" | No claro si era CSS, JS o DOM duplicado | Confirmado: HTML inicial tiene dos spans con texto "Arqing" + el motor JS borra y reconstruye todo |
| JSON-LD ausente | No sabía si se inyectaba via JS post-render | Confirmado: CERO JSON-LD en JS. Solo en 2 archivos HTML hardcodeado |
| Hreflang ausente | Se detectó ausente externamente | Confirmado: SÍ existe en todos los HTMLs públicos — la auditoría externa tuvo un falso negativo |
| Redirects de legacy URLs | No visible externamente si estaba en código | Confirmado: NO hay redirect config en el repo — debe estar en hosting |
| /studio/ny/ "rota" | Externamente devuelve algo | Confirmado: Funcional, intencionalmente noindex, en desarrollo |
| Contenido de /es/clientes/ | Bloqueado externamente | Confirmado: Página privada de cliente (Paseo Central) noindex, correctamente protegida |
| Manifest no vinculado | No se puede ver si existe el .webmanifest | Confirmado: Existe pero sin `<link rel="manifest">` en ningún HTML |
| Fuentes render-blocking | Visible externamente vía Lighthouse | Confirmado en código: @import en CSS, sin preconnect en HTML |
| GSAP sin defer | Visible via DevTools | Confirmado en código: todos los `<script src="gsap...">` sin atributo defer/async |
| Arqing México leak | No verificable externamente | Confirmado: CERO referencias a arqing-mexico en todo el repo |
| Inconsistencia "Mario Cámaras" vs "Crivelli" | No verificable externamente | Confirmado: error real en alt text de la foto de Mario |

---

## 11. Riesgos y Supuestos

### 11.1 Qué sí pudimos verificar con acceso al código

- ✅ Todo el HTML de todas las páginas
- ✅ Todos los scripts JS (engines, load-components, etc.)
- ✅ Todos los CSS
- ✅ Sitemap.xml, robots.txt, manifest.webmanifest, sw.js
- ✅ Estructura de assets y nombres de archivos
- ✅ Configuración de componentes (header/footer)
- ✅ Presencia/ausencia de schema en todo el proyecto
- ✅ Implementación del sistema i18n
- ✅ Estado real de /studio/ny/ y páginas en standby
- ✅ Páginas privadas de cliente

### 11.2 Qué requiere navegar el sitio en producción (ya verificado externamente)

- Status codes reales de URLs legacy (/about, /portfolio, /ny, /contact)
- Comportamiento del JS en producción (animaciones, morphing del H1)
- Core Web Vitals reales (LCP, CLS, INP) bajo condiciones reales
- Comportamiento del Service Worker en producción
- Respuesta de la CDN/hosting ante URLs inválidas (404 real)

### 11.3 Qué requeriría herramientas externas para completar

- **Google Search Console:** Cobertura real de indexación, errores de crawl, rich results eligibility, sitelinking, CTR por query
- **Lighthouse en producción:** CWV medidos con red real, no localhost
- **Ahrefs / Semrush:** Backlinks, ranking actual de keywords, authority de dominio
- **Google Rich Results Test en URLs reales:** Validar la legibilidad del schema ya implementado en animations
- **Schema Markup Validator:** Para verificar que el JSON-LD de animations pasa validación
- **PageSpeed Insights:** Medición real de LCP y blocking time con todas las CDN activas

### 11.4 Supuestos de esta auditoría

- El hosting es Cloudflare Pages o similar (inferido de la existencia de un SW y la ausencia de config de servidor en el repo)
- El dominio principal es `www.arqingrenders.com` con HTTPS (confirmado por los canonicals)
- Los 360s en `lazy.guru` son dominios propios y no afectan el SEO del dominio principal (confirmado en brief)
- `/es/` tiene prioridad baja y no es el foco de optimización (confirmado en brief)

---

*Archivo generado: `/audit-internal-AG.md`*  
*Cobertura: 23 archivos HTML analizados, 20+ archivos JS revisados, todos los archivos de configuración del proyecto*
