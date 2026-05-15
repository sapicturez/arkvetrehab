/* ============================================================
   ARK Vet Rehab — script.js
   All custom site behaviour for index.html & services.html
   ============================================================ */

/* ----------------------------------------------------------
   1. REVEAL ON SCROLL
   Adds .in to any .reveal element when it enters the viewport
---------------------------------------------------------- */
(function () {
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) entry.target.classList.add('in');
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('.reveal').forEach(function (el) {
    observer.observe(el);
  });
})();


/* ----------------------------------------------------------
   2. MOBILE NAV — close menu when a link is clicked
---------------------------------------------------------- */
(function () {
  document.querySelectorAll('.nav-links a').forEach(function (a) {
    a.addEventListener('click', function () {
      document.getElementById('navLinks').classList.remove('open');
    });
  });
})();


/* ----------------------------------------------------------
   3. WHY-US ACCORDION
   - Desktop (≥881px): all items forced open, clicks blocked
   - Mobile/tablet: single-open accordion with smooth close
   Only runs on pages that have .why-item elements
---------------------------------------------------------- */
(function () {
  var items = document.querySelectorAll('.why-item');
  if (!items.length) return;

  var DESKTOP = 881;
  function isDesktop() { return window.innerWidth >= DESKTOP; }

  function setMode() {
    if (isDesktop()) {
      items.forEach(function (det) { det.setAttribute('open', ''); });
    } else {
      items.forEach(function (det) {
        det.removeAttribute('open');
        det.classList.remove('closing');
      });
    }
  }

  setMode();
  window.addEventListener('resize', setMode);

  items.forEach(function (det) {
    det.addEventListener('click', function (e) {
      if (!e.target.closest('summary')) return;
      if (isDesktop()) { e.preventDefault(); return; }

      if (det.open) {
        e.preventDefault();
        det.classList.add('closing');
        setTimeout(function () {
          det.classList.remove('closing');
          det.removeAttribute('open');
        }, 380);
      } else {
        items.forEach(function (other) {
          if (other !== det && other.open && !other.classList.contains('closing')) {
            other.classList.add('closing');
            setTimeout(function () {
              other.classList.remove('closing');
              other.removeAttribute('open');
            }, 380);
          }
        });
      }
    });
  });
})();


/* ----------------------------------------------------------
   4. LIGHTBOX
   Opens a full-screen image overlay; keyboard + click nav
   Only runs on pages that have #lightbox
---------------------------------------------------------- */
(function () {
  var lb = document.getElementById('lightbox');
  var li = document.getElementById('lbImg');
  if (!lb || !li) return;

  var imgs = [
    './images/1arkvetrehab.jpg', './images/2arkvetrehab.jpg',
    './images/3arkvetrehab.jpg', './images/4arkvetrehab.jpg',
    './images/5arkvetrehab.jpg', './images/6arkvetrehab.jpg',
    './images/7arkvetrehab.jpg', './images/8arkvetrehab.jpg'
  ];
  var cur = 0;

  window.openLightbox = function (i) {
    cur = i;
    li.src = imgs[cur];
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  window.closeLightbox = function () {
    lb.classList.remove('open');
    document.body.style.overflow = '';
  };

  window.shiftLb = function (d, e) {
    if (e) e.stopPropagation();
    cur = (cur + d + imgs.length) % imgs.length;
    li.src = imgs[cur];
  };

  window.handleLbClick = function (e) {
    if (e.target === lb) closeLightbox();
  };

  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'ArrowLeft')  shiftLb(-1);
    else if (e.key === 'ArrowRight') shiftLb(1);
    else if (e.key === 'Escape')     closeLightbox();
  });

  /* ── Touch swipe in lightbox ── */
  var tsX = 0;
  lb.addEventListener('touchstart', function (e) {
    tsX = e.touches[0].clientX;
  }, { passive: true });

  lb.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - tsX;
    if (Math.abs(dx) < 40) return;   /* ignore tiny taps */
    shiftLb(dx < 0 ? 1 : -1);
  }, { passive: true });
})();


/* ----------------------------------------------------------
   5. GALLERY TAP HINT
   Shows a pulsing "tap to view" hint on the first gallery
   thumb, fades out after 2.5s or on first tap
---------------------------------------------------------- */
(function () {
  var thumbs = document.querySelectorAll('.gallery-thumb');
  if (!thumbs.length) return;

  /* Animate hint out once any thumb is tapped/clicked */
  function dismissHint() {
    var hint = document.querySelector('.gallery-hint');
    if (hint) { hint.classList.add('gone'); }
    thumbs.forEach(function (t) { t.removeEventListener('click', dismissHint); });
  }

  thumbs.forEach(function (t) { t.addEventListener('click', dismissHint); });

  /* Auto-fade after 3s */
  setTimeout(dismissHint, 3000);
})();
