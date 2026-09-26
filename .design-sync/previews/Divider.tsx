import { Card, Colors, Divider, Txt } from '@okradesu/ui';

const rows = ['Harvest ready', 'Disease risk', 'Equipment & network'];

/** Separates rows inside a Card. */
export const InAList = () => (
  <Card style={{ width: 320, paddingHorizontal: 16, paddingVertical: 4 }}>
    {rows.map((t, i) => (
      <div key={t}>
        {i > 0 ? <Divider /> : null}
        <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Txt variant="bodyLg" weight={800}>
            {t}
          </Txt>
          <Txt variant="small" color={Colors.textSecondary}>
            Sent to LINE as it happens
          </Txt>
        </div>
      </div>
    ))}
  </Card>
);
