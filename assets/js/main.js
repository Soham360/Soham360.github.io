/* Soham Kamat — Portfolio
   No dependencies. Handles the mobile menu, which section is active in
   the nav, and the scroll reveal. Partials are injected by index.html,
   so everything that touches them waits for "partials:loaded". */
(function () {
  'use strict';

  /* ---- Mobile menu (delegated: the nav is injected after load) ---- */
  function setMenu(open) {
    var toggle = document.getElementById('navToggle');
    var links = document.getElementById('navLinks');
    if (!toggle || !links) return;
    links.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function menuIsOpen() {
    var links = document.getElementById('navLinks');
    return !!links && links.classList.contains('open');
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('#navToggle')) {
      setMenu(!menuIsOpen());
      return;
    }
    // Any nav link closes the sheet; so does a tap outside it
    if (e.target.closest('#navLinks a') || !e.target.closest('#navLinks')) {
      if (menuIsOpen()) setMenu(false);
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menuIsOpen()) {
      setMenu(false);
      var toggle = document.getElementById('navToggle');
      if (toggle) toggle.focus();
    }
  });

  /* ---- Wayfinding: mark the nav link for the section on screen ---- */
  function initNavState() {
    if (!('IntersectionObserver' in window)) return;

    var links = Array.prototype.slice.call(
      document.querySelectorAll('.nav-links a[href^="#"]')
    );
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });

    function setActive(id) {
      links.forEach(function (a) {
        var on = byId[id] === a;
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
      });
    }

    // A thin band across the middle of the viewport decides the section
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    document.querySelectorAll('section[id]').forEach(function (s) { io.observe(s); });

    // Back at the hero: nothing is active
    var hero = document.getElementById('top');
    if (hero) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setActive('');
        });
      }, { rootMargin: '-45% 0px -50% 0px' }).observe(hero);
    }
  }

  /* ---- Scroll reveal ---- */
  var REVEAL = [
    '.section-head', '.about-grid', '.proj-item', '.more-projects',
    '.edu-item', '.tl-item', '.skill-col', '.skills-subhead',
    '.leader-card', '.honor-item', '.contact-lead', '.contact-list'
  ].join(',');

  function initReveal() {
    if (!('IntersectionObserver' in window)) return;

    var targets = document.querySelectorAll(REVEAL);

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

    targets.forEach(function (el) {
      // Small stagger among siblings, capped so long lists don't drag
      var index = Array.prototype.indexOf.call(el.parentElement.children, el);
      el.style.setProperty('--i', Math.min(index, 4));
      el.classList.add('reveal');
      io.observe(el);
    });
  }

  function init() {
    initNavState();
    initReveal();
  }

  if (window.__partialsLoaded) init();
  else document.addEventListener('partials:loaded', init, { once: true });
})();
