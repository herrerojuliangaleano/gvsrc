/*
GV Electro Product Descriptions - SAFE v8
Estable para HTML pegado en proveedores:
- no usa reveal ni opacity: 0;
- no modifica layout base;
- no aplica hover con estilos inline;
- limpia CSS viejo que podia dejar contenido oculto;
- anima solo barras/contadores cuando entran en pantalla;
- arma el boton de WhatsApp repartiendo 50/50 entre 2 numeros.
*/

(function () {
  "use strict";

  var VERSION = "v8";
  var CONFIG = {
    barDuration: 900,
    countDuration: 800,
    maxRetries: 80,
    retryDelay: 150
  };

  // Numeros de WhatsApp de la empresa (formato internacional, sin + ni espacios).
  // La consulta se reparte 50/50 entre estos numeros, al azar en cada visita.
  // Si cambian o se agrega un tercero, se edita solo aca y se sube version del JS.
  var WHATSAPP = {
    phones: ["5491161906319", "5491126289603"],
    message: "¡Hola GV Electro! 👋 Quería consultar por la *{producto}*. ¿Tenés stock y precio?"
  };

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
      return;
    }

    fn();
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function toArray(list) {
    return Array.prototype.slice.call(list || []);
  }

  function removeOldGVStyles() {
    toArray(document.querySelectorAll("style")).forEach(function (style) {
      var text = style.textContent || "";
      var isOld =
        style.getAttribute("data-gv") === "enhancer" ||
        style.getAttribute("data-gv-safe-enhancer") === "v2" ||
        style.getAttribute("data-gv-safe-enhancer") === "v3" ||
        text.indexOf(".gv-desc .gv-reveal") !== -1 && text.indexOf("opacity:0") !== -1 ||
        text.indexOf(".gv-desc .gv-reveal") !== -1 && text.indexOf("opacity: 0") !== -1;

      if (isOld && style.parentNode) {
        style.parentNode.removeChild(style);
      }
    });
  }

  function injectSafeCSS() {
    if (document.querySelector('style[data-gv-safe-enhancer="' + VERSION + '"]')) return;

    var css = [
      ".gv-desc,.gv-desc *{box-sizing:border-box}",
      ".gv-desc .gv-reveal{opacity:1!important;visibility:visible!important;transform:none!important}",
      ".gv-desc.gv-js .gv-card{transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease}",
      ".gv-desc.gv-js .gv-card:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(11,95,184,.13)!important;border-color:#bfd6ec!important}",
      ".gv-desc.gv-js .gv-acc{transition:box-shadow .22s ease,border-color .22s ease}",
      ".gv-desc.gv-js .gv-acc[open]{box-shadow:0 12px 28px rgba(11,95,184,.13)!important;border-color:#bfd6ec!important}",
      ".gv-desc.gv-js summary{outline-offset:3px}",
      ".gv-desc.gv-js summary:focus-visible{outline:3px solid #FFB020;border-radius:8px}",
      ".gv-desc.gv-js svg{flex:none}",
      ".gv-desc .gv-wa{display:inline-flex;align-items:center;justify-content:center;gap:8px;margin-top:16px;padding:11px 18px;border-radius:999px;background:#25d366;color:#fff;font-weight:700;font-size:15px;text-decoration:none}",
      ".gv-desc.gv-js .gv-wa:hover{background:#1ebe5d;transform:translateY(-1px)}"
    ].join("");

    var style = document.createElement("style");
    style.setAttribute("data-gv-safe-enhancer", VERSION);
    style.textContent = css;
    document.head.appendChild(style);
  }

  function killReveal(root) {
    toArray(root.querySelectorAll(".gv-reveal")).forEach(function (el) {
      el.classList.remove("gv-reveal");
      el.style.setProperty("opacity", "1", "important");
      el.style.setProperty("visibility", "visible", "important");
      el.style.setProperty("transform", "none", "important");
    });
  }

  function observeOnce(items, threshold, callback) {
    if (!items.length) return;

    if (!("IntersectionObserver" in window)) {
      items.forEach(callback);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        callback(entry.target);
        observer.unobserve(entry.target);
      });
    }, {
      threshold: threshold,
      rootMargin: "0px 0px -4% 0px"
    });

    items.forEach(function (item) {
      observer.observe(item);
    });
  }

  function setupBars(root) {
    var bars = toArray(root.querySelectorAll(".gv-bar > i"));

    observeOnce(bars, 0.25, function (bar) {
      if (bar.getAttribute("data-gv-bar-ready") === "true") return;
      bar.setAttribute("data-gv-bar-ready", "true");

      if (prefersReducedMotion() || !bar.animate) return;

      try {
        bar.animate([
          { transform: "scaleX(0)", transformOrigin: "left center" },
          { transform: "scaleX(1)", transformOrigin: "left center" }
        ], {
          duration: CONFIG.barDuration,
          easing: "cubic-bezier(.2,.7,.2,1)",
          fill: "none"
        });
      } catch (e) {
        // Si el proveedor bloquea animaciones, la barra queda con su ancho original.
      }
    });
  }

  function setupCounts(root) {
    var counts = toArray(root.querySelectorAll("[data-gv-count]"));

    observeOnce(counts, 0.35, function (el) {
      if (el.getAttribute("data-gv-count-ready") === "true") return;
      el.setAttribute("data-gv-count-ready", "true");

      var target = parseInt(el.getAttribute("data-gv-count"), 10);
      if (isNaN(target)) return;

      var suffix = el.getAttribute("data-gv-suffix") || "";
      var prefix = el.getAttribute("data-gv-prefix") || "";

      if (prefersReducedMotion() || !window.requestAnimationFrame) {
        el.textContent = prefix + target + suffix;
        return;
      }

      var startTime = null;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;

        var progress = Math.min((timestamp - startTime) / CONFIG.countDuration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var value = Math.round(target * eased);

        el.textContent = prefix + value + suffix;

        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          el.textContent = prefix + target + suffix;
        }
      }

      try {
        window.requestAnimationFrame(step);
      } catch (e) {
        el.textContent = prefix + target + suffix;
      }
    });
  }

  function pickPhone() {
    var phones = WHATSAPP.phones || [];
    if (!phones.length) return "";
    return phones[Math.floor(Math.random() * phones.length)];
  }

  function getProductName(el, root) {
    var explicit = el.getAttribute("data-gv-wa-product");
    if (explicit && explicit.trim()) return explicit.trim();

    var title = root.querySelector(".gv-title");
    if (title && title.textContent) return title.textContent.trim();

    return "";
  }

  function setupWhatsApp(root) {
    toArray(root.querySelectorAll("[data-gv-wa]")).forEach(function (el) {
      if (el.getAttribute("data-gv-wa-ready") === "true") return;

      var phone = pickPhone();
      if (!phone) return;

      el.setAttribute("data-gv-wa-ready", "true");

      var product = getProductName(el, root) || "este producto";
      var template = el.getAttribute("data-gv-wa-msg") || WHATSAPP.message;
      var message = template.replace("{producto}", product);

      el.setAttribute("href", "https://wa.me/" + phone + "?text=" + encodeURIComponent(message));
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
    });
  }

  function setupDetails(root) {
    toArray(root.querySelectorAll(".gv-acc, details")).forEach(function (detail) {
      if (detail.getAttribute("data-gv-detail-ready") === "true") return;
      detail.setAttribute("data-gv-detail-ready", "true");

      var summary = detail.querySelector("summary");

      function syncAria() {
        if (summary) summary.setAttribute("aria-expanded", detail.open ? "true" : "false");
      }

      syncAria();
      detail.addEventListener("toggle", syncAria);
    });
  }

  function enhanceRoot(root) {
    if (!root) return;

    root.classList.add("gv-js");
    killReveal(root);

    if (root.getAttribute("data-gv-enhanced") !== VERSION) {
      setupBars(root);
      setupCounts(root);
      setupDetails(root);
      setupWhatsApp(root);
      root.setAttribute("data-gv-enhanced", VERSION);
    }
  }

  function enhanceAll() {
    removeOldGVStyles();
    injectSafeCSS();

    var roots = toArray(document.querySelectorAll(".gv-desc, [data-gv-desc]"));

    roots.forEach(enhanceRoot);
    return roots.length > 0;
  }

  function watchForInjectedContent() {
    if (!("MutationObserver" in window)) return;

    var queued = false;
    var observer = new MutationObserver(function () {
      if (queued) return;
      queued = true;

      window.setTimeout(function () {
        queued = false;
        enhanceAll();
      }, 60);
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  ready(function () {
    var tries = 0;

    var timer = window.setInterval(function () {
      tries += 1;

      if (enhanceAll() || tries >= CONFIG.maxRetries) {
        window.clearInterval(timer);
      }
    }, CONFIG.retryDelay);

    enhanceAll();
    watchForInjectedContent();
  });
})();
