import React, { useState } from 'react';
import { Icon } from '../icons/Icon.jsx';

const SIZES = {
  sm: { height: 36, padding: '0 18px', fontSize: 11 },
  md: { height: 44, padding: '0 24px', fontSize: 12 },
  lg: { height: 52, padding: '0 30px', fontSize: 13 },
};

export function Button({ children, variant = 'primary', size = 'md', icon, iconRight, block = false, disabled = false, onClick, type = 'button', style }) {
  const [hover, setHover] = useState(false);
  const [press, setPress] = useState(false);
  const s = SIZES[size] || SIZES.md;
  const variants = {
    primary: {
      background: press ? 'var(--accent-pressed)' : hover ? 'var(--accent-hover)' : 'var(--accent)',
      color: 'var(--text-on-accent)', border: '1.5px solid transparent', boxShadow: 'var(--shadow-glow)',
    },
    secondary: {
      background: press ? 'var(--orange-200)' : hover ? 'var(--orange-100)' : 'transparent',
      color: 'var(--text-primary)', border: '1.5px solid var(--border-strong)',
    },
    ghost: {
      background: press ? 'var(--orange-200)' : hover ? 'var(--orange-100)' : 'transparent',
      color: 'var(--text-accent)', border: '1.5px solid transparent',
    },
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => { setHover(false); setPress(false); }}
      onMouseDown={() => setPress(true)} onMouseUp={() => setPress(false)}
      style={{
        display: block ? 'flex' : 'inline-flex', width: block ? '100%' : undefined,
        alignItems: 'center', justifyContent: 'center', gap: 8,
        height: s.height, padding: s.padding, borderRadius: 'var(--radius-pill)',
        fontFamily: 'var(--font-body)', fontSize: s.fontSize, fontWeight: 800,
        letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1,
        transform: press ? 'scale(0.97)' : 'none',
        transition: 'background var(--duration-fast), transform var(--duration-fast) var(--ease-out)',
        ...variants[variant], ...style,
      }}>
      {icon ? <Icon name={icon} size={16} /> : null}
      {children}
      {iconRight ? <Icon name={iconRight} size={16} /> : null}
    </button>
  );
}
