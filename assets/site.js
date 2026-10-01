/* EUROCOM — общий скрипт внутренних страниц. Без библиотек. */
(function(){
  'use strict';

  var МАРКИ = [
    {код:'2901', сажа:30},
    {код:'2902', сажа:32},
    {код:'2903', сажа:35},
    {код:'2905', сажа:38},
    {код:'2907', сажа:40},
    {код:'2908', сажа:42}
  ];
  var полное = function(m){ return 'SMART INT-' + m.код; };
  var ру = function(n, d){ d = d === undefined ? 1 : d;
    return n.toLocaleString('ru-RU', {minimumFractionDigits:d, maximumFractionDigits:d}); };
  var $ = function(s, root){ return (root || document).querySelector(s); };
  var $$ = function(s, root){ return Array.prototype.slice.call((root || document).querySelectorAll(s)); };

  /* ---------- уведомление ---------- */
  var тостТаймер;
  function тост(текст){
    var t = $('#toast');
    if (!t){ t = document.createElement('div'); t.id = 'toast'; t.className = 'toast glass'; t.setAttribute('role','status'); document.body.appendChild(t); }
    t.textContent = текст; t.classList.add('show');
    clearTimeout(тостТаймер); тостТаймер = setTimeout(function(){ t.classList.remove('show'); }, 3600);
  }

  /* ---------- демо-ссылки и формы ---------- */
  document.addEventListener('click', function(e){
    var a = e.target.closest('[data-demo]');
    if (a){ e.preventDefault(); тост(a.getAttribute('data-demo') || 'В демо-версии этот раздел не подключён'); return; }
    var link = e.target.closest('.mpanel a');
    if (link){ var t = $('#nav-open'); if (t) t.checked = false; }
  });
  $$('form[data-demo-form]').forEach(function(f){
    f.addEventListener('submit', function(e){
      e.preventDefault();
      if (!f.checkValidity()){ f.reportValidity(); return; }
      f.reset();
      тост(f.getAttribute('data-demo-form') || 'Демо: заявка принята. В рабочей версии менеджер свяжется с вами.');
    });
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape'){ var t = $('#nav-open'); if (t) t.checked = false; }
  });

  /* ---------- появление при прокрутке ---------- */
  var блоки = $$('.reveal');
  if ('IntersectionObserver' in window && блоки.length){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if (en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
    }, {rootMargin:'0px 0px -8% 0px', threshold:.08});
    блоки.forEach(function(b){ io.observe(b); });
  } else { блоки.forEach(function(b){ b.classList.add('in'); }); }

  /* ---------- дозировка ---------- */
  function расчёт(целевая, партия, сажа){
    var доза = целевая / сажа * 100;
    var кг = партия * доза / 100;
    return {доза:доза, кг:кг, база:партия - кг, наТонну:1000 * доза / 100};
  }

  /* ---------- страница «Продукция» ---------- */
  var шкала = $('#scale');
  if (шкала){
    var текущая = МАРКИ[3];
    var трек = $('#scaleStops');
    var мин = 28, макс = 44;
    МАРКИ.forEach(function(m){
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'stop'; b.dataset.code = m.код;
      b.style.left = ((m.сажа - мин) / (макс - мин) * 100) + '%';
      b.setAttribute('aria-label', полное(m) + ', техуглерод ' + m.сажа + ' %');
      b.innerHTML = '<i></i><span class="stop-c num">' + m.сажа + '%</span><span class="stop-n">' + m.код + '</span>';
      b.addEventListener('click', function(){ выбрать(m.код, true); });
      трек.appendChild(b);
    });

    function пересчитать(){
      var цел = +$('#dTarget').value;
      var партия = Math.max(0, +$('#dBatch').value || 0);
      var r = расчёт(цел, партия, текущая.сажа);
      $('#dTargetV').textContent = ру(цел) + ' %';
      $('#dDose').textContent = ру(r.доза);
      $('#dKg').textContent = ру(r.кг, 0) + ' кг';
      $('#dBase').textContent = ру(r.база, 0) + ' кг';
      $('#dPerT').textContent = ру(r.наТонну, 0) + ' кг';
    }

    function выбрать(код, писатьХеш){
      var m = МАРКИ.filter(function(x){ return x.код === код; })[0];
      if (!m) return;
      текущая = m;
      $$('.stop', трек).forEach(function(s){ s.setAttribute('aria-pressed', s.dataset.code === код ? 'true' : 'false'); });
      $('#scaleFill').style.width = ((m.сажа - мин) / (макс - мин) * 100) + '%';
      $('#gName').textContent = полное(m);
      $('#gCarbon').textContent = m.сажа + ' %';
      $('#gCarbonBig').textContent = m.сажа;
      $('#gPrice').href = 'price.html?grade=' + m.код;
      $$('#gradeTable tbody tr').forEach(function(tr){ tr.classList.toggle('on', tr.dataset.code === код); });
      var panel = $('#gradePanel');
      panel.classList.remove('swap'); void panel.offsetWidth; panel.classList.add('swap');
      пересчитать();
      if (писатьХеш && history.replaceState) history.replaceState(null, '', '#' + код);
    }

    ['dTarget','dBatch'].forEach(function(id){ $('#' + id).addEventListener('input', пересчитать); });
    $$('#gradeTable tbody tr').forEach(function(tr){
      tr.addEventListener('click', function(){
        выбрать(tr.dataset.code, true);
        $('#scale').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth'});
      });
      tr.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); tr.click(); } });
    });
    шкала.addEventListener('keydown', function(e){
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var i = МАРКИ.indexOf(текущая) + (e.key === 'ArrowRight' ? 1 : -1);
      if (i < 0 || i >= МАРКИ.length) return;
      e.preventDefault(); выбрать(МАРКИ[i].код, true);
      var s = $('.stop[data-code="' + МАРКИ[i].код + '"]'); if (s) s.focus();
    });
    var изХеша = location.hash.replace('#','');
    выбрать(МАРКИ.some(function(m){ return m.код === изХеша; }) ? изХеша : текущая.код, false);
    window.addEventListener('hashchange', function(){
      var h = location.hash.replace('#','');
      if (МАРКИ.some(function(m){ return m.код === h; })) выбрать(h, false);
    });
  }

  /* ---------- вкладки (Применение) ---------- */
  $$('[data-tabs]').forEach(function(group){
    var кнопки = $$('[role="tab"]', group);
    function открыть(id, писатьХеш){
      кнопки.forEach(function(b){
        var on = b.dataset.tab === id;
        b.setAttribute('aria-selected', on ? 'true' : 'false');
        b.tabIndex = on ? 0 : -1;
      });
      $$('[role="tabpanel"]').forEach(function(p){
        var on = p.id === 'tab-' + id;
        p.hidden = !on;
        if (on){ p.classList.remove('swap'); void p.offsetWidth; p.classList.add('swap'); }
      });
      if (писатьХеш && history.replaceState) history.replaceState(null, '', '#' + id);
    }
    кнопки.forEach(function(b, i){
      b.addEventListener('click', function(){ открыть(b.dataset.tab, true); });
      b.addEventListener('keydown', function(e){
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var n = кнопки[(i + d + кнопки.length) % кнопки.length];
        n.focus(); открыть(n.dataset.tab, true);
      });
    });
    var h = location.hash.replace('#','');
    открыть(кнопки.some(function(b){ return b.dataset.tab === h; }) ? h : кнопки[0].dataset.tab, false);
    window.addEventListener('hashchange', function(){
      var h2 = location.hash.replace('#','');
      if (кнопки.some(function(b){ return b.dataset.tab === h2; })) открыть(h2, false);
    });
  });

  /* ---------- прайс: предвыбор марки ---------- */
  var выбор = $('#priceGrades');
  if (выбор){
    var q = new URLSearchParams(location.search).get('grade');
    if (q){ var cb = $('input[value="' + q + '"]', выбор); if (cb) cb.checked = true; }
  }
})();
