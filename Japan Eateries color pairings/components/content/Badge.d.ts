import * as React from 'react';
export interface BadgeProps {
  children?: React.ReactNode;
  tone?: 'accent' | 'neutral' | 'success' | 'solid';
  /** Optional Lucide icon */
  icon?: string;
}
export declare function Badge(props: BadgeProps): JSX.Element;
