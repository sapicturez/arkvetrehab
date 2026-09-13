/* ARK cookie preferences. Optional services are never requested before consent. */
(function () {
  'use strict';
  var KEY = 'ark_cookie_consent_v2';
  var MAX_AGE = 180 * 24 * 60 * 60 * 1000;
  var GA_ID = 'G-MQ59ZFM9GW';
  var started = false;
  var pending = false;
  var banner;
  var returnFocus;

  function readChoice() {
    try {
      var saved = JSON.parse(localStorage.getItem(KEY));
      if (saved && saved.version === 2 &&
          (saved.choice === 'accepted' || saved.choice === 'declined') &&
          typeof saved.time === 'number' && saved.time <= Date.now() &&
          Date.now() - saved.time < MAX_AGE) return saved.choice;
    } catch (error) { /* Unavailable or invalid storage must fail closed. */ }
    return null;
  }
  var choice = readChoice();
  try { localStorage.removeItem('ark_cookie_ok'); } catch (error) {}

  function clearOptionalCookies() {
    var domains = ['', location.hostname];
    if (/(^|\.)arkvetrehab\.com$/.test(location.hostname)) domains.push('arkvetrehab.com');
    var paths = ['/'];
    var parts = location.pathname.split('/');
    for (var i = 1; i < parts.length; i++) paths.push(parts.slice(0, i).join('/') + '/');
    document.cookie.split(';').forEach(function (cookie) {
      var name = cookie.split('=')[0].trim();
      if (!/^(?:_ga(?:_|$)|_gid$|_gat(?:_|$)|_gcl_|_clck$|_clsk$|_hj|_mc_|mc_|MCPopup|MCEvilPopup|mailchimp)/i.test(name)) return;
      domains.forEach(function (domain) {
        paths.forEach(function (path) {
          document.cookie = name + '=; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=' + path + (domain ? '; domain=' + domain : '') + '; SameSite=Lax';
        });
      });
    });
  }

  // These are local queues only. No Google or Microsoft code is loaded here.
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window['ga-disable-' + GA_ID] = choice !== 'accepted';
  window.gtag('consent', 'default', {
    analytics_storage: 'denied', ad_storage: 'denied',
    ad_user_data: 'denied', ad_personalization: 'denied'
  });
  if (choice !== 'accepted') clearOptionalCookies();

  function addScript(id, src) {
    if (document.getElementById(id)) return;
    var script = document.createElement('script');
    script.id = id;
    script.async = true;
    script.src = src;
    document.head.appendChild(script);
  }

  function loadMap(frame) {
    if (!frame.dataset.arkMapSrc) return;
    frame.src = frame.dataset.arkMapSrc;
    delete frame.dataset.arkMapSrc;
    frame.hidden = false;
    var placeholder = frame.parentNode.querySelector('.ark-map-consent');
    if (placeholder) placeholder.remove();
  }

  function startOptionalServices() {
    if (started || pending || choice !== 'accepted') return;
    pending = true;
    // Keep the first screen ahead of optional services, including on return visits.
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      pending = false;
      if (choice !== 'accepted' || started) return;
      started = true;
      window['ga-disable-' + GA_ID] = false;
      window.gtag('consent', 'update', { analytics_storage: 'granted' });
      window.gtag('js', new Date());
      window.gtag('config', GA_ID, {
        allow_google_signals: false, allow_ad_personalization_signals: false,
        cookie_expires: 180 * 24 * 60 * 60
      });
      addScript('ark-ga', 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID);
      if (document.body.hasAttribute('data-ark-booking-confirmation')) {
        window.gtag('event', 'booking_request_sent', { event_category: 'form', event_label: 'booking_form' });
      }
      if (document.body.hasAttribute('data-ark-clarity')) {
        window.clarity = window.clarity || function () { (window.clarity.q = window.clarity.q || []).push(arguments); };
        window.clarity('consentv2', { analytics_Storage: 'granted', ad_Storage: 'denied' });
        addScript('ark-clarity', 'https://www.clarity.ms/tag/wrzh4olbi6');
      }
      if (document.body.hasAttribute('data-ark-mailchimp')) {
        addScript('mcjs', 'https://chimpstatic.com/mcjs-connected/js/users/2f53abceec0411cbbcd592f88/88538bbf13c08ae05ef2374b7.js');
      }
      document.querySelectorAll('[data-ark-map-src]').forEach(loadMap);
    }); });
  }

  function closeBanner() {
    if (!banner) return;
    banner.remove();
    banner = null;
    if (returnFocus && returnFocus.isConnected) returnFocus.focus({ preventScroll: true });
  }

  function choose(next) {
    choice = next;
    try { localStorage.setItem(KEY, JSON.stringify({ version: 2, choice: next, time: Date.now() })); } catch (error) {}
    closeBanner();
    if (next === 'accepted') startOptionalServices();
    else {
      window['ga-disable-' + GA_ID] = true;
      if (started) {
        window.gtag('consent', 'update', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
        if (window.clarity) window.clarity('consentv2', { analytics_Storage: 'denied', ad_Storage: 'denied' });
      }
      clearOptionalCookies();
      // Unload third-party code; removing script elements alone cannot stop it.
      if (started || document.querySelector('iframe[data-ark-map-loaded]')) location.reload();
    }
  }

  function showBanner(fromSettings) {
    if (banner) {
      if (fromSettings) banner.focus();
      return;
    }
    returnFocus = fromSettings ? document.activeElement : null;
    banner = document.createElement('section');
    banner.id = 'ark-cookie-banner';
    banner.className = 'visible';
    banner.tabIndex = -1;
    banner.setAttribute('aria-label', 'Cookie preferences');
    banner.innerHTML = '<div><strong>Your privacy, your choice</strong>' +
      '<p>With your permission, we use Google Analytics and Clarity to understand visits, Mailchimp for marketing features, and Google Maps for maps. ' +
      'Decline keeps these off. You can change your choice in Cookie settings. ' +
      '<a href="/privacy-policy.html#cookies">Privacy Policy</a>.</p>' +
      (choice ? '<p class="ark-cookie-current">Current choice: ' + (choice === 'accepted' ? 'accepted' : 'declined') + '.</p>' : '') + '</div>' +
      '<div class="ark-cookie-actions"><button type="button" class="ark-cookie-decline" id="arkCookieDecline">Decline</button>' +
      '<button type="button" class="ark-cookie-accept" id="arkCookieAccept">Accept</button></div>' +
      (fromSettings ? '<button type="button" class="ark-cookie-close">Close without changing</button>' : '');
    document.body.appendChild(banner);
    banner.querySelector('#arkCookieDecline').addEventListener('click', function () { choose('declined'); });
    banner.querySelector('#arkCookieAccept').addEventListener('click', function () { choose('accepted'); });
    if (fromSettings) {
      banner.querySelector('.ark-cookie-close').addEventListener('click', closeBanner);
      banner.addEventListener('keydown', function (event) { if (event.key === 'Escape') closeBanner(); });
      banner.focus({ preventScroll: true });
    }
  }

  document.addEventListener('click', function (event) {
    var settings = event.target.closest('[data-ark-cookie-settings]');
    if (settings) { event.preventDefault(); showBanner(true); }
    var mapButton = event.target.closest('[data-ark-load-map]');
    if (mapButton) {
      var frame = mapButton.closest('.ark-map-consent').parentNode.querySelector('[data-ark-map-src]');
      if (frame) { frame.setAttribute('data-ark-map-loaded', ''); loadMap(frame); }
    }
  });

  // A choice in another tab also stops scripts already running in this tab.
  window.addEventListener('storage', function (event) {
    if (event.key !== KEY && event.key !== null) return;
    if (readChoice() !== choice) location.reload();
  });
  window.addEventListener('pageshow', function (event) {
    if (event.persisted && readChoice() !== choice) location.reload();
  });
  if (choice === 'accepted') startOptionalServices();
  else if (!choice) showBanner(false);
})();
