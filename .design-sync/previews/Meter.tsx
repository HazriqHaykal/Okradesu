import { Colors, Meter, Txt } from '@okradesu/ui';

const box = { width: 320, display: 'flex', flexDirection: 'column', gap: 6 } as const;

/** Disease risk before symptoms show. */
export const Risk = () => (
  <div style={box}>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <Txt variant="small" weight={700} color={Colors.dangerFg}>
        High risk · 68%
      </Txt>
      <Txt variant="small" weight={600} color={Colors.textSecondary}>
        before symptoms show
      </Txt>
    </div>
    <Meter value={68} color={Colors.danger} />
  </div>
);

/** Progress: tasks done and rows picked. */
export const Progress = () => (
  <div style={{ ...box, gap: 14 }}>
    <Meter value={33} color={Colors.success} />
    <Meter value={75} color={Colors.accent} />
    <Meter value={100} color={Colors.successFg} />
  </div>
);
