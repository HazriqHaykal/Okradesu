import * as React from 'react';

/**
 * Badge — from @okradesu/ui@1.0.0.
 */
export interface BadgeProps {
  label: string;
  tone?: "accent" | "neutral" | "success" | "solid" | "danger";
  icon?: LucideIcon;
}

export declare const Badge: React.ComponentType<BadgeProps>;
