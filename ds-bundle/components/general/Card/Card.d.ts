import * as React from 'react';

/**
 * Card — from @okradesu/ui@1.0.0.
 */
export interface CardProps {
  children: React.ReactNode;
  style?: false | "" | ViewStyle | RecursiveArray<Falsy | ViewStyle>;
}

export declare const Card: React.ComponentType<CardProps>;
