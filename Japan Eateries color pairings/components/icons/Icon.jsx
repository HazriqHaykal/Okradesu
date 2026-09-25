import React from 'react';

const BASE = 'https://unpkg.com/lucide-static@0.460.0/icons/';

export function Icon({ name, size = 20, color = 'currentColor', style }) {
  const url = 'url(' + BASE + name + '.svg)';
  return (
    <span aria-hidden="true" style={{
      display: 'inline-block', width: size, height: size, flexShrink: 0,
      backgroundColor: color,
      WebkitMaskImage: url, maskImage: url,
      WebkitMaskSize: 'contain', maskSize: 'contain',
      WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
      WebkitMaskPosition: 'center', maskPosition: 'center',
      ...style,
    }} />
  );
}
