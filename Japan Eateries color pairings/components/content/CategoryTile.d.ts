import * as React from 'react';
export interface CategoryTileProps {
  label: string;
  /** Transparent PNG food render; a tinted placeholder shows when omitted */
  image?: string;
  selected?: boolean;
  onClick?: () => void;
}
export declare function CategoryTile(props: CategoryTileProps): JSX.Element;
