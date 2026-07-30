/* ============================================================
   Eldur Studio — Tab attention
   When the visitor leaves the tab for at least 30s, swap the
   title and favicon so the inactive tab stands out. Restore
   both on return (and cancel if they come back sooner).
   ============================================================ */
(function () {
  var awayTitle = 'Come back!';
  var delayMs = 30000;
  // Snapshot at hide time (not load): safer if anything rewrites the title.
  var realTitle = document.title;
  var icon = document.querySelector('link[rel="icon"][type="image/svg+xml"]');
  var realIcon = icon ? icon.getAttribute('href') : null;
  var alertIcon = '/assets/favicon-alert.svg';
  var awayTimer = null;
  var isAway = false;

  function applyAway() {
    isAway = true;
    document.title = awayTitle;
    if (icon) icon.setAttribute('href', alertIcon);
  }

  function restore() {
    if (awayTimer) {
      clearTimeout(awayTimer);
      awayTimer = null;
    }
    if (!isAway) return;
    isAway = false;
    document.title = realTitle;
    if (icon && realIcon) icon.setAttribute('href', realIcon);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      realTitle = document.title;
      if (awayTimer) clearTimeout(awayTimer);
      awayTimer = setTimeout(applyAway, delayMs);
    } else {
      restore();
    }
  });
})();
