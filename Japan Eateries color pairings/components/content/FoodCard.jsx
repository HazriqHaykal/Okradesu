import React, { useState } from 'react';
import { Icon } from '../icons/Icon.jsx';

export function FoodCard({ name, location, price, rating, image, favorite = false, onFavorite, onClick, style }) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)', padding: 8,
        display: 'flex', flexDirection: 'column', gap: 6, cursor: onClick ? 'pointer' : 'default',
        boxShadow: hover && onClick ? 'var(--shadow-float)' : 'var(--shadow-card)',
        transform: hover && onClick ? 'translateY(-2px)' : 'none',
        transition: 'box-shadow var(--duration-base), transform var(--duration-base) var(--ease-out)', ...style }}>
      <div style={{ position: 'relative', height: 104, borderRadius: 'var(--radius-md)', background: 'var(--surface-tint)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {image ? <img src={image} alt="" style={{ width: '86%', height: '86%', objectFit: 'contain' }} />
          : <span style={{ fontSize: 'var(--text-micro)', fontWeight: 600, color: 'var(--orange-700)', letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase' }}>Food render</span>}
        {onFavorite ? (
          <button type="button" aria-label="Favorite" onClick={(e) => { e.stopPropagation(); onFavorite(); }}
            style={{ position: 'absolute', top: 6, right: 6, width: 28, height: 28, borderRadius: 999, border: 'none',
              background: 'var(--surface-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
            <Icon name="heart" size={14} color={favorite ? 'var(--accent)' : 'var(--text-secondary)'} />
          </button>
        ) : null}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, padding: '0 2px' }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{name}</span>
        {rating != null ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 'var(--text-caption)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            <Icon name="star" size={12} color="var(--rating)" />{rating}
          </span>
        ) : null}
      </div>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 2px 2px', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
        <Icon name="map-pin" size={12} />{location}{price ? ' · ' + price : ''}
      </span>
    </div>
  );
}
