import { UpcomingChart, upcomingPods } from '@okradesu/ui';

/** Pods expected today and the next three days, from the flower countdown. */
export const Framed = () => (
  <div style={{ width: 360 }}>
    <UpcomingChart days={upcomingPods(4)} />
  </div>
);

/** Without its own card, inside a dashboard panel. */
export const InPanel = () => (
  <div style={{ width: 420, padding: 20, background: '#FFFFFF', borderRadius: 18 }}>
    <UpcomingChart days={upcomingPods(4)} height={140} framed={false} />
  </div>
);
