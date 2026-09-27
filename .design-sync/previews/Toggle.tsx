import { useState } from 'react';

import { Colors, Toggle, Txt } from '@okradesu/ui';

/** On and off. */
export const States = () => (
  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
    <Toggle value label="Automatic control" onValueChange={() => {}} />
    <Toggle value={false} label="Buyer orders alerts" onValueChange={() => {}} />
  </div>
);

/** In a settings row, working. */
export const SettingRow = () => {
  const [on, setOn] = useState(true);
  return (
    <div style={{ width: 340, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Txt variant="bodyLg" weight={800}>
          Air fans
        </Txt>
        <Txt variant="small" color={Colors.textSecondary}>
          {on ? 'Auto · runs when humidity is above 75%' : 'Manual · held at current speed'}
        </Txt>
      </div>
      <Toggle value={on} onValueChange={setOn} label="Automatic control for Air fans" />
    </div>
  );
};
