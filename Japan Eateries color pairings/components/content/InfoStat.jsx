import React from 'react';

export function InfoStat({ label, value, align = 'left' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: align === 'center' ? 'center' : 'flex-start' }}>
      <span style={{ fontSize: 'var(--text-micro)', fontWeight: 700, letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 'var(--text-body-lg)', fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
}
