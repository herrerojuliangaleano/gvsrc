/*!
 * GV Electro — Enhancer de descripciones de producto v2
 * Mejora progresiva: si el JS no carga, la plantilla sigue funcionando
 * (acordeones <details> nativos + modales con fallback checkbox).
 *
 * Uso: subí este archivo UNA vez y referencialo en cada producto con
 *   <script src="https://TU-DOMINIO/gv-desc.js" defer></script>
 *
 * Features:
 *  - Galería de imágenes (thumbs + lightbox con zoom, swipe y teclado)
 *  - Sticky in-page nav generado desde las secciones
 *  - Scroll-reveal, animación de barras y contadores numéricos
 *  - Modales accesibles (focus-trap, ESC, scroll-lock, backdrop)
 *  - Tabs ARIA construidas desde <details data-gv-tabs>
 *  - Búsqueda en vivo para FAQ y ficha técnica
 *  - Copiar al portapapeles (SKU, cupones)
 *  - WhatsApp CTA con mensaje pre-armado
 *  - prefers-reduced-motion, idempotente, re-escanea contenido dinámico
 */
(function () {
  'use strict';
  if (window.__gvDescLoaded) return;
  window.__gvDescLoaded = true;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var on = function (el, ev, fn, o) { el.addEventListener(ev, fn, o || false); };
  var uid = function (p) { return (p || 'gv') + '-' + Math.random().toString(36).slice(2, 9); };

  // ===== CSS auxiliar (solo lo que el JS aporta) =====
  var css = [
    '.gv-desc.gv-js .gv-mtoggle{display:none}',
    '.gv-desc .gv-js-only{display:none}',
    '.gv-desc.gv-js .gv-js-only{display:revert}',
    '.gv-desc.gv-js .gv-nojs-only{display:none}',
    '.gv-desc .gv-reveal{opacity:0;transform:translateY(18px);transition:opacity .55s ease,transform .55s ease}',
    '.gv-desc .gv-reveal.is-in{opacity:1;transform:none}',
    '.gv-desc .gv-bar > i.gv-bar-anim{width:0!important;transition:width 1.1s cubic-bezier(.2,.7,.2,1)}',
    '.gv-desc .gv-bar > i.gv-bar-anim.is-in{width:var(--gv-fill,58%)!important}',
    /* Sticky nav */
    '.gv-desc .gv-toc{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.92);backdrop-filter:blur(10px);border-bottom:1px solid var(--gv-border);margin:0 -8px 18px;padding:8px;border-radius:12px;display:flex;gap:4px;overflow-x:auto;scrollbar-width:none}',
    '.gv-desc .gv-toc::-webkit-scrollbar{display:none}',
    '.gv-desc .gv-toc a{flex:none;padding:10px 16px;min-height:40px;display:inline-flex;align-items:center;border-radius:999px;font-size:13px;font-weight:600;color:var(--gv-mute);text-decoration:none;white-space:nowrap;transition:background .2s,color .2s}',
    '.gv-desc .gv-toc a:hover{background:var(--gv-soft);color:var(--gv-primary)}',
    '.gv-desc .gv-toc a.is-active{background:linear-gradient(135deg,var(--gv-primary),var(--gv-accent));color:#fff}',
    '.gv-desc .gv-toc a:focus-visible{outline:3px solid #FFB020;outline-offset:2px}',
    /* Galería */
    '.gv-desc .gv-gal{display:grid;grid-template-columns:80px 1fr;gap:12px;margin-bottom:20px}',
    '.gv-desc .gv-gal-thumbs{display:flex;flex-direction:column;gap:8px;max-height:480px;overflow:auto;scrollbar-width:thin}',
    '.gv-desc .gv-gal-thumb{width:80px;height:80px;border-radius:10px;overflow:hidden;border:2px solid transparent;cursor:pointer;background:#fff;padding:0;flex:none;transition:border-color .2s,transform .2s}',
    '.gv-desc .gv-gal-thumb img{width:100%;height:100%;object-fit:cover;display:block}',
    '.gv-desc .gv-gal-thumb:hover{transform:scale(1.04)}',
    '.gv-desc .gv-gal-thumb[aria-current="true"]{border-color:var(--gv-primary)}',
    '.gv-desc .gv-gal-thumb:focus-visible{outline:3px solid #FFB020;outline-offset:2px}',
    '.gv-desc .gv-gal-main{position:relative;border-radius:var(--gv-radius);overflow:hidden;background:var(--gv-soft);aspect-ratio:1/1;box-shadow:var(--gv-shadow);cursor:zoom-in}',
    '.gv-desc .gv-gal-main img{width:100%;height:100%;object-fit:contain;display:block;transition:opacity .25s}',
    '.gv-desc .gv-gal-main .gv-gal-zoom{position:absolute;top:12px;right:12px;background:rgba(255,255,255,.92);border-radius:999px;padding:8px;display:flex;color:var(--gv-primary);pointer-events:none}',
    '@media(max-width:560px){.gv-desc .gv-gal{grid-template-columns:1fr;gap:8px}.gv-desc .gv-gal-thumbs{flex-direction:row;max-height:none;order:2;overflow-x:auto;padding-bottom:4px}.gv-desc .gv-gal-thumb{width:60px;height:60px}}',
    /* Lightbox */
    '.gv-lb{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;background:rgba(8,18,35,.92);backdrop-filter:blur(8px);opacity:0;transition:opacity .25s;padding:20px}',
    '.gv-lb.is-open{opacity:1}',
    '.gv-lb-stage{position:relative;max-width:100%;max-height:100%;display:flex;align-items:center;justify-content:center}',
    '.gv-lb img{max-width:92vw;max-height:88vh;border-radius:10px;box-shadow:0 30px 80px rgba(0,0,0,.5);transform:scale(.92);transition:transform .3s cubic-bezier(.2,.9,.3,1.2);user-select:none}',
    '.gv-lb.is-open img{transform:none}',
    '.gv-lb-btn{position:absolute;top:50%;transform:translateY(-50%);width:48px;height:48px;border-radius:50%;border:none;background:rgba(255,255,255,.95);color:#0B5FB8;font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 20px rgba(0,0,0,.3);font-weight:700}',
    '.gv-lb-btn.prev{left:18px}.gv-lb-btn.next{right:18px}',
    '.gv-lb-btn:hover{background:#fff;transform:translateY(-50%) scale(1.05)}',
    '.gv-lb-btn:focus-visible{outline:3px solid #FFB020;outline-offset:3px}',
    '.gv-lb-close{position:absolute;top:18px;right:22px;width:42px;height:42px;border-radius:50%;border:none;background:#fff;color:#0B5FB8;font-size:24px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 20px rgba(0,0,0,.3);z-index:2}',
    '.gv-lb-close:hover{transform:rotate(90deg)}',
    '.gv-lb-close:focus-visible{outline:3px solid #FFB020;outline-offset:3px}',
    '.gv-lb-counter{position:absolute;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.5);color:#fff;padding:6px 14px;border-radius:999px;font-size:13px;font-weight:600}',
    '.gv-desc [data-gv-zoom]{cursor:zoom-in;transition:transform .25s}',
    'body.gv-noscroll{overflow:hidden}',
    /* Tabs */
    '.gv-desc .gv-tabs{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:14px;border-bottom:1px solid var(--gv-border)}',
    '.gv-desc .gv-tab{appearance:none;border:none;background:transparent;font:inherit;color:var(--gv-mute);padding:10px 16px;cursor:pointer;border-radius:10px 10px 0 0;font-weight:600;font-size:14px;position:relative;transition:color .2s,background .2s;display:flex;align-items:center;gap:8px}',
    '.gv-desc .gv-tab svg{width:18px;height:18px}',
    '.gv-desc .gv-tab:hover{color:var(--gv-primary);background:var(--gv-soft)}',
    '.gv-desc .gv-tab[aria-selected="true"]{color:var(--gv-primary)}',
    '.gv-desc .gv-tab[aria-selected="true"]::after{content:"";position:absolute;left:12%;right:12%;bottom:-1px;height:3px;border-radius:3px 3px 0 0;background:linear-gradient(90deg,var(--gv-primary),var(--gv-accent))}',
    '.gv-desc .gv-tab:focus-visible{outline:3px solid #FFB020;outline-offset:2px;border-radius:10px}',
    '.gv-desc .gv-tabpanel{animation:gvFadeUp .35s ease;padding:6px 2px}',
    /* Filter input */
    '.gv-desc .gv-filter{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--gv-border);border-radius:999px;padding:8px 14px;margin-bottom:12px;box-shadow:var(--gv-shadow);transition:border-color .2s,box-shadow .2s}',
    '.gv-desc .gv-filter:focus-within{border-color:var(--gv-primary);box-shadow:0 0 0 4px rgba(11,95,184,.12)}',
    '.gv-desc .gv-filter svg{width:16px;height:16px;color:var(--gv-mute);flex:none}',
    '.gv-desc .gv-filter input{flex:1;border:none;outline:none;background:transparent;font:inherit;color:var(--gv-ink);font-size:14px;min-width:0}',
    '.gv-desc .gv-filter-empty{text-align:center;color:var(--gv-mute);padding:14px;font-size:14px;font-style:italic}',
    /* Highlight matches */
    '.gv-desc mark{background:linear-gradient(transparent 60%,#FFE58A 60%);color:inherit;padding:0 2px;border-radius:2px}',
    /* Copy button feedback */
    '.gv-desc .gv-copy-ok{display:inline-flex;align-items:center;gap:4px;color:#22A06B;font-weight:600;font-size:12px;margin-left:6px;opacity:0;transform:translateX(-6px);transition:opacity .2s,transform .2s}',
    '.gv-desc .gv-copy-ok.is-on{opacity:1;transform:none}',
    /* WhatsApp pulse */
    '.gv-desc .gv-wa{background:linear-gradient(135deg,#25D366,#128C7E)!important;box-shadow:0 6px 16px rgba(37,211,102,.35)!important}',
    '.gv-desc .gv-wa:hover{box-shadow:0 10px 24px rgba(37,211,102,.5)!important}',
    '@keyframes gvPulse{0%,100%{box-shadow:0 6px 16px rgba(37,211,102,.35),0 0 0 0 rgba(37,211,102,.5)}50%{box-shadow:0 6px 16px rgba(37,211,102,.35),0 0 0 12px rgba(37,211,102,0)}}',
    '.gv-desc .gv-wa.is-pulse{animation:gvPulse 2s ease-in-out infinite}',
    /* Toast */
    '.gv-toast{position:fixed;left:50%;bottom:24px;transform:translate(-50%,40px);background:#1A2433;color:#fff;padding:12px 20px;border-radius:999px;font-size:14px;font-weight:600;z-index:100001;opacity:0;transition:opacity .25s,transform .25s;box-shadow:0 12px 32px rgba(0,0,0,.3);display:flex;align-items:center;gap:8px}',
    '.gv-toast.is-on{opacity:1;transform:translate(-50%,0)}',
    '.gv-toast svg{width:18px;height:18px;color:#4ADE80}'
  ].join('');
  var st = document.createElement('style'); st.setAttribute('data-gv', 'enhancer'); st.textContent = css;
  document.head.appendChild(st);

  // ===== IntersectionObserver: reveal + barras + counters =====
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target;
      el.classList.add('is-in');
      if (el.hasAttribute('data-gv-count')) animateCount(el);
      io.unobserve(el);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }) : null;

  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-gv-count'));
    if (isNaN(target)) return;
    var suffix = el.getAttribute('data-gv-suffix') || '';
    if (reduceMotion) { el.textContent = (target % 1 === 0 ? target : target.toFixed(1)) + suffix; return; }
    var dur = 1300, start = performance.now();
    (function step(t) {
      var p = Math.min(1, (t - start) / dur);
      var v = target * (1 - Math.pow(1 - p, 3));
      el.textContent = (target % 1 === 0 ? Math.round(v) : v.toFixed(1)) + suffix;
      if (p < 1) requestAnimationFrame(step);
    })(performance.now());
  }

  // ===== Toast =====
  var toastEl;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'gv-toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg><span></span>';
    toastEl.querySelector('span').textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2200);
  }

  // ===== Modal manager =====
  var openModal = null, lastFocus = null;
  function trapFocus(e) {
    if (!openModal || e.key !== 'Tab') return;
    var f = $$('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])', openModal)
      .filter(function (n) { return !n.disabled && n.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
    else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
  }
  function showModal(m) {
    if (openModal) hideModal();
    openModal = m; lastFocus = document.activeElement;
    m.style.display = 'flex'; document.body.classList.add('gv-noscroll');
    requestAnimationFrame(function () { m.classList.add('is-open'); });
    if (lastFocus && lastFocus.setAttribute) lastFocus.setAttribute('aria-expanded', 'true');
    m._opener = lastFocus;
    var c = m.querySelector('.gv-modal-close'); if (c) c.focus();
  }
  function hideModal() {
    if (!openModal) return;
    openModal.classList.remove('is-open'); openModal.style.display = '';
    document.body.classList.remove('gv-noscroll');
    if (openModal._opener && openModal._opener.setAttribute) openModal._opener.setAttribute('aria-expanded', 'false');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    openModal = null;
  }
  on(document, 'keydown', function (e) {
    if (!openModal) return;
    if (e.key === 'Escape') { hideModal(); e.preventDefault(); }
    else trapFocus(e);
  });

  // ===== Lightbox con navegación =====
  var lb, lbList = [], lbIdx = 0;
  function buildLb() {
    lb = document.createElement('div');
    lb.className = 'gv-lb';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Vista ampliada');
    lb.innerHTML = '<button class="gv-lb-close" aria-label="Cerrar (Esc)">×</button>'
      + '<button class="gv-lb-btn prev" aria-label="Anterior">‹</button>'
      + '<div class="gv-lb-stage"><img alt=""></div>'
      + '<button class="gv-lb-btn next" aria-label="Siguiente">›</button>'
      + '<div class="gv-lb-counter" aria-hidden="true"></div>';
    document.body.appendChild(lb);
    on(lb.querySelector('.gv-lb-close'), 'click', closeLb);
    on(lb.querySelector('.prev'), 'click', function () { showLb(lbIdx - 1); });
    on(lb.querySelector('.next'), 'click', function () { showLb(lbIdx + 1); });
    on(lb, 'click', function (e) { if (e.target === lb) closeLb(); });
    on(document, 'keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLb();
      else if (e.key === 'ArrowLeft') showLb(lbIdx - 1);
      else if (e.key === 'ArrowRight') showLb(lbIdx + 1);
    });
    // swipe
    var sx = 0;
    on(lb, 'touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    on(lb, 'touchend', function (e) {
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 40) showLb(lbIdx + (dx < 0 ? 1 : -1));
    });
  }
  function showLb(i) {
    if (!lbList.length) return;
    lbIdx = (i + lbList.length) % lbList.length;
    var img = lb.querySelector('img');
    img.src = lbList[lbIdx].src;
    img.alt = lbList[lbIdx].alt || '';
    lb.querySelector('.gv-lb-counter').textContent = (lbIdx + 1) + ' / ' + lbList.length;
    lb.querySelectorAll('.gv-lb-btn').forEach(function (b) { b.style.display = lbList.length > 1 ? '' : 'none'; });
  }
  function openLb(list, idx) {
    if (!lb) buildLb();
    lbList = list; showLb(idx || 0);
    document.body.classList.add('gv-noscroll');
    lb.style.display = 'flex';
    requestAnimationFrame(function () { lb.classList.add('is-open'); });
    lb.querySelector('.gv-lb-close').focus();
  }
  function closeLb() {
    lb.classList.remove('is-open'); document.body.classList.remove('gv-noscroll');
    setTimeout(function () { lb.style.display = 'none'; }, 250);
  }

  // ===== Highlight helper =====
  function escapeHtml(s) { return s.replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function highlight(text, q) {
    if (!q) return escapeHtml(text);
    var re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    return escapeHtml(text).replace(re, '<mark>$1</mark>');
  }

  // ===== Enhance =====
  function enhance(root) {
    if (root.__gvEnhanced) return; root.__gvEnhanced = true;
    root.classList.add('gv-js');

    // --- Sticky TOC ---
    var navTarget = root.querySelector('[data-gv-toc]');
    if (navTarget) {
      var sections = $$('section[data-gv-nav]', root);
      if (sections.length) {
        var toc = document.createElement('nav');
        toc.className = 'gv-toc'; toc.setAttribute('aria-label', 'Secciones del producto');
        sections.forEach(function (s) {
          if (!s.id) s.id = uid('gvs');
          var label = s.getAttribute('data-gv-nav') || (s.querySelector('h3') || {}).textContent || 'Sección';
          var a = document.createElement('a'); a.href = '#' + s.id; a.textContent = label.trim();
          on(a, 'click', function (e) {
            e.preventDefault();
            var top = s.getBoundingClientRect().top + window.pageYOffset - 80;
            window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
          });
          toc.appendChild(a);
        });
        navTarget.appendChild(toc);
        // active state on scroll
        if ('IntersectionObserver' in window) {
          var spy = new IntersectionObserver(function (ents) {
            ents.forEach(function (en) {
              if (en.isIntersecting) {
                toc.querySelectorAll('a').forEach(function (a) {
                  var on_=a.getAttribute('href')==='#'+en.target.id;a.classList.toggle('is-active',on_);if(on_)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');
                });
              }
            });
          }, { rootMargin: '-30% 0px -60% 0px' });
          sections.forEach(function (s) { spy.observe(s); });
        }
      }
    }

    // --- Galería ---
    $$('[data-gv-gallery]', root).forEach(function (g) {
      var imgs;
      try { imgs = JSON.parse(g.getAttribute('data-gv-gallery')); } catch (e) { return; }
      if (!imgs || !imgs.length) return;
      var thumbs = document.createElement('div'); thumbs.className = 'gv-gal-thumbs'; thumbs.setAttribute('role', 'tablist');
      var main = document.createElement('button'); main.type = 'button'; main.className = 'gv-gal-main';
      main.setAttribute('aria-label', 'Ampliar imagen');
      main.innerHTML = '<img alt="" loading="lazy" decoding="async"><span class="gv-gal-zoom" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/></svg></span>';
      var mainImg = main.querySelector('img');
      function pick(i) {
        mainImg.src = imgs[i].src; mainImg.alt = imgs[i].alt || '';
        $$('.gv-gal-thumb', thumbs).forEach(function (t, k) { t.setAttribute('aria-current', k === i ? 'true' : 'false'); });
      }
      imgs.forEach(function (im, i) {
        var t = document.createElement('button'); t.type = 'button'; t.className = 'gv-gal-thumb';
        t.setAttribute('aria-label', 'Ver imagen ' + (i + 1));
        t.innerHTML = '<img src="' + im.thumb + '" alt="" loading="lazy" decoding="async" width="64" height="64">';
        on(t, 'click', function () { pick(i); });
        thumbs.appendChild(t);
      });
      on(main, 'click', function () { openLb(imgs, currentIdx()); });
      function currentIdx() {
        var cur = thumbs.querySelector('[aria-current="true"]');
        return cur ? $$('.gv-gal-thumb', thumbs).indexOf(cur) : 0;
      }
      g.innerHTML = ''; g.className = 'gv-gal'; g.appendChild(thumbs); g.appendChild(main);
      pick(0);
    });

    // --- Reveal / barras / counters ---
    if (io && !reduceMotion) {
      $$('.gv-anim,.gv-card,.gv-feat,.gv-dim,.gv-trust-item,details.gv-acc,.gv-table-wrap', root).forEach(function (el) {
        el.style.animation = 'none'; el.classList.add('gv-reveal'); io.observe(el);
      });
      $$('.gv-bar > i', root).forEach(function (el) { el.classList.add('gv-bar-anim'); io.observe(el); });
    }
    $$('[data-gv-count]', root).forEach(function (el) { io ? io.observe(el) : animateCount(el); });

    // --- Modales (reemplazo del checkbox-hack) ---
    $$('.gv-mtoggle', root).forEach(function (chk) {
      var mod = (chk.className.match(/gv-mtoggle--(\S+)/) || [])[1];
      if (!mod) return;
      var modal = root.querySelector('.gv-modal--' + mod);
      if (!modal) return;
      var btn = root.querySelector('label[for="' + chk.id + '"].gv-btn');
      if (btn) {
        btn.setAttribute('tabindex', '0');
        btn.setAttribute('aria-expanded', 'false');
        on(btn, 'click', function (e) { e.preventDefault(); showModal(modal); });
        on(btn, 'keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showModal(modal); } });
      }
      $$('.gv-modal-close,.gv-backdrop', modal).forEach(function (c) {
        on(c, 'click', function (e) { e.preventDefault(); hideModal(); });
        on(c, 'keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hideModal(); } });
      });
    });

    // --- Tabs desde <details> ---
    $$('[data-gv-tabs]', root).forEach(function (section) {
      var details = $$(':scope > details.gv-acc', section);
      if (details.length < 2) return;
      var tablist = document.createElement('div'); tablist.className = 'gv-tabs'; tablist.setAttribute('role', 'tablist');
      var panels = [];
      details.forEach(function (det, i) {
        var sum = det.querySelector('summary');
        var iconHtml = sum ? (sum.querySelector('.gv-ico') || {}).outerHTML || '' : '';
        var label = (sum ? (sum.textContent || '') : '').trim();
        var tab = document.createElement('button');
        tab.type = 'button'; tab.className = 'gv-tab'; tab.setAttribute('role', 'tab');
        tab.innerHTML = iconHtml + '<span>' + escapeHtml(label) + '</span>';
        var pid = uid('gvp'), tid = uid('gvt');
        tab.id = tid; tab.setAttribute('aria-controls', pid);
        var body = det.querySelector('.gv-acc-body');
        var panel = document.createElement('div');
        panel.id = pid; panel.className = 'gv-tabpanel'; panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', tid);
        if (body) panel.innerHTML = body.innerHTML;
        panels.push({ tab: tab, panel: panel });
        tablist.appendChild(tab);
        det.style.display = 'none';
      });
      var wrap = document.createElement('div'); wrap.appendChild(tablist);
      panels.forEach(function (p) { wrap.appendChild(p.panel); });
      section.appendChild(wrap);
      function sel(i) {
        panels.forEach(function (p, k) {
          var on_ = k === i;
          p.tab.setAttribute('aria-selected', on_ ? 'true' : 'false');
          p.tab.setAttribute('tabindex', on_ ? '0' : '-1');
          p.panel.hidden = !on_;
        });
      }
      panels.forEach(function (p, i) {
        on(p.tab, 'click', function () { sel(i); p.tab.focus(); });
        on(p.tab, 'keydown', function (e) {
          var n = panels.length;
          if (e.key === 'ArrowRight') { sel((i + 1) % n); panels[(i + 1) % n].tab.focus(); }
          else if (e.key === 'ArrowLeft') { var j = (i - 1 + n) % n; sel(j); panels[j].tab.focus(); }
          else if (e.key === 'Home') { sel(0); panels[0].tab.focus(); }
          else if (e.key === 'End') { sel(n - 1); panels[n - 1].tab.focus(); }
        });
      });
      sel(0);
    });

    // --- Filtros en vivo ---
    $$('[data-gv-filter]', root).forEach(function (input) {
      var targetSel = input.getAttribute('data-gv-filter');
      var items = $$(targetSel, root);
      // guardar texto original
      items.forEach(function (it) { it._orig = it.innerHTML; });
      var empty = document.createElement('div');
      empty.className = 'gv-filter-empty'; empty.textContent = 'Sin coincidencias.'; empty.hidden = true;
      if (items[0] && items[0].parentNode) items[0].parentNode.appendChild(empty);
      on(input, 'input', function () {
        var q = input.value.trim().toLowerCase();
        var shown = 0;
        items.forEach(function (it) {
          var text = (it.textContent || '').toLowerCase();
          var match = !q || text.indexOf(q) !== -1;
          it.style.display = match ? '' : 'none';
          if (match) shown++;
          // re-highlight
          if (q && match) {
            it.innerHTML = highlightHTML(it._orig, q);
          } else if (!q) {
            it.innerHTML = it._orig;
          }
        });
        empty.hidden = shown > 0;
      });
    });

    // --- Copiar al portapapeles ---
    $$('[data-gv-copy]', root).forEach(function (btn) {
      var ok = document.createElement('span'); ok.className = 'gv-copy-ok';
      ok.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>¡Copiado!';
      btn.appendChild(ok);
      on(btn, 'click', function () {
        var txt = btn.getAttribute('data-gv-copy');
        function done(){ ok.classList.add('is-on'); toast('Copiado: ' + txt); setTimeout(function(){ok.classList.remove('is-on');},1600); }
        function fallback(){
          try{ var ta=document.createElement('textarea'); ta.value=txt; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); done(); }catch(e){ toast('No se pudo copiar'); }
        }
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(txt).then(done, fallback);
        } else { fallback(); }
      });
    });

    // --- WhatsApp pulse ---
    $$('.gv-wa', root).forEach(function (a) {
      a.classList.add('is-pulse');
      on(a, 'mouseenter', function () { a.classList.remove('is-pulse'); });
    });

    // --- Lightbox individual para imgs sueltas ---
    $$('[data-gv-zoom]', root).forEach(function (el) {
      el.setAttribute('tabindex', '0'); el.setAttribute('role', 'button');
      el.setAttribute('aria-label', el.getAttribute('aria-label') || 'Ampliar imagen');
      function tr() { openLb([{ src: el.getAttribute('data-gv-zoom') || el.src, alt: el.alt }], 0); }
      on(el, 'click', tr);
      on(el, 'keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tr(); } });
    });
  }

  // simple HTML-safe highlight that respects child tags by only touching text nodes
  function highlightHTML(html, q) {
    var tmp = document.createElement('div'); tmp.innerHTML = html;
    var re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    (function walk(node) {
      for (var i = 0; i < node.childNodes.length; i++) {
        var c = node.childNodes[i];
        if (c.nodeType === 3) {
          if (re.test(c.nodeValue)) {
            var span = document.createElement('span');
            span.innerHTML = escapeHtml(c.nodeValue).replace(re, '<mark>$1</mark>');
            node.replaceChild(span, c);
          }
        } else if (c.nodeType === 1 && c.tagName !== 'MARK') walk(c);
      }
    })(tmp);
    return tmp.innerHTML;
  }

  function boot() { $$('.gv-desc').forEach(enhance); }
  if (document.readyState === 'loading') on(document, 'DOMContentLoaded', boot); else boot();

  if ('MutationObserver' in window) {
    new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        m.addedNodes && Array.prototype.forEach.call(m.addedNodes, function (n) {
          if (n.nodeType !== 1) return;
          if (n.classList && n.classList.contains('gv-desc')) enhance(n);
          else if (n.querySelectorAll) $$('.gv-desc', n).forEach(enhance);
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
  }
})();
