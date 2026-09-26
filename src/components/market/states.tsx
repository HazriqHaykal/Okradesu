import type { LucideIcon } from 'lucide-react-native';
import { RefreshCw, TriangleAlert } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/surface';
import { Txt } from '@/components/ui/text';
import { Colors, Palette, Radius, Shadow } from '@/constants/theme';

export function MarketLoading() {
  return (
    <Card style={styles.loading}>
      <ActivityIndicator color={Colors.accent} />
      <Txt variant="body" color={Colors.textSecondary}>
        Loading the market…
      </Txt>
    </Card>
  );
}

export function MarketError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={{ gap: 12 }}>
      <Banner tone="danger" icon={TriangleAlert} title="Couldn't load the market.">
        {message}
      </Banner>
      <Button label="Try again" icon={RefreshCw} variant="secondary" size="md" onPress={onRetry} />
    </View>
  );
}

const BANNER = {
  danger: { bg: Colors.dangerBg, fg: Colors.dangerFg },
  accent: { bg: Palette.orange200, fg: Palette.orange800 },
  success: { bg: Colors.successBg, fg: Colors.successFg },
} as const;

/** Tinted message strip, as on the old Market screen (offer sent / unmatched kg). */
export function Banner({
  tone,
  icon: Icon,
  title,
  children,
}: {
  tone: keyof typeof BANNER;
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
}) {
  const t = BANNER[tone];
  return (
    <View style={[styles.banner, { backgroundColor: t.bg }]}>
      <Icon size={20} color={t.fg} strokeWidth={2} />
      <Txt variant="body" color={t.fg} style={{ flex: 1 }}>
        <Txt variant="body" weight={800} color={t.fg}>
          {title}
        </Txt>
        {children ? <> {children}</> : null}
      </Txt>
    </View>
  );
}

/** White strip with an illustration or icon and a short line, for empty lists. */
export function EmptyNote({ children, art }: { children: ReactNode; art?: ReactNode }) {
  return (
    <View style={styles.empty}>
      {art}
      <Txt variant="small" color={Colors.textSecondary} style={{ flex: 1 }}>
        {children}
      </Txt>
    </View>
  );
}

/** Coloured KPI tile (the Harvest tab's stat tiles). */
export function StatTile({
  label,
  value,
  note,
  bg = Colors.surfaceCard,
  fg = Colors.textPrimary,
}: {
  label: string;
  value: string;
  note?: string;
  bg?: string;
  fg?: string;
}) {
  return (
    <View style={[styles.stat, { backgroundColor: bg }]}>
      <Txt variant="micro" color={fg}>
        {label}
      </Txt>
      <Txt variant="title" color={fg} tabular style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Txt>
      {note ? (
        <Txt variant="caption" color={fg} style={{ opacity: 0.8 }} numberOfLines={1}>
          {note}
        </Txt>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18 },
  banner: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: Radius.md },
  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceCard,
  },
  stat: { flexBasis: '46%', flexGrow: 1, padding: 12, borderRadius: Radius.md, gap: 2, boxShadow: Shadow.tile },
  statValue: { fontSize: 24, lineHeight: 30 },
});
