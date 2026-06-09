/* ============================================================
   Eldur Studio — InstallAgent (vanilla JS)
   Drives the install animation: idle → installing → done.
   - Self-demo: a plain <button data-install-agent> cycles on click.
   - Stripe link: an <a data-install-agent href="..."> just navigates.
   - Controlled: add data-controlled and drive it from your app:
        EldurInstallAgent.setState(el, 'installing');  // after payment
        EldurInstallAgent.setState(el, 'done');        // after setup
   The fill sweep is a CSS transition (robust even in background tabs);
   a timer guarantees completion; rAF only animates the % counter.
   ============================================================ */
(function () {
  var COPY = {
    installing: ['Installing…', 'Provisioning your agent'],
    done: ['Agent installed', 'Setup complete'],
  };

  function setState(el, state) {
    var dur = parseInt(el.getAttribute('data-duration') || '2200', 10);
    var fill = el.querySelector('.ia2-fill');
    var bot  = el.querySelector('.ia2bot');
    var main = el.querySelector('.ia2-main');
    var sub  = el.querySelector('.ia2-sub');
    var idleMain = el.getAttribute('data-label')    || 'Install agent';
    var idleSub  = el.getAttribute('data-sublabel') || 'Self-service guided setup';

    el.classList.toggle('is-installing', state === 'installing');
    el.classList.toggle('is-done', state === 'done');
    if (bot) {
      bot.classList.toggle('ia2bot--working', state === 'installing');
      bot.classList.toggle('ia2bot--done', state === 'done');
    }
    if (main) main.textContent = state === 'idle' ? idleMain : COPY[state][0];
    if (sub)  sub.textContent  = state === 'idle' ? idleSub  : COPY[state][1];

    function setFill(t, instant) {
      if (!fill) return;
      fill.style.transition = instant ? 'none' : 'transform ' + dur + 'ms cubic-bezier(.4,0,.2,1)';
      fill.style.transform = 'scaleX(' + t + ')';
    }

    cancelAnimationFrame(el._raf);
    clearTimeout(el._to);
    var pct = el.querySelector('.ia2-pct');
    if (pct) pct.remove();

    if (state === 'idle') { setFill(0, true); el._state = 'idle'; return; }
    if (state === 'done') { setFill(1, true); el._state = 'done'; return; }

    /* installing */
    pct = document.createElement('span');
    pct.className = 'ia2-pct';
    pct.textContent = '0%';
    el.appendChild(pct);

    setFill(0, true);
    if (fill) void fill.offsetWidth;   // force reflow so the transition runs
    setFill(1, false);

    var start = performance.now();
    function tick(now) {
      var p = Math.min(1, (now - start) / dur);
      pct.textContent = Math.round(p * 100) + '%';
      if (p < 1) el._raf = requestAnimationFrame(tick);
    }
    el._raf = requestAnimationFrame(tick);
    el._state = 'installing';

    /* self-demo auto-advances; controlled mode waits for the app */
    if (!el._controlled) el._to = setTimeout(function () { setState(el, 'done'); }, dur + 60);
  }

  function onClick(e) {
    var el = e.currentTarget;
    if (el.hasAttribute('data-href') || el.tagName === 'A') return; // link navigates
    if (el._controlled) return;
    if (el._state === 'installing') { e.preventDefault(); return; }
    setState(el, el._state === 'done' ? 'idle' : 'installing');
  }

  /* optional: eyes follow the cursor while idle */
  function wireEyes(el) {
    var svg = el.querySelector('.ia2bot svg');
    var look = el.querySelector('.ia2bot-look');
    if (!svg || !look) return;
    var raf = 0;
    window.addEventListener('mousemove', function (e) {
      if (raf || el._state !== 'idle') return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        var r = svg.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height * 0.46);
        var d = Math.hypot(dx, dy) || 1;
        look.setAttribute('transform', 'translate(' + (dx / d * 1.9).toFixed(2) + ' ' + (dy / d * 1.9).toFixed(2) + ')');
      });
    }, { passive: true });
  }

  function mount(el) {
    el._state = 'idle';
    el._controlled = el.hasAttribute('data-controlled');
    el.addEventListener('click', onClick);
    wireEyes(el);
    setState(el, 'idle');
  }

  function init(root) {
    (root || document).querySelectorAll('[data-install-agent]').forEach(mount);
  }

  window.EldurInstallAgent = { init: init, mount: mount, setState: setState };
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', function () { init(); });
})();
