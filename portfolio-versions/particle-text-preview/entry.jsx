import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import ParticleText from './ParticleText';

const heading = document.querySelector('.particle-heading');
const mount = document.getElementById('particle-name-root');
let ready = 0;
const onReady = () => {
  ready += 1;
  if (ready >= 2) heading.classList.add('particles-ready');
};

function ParticleName() {
  const [paused, setPaused] = useState(document.body.classList.contains('motion-paused'));
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setPaused(document.body.classList.contains('motion-paused'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const shared = {
    particleSize: 1.9,
    density: 3,
    color: '#eff4ff',
    highlightColor: '#a1e8f5',
    highlightMode: 'motion',
    shape: 'circle',
    intro: 'gather',
    scatter: 90,
    gatherDuration: 1300,
    stagger: 250,
    clickBurst: true,
    burstStrength: .7,
    pointerRepel: 36,
    repelRadius: 95,
    idleDrift: .4,
    trigger: 'hover',
    fontSize: 'clamp(4rem, 14vw, 7rem)',
    fontWeight: 800,
    fontFamily: 'Syne',
    glow: true,
    paused,
    onReady
  };
  return <>
    <ParticleText {...shared} text="Omid" />
    <ParticleText {...shared} text="Merati" color="#c3d5ff" highlightColor="#b7b1ff" />
  </>;
}

if (heading && mount) createRoot(mount).render(<ParticleName />);
