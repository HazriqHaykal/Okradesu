import { SectionHeader } from '@okradesu/ui';

/** Titles with and without an action link. */
export const WithAndWithoutAction = () => (
  <div style={{ width: 340, display: 'flex', flexDirection: 'column', gap: 16 }}>
    <SectionHeader title="Pick in This Order" />
    <SectionHeader title="Harvest Map" action="Open" href="/harvest" />
    <SectionHeader title="Buyers This Week" action="See All" href="/market" />
  </div>
);
