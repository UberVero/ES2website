(function () {
  var body = document.body;
  if (!body || !body.classList.contains('page--home')) return;

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hero = document.querySelector('[data-crab="hero"]');
  var callout = document.querySelector('[data-crab="callout"]');
  if (!hero) return;

  function getPolylineMeta(points) {
    var total = 0;
    var lengths = [];

    for (var i = 1; i < points.length; i += 1) {
      total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
      lengths.push(total);
    }

    return { total: total, lengths: lengths };
  }

  function getPointAtDistance(points, meta, distance) {
    if (distance <= 0) return points[0];
    if (distance >= meta.total) return points[points.length - 1];

    var previous = 0;
    for (var i = 0; i < meta.lengths.length; i += 1) {
      var current = meta.lengths[i];
      if (distance <= current) {
        var start = points[i];
        var end = points[i + 1];
        var ratio = (distance - previous) / (current - previous || 1);
        return {
          x: start.x + (end.x - start.x) * ratio,
          y: start.y + (end.y - start.y) * ratio
        };
      }
      previous = current;
    }

    return points[points.length - 1];
  }

  function createWalker(element, buildPath, config) {
    var sprite = element.querySelector('.crab__sprite');
    var state = {
      path: [],
      meta: { total: 0, lengths: [] }
    };

    function updatePath() {
      state.path = buildPath();
      state.meta = getPolylineMeta(state.path);
    }

    function render(time, offset) {
      var local = (time + offset) % (config.travelMs * 2 + config.pauseMs * 2);
      var progress = 0;
      var moving = false;

      if (local < config.travelMs) {
        progress = local / config.travelMs;
        moving = true;
      } else if (local < config.travelMs + config.pauseMs) {
        progress = 1;
      } else if (local < config.travelMs * 2 + config.pauseMs) {
        progress = 1 - ((local - config.travelMs - config.pauseMs) / config.travelMs);
        moving = true;
      }

      var point = getPointAtDistance(state.path, state.meta, state.meta.total * progress);
      var bob = moving ? Math.sin((time + offset) / 180) * 1.4 : 0;

      element.style.transform = 'translate3d(' + point.x + 'px, ' + (point.y + bob) + 'px, 0)';
      sprite.classList.toggle('is-step', moving && Math.floor((time + offset) / 220) % 2 === 0);
    }

    updatePath();

    return {
      updatePath: updatePath,
      render: render,
      rest: function () {
        var point = state.path[0];
        element.style.transform = 'translate3d(' + point.x + 'px, ' + point.y + 'px, 0)';
        sprite.classList.remove('is-step');
      }
    };
  }

  var heroWalker = createWalker(hero, function () {
    var host = hero.parentElement;
    var width = host.clientWidth;
    var height = host.clientHeight;
    var crabWidth = hero.offsetWidth || 72;
    var startX = Math.max(width - 176, 12);
    var endX = Math.max(width - crabWidth - 8, startX + 64);
    var y = Math.max(height - 62, 156);

    return [
      { x: startX, y: y },
      { x: startX + 18, y: y - 1 },
      { x: endX - 18, y: y - 2 },
      { x: endX, y: y }
    ];
  }, { travelMs: 3800, pauseMs: 1100 });

  var calloutWalker = callout ? createWalker(callout, function () {
    var host = callout.parentElement;
    var left = -40;
    var top = 10;
    var bottom = Math.max(host.clientHeight - 86, top + 92);

    return [
      { x: left, y: top },
      { x: left - 1, y: top + 34 },
      { x: left, y: bottom - 28 },
      { x: left + 10, y: bottom + 1 },
      { x: left + 34, y: bottom + 2 }
    ];
  }, { travelMs: 4200, pauseMs: 1200 }) : null;

  function refresh() {
    heroWalker.updatePath();
    if (calloutWalker) calloutWalker.updatePath();

    if (prefersReducedMotion) {
      heroWalker.rest();
      if (calloutWalker) calloutWalker.rest();
    }
  }

  refresh();
  window.addEventListener('resize', refresh);

  if (prefersReducedMotion) return;

  function tick(time) {
    heroWalker.render(time, 0);
    if (calloutWalker) calloutWalker.render(time, 900);
    window.requestAnimationFrame(tick);
  }

  window.requestAnimationFrame(tick);
})();
