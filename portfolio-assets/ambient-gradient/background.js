(() => {
  const layer = document.querySelector('.ambient-background');
  if (!layer) return;
  document.body.classList.add('ambient-motion');
  // Position, palette and ribbon drawing follow scrolling in both directions.
  let scrollFrame = null;
  const stops = [[244,241,235], [224,239,241], [233,225,246], [239,240,213], [237,225,241]];
  function renderScrollScene() {
    scrollFrame = null;
    const max = document.documentElement.scrollHeight - innerHeight;
    const progress = max > 0 ? Math.max(0, Math.min(1, scrollY / max)) : 0;
    const phase = progress * (stops.length - 1);
    const index = Math.min(stops.length - 2, Math.floor(phase));
    const fraction = phase - index;
    const rgb = stops[index].map((value, channel) => Math.round(value + (stops[index + 1][channel] - value) * fraction));
    const style = document.body.style;
    style.setProperty('--scene-paper', `rgb(${rgb.join(',')})`);
    style.setProperty('--scene-hue', `${progress * 125}deg`);
    style.setProperty('--scene-turn', `${progress * 110 - 25}deg`);
    style.setProperty('--scene-orbit', `${progress * -180}deg`);
    style.setProperty('--scene-shift', `${Math.sin(progress * Math.PI * 3) * 110}px`);
    style.setProperty('--scene-draw', String(1 - Math.min(1, progress * 2.2)));
    style.setProperty('--scene-opacity', String(Math.min(.62, progress * 3)));
    style.setProperty('--scene-light-x', `${90 - progress * 75}%`);
    style.setProperty('--scene-light-y', `${80 - progress * 65}%`);
  }
  function queueScrollScene() {
    if (scrollFrame === null) scrollFrame = requestAnimationFrame(renderScrollScene);
  }
  window.addEventListener('scroll', queueScrollScene, { passive: true });
  window.addEventListener('resize', queueScrollScene);
  window.addEventListener('load', queueScrollScene);
  renderScrollScene();
  let frame = null;
  let x = 0, y = 0, targetX = 0, targetY = 0;

  function follow() {
    frame = null;
    if (document.hidden) return;
    x += (targetX - x) * .09;
    y += (targetY - y) * .09;
    layer.style.setProperty('--ambient-x', x.toFixed(2) + 'px');
    layer.style.setProperty('--ambient-y', y.toFixed(2) + 'px');
    if (Math.abs(targetX - x) + Math.abs(targetY - y) > .1) frame = requestAnimationFrame(follow);
  }
  document.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    targetX = (event.clientX / innerWidth - .5) * 65;
    targetY = (event.clientY / innerHeight - .5) * 45;
    if (frame === null) frame = requestAnimationFrame(follow);
  }, { passive: true });
  document.addEventListener('pointerdown', event => {
    if (event.target.closest('a,button,input')) return;
    const pulse = document.createElement('span');
    pulse.className = 'ambient-pulse';
    pulse.style.left = event.clientX + 'px';
    pulse.style.top = event.clientY + 'px';
    layer.appendChild(pulse);
    setTimeout(() => pulse.remove(), 1250);
  }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    document.body.classList.toggle('ambient-suspended', document.hidden);
    if (document.hidden && frame !== null) { cancelAnimationFrame(frame); frame = null; }
  });
})();
