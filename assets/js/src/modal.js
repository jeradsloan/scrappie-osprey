(function() {
  var $ = document.querySelector.bind(document),
      $$ = document.querySelectorAll.bind(document),
      activeModal = null,
      lastFocusedElement = null,
      modalBoxes = $$('.modal-box'),
      openLinks = $$('.gallery-modal-link'),
      closeLinks = $$('.close'),
      galleryItems = $$('.gallery-item');

  function ensureVjsLoaded() {
    if (window.videojs) return Promise.resolve();
    if (window.__vjsLoadPromise) return window.__vjsLoadPromise;
    window.__vjsLoadPromise = new Promise(function (resolve, reject) {
      var a = window.__vjsAssets;
      if (!a) { reject(new Error('vjs assets missing')); return; }
      var pending = 2, settled = false;
      function done() { if (!settled && --pending === 0) { settled = true; resolve(); } }
      function fail(e) { if (!settled) { settled = true; reject(e); } }
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = a.css;
      link.onload = done;
      link.onerror = fail;
      document.head.appendChild(link);
      var s = document.createElement('script');
      s.src = a.js;
      s.onload = done;
      s.onerror = fail;
      document.head.appendChild(s);
    });
    return window.__vjsLoadPromise;
  }

  function initVjsPlayer(el) {
    if (el.__vjsPlayer) return el.__vjsPlayer;
    var player = videojs(el, {
      fluid: true,
      responsive: true,
      playsinline: true,
      preload: 'metadata',
      playbackRates: [0.5, 1, 1.25, 1.5, 2],
      html5: { vhs: { overrideNative: false, enableLowInitialPlaylist: true } }
    });
    player.addClass('vjs-scrappie');
    el.__vjsPlayer = player;
    return player;
  }

  // Set sources + wire HLS->mp4 fallback ONCE, at pre-init time (before any tap).
  function setVjsSources(player, vjsEl) {
    var hlsSrc = vjsEl.getAttribute('data-vjs-manifest');
    var mp4Src = vjsEl.getAttribute('data-mp4-fallback');
    var sources = [{ src: hlsSrc, type: 'application/vnd.apple.mpegurl' }];
    if (mp4Src) sources.push({ src: mp4Src, type: 'video/mp4' });
    player.src(sources);
    if (mp4Src && !player.__vjsFallbackWired) {
      player.__vjsFallbackWired = true;
      var triedFallback = false;
      player.on('error', function () {
        if (triedFallback || !player.error()) return;
        triedFallback = true;
        player.reset();
        player.src({ src: mp4Src, type: 'video/mp4' });
      });
    }
  }

  // Pre-initialize a modal's player so it's buffered BEFORE the user taps.
  function setupVjsModal(vjsEl) {
    if (vjsEl.__vjsSetupStarted) return;
    vjsEl.__vjsSetupStarted = true;
    ensureVjsLoaded().then(function () {
      if (!window.videojs) return;
      var player = initVjsPlayer(vjsEl);
      setVjsSources(player, vjsEl);
    }).catch(function (e) { if (window.console) console.error('vjs load failed', e); });
  }

  function animateOpen(box) {
    if (!box) return;
    box.classList.add('scale-in-center');
    box.classList.remove('scale-out-center');
  }

  function animateClose(box, callback) {
    if (!box) return;
    box.classList.remove('scale-in-center');
    box.classList.add('scale-out-center');
    setTimeout(function() {
      if (callback) callback();
    }, 400);
  }

  function triggerModalOpen(href, triggerEl) {
    if (!href) return;
    var targetModal = $(href);
    if (!targetModal) return;

    lastFocusedElement = triggerEl || document.activeElement;
    activeModal = targetModal;
    activeModal.classList.add('active');

    var box = activeModal.querySelector('.modal-box');
    animateOpen(box);

    var iframe = activeModal.querySelector('iframe[data-src]');
    if (iframe) {
      iframe.src = iframe.getAttribute('data-src') + '&autoplay=1';
    }

    var vjsEl = activeModal.querySelector('video[data-vjs-manifest]');
    if (vjsEl) {
      var player = vjsEl.__vjsPlayer;
      if (player) {
        // WARM PATH: pre-initialized by preloadVisibleModals(). play() is a direct,
        // synchronous call inside this click handler -> unmuted playback allowed on iOS + Android.
        player.play().catch(function () { /* blocked: big play button shown */ });
      } else {
        // COLD PATH: tapped before pre-init finished. Async script load breaks the
        // gesture chain, so unmuted playback may be blocked. Still fully usable.
        var modalRef = activeModal;
        ensureVjsLoaded().then(function () {
          if (activeModal !== modalRef) return;  // closed during load
          var p = initVjsPlayer(vjsEl);
          setVjsSources(p, vjsEl);
          p.one('loadedmetadata', function () { p.play().catch(function () {}); });
        }).catch(function (e) { if (window.console) console.error('vjs load failed', e); });
      }
    }

    var closeBtn = activeModal.querySelector('.close');
    if (closeBtn) {
      closeBtn.focus();
    }
  }

  function closeModal() {
    if (!activeModal) return;

    var modalRef = activeModal;
    var box = modalRef.querySelector('.modal-box');

    animateClose(box, function() {
      modalRef.classList.remove('active');
      var iframe = modalRef.querySelector('iframe[data-src]');
      if (iframe) {
        iframe.removeAttribute('src');
      }
      var vjsEl = modalRef.querySelector('video[data-vjs-manifest]');
      if (vjsEl && window.videojs) {
        var player = videojs.getPlayer(vjsEl);
        if (player) { player.pause(); }
      }
      if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
      }
      activeModal = null;
    });
  }

  openLinks.forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      triggerModalOpen(link.getAttribute('href'), link);
    });
  });

  galleryItems.forEach(function(item) {
    item.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        var link = item.querySelector('.gallery-modal-link');
        if (link) {
          triggerModalOpen(link.getAttribute('href'), item);
        }
      }
    });

    item.addEventListener('click', function(e) {
      if (e.target.classList.contains('gallery-modal-link')) return;
      var link = item.querySelector('.gallery-modal-link');
      if (link) {
        e.preventDefault();
        triggerModalOpen(link.getAttribute('href'), item);
      }
    });

    if (window.matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches) {
      var v = item.querySelector('video[data-trailer]');
      if (v) {
        item.addEventListener('mouseenter', function() { v.play().catch(function(){}); });
        item.addEventListener('mouseleave', function() { v.pause(); v.load(); });
      }
    }
  });

  closeLinks.forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      closeModal();
    });
  });

  // Next-video link: swap to the next gallery video modal (instant close, open anim).
  var nextLinks = $$('.modal-next-link');
  nextLinks.forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      var href = link.getAttribute('href');
      var targetModal = $(href);
      if (!targetModal) return;

      var currentModal = activeModal;
      if (currentModal && currentModal !== targetModal) {
        var vjsEl = currentModal.querySelector('video[data-vjs-manifest]');
        if (vjsEl && window.videojs) {
          var player = videojs.getPlayer(vjsEl);
          if (player) { player.pause(); }
        }
        var iframe = currentModal.querySelector('iframe[data-src]');
        if (iframe) { iframe.removeAttribute('src'); }
        var cbox = currentModal.querySelector('.modal-box');
        if (cbox) { cbox.classList.remove('scale-in-center', 'scale-out-center'); }
        currentModal.classList.remove('active');
      }

      triggerModalOpen(href, link);
    });
  });

  window.addEventListener('click', function(e) {
    if (activeModal && e.target === activeModal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', function(e) {
    if (!activeModal) return;

    if (e.key === 'Escape') {
      closeModal();
      return;
    }

    if (e.key === 'Tab') {
      var focusables = activeModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!focusables.length) return;

      var firstEl = focusables[0];
      var lastEl = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    }
  });

  // Lazy pre-init: warm up video.js players for gallery cards near the viewport so
  // the first tap hits a buffered player (warm path -> unmuted single-tap autoplay).
  function preloadVisibleModals() {
    var setupForItem = function (item) {
      var link = item.querySelector('.gallery-modal-link');
      if (!link) return;
      var modal = document.querySelector(link.getAttribute('href'));
      if (!modal) return;
      var vjsEl = modal.querySelector('video[data-vjs-manifest]');
      if (vjsEl) setupVjsModal(vjsEl);
    };
    if (!('IntersectionObserver' in window)) {
      galleryItems.forEach(setupForItem);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        setupForItem(entry.target);
        io.unobserve(entry.target);
      });
    }, { rootMargin: '300px 0px' });
    galleryItems.forEach(function (item) { io.observe(item); });
  }

  preloadVisibleModals();

})();

