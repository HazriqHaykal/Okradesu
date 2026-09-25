import React from 'react';
import { Icon } from '../icons/Icon.jsx';

const TONES = {
  accent: { background: 'var(--orange-200)', color: 'var(--orange-800)' },
  neutral: { background: 'var(--surface-sunken)', color: 'var(--ink-700)' },
  success: { background: '#E3F1E7', color: '#2C6A42' },
  solid: { background: 'var(--accent)', color: 'var(--text-on-accent)' },
};

export function Badge({ children, tone = 'accent', icon }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 22, padding: '0 9px',
      borderRadius: 'var(--radius-pill)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-micro)', fontWeight: 800,
      letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase', ...TONES[tone] }}>
      {icon ? <Icon name={icon} size={11} /> : null}{children}
    </span>
  );
}
