(() => {
  const layer = document.querySelector('.ambient-background');
  if (!layer) return;
  document.body.classList.add('ambient-motion');
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
