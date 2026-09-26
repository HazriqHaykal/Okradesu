import { OkraPod } from '@okradesu/ui';

/** Fresh, small and overgrown pods. */
export const Tones = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <OkraPod width={200} tone="fresh" />
    <OkraPod width={140} tone="small" />
    <OkraPod width={240} tone="overgrown" />
  </div>
);
