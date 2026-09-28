(function(){
  'use strict';
  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function limita(v){ return Math.max(0, Math.min(1, v)); }

  var ano = document.getElementById('ano');
  if (ano) ano.textContent = new Date().getFullYear();

  /* menu */
  var topo = document.getElementById('topo');
  var burger = document.getElementById('burger');
  var menu = document.getElementById('menu');
  function fecha(){ menu.classList.remove('aberto'); burger.setAttribute('aria-expanded','false'); burger.setAttribute('aria-label','Abrir menu'); document.body.style.overflow=''; }
  burger.addEventListener('click', function(){
    var abre = !menu.classList.contains('aberto');
    menu.classList.toggle('aberto', abre);
    burger.setAttribute('aria-expanded', abre);
    burger.setAttribute('aria-label', abre ? 'Fechar menu' : 'Abrir menu');
    document.body.style.overflow = abre ? 'hidden' : '';
  });
  menu.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', fecha); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && menu.classList.contains('aberto')) { fecha(); burger.focus(); } });
  window.addEventListener('resize', function(){ if (window.innerWidth > 880) fecha(); });

  /* contadores estilo app de corrida */
  function conta(el, dur){
    var alvo = parseFloat(el.dataset.alvo), casas = +el.dataset.casas || 0, ini = null;
    if (reduz) { el.textContent = alvo.toFixed(casas).replace('.', ','); return; }
    requestAnimationFrame(function passo(t){
      if (!ini) ini = t;
      var k = Math.min(1, (t - ini) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = (alvo * e).toFixed(casas).replace('.', ',');
      if (k < 1) requestAnimationFrame(passo);
    });
  }
  function relogio(el, dur){
    var alvo = +el.dataset.tempo, ini = null;
    function fmt(s){ s = Math.round(s); var m = Math.floor(s / 60), r = s % 60; return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r; }
    if (reduz) { el.textContent = fmt(alvo); return; }
    requestAnimationFrame(function passo(t){
      if (!ini) ini = t;
      var k = Math.min(1, (t - ini) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(alvo * e);
      if (k < 1) requestAnimationFrame(passo);
    });
  }
  var strava = document.querySelector('.strava');
  setTimeout(function(){
    strava.classList.add('on');
    strava.querySelectorAll('[data-alvo]').forEach(function(el){ conta(el, 2200); });
    strava.querySelectorAll('[data-tempo]').forEach(function(el){ relogio(el, 2200); });
  }, reduz ? 0 : 900);

  /* reveal + gatilhos */
  var cron = document.querySelector('.cronometro');
  var meses = document.getElementById('meses');
  var largada = document.getElementById('largada');
  var numPeito = document.getElementById('numPeito');
  function mesesAnima(){
    if (reduz) { meses.textContent = '6'; return; }
    var n = 0, it = setInterval(function(){ n++; meses.textContent = n; if (n >= 6) clearInterval(it); }, 360);
  }
  function sorteiaNumero(){
    var alvo = String(Math.floor(1000 + Math.random() * 9000));
    if (reduz) { numPeito.textContent = alvo; return; }
    var c = 0, it = setInterval(function(){
      numPeito.textContent = String(Math.floor(1000 + Math.random() * 9000));
      if (++c > 14) { clearInterval(it); numPeito.textContent = alvo; }
    }, 60);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(ents){
      ents.forEach(function(e){
        if (!e.isIntersecting) return;
        var t = e.target;
        t.classList.add('on');
        if (t === cron) mesesAnima();
        if (t === largada) { largada.classList.add('rompeu'); sorteiaNumero(); }
        io.unobserve(t);
      });
    }, {threshold: .2});
    document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });
    io.observe(cron); io.observe(largada);

    var links = {};
    menu.querySelectorAll('a[href^="#"]').forEach(function(a){ links[a.getAttribute('href').slice(1)] = a; });
    var ioS = new IntersectionObserver(function(ents){
      ents.forEach(function(e){
        if (e.isIntersecting && links[e.target.id]) {
          Object.keys(links).forEach(function(k){ links[k].classList.remove('ativo'); });
          links[e.target.id].classList.add('ativo');
        }
      });
    }, {rootMargin: '-45% 0px -50% 0px'});
    ['metodo','jornada','time','plano','duvidas'].forEach(function(id){ var s = document.getElementById(id); if (s) ioS.observe(s); });
  } else {
    document.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('on'); });
    cron.classList.add('on'); meses.textContent = '6'; largada.classList.add('rompeu'); sorteiaNumero();
  }

  /* percurso: rota desenha e corredor anda com a rolagem */
  var percurso = document.getElementById('percurso');
  var vivo = document.getElementById('rotaVivo');
  var corredor = document.getElementById('corredor');
  var svg = percurso.querySelector('.rota');
  var len = vivo.getTotalLength();
  vivo.style.setProperty('--len', len);
  var maxP = 0;
  function anda(){
    var r = percurso.getBoundingClientRect(), vh = window.innerHeight;
    var p = reduz ? 1 : limita((vh * 0.6 - r.top) / r.height);
    p = Math.max(p, maxP); maxP = p;
    var desktop = window.getComputedStyle(svg).display !== 'none';
    if (desktop) {
      vivo.style.setProperty('--off', (len * (1 - p)).toFixed(1));
      var pt = vivo.getPointAtLength(len * p);
      var sx = r.width / 1000, sy = r.height / 1400;
      corredor.style.transform = 'translate(' + (pt.x * sx).toFixed(1) + 'px,' + (pt.y * sy).toFixed(1) + 'px)';
    } else {
      percurso.style.setProperty('--prog', (p * 100).toFixed(1) + '%');
      corredor.style.transform = 'translate(0,' + (10 + (r.height - 20) * p).toFixed(1) + 'px)';
    }
  }

  var tic = false;
  function rola(){
    if (tic) return; tic = true;
    requestAnimationFrame(function(){ topo.classList.toggle('rolou', window.scrollY > 10); anda(); tic = false; });
  }
  window.addEventListener('scroll', rola, {passive:true});
  window.addEventListener('resize', function(){ maxP = 0; rola(); });
  rola();

  /* ficha -> WhatsApp */
  var f = document.getElementById('inscricao');
  var erro = document.getElementById('erro');
  f.nome.addEventListener('input', function(){ f.nome.classList.remove('invalido'); erro.textContent = ''; });
  f.addEventListener('submit', function(e){
    e.preventDefault();
    var nome = f.nome.value.trim();
    if (!nome) { f.nome.classList.add('invalido'); erro.textContent = 'Coloca seu nome pra gente saber com quem fala.'; f.nome.focus(); return; }
    var nivel = (f.querySelector('input[name="nivel"]:checked') || {}).value || 'nunca corri';
    var t = f.treinador.value.split('|');
    var msg = 'Olá, ' + t[1] + '! Me chamo ' + nome + ' e quero ser Consagrado(a).\n' +
      'Hoje: ' + nivel + '.\nMeu objetivo: ' + f.objetivo.value + '.\n(Ficha nº ' + numPeito.textContent + ', enviada pelo site)';
    window.open('https://wa.me/' + t[0] + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
  });
})();
