/* ============================================================
   ARK Vet Rehab — script.js
   All custom site behaviour for index.html & services.html
   ============================================================ */

/* ----------------------------------------------------------
   NAV — fade out on scroll down, fade in on scroll up
   Applies on every page that includes this script.
---------------------------------------------------------- */
(function () {
  var nav = document.querySelector('nav');
  if (!nav) return;

  var lastY = window.scrollY || window.pageYOffset;
  var ticking = false;
  var DELTA = 6;       // ignore tiny scroll jitter
  var SHOW_TOP = 80;   // always show near the top of the page

  function update() {
    var y = window.scrollY || window.pageYOffset;
    var menuOpen = !!document.querySelector('#navLinks.open');

    if (!menuOpen && Math.abs(y - lastY) > DELTA) {
      if (y > lastY && y > SHOW_TOP) {
        nav.classList.add('nav-hidden');     // scrolling down → hide
      } else {
        nav.classList.remove('nav-hidden');  // scrolling up → show
      }
    }
    if (menuOpen) nav.classList.remove('nav-hidden'); // never hide while menu is open
    lastY = y;
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
})();

/* ----------------------------------------------------------
   0. COOKIE NOTICE BANNER
   Shown once per browser. Dismissed choice stored in
   localStorage so it never appears again on return visits.
   Injected dynamically — zero HTML changes needed per page.
---------------------------------------------------------- */
(function () {
  if (localStorage.getItem('ark_cookie_ok')) return;

  var banner = document.createElement('div');
  banner.id = 'ark-cookie-banner';
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-label', 'Cookie notice');
  banner.innerHTML =
    '<p>We use cookies to improve your experience and analyse site traffic. ' +
    'By clicking Accept, you agree to our <a href="/privacy-policy.html">Privacy Policy</a>.</p>' +
    '<div class="ark-cookie-actions">' +
      '<button class="ark-cookie-decline" id="arkCookieDecline">Decline</button>' +
      '<button class="ark-cookie-accept" id="arkCookieAccept">Accept</button>' +
    '</div>';

  document.body.appendChild(banner);

  /* Slide up after short delay so it doesn't compete with page load */
  setTimeout(function () { banner.classList.add('visible'); }, 900);

  function dismiss() {
    banner.classList.remove('visible');
    setTimeout(function () { banner.remove(); }, 450);
    localStorage.setItem('ark_cookie_ok', '1');
  }

  document.getElementById('arkCookieAccept').addEventListener('click', dismiss);
  document.getElementById('arkCookieDecline').addEventListener('click', dismiss);
})();

/* ----------------------------------------------------------
   0. PAW TRAIL — REMOVED (kept in _paw-trail.backup.js for later re-use).
   To restore: paste the IIFE from that file back here.
---------------------------------------------------------- */

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
   1b. HERO SCROLL-REVEAL — video + stats only trigger after scroll
   Uses a stricter rootMargin so they never fire on page load
---------------------------------------------------------- */
(function () {
  var els = document.querySelectorAll('.hero-scroll-reveal');
  if (!els.length) return;
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -25% 0px'  /* element must be 25 vh above bottom fold */
  });
  els.forEach(function (el) { observer.observe(el); });
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
   Pulsing "tap to view" hint — stays visible permanently
---------------------------------------------------------- */


/* ----------------------------------------------------------
   6. BOOKING FORM — 3-step navigation + PHP submission
---------------------------------------------------------- */
(function () {
  var form = document.getElementById('bkForm');
  if (!form) return;

  var panels = form.querySelectorAll('.bk-panel');
  var labels = document.querySelectorAll('.bk-step-label');
  var fill   = document.querySelector('.bk-progress-fill');
  var cur    = 0;

  function goTo(n) {
    panels[cur].classList.remove('active');
    labels[cur].classList.remove('active');
    cur = n;
    panels[cur].classList.add('active');
    labels[cur].classList.add('active');
    fill.style.width = ((cur + 1) / 3 * 100) + '%';
    document.querySelector('.booking-widget').scrollIntoView({behavior: 'smooth', block: 'nearest'});
    /* Refresh calendar when step 3 becomes visible */
    if (n === 2 && typeof window.bkCalRefresh === 'function') window.bkCalRefresh();
  }

  function validatePanel(panel) {
    var ok = true;
    panel.querySelectorAll('input[required], textarea[required]').forEach(function (inp) {
      if (!inp.value.trim()) { inp.classList.add('bk-error'); ok = false; }
      else inp.classList.remove('bk-error');
    });
    return ok;
  }

  form.querySelectorAll('.bk-btn-next').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (validatePanel(panels[cur]) && cur < 2) goTo(cur + 1);
    });
  });

  form.querySelectorAll('.bk-btn-back').forEach(function (btn) {
    btn.addEventListener('click', function () { if (cur > 0) goTo(cur - 1); });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validatePanel(panels[cur])) return;
    var btn = form.querySelector('.bk-btn-submit');
    btn.disabled = true;
    btn.textContent = 'Sending…';

    fetch('send-booking.php', { method: 'POST', body: new FormData(form) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.ok) {
          window.location.href = 'thanks.html';
        } else {
          btn.disabled = false; btn.textContent = '🐾 Request Appointment';
          alert('Something went wrong. Please WhatsApp us directly.');
        }
      })
      .catch(function () {
        btn.disabled = false; btn.textContent = '🐾 Request Appointment';
        alert('Connection error. Please WhatsApp us at +65 8828 6875.');
      });
  });
})();


/* ----------------------------------------------------------
   7. BOOKING CALENDAR — date + time picker
   Mon–Fri: 09:00–17:30  |  Sat: 09:00–12:30  |  Sun: closed
---------------------------------------------------------- */
(function () {
  var grid    = document.getElementById('bkCalGrid');
  var label   = document.getElementById('bkCalLabel');
  var times   = document.getElementById('bkCalTimes');
  var dateVal = document.getElementById('bkDateVal');
  var timeVal = document.getElementById('bkTimeVal');
  if (!grid) return;

  var today    = new Date();
  today.setHours(0,0,0,0);
  var cur      = new Date(today.getFullYear(), today.getMonth(), 1);
  var selDate  = null;

  var MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
  var DAYS_LABEL = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  /* Time slots by weekday (0=Sun closed, 6=Sat shorter) */
  function getSlots(dow) {
    if (dow === 0) return [];                   // Sunday closed
    var end = (dow === 6) ? 12.5 : 17.5;       // Sat ends 12:30, weekdays 17:30
    var slots = [];
    for (var h = 9; h <= end; h += 0.5) {
      var hh = Math.floor(h);
      var mm = h % 1 === 0.5 ? '30' : '00';
      slots.push((hh < 10 ? '0' : '') + hh + ':' + mm);
    }
    return slots;
  }

  function renderCalendar() {
    label.textContent = MONTHS[cur.getMonth()] + ' ' + cur.getFullYear();
    grid.innerHTML = '';

    var firstDow = new Date(cur.getFullYear(), cur.getMonth(), 1).getDay();
    var daysInMonth = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate();

    /* Empty leading cells */
    for (var i = 0; i < firstDow; i++) {
      var e = document.createElement('div');
      e.className = 'bk-cal-day bk-cal-empty';
      grid.appendChild(e);
    }

    for (var d = 1; d <= daysInMonth; d++) {
      var date = new Date(cur.getFullYear(), cur.getMonth(), d);
      var dow  = date.getDay();
      var btn  = document.createElement('button');
      btn.type = 'button';
      btn.textContent = d;
      btn.className = 'bk-cal-day';
      if (dow === 0) btn.classList.add('bk-cal-sunday');
      if (dow === 0) btn.classList.add('bk-cal-closed'); // Sun closed
      if (date < today) btn.classList.add('bk-cal-past');
      if (date.getTime() === today.getTime()) btn.classList.add('bk-cal-today');
      if (selDate && date.getTime() === selDate.getTime()) btn.classList.add('bk-cal-selected');

      btn.addEventListener('click', function (d, date, dow) {
        return function () {
          selDate = date;
          dateVal.value = date.getFullYear() + '-' +
            String(date.getMonth()+1).padStart(2,'0') + '-' +
            String(d).padStart(2,'0');
          timeVal.value = '';
          renderCalendar();
          renderTimes(dow);
        };
      }(d, date, dow));

      grid.appendChild(btn);
    }
  }

  function renderTimes(dow) {
    times.innerHTML = '';
    var slots = getSlots(dow);
    if (!slots.length) {
      times.classList.add('hidden');
      return;
    }
    times.classList.remove('hidden');
    slots.forEach(function (s) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'bk-time-slot';
      btn.textContent = s;
      btn.addEventListener('click', function () {
        times.querySelectorAll('.bk-time-slot').forEach(function (b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
        timeVal.value = s;
      });
      times.appendChild(btn);
    });
  }

  document.getElementById('bkCalPrev').addEventListener('click', function () {
    cur = new Date(cur.getFullYear(), cur.getMonth() - 1, 1);
    renderCalendar();
  });
  document.getElementById('bkCalNext').addEventListener('click', function () {
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    renderCalendar();
  });

  /* Pre-select today (or next open day if Sunday) and show slots immediately */
  selDate = new Date(today);
  if (selDate.getDay() === 0) selDate.setDate(selDate.getDate() + 1); // skip Sunday
  cur = new Date(selDate.getFullYear(), selDate.getMonth(), 1);        // sync month view
  dateVal.value = selDate.getFullYear() + '-' +
    String(selDate.getMonth() + 1).padStart(2, '0') + '-' +
    String(selDate.getDate()).padStart(2, '0');
  renderCalendar();
  renderTimes(selDate.getDay());

  /* Expose refresh so booking form can re-trigger when step 3 becomes visible */
  window.bkCalRefresh = function () {
    renderCalendar();
    if (selDate) renderTimes(selDate.getDay());
  };
})();


/* ----------------------------------------------------------
   8. COUNTRY CODE PICKER
---------------------------------------------------------- */
(function () {
  var btn = document.getElementById('bkCcBtn');
  if (!btn) return;

  var dropdown = document.getElementById('bkCcDropdown');
  var search   = document.getElementById('bkCcSearch');
  var list     = document.getElementById('bkCcList');
  var flagEl   = document.getElementById('bkCcFlag');
  var codeEl   = document.getElementById('bkCcCode');
  var hidden   = document.getElementById('bkCcValue');

  var countries = [
    ['🇸🇬','Singapore','+65'],
    ['🇦🇺','Australia','+61'],['🇦🇹','Austria','+43'],
    ['🇧🇭','Bahrain','+973'],['🇧🇩','Bangladesh','+880'],
    ['🇧🇪','Belgium','+32'],['🇧🇳','Brunei','+673'],
    ['🇧🇷','Brazil','+55'],['🇰🇭','Cambodia','+855'],
    ['🇨🇦','Canada','+1'],['🇨🇳','China','+86'],
    ['🇩🇰','Denmark','+45'],['🇪🇬','Egypt','+20'],
    ['🇫🇮','Finland','+358'],['🇫🇷','France','+33'],
    ['🇩🇪','Germany','+49'],['🇬🇷','Greece','+30'],
    ['🇭🇰','Hong Kong','+852'],['🇮🇳','India','+91'],
    ['🇮🇩','Indonesia','+62'],['🇮🇪','Ireland','+353'],
    ['🇮🇱','Israel','+972'],['🇮🇹','Italy','+39'],
    ['🇯🇵','Japan','+81'],['🇯🇴','Jordan','+962'],
    ['🇰🇪','Kenya','+254'],['🇰🇷','South Korea','+82'],
    ['🇰🇼','Kuwait','+965'],['🇱🇦','Laos','+856'],
    ['🇱🇧','Lebanon','+961'],['🇲🇾','Malaysia','+60'],
    ['🇲🇻','Maldives','+960'],['🇲🇽','Mexico','+52'],
    ['🇲🇳','Mongolia','+976'],['🇲🇲','Myanmar','+95'],
    ['🇳🇵','Nepal','+977'],['🇳🇱','Netherlands','+31'],
    ['🇳🇿','New Zealand','+64'],['🇳🇬','Nigeria','+234'],
    ['🇳🇴','Norway','+47'],['🇴🇲','Oman','+968'],
    ['🇵🇰','Pakistan','+92'],['🇵🇭','Philippines','+63'],
    ['🇵🇱','Poland','+48'],['🇵🇹','Portugal','+351'],
    ['🇶🇦','Qatar','+974'],['🇷🇺','Russia','+7'],
    ['🇸🇦','Saudi Arabia','+966'],['🇿🇦','South Africa','+27'],
    ['🇪🇸','Spain','+34'],['🇱🇰','Sri Lanka','+94'],
    ['🇸🇪','Sweden','+46'],['🇨🇭','Switzerland','+41'],
    ['🇹🇼','Taiwan','+886'],['🇹🇭','Thailand','+66'],
    ['🇹🇷','Turkey','+90'],['🇦🇪','UAE','+971'],
    ['🇬🇧','United Kingdom','+44'],['🇺🇸','United States','+1'],
    ['🇻🇳','Vietnam','+84']
  ];

  var selected = countries[0];

  function renderList(query) {
    list.innerHTML = '';
    var q = (query || '').toLowerCase();
    countries.forEach(function (c) {
      if (q && c[1].toLowerCase().indexOf(q) === -1 && c[2].indexOf(q) === -1) return;
      var item = document.createElement('div');
      item.className = 'bk-cc-item' + (c === selected ? ' active' : '');
      item.innerHTML = '<span>' + c[0] + '</span>' +
        '<span class="bk-cc-item-name">' + c[1] + '</span>' +
        '<span class="bk-cc-item-dial">' + c[2] + '</span>';
      item.addEventListener('click', function () {
        selected = c;
        flagEl.textContent = c[0];
        codeEl.textContent = c[2];
        hidden.value = c[2];
        dropdown.classList.remove('open');
        search.value = '';
        renderList('');
      });
      list.appendChild(item);
    });
  }

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    dropdown.classList.toggle('open');
    if (dropdown.classList.contains('open')) { search.focus(); renderList(''); }
  });

  search.addEventListener('input', function () { renderList(search.value); });
  search.addEventListener('click', function (e) { e.stopPropagation(); });

  document.addEventListener('click', function () { dropdown.classList.remove('open'); });

  renderList('');
})();

/* ── Why Choose Us — tabs (desktop auto-rotate) + accordion (mobile) ── */
(function () {
  var tabs   = Array.from(document.querySelectorAll('.why-tab'));
  var panels = Array.from(document.querySelectorAll('.why-panel'));
  if (!tabs.length) return;

  var isDesktop = function () { return window.innerWidth > 880; };

  /* ── Mobile: move panels into tab list for accordion layout ── */
  (function setupMobile() {
    if (isDesktop()) return;
    var list = document.querySelector('.why-tab-list');
    var wrap = document.querySelector('.why-panels');
    if (!list || !wrap || list.dataset.mobileReady) return;
    tabs.forEach(function (tab, i) {
      tab.after(panels[i]);   // insert panel directly below its tab
    });
    wrap.style.display = 'none';
    list.dataset.mobileReady = '1';
  })();

  /* ── Activate a tab + its panel ── */
  function goTo(idx) {
    tabs.forEach(function (t, i) {
      var active = (i === idx);
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', String(active));
      // Restart progress fill animation on desktop
      if (isDesktop()) {
        var fill = t.querySelector('.why-prog-fill');
        if (fill) {
          fill.style.animation = 'none';
          fill.offsetHeight;                        // force reflow
          fill.style.animation = active ? '' : 'none';
        }
      }
    });
    panels.forEach(function (p, i) {
      p.classList.toggle('is-active', i === idx);
    });
  }

  /* ── Desktop: chain auto-rotation on animationend (bar must finish first) ── */
  function autoFrom(idx) {
    if (!isDesktop()) return;
    var fill = tabs[idx] && tabs[idx].querySelector('.why-prog-fill');
    if (!fill) return;
    fill.addEventListener('animationend', function () {
      if (!isDesktop()) return;   // guard in case viewport changed
      var next = (idx + 1) % tabs.length;
      goTo(next);
      autoFrom(next);
    }, { once: true });
  }

  /* ── Tab click ── */
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () {
      if (!isDesktop()) {
        /* Mobile: toggle — tap open tab to close it */
        if (tab.classList.contains('is-active')) {
          tab.classList.remove('is-active');
          tab.setAttribute('aria-selected', 'false');
          panels[i].classList.remove('is-active');
          return;
        }
      }
      goTo(i);
      if (isDesktop()) autoFrom(i);   // restart auto-rotation from clicked tab
    });
  });

  /* ── Init ── */
  goTo(0);
  autoFrom(0);   // desktop only — noop on mobile

  /* ── Fix: reload if viewport crosses the 880px breakpoint ──
     setupMobile() moves panels in the DOM once; crossing the breakpoint
     without a reload leaves the layout broken. Reload resets cleanly. */
  var _wasDesktop = isDesktop();
  window.addEventListener('resize', function () {
    var _nowDesktop = isDesktop();
    if (_wasDesktop !== _nowDesktop) {
      _wasDesktop = _nowDesktop;
      location.reload();
    }
  });

  /* ── Fix: move aria-live to tab-list on mobile so screen readers
     announce panel changes after setupMobile() hides .why-panels ── */
  if (!isDesktop()) {
    var _list = document.querySelector('.why-tab-list');
    if (_list) _list.setAttribute('aria-live', 'polite');
  }
})();

/* ----------------------------------------------------------
   9. PLATO BOOKING — visit-type selector → calendar iframe
   Step 1: choose visit type (On-site / House / Online)
   Step 2: load that calendar's Plato URL into the iframe
---------------------------------------------------------- */
(function () {
  var root = document.getElementById('bkPlato');
  if (!root) return;

  var step1 = document.getElementById('bkVisitStep');
  var step2 = document.getElementById('bkCalStep');
  var frame = document.getElementById('bkPlatoFrame');
  var sub   = document.getElementById('bkPlatoSub');
  var back  = document.getElementById('bkVisitBack');
  var cards = root.querySelectorAll('.bk-visit-card');
  var defaultSub = sub ? sub.textContent : '';

  cards.forEach(function (card) {
    card.addEventListener('click', function () {
      var url   = card.getAttribute('data-cal') || '';
      var label = card.getAttribute('data-label') || card.textContent.trim();

      // Placeholder calendars not set up yet
      if (!url || url.indexOf('REPLACE_WITH') !== -1) {
        if (sub) sub.textContent = label + ' isn’t available online yet — please WhatsApp us to book.';
        return;
      }

      frame.src = url;
      if (sub) sub.textContent = label + ' · pick a date & time';
      step1.hidden = true;
      step2.hidden = false;
      step2.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  });

  if (back) {
    back.addEventListener('click', function () {
      step2.hidden = true;
      step1.hidden = false;
      frame.src = 'about:blank';
      if (sub) sub.textContent = defaultSub;
      root.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  /* Auto-fit the iframe height if Plato broadcasts its content height via postMessage.
     This removes the inner scrollbar without cropping the calendar. Best-effort:
     if Plato never posts a height, the CSS min-height fallback applies. */
  window.addEventListener('message', function (e) {
    if (typeof e.origin !== 'string' || e.origin.indexOf('platomedical.com') === -1) return;
    var d = e.data, h = null;
    if (typeof d === 'number') h = d;
    else if (typeof d === 'string' && /^\d+$/.test(d.trim())) h = parseInt(d, 10);
    else if (d && typeof d === 'object') h = d.height || d.frameHeight || d.scrollHeight || (d.payload && d.payload.height);
    h = parseInt(h, 10);
    if (h && h > 200 && frame) {
      frame.style.height = h + 'px';
      frame.style.minHeight = '0';
    }
  }, false);
})();
