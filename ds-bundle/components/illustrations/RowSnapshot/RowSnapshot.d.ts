import * as React from 'react';

/**
 * RowSnapshot — from @okradesu/ui@1.0.0.
 */
export interface RowSnapshotProps {
  det: DetectionRow;
  kind: "outdoor" | "indoor";
  seed: number;
  width: number;
  height: number;
  labels?: boolean;
}

export declare const RowSnapshot: React.ComponentType<RowSnapshotProps>;
