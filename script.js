/* =========================================================
   Soluciones en Frío y Confort — script.js
   «El termómetro que se enfría al hacer scroll»
   ---------------------------------------------------------
   Único lugar donde vive el número de WhatsApp (con lada 52).
   Si queda vacío, se ocultan botones, CTA y envío del formulario.
   ========================================================= */
const WHATSAPP_NUMBER = "527571054014";

(() => {
  'use strict';

  /* ---------- Utilidades ---------- */
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeIO = t => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const root = document.documentElement;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINO = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const hasAnime = () => typeof window.anime === 'function';
  let vw = innerWidth, vh = innerHeight;

  /* ---------- WhatsApp ---------- */
  const waUrl = msg => `https://wa.me/${WHATSAPP_NUMBER}` + (msg ? `?text=${encodeURIComponent(msg)}` : '');

  function iniciarWA() {
    if (!WHATSAPP_NUMBER) { root.classList.add('sin-wa'); return; }
    $$('[data-wa]').forEach(a => {
      a.href = waUrl(a.dataset.msg || '');
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    });
    // Etiqueta del botón flotante: aparece a los 4 s, se recoge a los 9 s
    const f = $('#waFlot');
    if (f) {
      setTimeout(() => f.classList.add('abierta'), 4000);
      setTimeout(() => f.classList.remove('abierta'), 9000);
    }
  }

  /* ---------- Cargador ---------- */
  function cargador() {
    const el = $('#cargador');
    const n = $('#cargN');
    if (!el) { entrar(); return; }
    // Lectura 38 → 22
    if (n) {
      if (hasAnime() && !RM) {
        const o = { v: 38 };
        anime({ targets: o, v: 22, round: 1, duration: 1600, easing: 'easeInOutQuad', update: () => { n.textContent = o.v; } });
      } else {
        const t0 = performance.now();
        const paso = t => {
          const k = clamp((t - t0) / 1600);
          n.textContent = Math.round(lerp(38, 22, easeIO(k)));
          if (k < 1) requestAnimationFrame(paso);
        };
        requestAnimationFrame(paso);
      }
    }
    const salir = () => {
      if (el.classList.contains('salir')) return;
      el.classList.add('salir');
      setTimeout(() => el.classList.add('fuera'), 600);
      entrar();
    };
    setTimeout(salir, 1750);
  }

  /* Arranca la entrada del hero */
  function entrar() {
    root.classList.add('listo');
    const pal = $$('.h1-grande .pal-i');
    const fin = () => root.classList.add('h1-in');
    if (hasAnime() && !RM && pal.length) {
      anime({
        targets: pal,
        translateY: ['100%', '0%'],
        opacity: [0, 1],
        filter: ['blur(10px)', 'blur(0px)'],
        delay: anime.stagger(70),
        duration: 900,
        easing: 'easeOutCubic',
        complete: fin
      });
      setTimeout(fin, 3000);
    } else {
      fin();
    }
  }

  /* ---------- Revelado (IntersectionObserver + respaldo por geometría) ---------- */
  const revelables = [];
  function revelar(el) {
    if (el.classList.contains('is-in')) return;
    el.classList.add('is-in');
    dibujarIconos(el);
  }

  function prepararIconos() {
    if (!hasAnime() || RM) return;
    $$('.ico-draw').forEach(svg => {
      $$('path,circle,line', svg).forEach(p => {
        try { p.style.strokeDashoffset = anime.setDashoffset(p); } catch (e) { /* si falla se queda visible */ }
      });
    });
  }
  function dibujarIconos(el) {
    if (!hasAnime() || RM) return;
    const svgs = el.matches && el.matches('.ico-draw') ? [el] : $$('.ico-draw', el);
    svgs.forEach(svg => {
      const t = $$('path,circle,line', svg);
      if (!t.length || svg.dataset.dibujado) return;
      svg.dataset.dibujado = '1';
      anime({ targets: t, strokeDashoffset: [anime.setDashoffset, 0], duration: 1500, delay: anime.stagger(140), easing: 'easeInOutSine' });
    });
  }

  function iniciarReveal() {
    $$('.rv,[data-observa]').forEach(e => revelables.push(e));
    prepararIconos();
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => {
        es.forEach(e => { if (e.isIntersecting) { revelar(e.target); io.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
      revelables.forEach(e => io.observe(e));
    }
    setTimeout(revelarGeometria, 2000);
    setTimeout(() => revelables.forEach(revelar), 6000);
  }
  function revelarGeometria() {
    const h = innerHeight;
    revelables.forEach(e => {
      if (e.classList.contains('is-in')) return;
      const r = e.getBoundingClientRect();
      if (r.top < h * 0.96 && r.bottom > 0) revelar(e);
    });
  }

  /* ---------- Hero: campo de flujo + dial ---------- */
  const hero = $('#inicio');
  const cv = $('#flujo');
  let ctx = null, W = 0, H = 0, parts = [];
  const ptr = { x: -9999, y: -9999, activo: false };
  let heroVisible = true, heroCorre = false;

  function tamCanvas() {
    if (!cv) return;
    const r = cv.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#080B42';
    ctx.fillRect(0, 0, W, H);
    const N = vw < 768 ? 70 : 140;
    parts = Array.from({ length: N }, () => nuevaParticula());
  }
  function nuevaParticula() {
    const x = Math.random() * W, y = Math.random() * H;
    return { x, y, px: x, py: y, vida: 160 + Math.random() * 320, sp: .7 + Math.random() * 1.1, w: .7 + Math.random() * 1.3 };
  }
  const campo = (x, y, t) => (Math.sin(x * .0021 + t * .23) + Math.cos(y * .0027 - t * .17) + Math.sin((x + y) * .0014 + t * .11)) * 1.35;

  function pasoFlujo(t) {
    if (!ctx) return;
    ctx.fillStyle = 'rgba(8,11,66,.09)';
    ctx.fillRect(0, 0, W, H);
    const bw = W * .15;
    const fx = (((t % 10) / 10) * 1.4 - .2) * W; // frente frío: 10 s, izquierda → derecha
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      const a = campo(p.x, p.y, t);
      let vx = Math.cos(a) * p.sp, vy = Math.sin(a) * p.sp;
      let frio = clamp(1 - Math.abs(p.x - fx) / bw);
      if (ptr.activo) {
        const dx = p.x - ptr.x, dy = p.y - ptr.y, d = Math.hypot(dx, dy);
        if (d < 160 && d > .01) {
          const f = 1 - d / 160;
          vx += (dx / d) * f * 2.4; vy += (dy / d) * f * 2.4;
          frio = Math.max(frio, f * 1.2);
        }
      }
      frio = clamp(frio);
      p.px = p.x; p.py = p.y;
      p.x += vx; p.y += vy; p.vida--;
      const u = clamp(p.x / W);
      const r0 = lerp(255, 63, u), g0 = lerp(181, 195, u), b0 = lerp(71, 255, u);
      const r = lerp(r0, 63, frio) | 0, g = lerp(g0, 195, frio) | 0, b = lerp(b0, 255, frio) | 0;
      ctx.strokeStyle = `rgba(${r},${g},${b},${(.32 + .5 * frio).toFixed(2)})`;
      ctx.lineWidth = p.w + frio * .6;
      ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(p.x, p.y); ctx.stroke();
      if (p.vida <= 0 || p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) parts[i] = nuevaParticula();
    }
  }

  // Dial: inclinación + arco de temperatura
  const dial = $('#dial');
  const arco = $('#arcoLleno');
  const dialN = $('#dialN');
  let tiltX = 0, tiltY = 0, tgtX = 0, tgtY = 0;

  function pasoDial(t) {
    if (dial) {
      if (!FINO) { // táctil: vaivén automático de 9 s
        const ph = (t / 9) * Math.PI * 2;
        tgtX = Math.sin(ph) * 4; tgtY = Math.cos(ph) * 7;
      }
      tiltX += (tgtX - tiltX) * .08; tiltY += (tgtY - tiltY) * .08;
      dial.style.transform = `rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg)`;
    }
    // Ciclo de 8 s, ease-in-out
    const u = (Math.sin((t / 8) * Math.PI * 2 - Math.PI / 2) + 1) / 2;
    if (arco) arco.style.strokeDasharray = `${(10 + 65 * u).toFixed(1)} 100`;
    if (dialN) dialN.textContent = `${Math.round(36 - 14 * u)}°C`;
  }

  function bucleHero(ms) {
    heroCorre = false;
    if (!heroVisible || document.hidden) return;
    const t = ms / 1000;
    pasoFlujo(t);
    pasoDial(t);
    heroCorre = true;
    requestAnimationFrame(bucleHero);
  }
  function arrancarHero() { if (!heroCorre && heroVisible && !document.hidden) { heroCorre = true; requestAnimationFrame(bucleHero); } }

  function iniciarHero() {
    if (!hero || !cv) return;
    tamCanvas();
    if (RM) { // un solo cuadro
      for (let i = 0; i < 160; i++) pasoFlujo(i * .05);
      if (arco) arco.style.strokeDasharray = '45 100';
      return;
    }
    hero.addEventListener('pointermove', e => {
      const r = cv.getBoundingClientRect();
      ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.activo = true;
      if (FINO) {
        tgtY = ((e.clientX / vw) - .5) * 16;
        tgtX = -((e.clientY / vh) - .5) * 16;
      }
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { ptr.activo = false; tgtX = 0; tgtY = 0; });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => { heroVisible = es[0].isIntersecting; if (heroVisible) arrancarHero(); }).observe(hero);
    }
    document.addEventListener('visibilitychange', arrancarHero);
    arrancarHero();
  }

  /* ---------- Menú móvil ---------- */
  function iniciarMenu() {
    const b = $('#burger'), m = $('#menu');
    if (!b || !m) return;
    const set = abierto => {
      root.classList.toggle('menu-abierto', abierto);
      b.setAttribute('aria-expanded', abierto);
      b.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
      m.setAttribute('aria-hidden', !abierto);
    };
    b.addEventListener('click', () => set(!root.classList.contains('menu-abierto')));
    $$('a', m).forEach(a => a.addEventListener('click', () => set(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
    addEventListener('resize', () => { if (innerWidth >= 1024) set(false); });
  }

  /* ---------- Ticker con velocidad de scroll ---------- */
  function iniciarTicker() {
    const sec = $('.ticker');
    const filas = $$('.ticker .fila');
    if (!sec || !filas.length || RM) return;
    sec.classList.add('tk-js');
    const st = filas.map((f, i) => ({ pista: $('.pista', f), dir: i % 2 === 0 ? -1 : 1, x: 0, half: 1 }));
    const medir = () => st.forEach(s => { s.half = s.pista.scrollWidth / 2 || 1; });
    medir();
    addEventListener('load', medir);
    addEventListener('resize', medir);
    let visible = true, last = performance.now(), prevY = scrollY, sv = 0, corre = false;
    const base = 70; // px/s
    function loop(now) {
      corre = false;
      if (!visible || document.hidden) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      const v = dt > 0 ? (scrollY - prevY) / dt : 0; prevY = scrollY;
      sv = lerp(sv, clamp(v, -3000, 3000), .1);
      st.forEach(s => {
        // fila A va a la izquierda, fila B a la derecha; la velocidad de scroll acelera o invierte
        s.x += (base + sv * .35) * s.dir * dt;
        s.x = ((s.x % s.half) - s.half) % s.half;
        s.pista.style.transform = `translate3d(${s.x.toFixed(1)}px,0,0)`;
      });
      corre = true; requestAnimationFrame(loop);
    }
    const arrancar = () => { if (!corre && visible) { last = performance.now(); corre = true; requestAnimationFrame(loop); } };
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) arrancar(); }).observe(sec);
    document.addEventListener('visibilitychange', arrancar);
    arrancar();
  }

  /* ---------- Manifiesto: palabra por palabra ---------- */
  let manP = null, manW = [];
  function iniciarManifiesto() {
    manP = $('#manTxt');
    if (!manP || RM) return;
    const palabras = manP.textContent.trim().split(/\s+/);
    manP.textContent = '';
    palabras.forEach(w => {
      const s = document.createElement('span');
      s.className = 'w'; s.textContent = w;
      manP.appendChild(s);
      manP.appendChild(document.createTextNode(' '));
    });
    manP.classList.add('man-js');
    manW = $$('.w', manP);
  }
  function manifiesto() {
    if (!manW.length) return;
    const r = manP.getBoundingClientRect();
    if (r.bottom < -200 || r.top > vh + 200) return;
    const p = clamp((vh * .82 - r.top) / (r.height + vh * .2));
    const n = Math.round(p * manW.length * 1.04);
    for (let i = 0; i < manW.length; i++) manW[i].classList.toggle('on', i < n);
  }

  /* ---------- Servicios: tarjetas apiladas ---------- */
  let tarjetas = [], stick = [];
  function iniciarPila() {
    tarjetas = $$('[data-pila]');
    medirPila();
  }
  function medirPila() {
    stick = tarjetas.map(c => parseFloat(getComputedStyle(c).top) || 0);
  }
  function pila() {
    if (!tarjetas.length || RM) return;
    const pr = $('#pila').getBoundingClientRect();
    if (pr.bottom < -100 || pr.top > vh + 100) return;
    const llegada = tarjetas.map((c, k) => {
      const r = c.getBoundingClientRect();
      return clamp(1 - (r.top - stick[k]) / (r.height * .9));
    });
    tarjetas.forEach((c, i) => {
      let depth = 0;
      for (let k = i + 1; k < tarjetas.length; k++) depth += llegada[k];
      c.style.setProperty('--s', (1 - .035 * depth).toFixed(4));
      c.style.setProperty('--dim', clamp(depth * .14, 0, .42).toFixed(3));
    });
    // Parallax vertical ±6 %
    tarjetas.forEach(c => {
      const img = $('.media-inner img', c);
      if (!img || img.closest('.dispositivo')) return;
      const r = c.getBoundingClientRect();
      const m = clamp((r.top + r.height / 2 - vh / 2) / vh, -1, 1);
      img.style.setProperty('--py', `${(m * -6).toFixed(2)}%`);
      const z = parseFloat(img.style.getPropertyValue('--z')) || 1.14;
      img.style.setProperty('--z', Math.max(1.12, z));
    });
  }

  /* ---------- Obra: la imagen que se abre ---------- */
  let obraSec = null, visor = null, visorImg = null, obraTxt = null, obraCta = null;
  function iniciarObra() {
    obraSec = $('#obra'); if (!obraSec || RM) return;
    visor = $('.visor', obraSec); visorImg = $('.visor img', obraSec);
    obraTxt = $('#obraTxt'); obraCta = $('#obraCta');
    obraSec.classList.add('obra-js');
  }
  function obra() {
    if (!obraSec || RM) return;
    const r = obraSec.getBoundingClientRect();
    if (r.bottom < -80 || r.top > vh + 80) return;
    const total = Math.max(1, r.height - vh);
    const p = clamp(-r.top / total);
    const e = easeIO(clamp(p / .7));
    const mob = vw < 768;
    const iv = lerp(mob ? 14 : 18, 0, e), ih = lerp(mob ? 10 : 28, 0, e);
    const cr = lerp(28, 0, e), sc = lerp(1.25, 1, e);
    visor.style.clipPath = `inset(${iv.toFixed(2)}% ${ih.toFixed(2)}% round ${cr.toFixed(1)}px)`;
    visorImg.style.transform = `scale(${sc.toFixed(4)})`;
    obraSec.style.setProperty('--iv', `${(iv * vh / 100).toFixed(1)}px`);
    obraSec.style.setProperty('--ih', `${(ih * vw / 100).toFixed(1)}px`);
    obraTxt.classList.toggle('on', p > .45);
    obraCta.classList.toggle('on', p > .8);
  }

  /* ---------- Sectores: acordeón ---------- */
  function iniciarAcordeon() {
    const cont = $('#acordeon');
    if (!cont) return;
    const panels = $$('.panel', cont);
    let cur = 0, pausaHasta = 0, hover = false, visible = true;
    const set = i => {
      panels.forEach((p, j) => {
        const a = i === j;
        p.classList.toggle('is-active', a);
        $('.panel-btn', p).setAttribute('aria-expanded', a ? 'true' : 'false');
      });
      cur = i;
    };
    panels.forEach((p, i) => {
      p.addEventListener('click', e => { if (e.target.closest('a')) return; if (i !== cur) { set(i); pausaHasta = Date.now() + 12000; } });
      p.addEventListener('mouseenter', () => { hover = true; });
      p.addEventListener('mouseleave', () => { hover = false; });
      p.addEventListener('focusin', () => { pausaHasta = Date.now() + 12000; });
      p.addEventListener('touchstart', () => { pausaHasta = Date.now() + 12000; }, { passive: true });
      $('.panel-btn', p).addEventListener('keydown', e => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); const n = (i + 1) % panels.length; set(n); $('.panel-btn', panels[n]).focus(); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); const n = (i - 1 + panels.length) % panels.length; set(n); $('.panel-btn', panels[n]).focus(); }
      });
    });
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(cont);
    if (!RM) setInterval(() => { if (!hover && visible && !document.hidden && Date.now() > pausaHasta) set((cur + 1) % panels.length); }, 4500);
  }

  /* ---------- Proceso: dial que enfría ---------- */
  let procSec = null, pasos = [], pArco = null, pFlake = null, pTemp = null;
  function iniciarProceso() {
    procSec = $('#proceso'); if (!procSec) return;
    pasos = $$('#pasos .paso'); pArco = $('#pArco'); pFlake = $('#pFlake'); pTemp = $('#pTemp');
  }
  function proceso() {
    if (!procSec || !pasos.length) return;
    const r = procSec.getBoundingClientRect();
    if (r.bottom < -100 || r.top > vh + 100) return;
    const lista = $('#pasos').getBoundingClientRect();
    const p = RM ? 1 : clamp((vh * .55 - lista.top) / Math.max(1, lista.height - vh * .1));
    if (pArco) pArco.style.strokeDashoffset = (100 - p * 100).toFixed(1);
    if (pFlake) pFlake.style.transform = `scale(${(.8 + .5 * p).toFixed(3)})`;
    if (pTemp) pTemp.textContent = `${Math.round(lerp(38, 22, p))}°`;
    let mejor = 0, dmin = Infinity;
    pasos.forEach((s, i) => {
      const b = s.getBoundingClientRect();
      const d = Math.abs(b.top + b.height / 2 - vh * .5);
      if (d < dmin) { dmin = d; mejor = i; }
    });
    pasos.forEach((s, i) => s.classList.toggle('activo', i === mejor));
  }

  /* ---------- Bento: inclinación 3D + brillo ---------- */
  function iniciarBento() {
    if (!FINO || RM) return;
    $$('.b-card').forEach(card => {
      const inn = $('.b-in', card), g = $('.glare', card);
      if (!inn) return;
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        inn.style.setProperty('--ry', `${((x - .5) * 10).toFixed(2)}deg`);
        inn.style.setProperty('--rx', `${(-(y - .5) * 10).toFixed(2)}deg`);
        if (g) { g.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`); g.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`); }
      });
      card.addEventListener('pointerleave', () => { inn.style.setProperty('--rx', '0deg'); inn.style.setProperty('--ry', '0deg'); });
    });
  }

  /* ---------- Bento: carruseles de fotos ---------- */
  function iniciarGalerias() {
    $$('[data-gal]').forEach((gal, g) => {
      const fotos = $$('img', gal);
      if (fotos.length < 2) return;
      let cur = 0, manual = false, visible = false;
      const ir = n => {
        cur = (n + fotos.length) % fotos.length;
        fotos.forEach((f, i) => { f.classList.toggle('is-on', i === cur); f.setAttribute('aria-hidden', i === cur ? 'false' : 'true'); });
      };
      const ctl = document.createElement('div');
      ctl.className = 'gal-ctl';
      [['‹', 'Foto anterior', -1], ['›', 'Foto siguiente', 1]].forEach(([t, lab, d]) => {
        const b = document.createElement('button');
        b.type = 'button'; b.textContent = t; b.setAttribute('aria-label', lab);
        b.addEventListener('click', () => { manual = true; ir(cur + d); });
        ctl.appendChild(b);
      });
      gal.appendChild(ctl);
      if (!RM && 'IntersectionObserver' in window) {
        new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(gal);
        setInterval(() => { if (!manual && visible && !document.hidden) ir(cur + 1); }, 4200 + g * 700);
      }
    });
  }

  /* ---------- Por dentro: radiografía ---------- */
  function iniciarRadio() {
    const lista = $$('#radioLista li');
    const hots = $$('.hot');
    if (!lista.length) return;
    let cur = 0, manual = false, visible = true;
    const set = i => {
      cur = i;
      lista.forEach((l, j) => l.classList.toggle('is-on', j === i));
      hots.forEach(h => h.classList.toggle('is-on', +h.dataset.i === i));
    };
    lista.forEach((l, i) => {
      $('button', l).addEventListener('click', () => { manual = true; set(i); });
      l.addEventListener('mouseenter', () => { manual = true; set(i); });
    });
    hots.forEach(h => {
      h.addEventListener('click', () => { manual = true; set(+h.dataset.i); });
      h.addEventListener('mouseenter', () => { manual = true; set(+h.dataset.i); });
    });
    const rd = $('#radio');
    if (rd) rd.addEventListener('touchstart', () => { manual = true; }, { passive: true });
    if (rd && 'IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(rd);
    set(0);
    if (!RM) setInterval(() => { if (!manual && visible && !document.hidden) set((cur + 1) % lista.length); }, 3500);
  }

  /* ---------- Bitácora: carril horizontal con scroll ---------- */
  let bit = null, bitPista = null, bitProg = null, marcos = [], railW = 0;
  function iniciarBit() {
    bit = $('#obras'); if (!bit) return;
    bitPista = $('#bitPista'); bitProg = $('#bitProg'); marcos = $$('.marco', bit);
    medirBit();
  }
  function medirBit() {
    if (!bit) return;
    const on = innerWidth >= 1024 && !RM;
    bit.classList.toggle('bit-js', on);
    if (on) {
      railW = bitPista.scrollWidth;
      /* el carril avanza 1.8× más rápido que el scroll para que 20 fotos no alarguen la página en exceso */
      bit.style.height = `${Math.round((railW - innerWidth) / 1.8 + innerHeight)}px`;
    } else {
      bit.style.height = '';
      bitPista.style.transform = '';
      marcos.forEach(m => { const im = $('img', m); if (im) im.style.removeProperty('--px'); });
    }
  }
  function bitacora() {
    if (!bit || !bit.classList.contains('bit-js')) return;
    const r = bit.getBoundingClientRect();
    if (r.bottom < -100 || r.top > vh + 100) return;
    const p = clamp(-r.top / Math.max(1, r.height - vh));
    const max = Math.max(0, railW - vw);
    bitPista.style.transform = `translate3d(${(-p * max).toFixed(1)}px,0,0)`;
    if (bitProg) bitProg.style.transform = `scaleX(${p.toFixed(4)})`;
    marcos.forEach(m => {
      const b = m.getBoundingClientRect();
      const off = ((b.left + b.width / 2) - vw / 2) / vw;
      const im = $('img', m);
      if (im) im.style.setProperty('--px', `${clamp(off * -14, -8, 8).toFixed(2)}%`);
    });
  }

  /* ---------- Contacto: termostato + formulario ---------- */
  function iniciarContacto() {
    const rango = $('#rango'), lect = $('#tempLect'), card = $('#termostato');
    const form = $('#formContacto');
    const colorTemp = t => {
      const m = clamp((t - 16) / 16);
      const c = [lerp(63, 255, m), lerp(195, 181, m), lerp(255, 71, m)].map(v => Math.round(v));
      return `rgb(${c[0]},${c[1]},${c[2]})`;
    };
    if (rango && lect && card) {
      const act = () => {
        lect.textContent = rango.value;
        card.style.setProperty('--heat', colorTemp(+rango.value));
        card.style.setProperty('--m', ((rango.value - 16) / 16).toFixed(2));
      };
      rango.addEventListener('input', act);
      act();
    }
    if (!form) return;
    const nombre = $('#f-nombre'), err = $('#e-nombre'), exito = $('#exito');
    nombre.addEventListener('input', () => { if (nombre.value.trim()) { err.hidden = true; nombre.closest('.campo').classList.remove('invalido'); nombre.removeAttribute('aria-invalid'); } });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const n = nombre.value.trim();
      if (!n) {
        err.hidden = false; nombre.closest('.campo').classList.add('invalido');
        nombre.setAttribute('aria-invalid', 'true'); nombre.focus(); return;
      }
      if (!WHATSAPP_NUMBER) return;
      const espacio = $('#f-espacio').value;
      const servicio = ($('input[name="servicio"]:checked', form) || {}).value || '';
      const extra = $('#f-msg').value.trim();
      const t = rango ? rango.value : '';
      const partes = [`Hola, soy ${n}.`];
      if (servicio && espacio) partes.push(`Me interesa ${servicio.toLowerCase()} para ${espacio.toLowerCase()}.`);
      else if (servicio) partes.push(`Me interesa ${servicio.toLowerCase()}.`);
      else if (espacio) partes.push(`Quiero cotizar clima para ${espacio.toLowerCase()}.`);
      else partes.push('Quiero cotizar un servicio de aire acondicionado o refrigeración.');
      if (t) partes.push(`Temperatura deseada: ~${t}°C.`);
      if (extra) partes.push(extra);
      window.open(waUrl(partes.join(' ')), '_blank', 'noopener');
      exito.hidden = false;
      exito.scrollIntoView({ block: 'nearest', behavior: RM ? 'auto' : 'smooth' });
    });
  }

  /* ---------- Pie ---------- */
  function iniciarPie() {
    const b = $('#arriba');
    if (b) b.addEventListener('click', () => scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' }));
  }

  /* ---------- Orquestador de scroll (un solo rAF) ---------- */
  const barra = $('#barra');
  const termoN = $('#termoN');
  let lastY = scrollY, ticking = false;

  function frame() {
    ticking = false;
    const y = scrollY, dy = y - lastY; lastY = y;
    // Progreso global → termómetro
    const max = Math.max(1, root.scrollHeight - innerHeight);
    const p = clamp(y / max);
    root.style.setProperty('--progreso', p.toFixed(4));
    if (termoN) termoN.textContent = `${Math.round(36 - 18 * p)}°C`;
    // Barra: se oculta al bajar, reaparece al subir
    if (barra && !root.classList.contains('menu-abierto')) {
      if (y > 140 && dy > 4) barra.classList.add('oculta');
      else if (dy < -4 || y < 140) barra.classList.remove('oculta');
    }
    manifiesto(); pila(); obra(); proceso(); bitacora();
    revelarGeometria();
  }
  function pedir() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }

  function alRedimensionar() {
    vw = innerWidth; vh = innerHeight;
    tamCanvas(); medirPila(); medirBit();
    pedir();
  }

  /* ---------- Arranque ---------- */
  function init() {
    iniciarWA();
    iniciarMenu();
    iniciarManifiesto();
    iniciarPila();
    iniciarObra();
    iniciarProceso();
    iniciarBit();
    iniciarReveal();
    iniciarHero();
    iniciarTicker();
    iniciarAcordeon();
    iniciarBento();
    iniciarGalerias();
    iniciarRadio();
    iniciarContacto();
    iniciarPie();
    cargador();
    addEventListener('scroll', pedir, { passive: true });
    let rt = null;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(alRedimensionar, 120); });
    addEventListener('load', () => { medirBit(); medirPila(); pedir(); });
    pedir();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
