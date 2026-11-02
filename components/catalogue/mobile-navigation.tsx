'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { Icon } from '@/components/ui/icon';

export function MobileNavigation({ links }: { links: readonly (readonly [string, string])[] }) {
  const menu = useRef<HTMLDetailsElement>(null);
  return <details className="mobile-menu" ref={menu} onKeyDown={event => {
    if (event.key === 'Escape' && menu.current?.open) {
      menu.current.open = false;
      menu.current.querySelector('summary')?.focus();
    }
  }}>
    <summary aria-label="Toggle navigation"><span>Menu</span><Icon name="menu" /></summary>
    <nav aria-label="Mobile navigation">{links.map(([name, path]) => <Link key={path} href={path} onClick={() => { if (menu.current) menu.current.open = false; }}>{name}</Link>)}</nav>
  </details>;
}
