// Site behaviour. No libraries on load; hls.js is fetched only when the film is played.
(() => {
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // loops play only while visible, so a page never pulls every video at once
  const loops = $$('video[data-loop]');
  const io = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting) { if (v.preload !== 'auto') v.preload = 'auto'; v.play().catch(() => {}); } else v.pause();
  }), { threshold: 0.3 });
  loops.forEach(v => io.observe(v));

  // one sound at a time
  $$('.sound').forEach(b => {
    const v = b.parentElement.querySelector('video');
    b.addEventListener('click', () => {
      v.muted = !v.muted;
      b.textContent = v.muted ? 'Sound on' : 'Sound off';
      b.classList.toggle('live', !v.muted);
      if (!v.muted) $$('.sound').forEach(o => { if (o !== b) { const ov = o.parentElement.querySelector('video'); ov.muted = true; o.textContent = 'Sound on'; o.classList.remove('live'); } });
      v.play().catch(() => {});
    });
  });

  // tabs
  $$('[role=tablist]').forEach(list => {
    const tabs = $$('[role=tab]', list);
    tabs.forEach(t => t.addEventListener('click', () => {
      tabs.forEach(o => { const on = o === t; o.setAttribute('aria-selected', on); const p = document.getElementById(o.getAttribute('aria-controls')); if (p) p.hidden = !on; });
      const p = document.getElementById(t.getAttribute('aria-controls'));
      if (p) $$('video[data-loop]', p).forEach(v => { v.preload = 'auto'; v.play().catch(() => {}); });
    }));
  });

  // before / after
  $$('.ba').forEach(ba => {
    const r = ba.querySelector('input');
    const set = () => ba.style.setProperty('--x', r.value + '%');
    r.addEventListener('input', set); set();
  });

  // lightbox for keyframes
  const lb = document.querySelector('.lb');
  if (lb) {
    const img = lb.querySelector('img'), cap = lb.querySelector('.cap'), num = lb.querySelector('.num');
    const items = $$('[data-full]');
    let i = 0;
    const show = k => { i = (k + items.length) % items.length; const b = items[i]; img.src = b.dataset.full; img.alt = b.dataset.cap; cap.textContent = b.dataset.cap; num.textContent = b.dataset.id; lb.hidden = false; };
    items.forEach((b, k) => b.addEventListener('click', () => show(k)));
    lb.addEventListener('click', e => { if (e.target === lb || e.target.closest('.x')) lb.hidden = true; });
    document.addEventListener('keydown', e => {
      if (lb.hidden) return;
      if (e.key === 'Escape') lb.hidden = true;
      if (e.key === 'ArrowRight') show(i + 1);
      if (e.key === 'ArrowLeft') show(i - 1);
    });
  }

  // the film: adaptive stream (1080p / 720p / 480p). Safari plays HLS natively; elsewhere hls.js loads on first play.
  const film = document.querySelector('[data-hls]');
  if (film) {
    const v = film.querySelector('video'), btn = film.querySelector('.play'), src = film.dataset.hls;
    const start = () => {
      btn.remove(); v.controls = true;
      if (v.canPlayType('application/vnd.apple.mpegurl')) { v.src = src; v.play().catch(() => {}); return; }
      const s = document.createElement('script');
      s.src = film.dataset.hlsjs;
      s.onload = () => {
        if (!window.Hls || !Hls.isSupported()) { v.src = film.dataset.fallback; v.play().catch(() => {}); return; }
        const h = new Hls({ capLevelToPlayerSize: true, startLevel: -1 });
        h.loadSource(src); h.attachMedia(v);
        h.on(Hls.Events.MANIFEST_PARSED, () => v.play().catch(() => {}));
      };
      document.head.appendChild(s);
    };
    btn.addEventListener('click', start);
  }
})();
