import { Link, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Txt } from '@/components/ui/text';
import { Colors } from '@/constants/theme';

/** Section title in Manrope 800 with an optional small orange action link on the right (e.g. "See All"). */
export function SectionHeader({ title, action, href }: { title: string; action?: string; href?: Href }) {
  return (
    <View style={styles.row}>
      <Txt variant="heading" accessibilityRole="header">
        {title}
      </Txt>
      {action && href ? (
        <Link href={href} style={styles.action}>
          <Txt variant="small" weight={600} color={Colors.textAccent}>
            {action}
          </Txt>
        </Link>
      ) : null}
    </View>
  );
}

/** Uppercase meta label over a bold value (Detail facts row). */
export function InfoStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <View style={styles.stat}>
      <Txt variant="micro" color={Colors.textSecondary}>
        {label}
      </Txt>
      <Txt variant="bodyLg" weight={800} tabular numberOfLines={1}>
        {value}
      </Txt>
    </View>
  );
}

/** Small uppercase label above a screen title, with the Anton title below. */
export function ScreenTitle({ kicker, title, right }: { kicker: string; title: string; right?: ReactNode }) {
  return (
    <View style={styles.head}>
      <View style={styles.headText}>
        <Txt variant="micro" color={Colors.textSecondary}>
          {kicker}
        </Txt>
        <Txt variant="display" accessibilityRole="header">
          {title}
        </Txt>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 },
  action: { paddingVertical: 8 },
  stat: { flex: 1, gap: 2, minWidth: 0 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  headText: { flex: 1, gap: 8 },
});
