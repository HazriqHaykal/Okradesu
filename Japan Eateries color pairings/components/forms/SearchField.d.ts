import * as React from 'react';
export interface SearchFieldProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Optional Lucide icon at the right edge (e.g. "sliders-horizontal") */
  trailingIcon?: string;
  style?: React.CSSProperties;
}
export declare function SearchField(props: SearchFieldProps): JSX.Element;
