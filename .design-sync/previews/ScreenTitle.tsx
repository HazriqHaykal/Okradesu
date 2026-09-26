import { IconButton, Icons, ScreenTitle } from '@okradesu/ui';

/** Screen header: uppercase kicker over an Anton title, with an action on the right. */
export const WithAction = () => (
  <div style={{ width: 360 }}>
    <ScreenTitle
      kicker="Saturday 26 September"
      title="Harvest map"
      right={<IconButton icon={Icons.ScanLine} label="Check a pod" variant="accent" size={48} />}
    />
  </div>
);

/** Title only. */
export const Plain = () => (
  <div style={{ width: 360 }}>
    <ScreenTitle kicker="Sent to LINE as they happen" title="Alerts" />
  </div>
);
