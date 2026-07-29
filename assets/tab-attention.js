/* ============================================================
   Eldur Studio — Tab attention
   When the visitor leaves the tab, swap the title and favicon
   so the inactive tab stands out. Restore both on return.
   ============================================================ */
(function () {
  var awayTitle = 'Come back — Eldur Studio';
  // Snapshot at hide time (not load): safer if anything rewrites the title.
  var realTitle = document.title;
  var icon = document.querySelector('link[rel="icon"][type="image/svg+xml"]');
  var realIcon = icon ? icon.getAttribute('href') : null;
  var alertIcon = '/assets/favicon-alert.svg';

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      realTitle = document.title;
      document.title = awayTitle;
      if (icon) icon.setAttribute('href', alertIcon);
    } else {
      document.title = realTitle;
      if (icon && realIcon) icon.setAttribute('href', realIcon);
    }
  });
})();
