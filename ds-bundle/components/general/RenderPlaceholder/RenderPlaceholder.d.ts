import * as React from 'react';

/**
 * RenderPlaceholder — from @okradesu/ui@1.0.0.
 */
export interface RenderPlaceholderProps {
  label: string;
  height: number;
  radius?: number;
  style?: false | "" | ViewStyle | RecursiveArray<Falsy | ViewStyle>;
}

export declare const RenderPlaceholder: React.ComponentType<RenderPlaceholderProps>;
