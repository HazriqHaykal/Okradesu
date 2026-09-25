import React from 'react';
import { Icon } from '../icons/Icon.jsx';

const DEFAULT_ITEMS = [
  { id: 'home', label: 'Home', icon: 'house' },
  { id: 'saved', label: 'Saved', icon: 'bookmark' },
  { id: 'orders', label: 'Orders', icon: 'receipt' },
  { id: 'profile', label: 'Profile', icon: 'user' },
];

export function BottomNav({ items = DEFAULT_ITEMS, active = 'home', onChange, style }) {
  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 7,
      background: 'var(--surface-card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-float)', ...style }}>
      {items.map((it) => {
        const on = it.id === active;
        return (
          <button key={it.id} type="button" aria-label={it.label} onClick={() => onChange && onChange(it.id)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 40, padding: on ? '0 16px' : '0 12px',
              border: 'none', borderRadius: 'var(--radius-lg)', cursor: 'pointer',
              background: on ? 'var(--accent)' : 'transparent', color: on ? 'var(--text-on-accent)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-body)', fontSize: 'var(--text-small)', fontWeight: 700,
              transition: 'background var(--duration-base), padding var(--duration-base) var(--ease-out)' }}>
            <Icon name={it.icon} size={18} />
            {on ? it.label : null}
          </button>
        );
      })}
    </nav>
  );
}
