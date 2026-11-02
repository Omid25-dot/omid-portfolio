(() => {
  const layer = document.querySelector('.ambient-background');
  const button = document.querySelector('.ambient-toggle');
  if (!layer || !button) return;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let playing = !preference.matches;
  let frame = null;
  let x = 0, y = 0, targetX = 0, targetY = 0;

  function update() {
    document.body.classList.toggle('ambient-motion', playing);
    button.textContent = playing ? 'Pause background' : 'Play background';
    button.setAttribute('aria-pressed', String(!playing));
    if (!playing) {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      x = y = targetX = targetY = 0;
      layer.style.setProperty('--ambient-x', '0px');
      layer.style.setProperty('--ambient-y', '0px');
      layer.querySelectorAll('.ambient-pulse').forEach(pulse => pulse.remove());
    }
  }
  function follow() {
    frame = null;
    if (!playing || document.hidden) return;
    x += (targetX - x) * .09;
    y += (targetY - y) * .09;
    layer.style.setProperty('--ambient-x', x.toFixed(2) + 'px');
    layer.style.setProperty('--ambient-y', y.toFixed(2) + 'px');
    if (Math.abs(targetX - x) + Math.abs(targetY - y) > .1) frame = requestAnimationFrame(follow);
  }
  document.addEventListener('pointermove', event => {
    if (!playing || event.pointerType !== 'mouse') return;
    targetX = (event.clientX / innerWidth - .5) * 65;
    targetY = (event.clientY / innerHeight - .5) * 45;
    if (frame === null) frame = requestAnimationFrame(follow);
  }, { passive: true });
  document.addEventListener('pointerdown', event => {
    if (!playing || event.target.closest('a,button,input')) return;
    const pulse = document.createElement('span');
    pulse.className = 'ambient-pulse';
    pulse.style.left = event.clientX + 'px';
    pulse.style.top = event.clientY + 'px';
    layer.appendChild(pulse);
    setTimeout(() => pulse.remove(), 1250);
  }, { passive: true });
  button.addEventListener('click', () => { playing = !playing; update(); });
  // The original page binds cursor hover listeners before this script runs.
  button.addEventListener('pointerenter', () => document.body.classList.add('cursor-hover'));
  button.addEventListener('pointerleave', () => document.body.classList.remove('cursor-hover'));
  preference.addEventListener('change', () => { playing = !preference.matches; update(); });
  document.addEventListener('visibilitychange', () => {
    document.body.classList.toggle('ambient-suspended', document.hidden);
    if (document.hidden && frame !== null) { cancelAnimationFrame(frame); frame = null; }
  });
  update();
})();
