import * as React from 'react';

/**
 * Toggle — from @okradesu/ui@1.0.0.
 */
export interface ToggleProps {
  value: boolean;
  onValueChange: (next: boolean) => void;
  label: string;
}

export declare const Toggle: React.ComponentType<ToggleProps>;
