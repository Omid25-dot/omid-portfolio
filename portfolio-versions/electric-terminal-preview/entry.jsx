import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import ElectricBorder from './ElectricBorder';

const terminal = document.querySelector('.hero .terminal');

function ExistingTerminal() {
  const slot = useRef(null);
  useLayoutEffect(() => {
    // Move the existing node to preserve its content, observers and cursor events.
    slot.current.appendChild(terminal);
  }, []);
  return <div className="terminal-slot" ref={slot} />;
}

function BorderedTerminal() {
  const [paused, setPaused] = useState(document.body.classList.contains('motion-paused'));
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setPaused(document.body.classList.contains('motion-paused'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return <ElectricBorder
    color="#a1e8f5"
    glowColor="#a6bbff"
    speed={.8}
    chaos={.45}
    spread={.45}
    strands={3}
    thickness={1.5}
    borderRadius={16}
    glow={.65}
    intensity={.9}
    arcs={.7}
    flicker={.25}
    paused={paused}
    interactive={!paused}
  ><ExistingTerminal /></ElectricBorder>;
}

if (terminal) {
  const mount = document.createElement('div');
  mount.className = 'terminal-effect-root';
  terminal.parentElement.insertBefore(mount, terminal);
  createRoot(mount).render(<BorderedTerminal />);
}
