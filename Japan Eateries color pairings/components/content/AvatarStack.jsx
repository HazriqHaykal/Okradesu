import React from 'react';

export function AvatarStack({ people = [], max = 3, caption }) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  const circle = { width: 28, height: 28, borderRadius: 999, border: '2px solid var(--surface-card)', marginLeft: -8,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, overflow: 'hidden' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'flex', paddingLeft: 8 }}>
        {shown.map((p, i) => (
          <span key={i} style={{ ...circle, background: 'var(--orange-300)', color: 'var(--ink-900)' }}>
            {p.src ? <img src={p.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : p.initials}
          </span>
        ))}
        {extra > 0 ? <span style={{ ...circle, background: 'var(--ink-900)', color: 'var(--white)' }}>+{extra}</span> : null}
      </div>
      {caption ? <span style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)' }}>{caption}</span> : null}
    </div>
  );
}
