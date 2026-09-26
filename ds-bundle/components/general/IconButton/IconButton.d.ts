import * as React from 'react';

/**
 * IconButton — from @okradesu/ui@1.0.0.
 */
export interface IconButtonProps {
  icon: LucideIcon;
  label: string;
  onPress?: () => void;
  href?: string | { pathname: string; params?: Record<string, string>; };
  variant?: "accent" | "surface";
  size?: number;
  dot?: boolean;
}

export declare const IconButton: React.ComponentType<IconButtonProps>;
