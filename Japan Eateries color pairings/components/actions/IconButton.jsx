import React, { useState } from 'react';
import { Icon } from '../icons/Icon.jsx';

export function IconButton({ icon, variant = 'surface', size = 40, active = false, label, onClick, style }) {
  const [hover, setHover] = useState(false);
  const [press, setPress] = useState(false);
  const v = {
    surface: { background: hover ? 'var(--orange-100)' : 'var(--surface-card)', color: active ? 'var(--accent)' : 'var(--text-primary)', boxShadow: 'var(--shadow-tile)' },
    accent: { background: press ? 'var(--accent-pressed)' : hover ? 'var(--accent-hover)' : 'var(--accent)', color: 'var(--text-on-accent)', boxShadow: 'var(--shadow-glow)' },
    ghost: { background: hover ? 'var(--orange-100)' : 'transparent', color: active ? 'var(--accent)' : 'var(--text-primary)' },
  }[variant];
  return (
    <button type="button" aria-label={label || icon} onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => { setHover(false); setPress(false); }}
      onMouseDown={() => setPress(true)} onMouseUp={() => setPress(false)}
      style={{
        width: size, height: size, borderRadius: 'var(--radius-pill)', border: 'none', padding: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        transform: press ? 'scale(0.94)' : 'none',
        transition: 'background var(--duration-fast), transform var(--duration-fast) var(--ease-out)',
        ...v, ...style,
      }}>
      <Icon name={icon} size={Math.round(size * 0.48)} />
    </button>
  );
}
