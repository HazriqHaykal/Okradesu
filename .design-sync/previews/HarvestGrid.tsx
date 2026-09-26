import { Card, HarvestGrid, allRows } from '@okradesu/ui';

const frame = { width: 380, padding: 14 } as const;

/** Today's map across all six farms: red = must pick, orange = ready, grey = not yet. */
export const TodaysMap = () => (
  <Card style={frame}>
    <HarvestGrid grid={allRows()} picked={new Map()} />
  </Card>
);

/** Mid-morning: two Field A rows already picked (green ticks). */
export const PartlyPicked = () => (
  <Card style={frame}>
    <HarvestGrid
      grid={allRows()}
      picked={
        new Map([
          ['field-a#2', new Date()],
          ['field-a#4', new Date()],
        ])
      }
    />
  </Card>
);

/** On a wide dashboard panel the squares grow to 40 px. */
export const Dashboard = () => (
  <Card style={{ width: 560, padding: 18 }}>
    <HarvestGrid grid={allRows()} picked={new Map()} maxCell={40} />
  </Card>
);
