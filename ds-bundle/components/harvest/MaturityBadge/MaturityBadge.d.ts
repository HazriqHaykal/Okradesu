import * as React from 'react';

/**
 * MaturityBadge — from @okradesu/ui@1.0.0.
 */
export interface MaturityBadgeProps {
  maturity: "too_small" | "ready" | "overgrown";
}

export declare const MaturityBadge: React.ComponentType<MaturityBadgeProps>;
