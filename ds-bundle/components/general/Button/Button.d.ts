import * as React from 'react';

/**
 * Button — from @okradesu/ui@1.0.0.
 * @replaces button
 */
export interface ButtonProps {
  label: string;
  onPress?: () => void;
  href?: string | { pathname: string; params?: Record<string, string>; };
  variant?: "primary" | "secondary" | "ghost" | "surface";
  size?: "sm" | "md" | "lg";
  icon?: LucideIcon;
  block?: boolean;
  disabled?: boolean;
  style?: false | "" | ViewStyle | RecursiveArray<Falsy | ViewStyle>;
}

export declare const Button: React.ComponentType<ButtonProps>;
