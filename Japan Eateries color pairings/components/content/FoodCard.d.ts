import * as React from 'react';
/**
 * @startingPoint section="Content" subtitle="Recommendation card with food render, rating and location" viewport="700x300"
 */
export interface FoodCardProps {
  name: string;
  location: string;
  /** Pre-formatted, e.g. "¥980" */
  price?: string;
  rating?: number;
  /** Transparent PNG food render; placeholder shows when omitted */
  image?: string;
  favorite?: boolean;
  /** Shows the heart button when provided */
  onFavorite?: () => void;
  onClick?: () => void;
  style?: React.CSSProperties;
}
export declare function FoodCard(props: FoodCardProps): JSX.Element;
