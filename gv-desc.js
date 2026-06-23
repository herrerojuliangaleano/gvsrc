/*
GV Electro Product Descriptions — SAFE v4
Versión estable sin reveal.
Elimina CSS viejo que ocultaba bloques.
Quita .gv-reveal del HTML en runtime.
No usa opacity:0.
No usa animaciones de aparición.
*/

(function () {
  'use strict';

  var CONFIG = {
    barDuration: 900,
    countDuration: 800,
    maxRetries: 80,
    retryDelay: 150
  };

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function removeOldGVStyles() {
    var styles = document.querySelectorAll('style');

    styles.forEach(function (style) {
      var txt = style.textContent || '';
      var isOld =
        style.getAttribute('data-gv') === 'enhancer' ||
        style.getAttribute('data-gv-safe-enhancer') === 'v2' ||
        txt.indexOf('.gv-desc .gv-reveal{opacity:0') !== -1 ||
        txt.indexOf('.gv-desc .gv-reveal {opacity:0') !== -1 ||
        txt.indexOf('.gv-desc .gv-reveal') !== -1 && txt.indexOf('opacity:0') !== -1;

      if (isOld) {
        style.parentNode.removeChild(style);
      }
    });
  }

  function injectSafeCSS() {
    if (document.querySelector('style[data-gv-safe-enhancer="v4"]')) return;

    var css = [
      '.gv-desc,.gv-desc *{box-sizing:border-box}',
      '.gv-desc .gv-reveal{opacity:1!important;visibility:visible!important;transform:none!important}',
      '.gv-desc.gv-js .gv-card{transition:box-shadow .22s ease,border-color .22s ease}',
      '.gv-desc.gv-js .gv-card:hover{box-shadow:0 12px 28px rgba(11,95,184,.16)!important;border-color:#CFE0F4!important}',
      '.gv-desc.gv-js .gv-acc{transition:box-shadow .22s ease,border-color .22s ease}',
      '.gv-desc.gv-js .gv-acc[open]{box-shadow:0 12px 28px rgba(11,95,184,.15)!important;border-color:#CFE0F4!important}',
      '.gv-desc.gv-js summary{outline-offset:3px}',
      '.gv-desc.gv-js summary:focus-visible{outline:3px solid #FFB020;border-radius:10px}',
      '.gv-desc.gv-js svg{flex:none}'
    ].join('');

    var style = document.createElement('style');
    style.setAttribute('data-gv-safe-enhancer', 'v4');
    style.textContent = css;
    document.head.appendChild(style);
  }

  function killReveal(root) {
    var revealItems = root.querySelectorAll('.gv-reveal');

    revealItems.forEach(function (el) {
      el.classList.remove('gv-reveal');
      el.style.setProperty('opacity', '1', 'important');
      el.style.setProperty('visibility', 'visible', 'important');
      el.style.setProperty('transform', 'none', 'important');
    });
  }

  function setupBars(root) {
    var bars = Array.prototype.slice.call(root.querySelectorAll('.gv-bar > i'));

    bars.forEach(function (bar) {
      if (bar.getAttribute('data-gv-bar-ready') === 'true') return;
      bar.setAttribute('data-gv-bar-ready', 'true');

      var target = bar.style.width || bar.getAttribute('data-gv-target') || '58%';

      if (!target || target === '0px') {
        target = '58%';
      }

      if (prefersReducedMotion()) {
        bar.style.width = target;
        return;
      }

      bar.style.width = '0%';
      bar.style.transition = 'width ' + CONFIG.barDuration + 'ms cubic-bezier(.2,.7,.2,1)';

      setTimeout(function () {
        bar.style.width = target;
      }, 150);
    });
  }

  function setupCounts(root) {
    var counts = Array.prototype.slice.call(root.querySelectorAll('[data-gv-count]'));

    counts.forEach(function (el) {
      if (el.getAttribute('data-gv-count-ready') === 'true') return;
      el.setAttribute('data-gv-count-ready', 'true');

      var target = parseInt(el.getAttribute('data-gv-count'), 10);
      if (isNaN(target)) return;

      var suffix = el.getAttribute('data-gv-suffix') || '';
      var prefix = el.getAttribute('data-gv-prefix') || '';

      if (prefersReducedMotion()) {
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

      el.textContent = prefix + '0' + suffix;
      window.requestAnimationFrame(step);
    });
  }

  function setupCards(root) {
    var cards = Array.prototype.slice.call(root.querySelectorAll('.gv-card'));

    cards.forEach(function (card) {
      if (card.getAttribute('data-gv-card-ready') === 'true') return;
      card.setAttribute('data-gv-card-ready', 'true');

      var baseShadow = card.style.boxShadow || '0 4px 14px rgba(11,95,184,.08)';
      var baseBorder = card.style.borderColor || '#E3EBF5';

      card.addEventListener('mouseenter', function () {
        card.style.boxShadow = '0 12px 28px rgba(11,95,184,.16)';
        card.style.borderColor = '#CFE0F4';
      });

      card.addEventListener('mouseleave', function () {
        card.style.boxShadow = baseShadow;
        card.style.borderColor = baseBorder;
      });
    });
  }

  function setupDetails(root) {
    var details = Array.prototype.slice.call(root.querySelectorAll('.gv-acc, details'));

    details.forEach(function (detail) {
      if (detail.getAttribute('data-gv-detail-ready') === 'true') return;
      detail.setAttribute('data-gv-detail-ready', 'true');

      var baseShadow = detail.style.boxShadow || '0 4px 14px rgba(11,95,184,.08)';
      var baseBorder = detail.style.borderColor || '#E3EBF5';

      detail.addEventListener('toggle', function () {
        if (detail.open) {
          detail.style.boxShadow = '0 12px 28px rgba(11,95,184,.15)';
          detail.style.borderColor = '#CFE0F4';
        } else {
          detail.style.boxShadow = baseShadow;
          detail.style.borderColor = baseBorder;
        }
      });
    });
  }

  function enhanceRoot(root) {
    if (!root) return;

    root.classList.add('gv-js');

    killReveal(root);
    setupBars(root);
    setupCounts(root);
    setupCards(root);
    setupDetails(root);

    root.setAttribute('data-gv-enhanced', 'v4');
  }

  function enhanceAll() {
    removeOldGVStyles();
    injectSafeCSS();

    var roots = Array.prototype.slice.call(document.querySelectorAll('.gv-desc, [data-gv-desc]'));

    if (!roots.length) return false;

    roots.forEach(enhanceRoot);

    return true;
  }

  ready(function () {
    var tries = 0;

    var timer = setInterval(function () {
      tries += 1;

      var done = enhanceAll();

      if (done || tries >= CONFIG.maxRetries) {
        clearInterval(timer);
      }
    }, CONFIG.retryDelay);

    enhanceAll();

    if ('MutationObserver' in window) {
      var mo = new MutationObserver(function () {
        enhanceAll();
      });

      mo.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    }
  });
})();
