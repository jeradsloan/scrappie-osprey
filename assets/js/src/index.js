(function() {
  var $ = document.querySelector.bind(document),
      $$ = document.querySelectorAll.bind(document);

  function updateNavFixedState(isFixed) {
    var nav = $('nav');
    if (!nav) return;

    nav.classList.toggle('nav-fixed', isFixed);

    // Logo: always visible (in the bottom ribbon at the top of the page, and in
    // the fixed bar after scrolling). Toggle (hamburger) still follows the fixed state.
    var logo = $('nav > .logo');
    if (logo) {
      logo.style.visibility = 'visible';
      logo.classList.add('show');
      logo.classList.remove('hide');
    }

    $$('nav > .nav-toggle').forEach(function(el) {
      if (isFixed) {
        el.style.visibility = 'visible';
        el.classList.add('show');
        el.classList.remove('hide');
      } else {
        el.style.visibility = 'hidden';
        el.classList.add('hide');
        el.classList.remove('show');
      }
    });
  }

  var header = $('header');
  var nav = $('nav');

  if (header && nav) {
    updateNavFixedState(false);
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          // When header is visible (intersecting), nav is at bottom of hero (not fixed)
          // When header scrolled out of view, fix nav to top
          updateNavFixedState(!entry.isIntersecting);
        });
      }, {
        // Trigger as soon as header bottom passes top of viewport
        rootMargin: '-50px 0px 0px 0px',
        threshold: 0
      });

      observer.observe(header);
    } else {
      function updateNavScrollFallback() {
        var scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        var threshold = header.offsetHeight - nav.clientHeight;
        updateNavFixedState(scrollPosition > threshold);
      }
      window.addEventListener('scroll', updateNavScrollFallback, { passive: true });
      updateNavScrollFallback();
    }
  }

  function toggleMenu(forceClose) {
    var navFull = $('.nav-full'),
        main = $('main'),
        navIcon = $('.nav-icon');

    if (!navFull || !main || !navIcon) return;

    var isActive = navFull.classList.contains('active');
    var nextState = forceClose ? false : !isActive;

    [navFull, main].forEach(function(el) {
      el.classList.toggle('active', nextState);
    });

    navIcon.setAttribute('aria-expanded', nextState ? 'true' : 'false');
    navFull.setAttribute('aria-hidden', nextState ? 'false' : 'true');

    var menuImg = navIcon.querySelector('img[alt="Open Menu"]');
    var closeImg = navIcon.querySelector('img[alt="Close Menu"]');

    if (menuImg && closeImg) {
      menuImg.style.display = nextState ? 'none' : 'inline-block';
      closeImg.style.display = nextState ? 'inline-block' : 'none';
    }

    document.documentElement.style.overflowY = nextState ? 'hidden' : 'scroll';
  }

  var navIcon = $('.nav-icon');
  if (navIcon) {
    navIcon.addEventListener('click', function(e) {
      e.preventDefault();
      toggleMenu();
    });
  }

  $$('.nav-full a').forEach(function(link) {
    link.addEventListener('click', function() {
      toggleMenu(true);
    });
  });

  var logo = $('.logo');
  if (logo) {
    logo.addEventListener('click', function() {
      if ($('.nav-full') && $('.nav-full').classList.contains('active')) {
        toggleMenu(true);
      }
    });
  }

  document.body.addEventListener('click', function(e) {
    var navFull = $('.nav-full');
    if (navFull && navFull.classList.contains('active') && !e.target.closest('.nav-icon') && !e.target.closest('.nav-full')) {
      toggleMenu(true);
    }
  });
})();

