/* Little Heart Heroes - progressive enhancements (count-up + scroll reveal).
   Pure vanilla JS, no dependencies. Fails safe: if anything goes wrong,
   all content is shown and counters jump to their final values. */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function fmt(n, info) {
    var s = info.comma ? n.toLocaleString('en-IN') : String(n);
    return info.prefix + s + info.suffix;
  }
  function parseStat(text) {
    var m = (text || '').trim().match(/^(\D*?)(\d[\d,]*)(\D*)$/);
    if (!m) return null;
    var target = parseInt(m[2].replace(/,/g, ''), 10);
    if (isNaN(target)) return null;
    return { prefix: m[1], suffix: m[3], target: target, comma: m[2].indexOf(',') > -1 };
  }

  ready(function () {
    var nums = [];
    var reveals = [];

    /* Fail-safe: show all reveal targets + finalise all counters. */
    function showEverything() {
      reveals.forEach(function (el) { el.classList.add('is-visible'); });
      nums.forEach(function (n) { if (n._stat) n.textContent = fmt(n._stat.target, n._stat); });
    }

    try {
      /* ---- Center the cyclothon "Why cycling" hosted video vertically in its column.
             (CSS :has() is unreliable in some browsers, so do it here.) ---- */
      [].forEach.call(document.querySelectorAll('.elementor-widget-video'), function (vw) {
        var col = vw.closest('.elementor-column');
        /* center the short video column vertically against the tall text column */
        if (col && col.parentElement) { col.parentElement.style.alignItems = 'center'; }
        vw.style.width = '100%';
      });

      /* ---- collect counters ---- */
      [].forEach.call(document.querySelectorAll('.wgl-counter_value-wrap'), function (w) {
        var info = parseStat(w.textContent);
        if (info) { w._stat = info; nums.push(w); }
        else if (!w.textContent.trim()) {
          var box = w.closest('.elementor-widget-wgl-counter') || w.closest('.elementor-element');
          if (box) box.classList.add('lhh-empty-stat');
        }
      });

      /* ---- collect reveal targets ---- */
      var sel = [
        '.elementor-widget-wgl-double-headings', '.elementor-widget-wgl-counter',
        '.elementor-widget-wgl-infobox', '.elementor-widget-image-box',
        '.elementor-widget-icon-box', '.elementor-widget-image',
        '.elementor-widget-text-editor', '.elementor-widget-button',
        '.elementor-widget-wgl-button', '.elementor-widget-wgl-team',
        '.elementor-widget-wgl-blockquote', '.lhh-video'
      ].join(',');
      reveals = [].filter.call(document.querySelectorAll(sel), function (el) {
        return !el.closest('.elementor-location-header') &&
               !el.closest('.elementor-location-footer') &&
               !el.closest('.lhh-hero');
      });
      reveals.forEach(function (el) { el.classList.add('lhh-reveal'); });

      if (reduce || !('IntersectionObserver' in window)) { showEverything(); return; }

      /* reset counters to 0, then animate when scrolled into view */
      nums.forEach(function (n) { n.textContent = fmt(0, n._stat); });

      function runCount(el) {
        var info = el._stat, dur = 1700, t0 = null;
        requestAnimationFrame(function step(ts) {
          if (t0 === null) t0 = ts;
          var p = Math.min((ts - t0) / dur, 1);
          var e = 1 - Math.pow(1 - p, 3);
          el.textContent = fmt(Math.round(info.target * e), info);
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = fmt(info.target, info);
        });
      }

      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add('is-visible');
          if (en.target._stat) runCount(en.target);
          io.unobserve(en.target);
        });
      }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

      reveals.forEach(function (el) { io.observe(el); });
      nums.forEach(function (n) { io.observe(n); });

      /* last-resort safety: nothing should stay hidden longer than 6s */
      setTimeout(function () {
        reveals.forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.top < window.innerHeight && !el.classList.contains('is-visible')) {
            el.classList.add('is-visible');
            if (el._stat) runCount(el);
          }
        });
      }, 6000);

    } catch (err) {
      showEverything();
    }
  });
})();
