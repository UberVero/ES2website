/* Fathom values are in cents. The Watchtower click carries a nominal
   $1 value, not purchase revenue; set its event currency to USD in Fathom. */
(function () {
  'use strict';

  function track(name, options) {
    if (!window.fathom || typeof window.fathom.trackEvent !== 'function') return;
    window.fathom.trackEvent(name, options);
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest('a');
    if (!link) return;
    if (/^mailto:/i.test(link.getAttribute('href') || '')) {
      track('email-contact-click');
    } else if (link.dataset.analyticsEvent) {
      var value = link.dataset.analyticsValue;
      track(link.dataset.analyticsEvent, value ? { _value: Number(value) } : undefined);
    }
  });

  // Observe the heading rather than the whole section: the cards can be
  // taller than the screen on a phone. Count once per page load.
  var heading = document.querySelector('#watchtower .section__title');
  if (!heading || !('IntersectionObserver' in window)) return;
  var observer = new IntersectionObserver(function (entries) {
    if (entries.some(function (entry) { return entry.isIntersecting; })) {
      track('self-serve-agents-viewed');
      observer.disconnect();
    }
  }, { threshold: 0 });
  observer.observe(heading);
})();
