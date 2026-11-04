import React, { useLayoutEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import ElectricBorder from './ElectricBorder';

const terminal = document.querySelector('.hero .terminal');

function ExistingTerminal() {
  const slot = useRef(null);
  useLayoutEffect(() => { slot.current.appendChild(terminal); }, []);
  return <div className="terminal-slot" ref={slot} />;
}

function BorderedTerminal() {
  return <ElectricBorder color="#7df9ff" speed={1.1} chaos={.6} spread={.6}
      strands={3} thickness={1.5} borderRadius={16} glow={.65} intensity={.9}
      arcs={1.2} flicker={.35} paused={false} interactive cursorRadius={150}>
      <ExistingTerminal />
    </ElectricBorder>;
}

if (terminal) {
  const mount = document.createElement('div');
  mount.className = 'terminal-effect-root';
  terminal.parentElement.insertBefore(mount, terminal);
  createRoot(mount).render(<BorderedTerminal />);
}
