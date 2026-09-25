import React from 'react';

export function SectionHeader({ title, action = 'See All', onAction, style }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, ...style }}>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-heading)', fontWeight: 800, color: 'var(--text-primary)' }}>{title}</span>
      {action ? (
        <button type="button" onClick={onAction} style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer',
          fontFamily: 'var(--font-body)', fontSize: 'var(--text-small)', fontWeight: 600, color: 'var(--text-accent)' }}>{action}</button>
      ) : null}
    </div>
  );
}
