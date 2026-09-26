import { RenderPlaceholder } from '@okradesu/ui';

/** Stand-in for a camera frame or photo until real imagery exists. */
export const CameraFrame = () => (
  <div style={{ width: 320 }}>
    <RenderPlaceholder label="Live camera · Classroom 2" height={200} radius={22} />
  </div>
);

/** Round and small, for onboarding collages. */
export const Shapes = () => (
  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
    <RenderPlaceholder label="Okra basket" height={140} radius={999} style={{ width: 140 }} />
    <RenderPlaceholder label="Okra pods" height={110} style={{ width: 150 }} />
  </div>
);
