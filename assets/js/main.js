(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;

  // Hauteur d'écran mesurée une fois ; mise à jour seulement si la largeur change (rotation)
  let lastW = innerWidth;
  addEventListener('resize', () => {
    if (innerWidth === lastW) return;
    lastW = innerWidth;
    root.style.setProperty('--vh', innerHeight / 100 + 'px');
  });

  // Header : fond plein après le hero
  const hdr = $('#hdr');
  const onScroll = () => hdr.classList.toggle('is-solid', scrollY > 60);
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });

  // Menu mobile
  const burger = $('#burger');
  const setMenu = open => {
    hdr.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(!hdr.classList.contains('is-open')));
  $$('#nav a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  // Révélations au scroll (avec léger décalage entre éléments voisins)
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  $$('.rv').forEach(el => {
    const sibs = [...el.parentElement.children].filter(c => c.classList.contains('rv'));
    el.style.setProperty('--d', Math.min(sibs.indexOf(el), 6) * 0.07 + 's');
    io.observe(el);
  });
  // Hero : visible tout de suite
  requestAnimationFrame(() => $$('.hero .rv').forEach(el => el.classList.add('is-in')));

  // Barre de contact mobile : visible une fois les boutons du hero dépassés
  const mbar = $('#mbar');
  const ctas = $('#heroCtas');
  new IntersectionObserver(([e]) => {
    mbar.classList.toggle('is-on', !e.isIntersecting && e.boundingClientRect.top < 0);
  }).observe(ctas);

  // Avant / après
  const pairs = [
    { a: 'ap-mas-apres', b: 'ap-mas-avant', alt: ['Avant : mas en pierre en ruine', 'Après : mas en pierre entièrement rénové'], cap: 'Mas cévenol en ruine : murs repris en pierre, toiture en lauzes refaite, menuiseries neuves.' },
    { a: 'ap-mur-apres', b: 'ap-mur-avant', alt: ['Avant : mur de soutènement effondré', 'Après : mur reconstruit en pierre sèche'], cap: 'Mur de soutènement effondré, remonté en pierre sèche avec les pierres du site.' },
    { a: 'ap-terrasse-apres', b: 'ap-terrasse-avant', alt: ['Avant : terrain en pente brut', 'Après : terrasse et escalier en béton'], cap: 'Terrain en pente transformé en terrasse : dalle béton, escalier et muret en pierre.' },
    { a: 'ap-combles-apres', b: 'ap-combles-avant', alt: ['Avant : combles nus non isolés', 'Après : combles isolés en fibre de bois'], cap: 'Combles nus isolés en fibre de bois : travaux RGE, éligibles aux aides.' }
  ];
  const slider = $('#baSlider'), range = $('#baRange');
  const imgA = $('#baAfter'), imgB = $('#baBefore'), cap = $('#baCap');
  const setPos = p => { p = Math.max(0, Math.min(100, p)); slider.style.setProperty('--pos', p + '%'); range.value = p; };
  const fromX = x => { const r = slider.getBoundingClientRect(); setPos((x - r.left) / r.width * 100); };
  let drag = false;
  slider.addEventListener('pointerdown', e => { drag = true; slider.classList.add('is-drag'); slider.setPointerCapture(e.pointerId); fromX(e.clientX); });
  slider.addEventListener('pointermove', e => { if (drag) fromX(e.clientX); });
  const end = () => { drag = false; slider.classList.remove('is-drag'); };
  slider.addEventListener('pointerup', end);
  slider.addEventListener('pointercancel', end);
  range.addEventListener('input', () => setPos(+range.value));
  // Tabs : préchargement puis échange des images
  const tabs = $$('.ba__tabs button');
  pairs.forEach(p => [p.a, p.b].forEach(n => { const i = new Image(); i.src = `assets/img/${n}-800.webp`; }));
  tabs.forEach(t => t.addEventListener('click', () => {
    const p = pairs[+t.dataset.ba];
    tabs.forEach(x => x.setAttribute('aria-pressed', x === t));
    slider.classList.add('is-swap');
    const big = innerWidth > 800 ? 1168 : 800;
    const a = new Image(), b = new Image();
    let n = 0;
    const done = () => { if (++n < 2) return;
      imgA.src = a.src; imgB.src = b.src; imgB.alt = p.alt[0]; imgA.alt = p.alt[1]; cap.textContent = p.cap;
      setPos(50); slider.classList.remove('is-swap'); };
    a.onload = b.onload = a.onerror = b.onerror = done;
    a.src = `assets/img/${p.a}-${big}.webp`; b.src = `assets/img/${p.b}-${big}.webp`;
  }));
  // Petit aperçu du curseur à l'arrivée sur la section
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    new IntersectionObserver(([e], o) => {
      if (!e.isIntersecting) return; o.disconnect();
      let t0 = null;
      const step = t => { t0 ??= t; const k = (t - t0) / 1600; if (k >= 1 || drag) return setPos(drag ? +range.value : 50);
        setPos(50 + Math.sin(k * Math.PI * 2) * 18); requestAnimationFrame(step); };
      setTimeout(() => requestAnimationFrame(step), 500);
    }, { threshold: 0.6 }).observe(slider);
  }

  // Galerie filtrable
  const fbtns = $$('.filters button'), items = $$('#gal li');
  fbtns.forEach(b => b.addEventListener('click', () => {
    fbtns.forEach(x => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', x === b); });
    const f = b.dataset.f;
    items.forEach(li => {
      const show = f === 'all' || li.dataset.c === f;
      li.hidden = !show;
      if (show) { li.style.animation = 'none'; li.offsetWidth; li.style.animation = ''; }
    });
  }));

  // Visionneuse
  const lb = $('#lb'), lbImg = $('#lbImg'), lbCap = $('#lbCap');
  items.forEach(li => $('button', li).addEventListener('click', () => {
    const img = $('img', li);
    lbImg.src = img.currentSrc.replace('-800.webp', img.currentSrc.includes('/ap-') ? '-1168.webp' : '-1600.webp');
    lbImg.alt = img.alt; lbCap.textContent = $('span', li).textContent;
    lb.showModal();
  }));
  $('#lbX').addEventListener('click', () => lb.close());
  lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });

  // Frise des étapes : la ligne se remplit au scroll
  const steps = $('#steps');
  let ticking = false;
  const fill = () => {
    ticking = false;
    const r = steps.getBoundingClientRect(), vh = parseFloat(root.style.getPropertyValue('--vh')) * 100;
    const p = Math.max(0, Math.min(1, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
    steps.style.setProperty('--p', p.toFixed(3));
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(fill); } }, { passive: true });
  fill();

  // Carte : rivières dessinées à l'apparition
  const map = $('.map');
  new IntersectionObserver(([e], o) => { if (e.isIntersecting) { map.classList.add('is-in'); o.disconnect(); } }, { threshold: 0.3 }).observe(map);

  // Formulaire de démo : confirmation à l'écran, aucun envoi
  const form = $('#form'), err = $('#formErr'), ok = $('#formOk');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const req = $$('[required]', form);
    let bad = null;
    req.forEach(i => { const v = i.value.trim() !== ''; i.setAttribute('aria-invalid', !v); if (!v && !bad) bad = i; });
    err.hidden = !bad;
    if (bad) { bad.focus(); return; }
    ok.hidden = false; ok.focus();
  });
  form.addEventListener('input', e => { if (e.target.getAttribute('aria-invalid') === 'true' && e.target.value.trim()) e.target.setAttribute('aria-invalid', 'false'); });
})();
