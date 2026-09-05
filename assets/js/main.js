!(function($) {
  "use strict";

  // Return to the hero/header view, as if freshly landed on the homepage
  function goHome() {
    $('#header').removeClass('header-top');
    $('.nav-menu .active, .mobile-nav .active').removeClass('active');
    $('.nav-menu, .mobile-nav').find('a[href="#header"]').parent('li').addClass('active');
    $('section').removeClass('section-show');

    // Strip any leftover hash so the URL always stays clean
    if (window.location.hash && history.replaceState) {
      history.replaceState(null, document.title, window.location.pathname + window.location.search);
    }

    if ($('body').hasClass('mobile-nav-active')) {
      $('body').removeClass('mobile-nav-active');
      $('.mobile-nav-toggle i').toggleClass('icofont-navigation-menu icofont-close');
      $('.mobile-nav-overly').fadeOut();
    }

    // #header scrolls internally (overflow-y: auto), and the page itself may too
    $('#header').stop().animate({ scrollTop: 0 }, 400);
    $('html, body').stop().animate({ scrollTop: 0 }, 400);
  }

  // Explicit data-page="home" wins; otherwise fall back to path sniffing
  function isHomePage() {
    if (document.body.dataset.page) {
      return document.body.dataset.page === 'home';
    }
    var path = window.location.pathname.replace(/index\.html?$/, '');
    return path === '/' || path === '';
  }

  // Brand mark: smooth-scroll home if already here, otherwise navigate home cleanly
  $(document).on('click', '#brand-mark', function(e) {
    e.preventDefault();
    if (isHomePage()) {
      goHome();
    } else {
      window.location.href = '/';
    }
  });

  // Nav Menu
  $(document).on('click', '.nav-menu a, .mobile-nav a', function(e) {
    if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
      var hash = this.hash;
      var target = $(hash);
      if (target.length) {
        e.preventDefault();

        if ($(this).parents('.nav-menu, .mobile-nav').length) {
          $('.nav-menu .active, .mobile-nav .active').removeClass('active');
          $(this).closest('li').addClass('active');
        }

        if (hash == '#header') {
          goHome();
          return;
        }

        if (!$('#header').hasClass('header-top')) {
          $('#header').addClass('header-top');
          setTimeout(function() {
            $("section").removeClass('section-show');
            $(hash).addClass('section-show');
          }, 350);
        } else {
          $("section").removeClass('section-show');
          $(hash).addClass('section-show');
        }

        if ($('body').hasClass('mobile-nav-active')) {
          $('body').removeClass('mobile-nav-active');
          $('.mobile-nav-toggle i').toggleClass('icofont-navigation-menu icofont-close');
          $('.mobile-nav-overly').fadeOut();
        }

        return false;
      }
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    if (navToggle && navLinks) {
      navToggle.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', isOpen);
      });

      navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          navLinks.classList.remove('open');
          navToggle.setAttribute('aria-expanded', 'false');
        });
      });
    }
  });


})(jQuery);