import React, { useState } from 'react';
import { Icon } from '../icons/Icon.jsx';

export function SearchField({ placeholder = 'What do you want to eat?', value, onChange, trailingIcon, style }) {
  const [focus, setFocus] = useState(false);
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 10, height: 46, padding: '0 16px',
      background: 'var(--surface-card)', borderRadius: 'var(--radius-md)',
      boxShadow: focus ? '0 0 0 2px var(--accent), var(--shadow-glow)' : 'var(--shadow-glow)',
      transition: 'box-shadow var(--duration-fast)', cursor: 'text', ...style,
    }}>
      <Icon name="search" size={18} color="var(--text-secondary)" />
      <input value={value} onChange={onChange} placeholder={placeholder}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
          fontFamily: 'var(--font-body)', fontSize: 'var(--text-body)', color: 'var(--text-primary)' }} />
      {trailingIcon ? <Icon name={trailingIcon} size={18} color="var(--accent)" /> : null}
    </label>
  );
}
