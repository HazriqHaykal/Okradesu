import * as React from 'react';
export interface BottomNavItem { id: string; label: string; /** Lucide icon name */ icon: string; }
export interface BottomNavProps {
  items?: BottomNavItem[];
  active?: string;
  onChange?: (id: string) => void;
  style?: React.CSSProperties;
}
export declare function BottomNav(props: BottomNavProps): JSX.Element;
