import { RowSnapshot, allRows } from '@okradesu/ui';

const grid = allRows();
const fieldA = grid.find((g) => g.farm.id === 'field-a')!;
const classroom = grid.find((g) => g.farm.id === 'classroom-2')!;
const frame = { borderRadius: 18, overflow: 'hidden', display: 'inline-block' } as const;

/** What the camera saw in Field A, row 2, with Edge AI boxes and labels. */
export const OutdoorRow = () => (
  <div style={frame}>
    <RowSnapshot det={fieldA.rows[1]} kind="outdoor" seed={2} width={340} height={230} labels />
  </div>
);

/** An indoor row under LEDs. */
export const IndoorRow = () => (
  <div style={frame}>
    <RowSnapshot det={classroom.rows[2]} kind="indoor" seed={3} width={340} height={230} labels />
  </div>
);

/** Small thumbnails for list rows. */
export const Thumbnails = () => (
  <div style={{ display: 'flex', gap: 8 }}>
    {fieldA.rows.slice(0, 4).map((r, i) => (
      <div key={r.row} style={{ ...frame, borderRadius: 10 }}>
        <RowSnapshot det={r} kind="outdoor" seed={i + 1} width={64} height={78} />
      </div>
    ))}
  </div>
);
