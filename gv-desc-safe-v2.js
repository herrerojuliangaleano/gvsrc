/*
GV Electro Product Descriptions — SAFE v2
Objetivo: animar/mejorar descripciones sin ocultar contenido de forma permanente.
No usa estilos que dejen elementos invisibles al hacer scroll.
Compatible con HTML inline + clases/hooks:
.gv-desc, .gv-reveal, .gv-card, .gv-bar > i, .gv-acc, [data-gv-count]
*/

(function () {
    'use strict';

    var CONFIG = {
        revealDuration: 600,
        revealStagger: 55,
        barDuration: 1100,
        countDuration: 900,
        maxRetries: 50,
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

    function injectSafeCSS() {
        if (document.querySelector('style[data-gv-safe-enhancer="v2"]')) return;

        var css = [
            '.gv-desc.gv-js .gv-card{transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease}',
            '.gv-desc.gv-js .gv-card:hover{transform:translateY(-3px);box-shadow:0 12px 28px rgba(11,95,184,.16)!important;border-color:#CFE0F4!important}',
            '.gv-desc.gv-js .gv-acc{transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease}',
            '.gv-desc.gv-js .gv-acc[open]{box-shadow:0 12px 28px rgba(11,95,184,.15)!important;border-color:#CFE0F4!important}',
            '.gv-desc.gv-js summary{outline-offset:3px}',
            '.gv-desc.gv-js summary:focus-visible{outline:3px solid #FFB020;border-radius:10px}',
            '.gv-desc.gv-js svg{flex:none}'
        ].join('');

        var style = document.createElement('style');
        style.setAttribute('data-gv-safe-enhancer', 'v2');
        style.textContent = css;
        document.head.appendChild(style);
    }

    function animateOnce(el, frames, options) {
        if (prefersReducedMotion()) return;

        try {
            if (el.animate) {
                el.animate(frames, options);
            }
        } catch (e) {
            /* Si el navegador bloquea alguna animación, no rompemos nada. */
        }
    }

    function revealElement(el, index) {
        if (!el || el.getAttribute('data-gv-revealed') === 'true') return;
        el.setAttribute('data-gv-revealed', 'true');

        animateOnce(
            el,
            [
                { opacity: 0, transform: 'translateY(16px)' },
                { opacity: 1, transform: 'translateY(0)' }
            ],
            {
                duration: CONFIG.revealDuration,
                easing: 'cubic-bezier(.2,.8,.2,1)',
                delay: Math.min(index * CONFIG.revealStagger, 450),
                fill: 'none'
            }
        );
    }

    function setupReveal(root) {
        var items = Array.prototype.slice.call(root.querySelectorAll('.gv-reveal'));
        if (!items.length) return;

        if (!('IntersectionObserver' in window) || prefersReducedMotion()) {
            items.forEach(function (el, i) {
                revealElement(el, i);
            });
            return;
        }

        var indexMap = new Map();
        items.forEach(function (el, i) {
            indexMap.set(el, i);
        });

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;

                revealElement(entry.target, indexMap.get(entry.target) || 0);
                observer.unobserve(entry.target);
            });
        }, {
            threshold: 0.08,
            rootMargin: '0px 0px -4% 0px'
        });

        items.forEach(function (el) {
            observer.observe(el);
        });
    }

    function setupBars(root) {
        var bars = Array.prototype.slice.call(root.querySelectorAll('.gv-bar > i'));
        if (!bars.length) return;

        function animateBar(bar) {
            if (bar.getAttribute('data-gv-bar-ready') === 'true') return;
            bar.setAttribute('data-gv-bar-ready', 'true');

            var target = bar.style.width || bar.getAttribute('data-gv-target') || '58%';
            if (!target || target === '0px') target = '58%';

            if (prefersReducedMotion()) {
                bar.style.width = target;
                return;
            }

            bar.style.width = '0%';
            bar.style.transition = 'width ' + CONFIG.barDuration + 'ms cubic-bezier(.2,.7,.2,1)';

            setTimeout(function () {
                bar.style.width = target;
            }, 120);
        }

        if (!('IntersectionObserver' in window)) {
            bars.forEach(animateBar);
            return;
        }

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;

                animateBar(entry.target);
                observer.unobserve(entry.target);
            });
        }, {
            threshold: 0.25
        });

        bars.forEach(function (bar) {
            observer.observe(bar);
        });
    }

    function setupCounts(root) {
        var counts = Array.prototype.slice.call(root.querySelectorAll('[data-gv-count]'));
        if (!counts.length) return;

        function animateCount(el) {
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
        }

        if (!('IntersectionObserver' in window)) {
            counts.forEach(animateCount);
            return;
        }

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;

                animateCount(entry.target);
                observer.unobserve(entry.target);
            });
        }, {
            threshold: 0.35
        });

        counts.forEach(function (el) {
            observer.observe(el);
        });
    }

    function setupCards(root) {
        var cards = Array.prototype.slice.call(root.querySelectorAll('.gv-card'));

        cards.forEach(function (card) {
            if (card.getAttribute('data-gv-card-ready') === 'true') return;
            card.setAttribute('data-gv-card-ready', 'true');

            var baseTransform = card.style.transform || '';
            var baseShadow = card.style.boxShadow || '0 4px 14px rgba(11,95,184,.08)';
            var baseBorder = card.style.borderColor || '#E3EBF5';

            card.addEventListener('mouseenter', function () {
                card.style.transform = 'translateY(-3px)';
                card.style.boxShadow = '0 12px 28px rgba(11,95,184,.16)';
                card.style.borderColor = '#CFE0F4';
            });

            card.addEventListener('mouseleave', function () {
                card.style.transform = baseTransform;
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
        if (!root || root.getAttribute('data-gv-enhanced') === 'v2') return;

        root.setAttribute('data-gv-enhanced', 'v2');
        root.classList.add('gv-js');

        setupReveal(root);
        setupBars(root);
        setupCounts(root);
        setupCards(root);
        setupDetails(root);
    }

    function enhanceAll() {
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