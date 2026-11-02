/* Original falling-glyph background for Omid's static portfolio.
 * Independently authored; does not contain React Bits Pro component code.
 */
(() => {
  const hero = document.querySelector('.hero');
  const canvas = document.querySelector('.glyph-rain');
  const context = canvas?.getContext('2d');
  if (!hero || !context) return;

  const glyphs = Array.from('01ABCDEF{}[]<>/+=:;アイウエオカキクケコ');
  const pointer = { x: -1000, y: -1000 };
  let width = 0;
  let height = 0;
  let streams = [];
  let frame = null;
  let lastTime = 0;
  let visible = true;
  let shuffleTime = 0;

  const randomGlyph = () => glyphs[Math.floor(Math.random() * glyphs.length)];
  const paused = () => document.body.classList.contains('motion-paused');
  const canAnimate = () => visible && !document.hidden && !paused();

  function resize() {
    const bounds = hero.getBoundingClientRect();
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    streams = [];
    for (let layer = 0; layer < 2; layer++) {
      const size = layer === 0 ? 13 : 19;
      const gap = layer === 0 ? 27 : 34;
      for (let x = 10; x < width; x += gap) {
        if (Math.random() > .66) continue;
        streams.push({
          x: x + Math.random() * 8,
          y: Math.random() * (height + 280),
          size,
          speed: (layer === 0 ? 27 : 48) + Math.random() * 48,
          length: 8 + Math.floor(Math.random() * 12),
          opacity: layer === 0 ? .24 : .58,
          characters: Array.from({ length: 20 }, randomGlyph),
          burst: 0
        });
      }
    }
    draw(0);
    sync();
  }

  function draw(delta) {
    context.clearRect(0, 0, width, height);
    shuffleTime += delta;
    const shuffle = shuffleTime > .15;
    if (shuffle) shuffleTime = 0;
    for (const stream of streams) {
      const distance = Math.hypot(stream.x - pointer.x, stream.y - pointer.y);
      const slow = Math.min(1, Math.max(.2, distance / 170));
      stream.y += stream.speed * slow * delta * (1 + stream.burst * 2);
      stream.burst = Math.max(0, stream.burst - delta);
      if (stream.y - stream.length * stream.size > height) {
        stream.y = -Math.random() * 300;
      }
      context.font = `${stream.size}px "JetBrains Mono", monospace`;
      context.textAlign = 'center';
      for (let index = stream.length - 1; index >= 0; index--) {
        const y = stream.y - index * stream.size;
        if (y < -stream.size || y > height + stream.size) continue;
        if (shuffle && Math.random() < .12) stream.characters[index] = randomGlyph();
        const fade = Math.pow(1 - index / stream.length, 1.6);
        context.globalAlpha = stream.opacity * fade;
        context.fillStyle = index === 0 ? '#e3faff' : '#9db8ff';
        context.shadowColor = index === 0 ? '#a1e8f5' : '#8398ff';
        context.shadowBlur = index === 0 ? 12 : 2;
        context.fillText(stream.characters[index], stream.x, y);
      }
    }
    context.globalAlpha = 1;
    context.shadowBlur = 0;
  }

  function tick(time) {
    frame = null;
    if (!canAnimate()) return;
    if (time - lastTime >= 1000 / 30) {
      const delta = lastTime ? Math.min((time - lastTime) / 1000, .07) : 0;
      lastTime = time;
      draw(delta);
    }
    frame = requestAnimationFrame(tick);
  }

  function sync() {
    if (canAnimate()) {
      if (frame === null) {
        lastTime = 0;
        frame = requestAnimationFrame(tick);
      }
    } else {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      lastTime = 0;
    }
  }

  hero.addEventListener('pointermove', event => {
    const bounds = hero.getBoundingClientRect();
    pointer.x = event.clientX - bounds.left;
    pointer.y = event.clientY - bounds.top;
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { pointer.x = -1000; pointer.y = -1000; });
  hero.addEventListener('pointerdown', event => {
    if (paused() || event.target.closest('a, button')) return;
    const bounds = hero.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    for (const stream of streams) {
      if (Math.abs(stream.x - x) < 160) {
        stream.y = y - Math.random() * 100;
        stream.burst = 1;
      }
    }
  });

  new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    sync();
  }).observe(hero);
  new ResizeObserver(resize).observe(hero);
  document.addEventListener('visibilitychange', sync);
  resize();
})();
