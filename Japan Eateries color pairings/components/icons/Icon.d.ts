import * as React from 'react';
export interface IconProps {
  /** Lucide icon name, kebab-case (e.g. "search", "map-pin", "heart") */
  name: string;
  /** Pixel size. Default 20 */
  size?: number;
  /** Any CSS color; defaults to currentColor */
  color?: string;
  style?: React.CSSProperties;
}
export declare function Icon(props: IconProps): JSX.Element;
