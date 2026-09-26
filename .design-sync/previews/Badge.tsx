import { Badge, Icons } from '@okradesu/ui';

const row = { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' } as const;

/** Every tone, as the app uses them for farm and pod status. */
export const Tones = () => (
  <div style={row}>
    <Badge label="Online" tone="success" />
    <Badge label="Local mode" tone="accent" />
    <Badge label="Mildew risk" tone="danger" />
    <Badge label="4 farms" tone="neutral" />
    <Badge label="9 ready" tone="solid" />
  </div>
);

/** With a leading icon. */
export const WithIcon = () => (
  <div style={row}>
    <Badge label="Online" tone="success" icon={Icons.RadioTower} />
    <Badge label="Rising" tone="danger" icon={Icons.TriangleAlert} />
    <Badge label="Picked 07:12" tone="success" icon={Icons.Check} />
  </div>
);

/** Row counts on the harvest map. */
export const HarvestCounts = () => (
  <div style={row}>
    <Badge label="3 must" tone="danger" />
    <Badge label="9 ready" tone="solid" />
    <Badge label="1 overgrown" tone="accent" />
  </div>
);
