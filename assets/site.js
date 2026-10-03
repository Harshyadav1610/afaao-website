/* Afaao site behaviour */
(function () {
  var d = document;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function track(name, params) { if (typeof window.gtag === 'function') window.gtag('event', name, params || {}); }

  /* Header shadow on scroll */
  var header = d.querySelector('.site-header');
  function onScroll() { if (header) header.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* Desktop dropdown */
  d.querySelectorAll('.dd').forEach(function (dd) {
    var btn = dd.querySelector('button'); var t;
    function set(open) { dd.classList.toggle('open', open); btn.setAttribute('aria-expanded', open ? 'true' : 'false'); }
    btn.addEventListener('click', function (e) { e.stopPropagation(); set(!dd.classList.contains('open')); });
    dd.addEventListener('mouseenter', function () { clearTimeout(t); set(true); });
    dd.addEventListener('mouseleave', function () { t = setTimeout(function () { set(false); }, 150); });
    d.addEventListener('click', function (e) { if (!dd.contains(e.target)) set(false); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
  });

  /* Mobile menu */
  var mb = d.querySelector('.menu-btn'), mp = d.querySelector('.mobile-panel');
  if (mb && mp) {
    mb.addEventListener('click', function () {
      var open = !mp.classList.contains('open');
      mp.classList.toggle('open', open); mb.setAttribute('aria-expanded', open ? 'true' : 'false');
      d.body.style.overflow = open ? 'hidden' : '';
    });
    mp.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { mp.classList.remove('open'); d.body.style.overflow = ''; mb.setAttribute('aria-expanded', 'false'); }); });
  }

  /* Rotating hero phrase (static text stays in the HTML for crawlers) */
  var sw = d.querySelector('[data-swap]');
  if (sw && !reduce) {
    var words = JSON.parse(sw.getAttribute('data-swap')); var i = 0;
    setInterval(function () {
      sw.classList.add('out');
      setTimeout(function () { i = (i + 1) % words.length; sw.textContent = words[i]; sw.classList.remove('out'); }, 350);
    }, 2800);
  }

  /* Stack map: hover or tap a tool */
  d.querySelectorAll('.stack').forEach(function (st) {
    var tip = (st.closest('.hero-visual') || d).querySelector('.node-tip-box');
    st.querySelectorAll('.node').forEach(function (n) {
      function on() {
        st.querySelectorAll('.node').forEach(function (x) { x.classList.remove('on'); });
        st.querySelectorAll('.ln').forEach(function (x) { x.classList.remove('on'); });
        n.classList.add('on');
        var ln = st.querySelector('.ln[data-for="' + n.dataset.key + '"]'); if (ln) ln.classList.add('on');
        if (tip) { tip.innerHTML = '<strong>' + n.textContent + '</strong>' + n.dataset.tip; tip.classList.remove('fade-in'); void tip.offsetWidth; tip.classList.add('fade-in'); }
      }
      n.addEventListener('mouseenter', on); n.addEventListener('focus', on); n.addEventListener('click', on);
    });
  });

  /* Generic tab groups: [data-tabs] with buttons [role=tab][aria-controls] */
  d.querySelectorAll('[data-tabs]').forEach(function (g) {
    var tabs = g.querySelectorAll('[role=tab]');
    function select(t, focus) {
      tabs.forEach(function (x) {
        var on = x === t; x.setAttribute('aria-selected', on ? 'true' : 'false'); x.tabIndex = on ? 0 : -1;
        var p = d.getElementById(x.getAttribute('aria-controls'));
        if (p) { p.hidden = !on; if (on) { p.classList.remove('fade-in'); void p.offsetWidth; p.classList.add('fade-in'); } }
      });
      if (focus) t.focus();
      if (g.classList.contains('picker') && window.innerWidth < 900) { var pp = d.getElementById(t.getAttribute('aria-controls')); if (pp) pp.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' }); }
      if (t.dataset.track) track('select_content', { content_type: g.dataset.tabs, item_id: t.dataset.track });
    }
    tabs.forEach(function (t, idx) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, n = null;
        if (k === 'ArrowRight' || k === 'ArrowDown') n = tabs[(idx + 1) % tabs.length];
        if (k === 'ArrowLeft' || k === 'ArrowUp') n = tabs[(idx - 1 + tabs.length) % tabs.length];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
  });

  /* Cost calculator */
  var calc = d.getElementById('calc');
  if (calc) {
    var fmt = function (n) { return n >= 1e6 ? '$' + (n / 1e6).toFixed(1) + 'M' : n >= 1000 ? '$' + Math.round(n / 1000) + 'k' : '$' + n; };
    var shown = 0, raf;
    function animate(to) {
      cancelAnimationFrame(raf); var from = shown, start = null;
      if (reduce) { shown = to; d.getElementById('c-total').textContent = fmt(to); return; }
      function step(ts) { if (!start) start = ts; var p = Math.min((ts - start) / 450, 1); shown = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))); d.getElementById('c-total').textContent = fmt(shown); if (p < 1) raf = requestAnimationFrame(step); }
      raf = requestAnimationFrame(step);
    }
    var touched = false;
    function run() {
      var v = function (id) { return +d.getElementById(id).value; };
      var team = v('r-team'), hours = v('r-hours'), salary = v('r-salary'), camps = v('r-campaigns'), budget = v('r-budget');
      d.getElementById('o-team').textContent = team + (team === 1 ? ' person' : ' people');
      d.getElementById('o-hours').textContent = hours + ' hrs';
      d.getElementById('o-salary').textContent = fmt(salary);
      d.getElementById('o-campaigns').textContent = camps;
      d.getElementById('o-budget').textContent = fmt(budget);
      var staff = Math.round(team * hours * 52 * (salary / 2080));
      var waste = Math.round(camps * 12 * budget * 0.2);
      var tools = team * 2000;
      d.getElementById('c-staff').textContent = fmt(staff);
      d.getElementById('c-camp').textContent = fmt(waste);
      d.getElementById('c-tools').textContent = fmt(tools);
      var tot = staff + waste + tools || 1;
      var sb = d.getElementById('cb-staff'); if (sb) { sb.style.width = (staff / tot * 100) + '%'; d.getElementById('cb-camp').style.width = (waste / tot * 100) + '%'; d.getElementById('cb-tools').style.width = (tools / tot * 100) + '%'; }
      animate(staff + waste + tools);
    }
    calc.querySelectorAll('input[type=range]').forEach(function (r) {
      r.addEventListener('input', function () { run(); if (!touched) { touched = true; track('calculator_used'); } });
    });
    run();
  }


  /* Hero CRM demo: before / after */
  var crm = d.getElementById('crm');
  if (crm) {
    var auto = true, timer;
    var score = crm.querySelector('.crm-score'), bar = crm.querySelector('.crm-bar i');
    function countTo(el, to) {
      var from = parseInt(el.textContent, 10) || 0, start = null;
      if (reduce) { el.textContent = to + '%'; return; }
      function st(ts) { if (!start) start = ts; var p = Math.min((ts - start) / 700, 1); el.textContent = Math.round(from + (to - from) * p) + '%'; if (p < 1) requestAnimationFrame(st); }
      requestAnimationFrame(st);
    }
    function setState(state) {
      crm.setAttribute('data-state', state);
      crm.querySelectorAll('.crm-toggle button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.set === state ? 'true' : 'false'); });
      crm.querySelectorAll('td[data-before]').forEach(function (td, i) {
        var v = td.getAttribute('data-' + state);
        if (td.textContent !== v) {
          setTimeout(function () { td.textContent = v; td.classList.remove('flash'); void td.offsetWidth; td.classList.add('flash'); }, reduce ? 0 : i * 45);
        }
      });
      var target = +score.getAttribute('data-' + state); countTo(score, target); bar.style.width = target + '%';
    }
    crm.querySelectorAll('.crm-toggle button').forEach(function (b) {
      b.addEventListener('click', function () { auto = false; clearInterval(timer); setState(b.dataset.set); track('crm_demo_toggle', { state: b.dataset.set }); });
    });
    if (!reduce) {
      setTimeout(function () { if (auto) setState('after'); }, 1800);
      timer = setInterval(function () { if (!auto) return; setState(crm.getAttribute('data-state') === 'before' ? 'after' : 'before'); }, 4200);
    }
  }

  /* Stack health check */
  var hc = d.getElementById('hc');
  if (hc) {
    var fg = hc.querySelector('.g-fg'), scoreEl = d.getElementById('hc-score'), label = d.getElementById('hc-label'),
        plan = d.getElementById('hc-plan'), cta = d.getElementById('hc-cta'), weeks = d.getElementById('hc-weeks'), used = false;
    function update() {
      var on = Array.prototype.filter.call(hc.querySelectorAll('.hc-chip'), function (c) { return c.getAttribute('aria-pressed') === 'true'; });
      var sc = Math.max(12, 100 - on.length * 15);
      scoreEl.textContent = sc;
      fg.style.strokeDasharray = sc + ' 100';
      hc.setAttribute('data-level', sc >= 80 ? 'good' : sc >= 50 ? 'mid' : 'bad');
      label.textContent = sc >= 80 ? 'Healthy stack' : sc >= 50 ? 'Needs attention' : 'At risk';
      if (!on.length) { plan.innerHTML = '<li class="hc-empty">Your fix plan builds here as you tick.</li>'; cta.hidden = true; return; }
      plan.innerHTML = on.map(function (c) { return '<li class="fade-in"><a href="' + c.dataset.href + '">' + c.dataset.fix + '</a></li>'; }).join('');
      var w = on.reduce(function (a, c) { return a + (+c.dataset.w); }, 0);
      var lo = Math.max(1, Math.round(w * 0.6)), hi = Math.max(lo + 1, w);
      weeks.textContent = lo + ' to ' + hi + ' weeks'; cta.hidden = false;
    }
    hc.querySelectorAll('.hc-chip').forEach(function (c) {
      c.addEventListener('click', function () {
        c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); update();
        if (!used) { used = true; track('health_check_used'); }
      });
    });
    update();
  }


  /* Mobile sticky CTA: show after the hero, hide near the closing CTA and footer */
  var mcta = d.getElementById('m-cta');
  if (mcta) {
    var endEls = d.querySelectorAll('.cta-band, .site-footer'), nearEnd = false;
    if ('IntersectionObserver' in window) {
      var eo = new IntersectionObserver(function (es) { es.forEach(function (x) { x.target._vis = x.isIntersecting; }); nearEnd = Array.prototype.some.call(endEls, function (el) { return el._vis; }); sync(); });
      endEls.forEach(function (el) { eo.observe(el); });
    }
    function sync() {
      var show = window.scrollY > 520 && !nearEnd;
      mcta.classList.toggle('show', show); d.body.classList.toggle('mcta-on', show);
      mcta.setAttribute('aria-hidden', show ? 'false' : 'true');
      mcta.querySelector('a').tabIndex = show ? 0 : -1;
    }
    window.addEventListener('scroll', sync, { passive: true }); sync();
  }

  /* Reveal on scroll */
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    d.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else { d.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); }); }

  /* FAQ open tracking */
  d.querySelectorAll('.faq details').forEach(function (det) {
    det.addEventListener('toggle', function () { if (det.open) track('faq_open', { question: det.querySelector('summary').textContent.trim().slice(0, 90) }); });
  });

  /* Click tracking for buying intent */
  d.addEventListener('click', function (e) {
    var a = e.target.closest('a'); if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href.indexOf('calendly.com') !== -1) track('book_call_click', { link_text: (a.textContent || '').trim(), page_path: location.pathname });
    else if (href.indexOf('mailto:') === 0) track('email_click', { page_path: location.pathname });
    else if (href.indexOf('linkedin.com') !== -1) track('linkedin_click', { page_path: location.pathname });
  });

  /* Contact form (Web3Forms) */
  var form = d.getElementById('contact-form');
  if (form) {
    var btn = form.querySelector('button[type=submit]'), msg = d.getElementById('form-message');
    var src = form.querySelector('input[name=source_page]'); if (src) src.value = d.referrer || 'direct';
    form.addEventListener('submit', function (e) {
      e.preventDefault(); btn.disabled = true; var label = btn.textContent; btn.textContent = 'Sending...'; msg.className = 'form-msg';
      fetch(form.action, { method: 'POST', body: new FormData(form) }).then(function (r) { return r.json(); }).then(function (j) {
        if (!j.success) throw new Error('fail');
        msg.textContent = "Thanks! We've got your message and will reply within one business day."; msg.className = 'form-msg ok';
        track('generate_lead', { form_name: 'contact' }); form.reset();
      }).catch(function () {
        msg.textContent = 'Something went wrong. Please email us at hello@afaao.com'; msg.className = 'form-msg err';
      }).then(function () { btn.disabled = false; btn.textContent = label; });
    });
  }

  /* Cookie notice */
  var banner = d.getElementById('consent-banner');
  if (banner) {
    if (!window.AFAAO_CONSENT) banner.hidden = false;
    var save = function (c) { try { localStorage.setItem('afaao_consent', c); } catch (e) {} banner.hidden = true; };
    d.getElementById('consent-accept').addEventListener('click', function () { if (window.gtag) gtag('consent', 'update', { analytics_storage: 'granted' }); if (window.initApollo) initApollo(); save('granted'); });
    d.getElementById('consent-decline').addEventListener('click', function () { if (window.gtag) gtag('consent', 'update', { analytics_storage: 'denied' }); save('denied'); });
  }
})();
