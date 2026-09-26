import { Colors, Txt } from '@okradesu/ui';

const stack = { display: 'flex', flexDirection: 'column', gap: 8 } as const;

/** Anton display sizes: screen titles and hero numbers only. */
export const Display = () => (
  <div style={stack}>
    <Txt variant="displayXl">112 pods</Txt>
    <Txt variant="display">Harvest map</Txt>
    <Txt variant="displaySm">Connected Okra</Txt>
  </div>
);

/** Manrope headings and body copy. */
export const Headings = () => (
  <div style={stack}>
    <Txt variant="title">Field A · Row 2</Txt>
    <Txt variant="heading">Pick in This Order</Txt>
    <Txt variant="bodyLg" weight={800}>
      Pick 34 pods at Field A
    </Txt>
    <Txt variant="body" color={Colors.textBody}>
      Best picked before 11:00, while pods are under 10 cm.
    </Txt>
    <Txt variant="small" color={Colors.textSecondary}>
      Photo 16:00 yesterday · projected to 06:00 today
    </Txt>
  </div>
);

/** Uppercase micro labels and numbers set in tabular figures. */
export const LabelsAndNumbers = () => (
  <div style={{ display: 'flex', gap: 24 }}>
    <div style={stack}>
      <Txt variant="micro" color={Colors.textSecondary}>
        Must pick
      </Txt>
      <Txt variant="title" tabular color={Colors.dangerFg}>
        21
      </Txt>
    </div>
    <div style={stack}>
      <Txt variant="micro" color={Colors.textSecondary}>
        Ready
      </Txt>
      <Txt variant="title" tabular color={Colors.textAccent}>
        112
      </Txt>
    </div>
    <div style={stack}>
      <Txt variant="micro" color={Colors.textSecondary}>
        Sold ahead
      </Txt>
      <Txt variant="title" tabular color={Colors.successFg}>
        82%
      </Txt>
    </div>
  </div>
);
