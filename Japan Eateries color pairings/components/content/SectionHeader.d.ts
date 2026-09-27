import * as React from 'react';
export interface SectionHeaderProps {
  title: string;
  /** Right-side link label; pass null to hide. Default "See All" */
  action?: string | null;
  onAction?: () => void;
  style?: React.CSSProperties;
}
export declare function SectionHeader(props: SectionHeaderProps): JSX.Element;
