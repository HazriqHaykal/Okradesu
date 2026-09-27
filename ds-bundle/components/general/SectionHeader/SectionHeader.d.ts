import * as React from 'react';

/**
 * SectionHeader — from @okradesu/ui@1.0.0.
 */
export interface SectionHeaderProps {
  title: string;
  action?: string;
  href?: string | { pathname: string; params?: Record<string, string>; };
}

export declare const SectionHeader: React.ComponentType<SectionHeaderProps>;
