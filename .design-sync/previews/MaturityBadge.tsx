import { MaturityBadge } from '@okradesu/ui';

/** The three outcomes of a pod check. */
export const Outcomes = () => (
  <div style={{ display: 'flex', gap: 8 }}>
    <MaturityBadge maturity="ready" />
    <MaturityBadge maturity="too_small" />
    <MaturityBadge maturity="overgrown" />
  </div>
);
