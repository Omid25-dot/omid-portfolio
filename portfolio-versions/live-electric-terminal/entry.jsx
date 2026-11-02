import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import ElectricBorder from './ElectricBorder';

const terminal = document.querySelector('.hero .terminal');

function ExistingTerminal() {
  const slot = useRef(null);
  useLayoutEffect(() => { slot.current.appendChild(terminal); }, []);
  return <div className="terminal-slot" ref={slot} />;
}

function BorderedTerminal() {
  const [paused, setPaused] = useState(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPaused(preference.matches);
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  return <>
    <ElectricBorder color="#7df9ff" speed={.8} chaos={.45} spread={.45}
      strands={3} thickness={1.5} borderRadius={16} glow={.65} intensity={.9}
      arcs={.7} flicker={.25} paused={paused} interactive={!paused}>
      <ExistingTerminal />
    </ElectricBorder>
    {createPortal(<button className="border-motion" type="button"
      aria-pressed={paused} onClick={() => setPaused(value => !value)}
      onPointerEnter={() => document.body.classList.add('cursor-hover')}
      onPointerLeave={() => document.body.classList.remove('cursor-hover')}>
      {paused ? 'Play border' : 'Pause border'}
    </button>, terminal.querySelector('.terminal-bar'))}
  </>;
}

if (terminal) {
  const mount = document.createElement('div');
  mount.className = 'terminal-effect-root';
  terminal.parentElement.insertBefore(mount, terminal);
  createRoot(mount).render(<BorderedTerminal />);
}
