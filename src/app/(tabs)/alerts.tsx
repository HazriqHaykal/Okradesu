import { Check, MessageCircle } from 'lucide-react-native';
import { Fragment, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Badge } from '@/components/ui/badge';
import { ScreenTitle, SectionHeader } from '@/components/ui/section-header';
import { Card, Divider, IconWell } from '@/components/ui/surface';
import { Txt } from '@/components/ui/text';
import { Toggle } from '@/components/ui/toggle';
import { Colors } from '@/constants/theme';
import { ALERT_CATEGORIES, ALERT_EVENTS, type AlertTone } from '@/data/farms';

const DOT: Record<AlertTone, string> = {
  accent: Colors.accent,
  danger: Colors.danger,
  success: Colors.success,
};

export default function AlertsScreen() {
  const [on, setOn] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(ALERT_CATEGORIES.map((c) => [c.id, c.on])),
  );

  return (
    <Screen>
      <ScreenTitle kicker="Sent to LINE as they happen" title="Alerts" />

      <Card style={styles.line}>
        <IconWell icon={MessageCircle} size={48} bg={Colors.successBg} fg={Colors.successFg} />
        <View style={{ flex: 1, gap: 4 }}>
          <Txt variant="bodyLg" weight={800}>
            LINE connected
          </Txt>
          <Txt variant="small" color={Colors.textSecondary}>
            Alerts go to your farm&apos;s LINE group
          </Txt>
        </View>
        <Badge label="On" tone="success" icon={Check} />
      </Card>

      <SectionHeader title="Send Me" />
      <Card style={styles.list}>
        {ALERT_CATEGORIES.map((c, i) => (
          <Fragment key={c.id}>
            {i > 0 ? <Divider /> : null}
            <View style={styles.row}>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt variant="bodyLg" weight={800}>
                  {c.name}
                </Txt>
                <Txt variant="small" color={Colors.textSecondary}>
                  {c.desc}
                </Txt>
              </View>
              <Toggle
                label={`${c.name} alerts`}
                value={on[c.id]}
                onValueChange={(v) => setOn((s) => ({ ...s, [c.id]: v }))}
              />
            </View>
          </Fragment>
        ))}
      </Card>

      <SectionHeader title="Today" />
      <View>
        {ALERT_EVENTS.map((e, i) => (
          <View key={i} style={styles.event}>
            <View style={styles.rail}>
              <View style={[styles.dot, { backgroundColor: DOT[e.tone] }]} />
              {i < ALERT_EVENTS.length - 1 ? <View style={styles.line2} /> : null}
            </View>
            <View style={styles.eventBody}>
              <Txt variant="caption" weight={700} color={Colors.textSecondary} tabular>
                {e.time}
              </Txt>
              <Txt variant="bodyLg" weight={800}>
                {e.title}
              </Txt>
              <Txt variant="small" color={Colors.textSecondary}>
                {e.detail}
              </Txt>
            </View>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  line: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  list: { paddingHorizontal: 16, paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  event: { flexDirection: 'row', gap: 12 },
  rail: { alignItems: 'center', paddingTop: 4, gap: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  line2: { width: 2, flex: 1, backgroundColor: Colors.borderSubtle },
  eventBody: { flex: 1, gap: 3, paddingBottom: 16 },
});
