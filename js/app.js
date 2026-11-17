(() => {
  'use strict';
  const d = document, $ = (s, c = d) => [...c.querySelectorAll(s)], root = d.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  if (!window.gsap || !window.ScrollTrigger || reduce) {            // graceful fallback: content stays visible
    root.classList.remove('gx'); $('[data-count]').forEach(e => e.textContent = e.dataset.count); return;
  }
  gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin);
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const ease = 'power4.out';

  // smooth scroll (Lenis) driven by GSAP's ticker
  const lenis = new Lenis({ lerp: .1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
  const nav = $('.nav')[0];
  lenis.on('scroll', e => nav.classList.toggle('hide', e.direction === 1 && e.scroll > 240));

  const cur = $('.curtain')[0], cnt = $('.cnt')[0];
  let started = false;

  function start() {
    if (started) return; started = true;
    // headings: split by words (Arabic letters must stay joined), line masks
    const h = $('#hero-h1')[0];
    if (h) new SplitText(h, { type: 'lines,words', mask: 'lines', autoSplit: true,
      onSplit: s => gsap.from(s.words, { yPercent: 115, duration: 1.3, stagger: .08, ease }) });
    gsap.to('.hero-in', { opacity: 1, y: 0, translateY: 0, duration: 1.1, stagger: .14, delay: .5, ease: 'power3.out', clearProps: 'translate' });
    $('[data-split]').forEach(el => new SplitText(el, { type: 'lines,words', mask: 'lines', autoSplit: true,
      onSplit: s => gsap.from(s.words, { yPercent: 115, duration: 1.1, stagger: .07, ease, scrollTrigger: { trigger: el, start: 'top 88%' } }) }));
    $('[data-reveal]').forEach(el => gsap.from(el, { y: 50, opacity: 0, duration: 1.1, ease, scrollTrigger: { trigger: el, start: 'top 90%' } }));
    $('[data-stagger]').forEach(g => gsap.from(g.children, { y: 60, opacity: 0, duration: 1.1, stagger: .12, ease, scrollTrigger: { trigger: g, start: 'top 85%' } }));
    // parallax images
    $('[data-par]').forEach(img => gsap.fromTo(img, { yPercent: -10 }, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: img.parentElement, scrub: true, start: 'top bottom', end: 'bottom top' } }));
    // hero media expands with scroll
    if ($('.hero-media')[0]) gsap.to('.hero-media', { width: '100%', borderRadius: 30, ease: 'none', scrollTrigger: { trigger: '.media-wrap', start: 'top 92%', end: 'top 12%', scrub: true } });
    // counters
    $('[data-count]').forEach(el => { const o = { v: 0 };
      ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => gsap.to(o, { v: +el.dataset.count, duration: 2.4, ease: 'power3.out', onUpdate: () => el.textContent = Math.round(o.v) }) }); });
    // sticky stack: earlier cards recede
    $('.scard').forEach((c, i, a) => { if (i < a.length - 1) gsap.to(c, { scale: .92, ease: 'none', scrollTrigger: { trigger: a[i + 1], start: 'top 75%', end: 'top 20%', scrub: true } }); });
    // pinned horizontal scroll (desktop only)
    gsap.matchMedia().add('(min-width:900px)', () => {
      const hz = $('.hz')[0], t = $('.hz-track')[0]; if (!hz) return;
      const dist = () => Math.max(0, t.offsetWidth - innerWidth), bar = $('.hz-bar')[0];
      gsap.to(t, { x: dist, ease: 'none', scrollTrigger: { trigger: hz, pin: true, scrub: .6, start: 'top top', end: () => '+=' + dist(), invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: s => bar.style.transform = 'scaleX(' + s.progress + ')' } });
    });
    // timeline line
    const tl = $('.tl')[0];
    if (tl) ScrollTrigger.create({ trigger: tl, start: 'top 70%', end: 'bottom 60%', scrub: true, onUpdate: s => tl.style.setProperty('--k', s.progress) });
    // architecture flow (DrawSVG)
    $('.flow').forEach(f => { gsap.from($('path', f), { drawSVG: 0, duration: 2.2, ease: 'power2.inOut', scrollTrigger: { trigger: f, start: 'top 80%' } });
      gsap.from($('.fn', f), { scale: 0, transformOrigin: '50% 50%', duration: .8, stagger: .35, ease: 'back.out(2)', scrollTrigger: { trigger: f, start: 'top 80%' } }); });
    // big marquee reacts to scroll velocity
    const tr = $('.track')[0];
    if (tr) { const m = gsap.to(tr, { xPercent: -50, repeat: -1, duration: 28, ease: 'none' });
      lenis.on('scroll', e => gsap.to(m, { timeScale: 1 + Math.min(Math.abs(e.velocity) * .6, 6), duration: .2, overwrite: true }).then(() => gsap.to(m, { timeScale: 1, duration: 1 }))); }
    // footer wordmark
    gsap.from('.fw', { yPercent: 40, ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'bottom bottom', scrub: true } });
    ScrollTrigger.refresh();
  }

  function open() {
    gsap.to(cur, { yPercent: -100, duration: 1.1, delay: .1, ease: 'power4.inOut', onStart: () => setTimeout(start, 380), onComplete: () => cur.style.display = 'none' });
  }
  if (!sessionStorage.getItem('sdp')) {
    sessionStorage.setItem('sdp', 1); const o = { v: 0 };
    gsap.to(o, { v: 100, duration: 1.7, ease: 'power2.inOut', onUpdate: () => cnt.textContent = Math.round(o.v), onComplete: open });
  } else { cur.classList.add('quick'); open(); }
  setTimeout(() => { if (!started) { cur.style.display = 'none'; start(); } }, 8000);   // safety net

  // page transitions
  d.addEventListener('click', e => {
    const a = e.target.closest('a[href]'); if (!a || a.target || e.metaKey || e.ctrlKey || a.origin !== location.origin || a.pathname.replace(/index\.html$/,'') === location.pathname.replace(/index\.html$/,'')) return;
    e.preventDefault(); cur.classList.add('quick'); gsap.set(cur, { display: 'flex', yPercent: 100 });
    gsap.to(cur, { yPercent: 0, duration: .8, ease: 'power4.inOut', onComplete: () => location.href = a.href });
  });
  addEventListener('pageshow', e => { if (e.persisted) cur.style.display = 'none'; });

  if (!fine) return;
  // cursor + magnetic buttons
  const c = $('.cursor')[0], cx = gsap.quickTo(c, 'x', { duration: .45, ease: 'power3' }), cy = gsap.quickTo(c, 'y', { duration: .45, ease: 'power3' });
  addEventListener('pointermove', e => { cx(e.clientX); cy(e.clientY); });
  d.addEventListener('pointerover', e => c.classList.toggle('big', !!e.target.closest('a,button')));
  d.addEventListener('pointermove', () => {}, { passive: true });
  $('[data-mag]').forEach(b => { const x = gsap.quickTo(b, 'x', { duration: .5, ease: 'power3' }), y = gsap.quickTo(b, 'y', { duration: .5, ease: 'power3' });
    b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * .3); y((e.clientY - r.top - r.height / 2) * .4); });
    b.addEventListener('pointerleave', () => { x(0); y(0); }); });
})();
