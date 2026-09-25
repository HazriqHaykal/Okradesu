import * as React from 'react';
export interface IconButtonProps {
  /** Lucide icon name */
  icon: string;
  /** surface = white circle w/ soft shadow; accent = orange; ghost = no fill */
  variant?: 'surface' | 'accent' | 'ghost';
  /** Diameter in px. Default 40 */
  size?: number;
  /** Tints the icon orange (e.g. favorited heart) */
  active?: boolean;
  /** Accessible label; defaults to icon name */
  label?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  style?: React.CSSProperties;
}
export declare function IconButton(props: IconButtonProps): JSX.Element;
