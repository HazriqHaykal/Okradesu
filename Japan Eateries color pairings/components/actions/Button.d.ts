import * as React from 'react';
/**
 * @startingPoint section="Actions" subtitle="Pill buttons — filled orange, outlined ink, ghost" viewport="700x260"
 */
export interface ButtonProps {
  children?: React.ReactNode;
  /** primary = orange fill + ink label; secondary = ink outline; ghost = accent text */
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  /** Lucide icon name before the label */
  icon?: string;
  /** Lucide icon name after the label */
  iconRight?: string;
  block?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  style?: React.CSSProperties;
}
export declare function Button(props: ButtonProps): JSX.Element;
