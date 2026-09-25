import React from 'react';

export function CategoryTile({ label, image, selected = false, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 54, height: 54, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)',
        boxShadow: selected ? '0 0 0 2px var(--accent), var(--shadow-glow)' : 'var(--shadow-tile)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {image ? <img src={image} alt="" style={{ width: '82%', height: '82%', objectFit: 'contain' }} />
          : <span style={{ width: '70%', height: '70%', borderRadius: 'var(--radius-sm)', background: 'var(--surface-tint)' }} />}
      </span>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-caption)', fontWeight: 600,
        color: selected ? 'var(--text-accent)' : 'var(--text-primary)' }}>{label}</span>
    </button>
  );
}
