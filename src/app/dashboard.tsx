import { router, type Href } from 'expo-router';
import {
  Bell,
  ChevronLeft,
  House,
  LayoutDashboard,
  Leaf,
  Printer,
  RadioTower,
  Sprout,
  Store,
  type LucideIcon,
} from 'lucide-react-native';
import { Fragment, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ForecastChart } from '@/components/forecast-chart';
import { HeroBackground } from '@/components/screen';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Button, IconButton } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import { Card, Divider } from '@/components/ui/surface';
import { Txt } from '@/components/ui/text';
import { Colors, Palette, Radius, Shadow } from '@/constants/theme';
import {
  ALERT_EVENTS,
  BUYERS,
  FARMS,
  FARMS_ONLINE,
  FORECAST_OPEN,
  FORECAST_TOTAL,
  TODAY_LABEL,
  TOTAL_PLANTS,
  TOTAL_PODS_TODAY,
  type Farm,
} from '@/data/farms';

const NAV: { label: string; icon: LucideIcon; href?: Href }[] = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Farms', icon: House, href: '/home' },
  { label: 'Harvest maps', icon: Sprout, href: '/harvest' },
  { label: 'Market', icon: Store, href: '/market' },
  { label: 'Disease', icon: Leaf, href: '/disease' },
  { label: 'Alerts', icon: Bell, href: '/alerts' },
];

const BUYER_BADGE: Record<string, { label: string; tone: BadgeTone }> = {
  confirmed: { label: 'Confirmed', tone: 'success' },
  offer: { label: 'Offer sent', tone: 'accent' },
  pending: { label: 'Pending', tone: 'accent' },
};

const ALERT_DOT = { accent: Colors.accent, danger: Colors.danger, success: Colors.success } as const;

/** Responsive web dashboard: sidebar at desktop widths, single column on phones. */
export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const wide = width >= 1024;
  const medium = width >= 720;
  const soldPct = Math.round(((FORECAST_TOTAL - FORECAST_OPEN) / FORECAST_TOTAL) * 100);
  const offline = FARMS.filter((f) => f.status === 'local').length;

  return (
    <View style={[styles.root, wide && styles.rootWide]}>
      <HeroBackground />
      {wide ? <Sidebar /> : null}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.main,
          {
            paddingTop: insets.top + (wide ? 28 : 12),
            paddingBottom: insets.bottom + 40,
            paddingHorizontal: wide ? 36 : 20,
          },
        ]}>
        <View style={[styles.header, !medium && styles.headerStack]}>
          <View style={{ gap: 8 }}>
            {!wide ? (
              <IconButton
                icon={ChevronLeft}
                label="Back"
                onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
              />
            ) : null}
            <Txt variant="micro" color={Colors.textSecondary}>
              {TODAY_LABEL}
            </Txt>
            <Txt variant="displayXl" accessibilityRole="header">
              Overview
            </Txt>
          </View>
          <View style={styles.headerActions}>
            <Button label="Print harvest maps" size="md" variant="secondary" icon={Printer} href="/harvest" />
            <Button label={`Offer ${FORECAST_OPEN} kg`} size="md" icon={Store} href="/market" />
          </View>
        </View>

        <View style={styles.kpis}>
          <Kpi
            label="Ready to pick today"
            value={`${TOTAL_PODS_TODAY} pods`}
            sub="12 more tomorrow"
            color={Colors.textAccent}
          />
          <Kpi label="7-day forecast" value={`${FORECAST_TOTAL} kg`} sub={`across ${TOTAL_PLANTS} plants`} />
          <Kpi
            label="Sold ahead"
            value={`${soldPct}%`}
            sub={`${FORECAST_OPEN} kg still unmatched`}
            color={Colors.successFg}
          />
          <Kpi
            label="Farms online"
            value={`${FARMS_ONLINE} / ${FARMS.length}`}
            sub={`${offline} on local control`}
          />
        </View>

        <Row wide={wide}>
          <Card style={[styles.panel, wide && { flex: 1.7 }]}>
            <SectionHeader title="Farms" action="Open app" href="/home" />
            <FarmTable compact={!medium} />
          </Card>
          <Card style={[styles.panel, wide && { flex: 1 }]}>
            <SectionHeader title="Alerts" action="LINE settings" href="/alerts" />
            {ALERT_EVENTS.slice(0, 3).map((e, i) => (
              <View key={i} style={styles.alert}>
                <View style={[styles.alertDot, { backgroundColor: ALERT_DOT[e.tone] }]} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt variant="body" weight={800}>
                    {e.title}
                  </Txt>
                  <Txt variant="small" color={Colors.textSecondary}>
                    {e.detail}
                  </Txt>
                </View>
                <Txt variant="caption" weight={700} color={Colors.textSecondary} tabular>
                  {e.time}
                </Txt>
              </View>
            ))}
          </Card>
        </Row>

        <Row wide={wide}>
          <Card style={[styles.panel, wide && { flex: 1.7 }]}>
            <SectionHeader title="Harvest Forecast · Next 7 Days" />
            <ForecastChart height={wide ? 170 : 130} barWidth={44} showUnit={medium} />
          </Card>
          <Card style={[styles.panel, wide && { flex: 1 }]}>
            <SectionHeader title="Buyers This Week" action="Market" href="/market" />
            {BUYERS.map((b) => (
              <View key={b.id} style={styles.buyer}>
                <View style={{ flex: 1, gap: 1 }}>
                  <Txt variant="body" weight={800}>
                    {b.name}
                  </Txt>
                  <Txt variant="small" color={Colors.textSecondary}>
                    {b.kind} · {b.detail}
                  </Txt>
                </View>
                <Badge label={BUYER_BADGE[b.status].label} tone={BUYER_BADGE[b.status].tone} />
              </View>
            ))}
          </Card>
        </Row>
      </ScrollView>
    </View>
  );
}

function Sidebar() {
  const offline = FARMS.find((f) => f.status === 'local');
  return (
    <View style={styles.sidebar}>
      <View style={{ paddingHorizontal: 8, gap: 4 }}>
        <Txt variant="displaySm">Connected Okra</Txt>
        <Txt variant="micro" color={Colors.textSecondary}>
          Farm dashboard
        </Txt>
      </View>
      <View accessibilityRole="menu" style={{ gap: 4 }}>
        {NAV.map((n) => {
          const active = !n.href;
          const Icon = n.icon;
          return (
            <Pressable
              key={n.label}
              accessibilityRole="link"
              accessibilityState={{ selected: active }}
              onPress={() => n.href && router.navigate(n.href)}
              style={({ pressed }) => [
                styles.navItem,
                active && styles.navActive,
                pressed && !active && { backgroundColor: Palette.orange100 },
              ]}>
              <Icon size={18} color={active ? Colors.textOnAccent : Colors.textSecondary} strokeWidth={2} />
              <Txt variant="body" weight={700} color={active ? Colors.textOnAccent : Colors.textSecondary}>
                {n.label}
              </Txt>
            </Pressable>
          );
        })}
      </View>
      <View style={{ flex: 1 }} />
      <View style={styles.network}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <RadioTower size={16} color={Colors.textAccent} strokeWidth={2} />
          <Txt variant="body" weight={800}>
            LoRa network
          </Txt>
        </View>
        <Txt variant="small" color={Colors.textBody}>
          {FARMS_ONLINE} of {FARMS.length} farms online.
          {offline ? ` ${offline.name} on local control for ${offline.lastSync.replace(' ago', '')}.` : ''}
        </Txt>
      </View>
    </View>
  );
}

function Kpi({
  label,
  value,
  sub,
  color = Colors.textPrimary,
}: {
  label: string;
  value: string;
  sub: string;
  color?: string;
}) {
  return (
    <Card style={styles.kpi}>
      <Txt variant="micro" color={Colors.textSecondary}>
        {label}
      </Txt>
      <Txt variant="title" color={color} tabular style={{ fontSize: 30, lineHeight: 36 }}>
        {value}
      </Txt>
      <Txt variant="small" color={Colors.textSecondary}>
        {sub}
      </Txt>
    </Card>
  );
}

function Row({ wide, children }: { wide: boolean; children: ReactNode }) {
  return <View style={[styles.row, wide && styles.rowWide]}>{children}</View>;
}

function FarmTable({ compact }: { compact: boolean }) {
  const cols = compact
    ? (['Farm', 'Ready', 'Risk'] as const)
    : (['Farm', 'Link', 'Soil', 'Humidity', 'Air', 'Ready', 'Risk'] as const);
  const cell = (farm: Farm, col: (typeof cols)[number]): ReactNode => {
    const read = (key: string) => farm.sensors.find((s) => s.key === key);
    switch (col) {
      case 'Farm':
        return (
          <Pressable
            accessibilityRole="link"
            onPress={() => router.navigate({ pathname: '/home/farm/[id]', params: { id: farm.id } })}
            style={{ gap: 1 }}>
            <Txt variant="body" weight={800}>
              {farm.name}
            </Txt>
            <Txt variant="caption" color={Colors.textSecondary}>
              {farm.building}
            </Txt>
          </Pressable>
        );
      case 'Link':
        return farm.status === 'online' ? (
          <Badge label="Online" tone="success" />
        ) : (
          <Badge label="Local" tone="accent" />
        );
      case 'Soil':
        return (
          <Txt variant="body" tabular>
            {read('moisture')?.value}%
          </Txt>
        );
      case 'Humidity': {
        const h = read('humidity');
        return (
          <Txt
            variant="body"
            tabular
            weight={h?.warn ? 800 : 400}
            color={h?.warn ? Colors.dangerFg : Colors.textPrimary}>
            {h?.value}%
          </Txt>
        );
      }
      case 'Air':
        return (
          <Txt variant="body" tabular>
            {read('air')?.value} °C
          </Txt>
        );
      case 'Ready':
        return (
          <Txt variant="body" weight={800} tabular>
            {farm.podsReady}
          </Txt>
        );
      case 'Risk':
        return farm.risk ? <Badge label="Mildew 68%" tone="danger" /> : <Badge label="Low" tone="success" />;
    }
  };
  const flex = (col: string) => (col === 'Farm' ? 2 : col === 'Risk' ? 1.4 : 1);

  return (
    <View>
      <View style={styles.tr}>
        {cols.map((c) => (
          <View key={c} style={{ flex: flex(c) }}>
            <Txt variant="micro" color={Colors.textSecondary}>
              {c}
            </Txt>
          </View>
        ))}
      </View>
      {FARMS.map((f) => (
        <Fragment key={f.id}>
          <Divider />
          <View style={styles.tr}>
            {cols.map((c) => (
              <View key={c} style={{ flex: flex(c) }}>
                {cell(f, c)}
              </View>
            ))}
          </View>
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgApp },
  rootWide: { flexDirection: 'row' },
  sidebar: {
    width: 248,
    backgroundColor: Colors.surfaceCard,
    boxShadow: Shadow.float,
    paddingVertical: 28,
    paddingHorizontal: 16,
    gap: 28,
  },
  navItem: {
    height: 44,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: Radius.pill,
  },
  navActive: { backgroundColor: Colors.accent, boxShadow: Shadow.glow },
  network: { borderRadius: Radius.lg, backgroundColor: Palette.orange100, padding: 14, gap: 8 },
  main: { gap: 20, width: '100%', maxWidth: 1240, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 },
  headerStack: { flexDirection: 'column', alignItems: 'stretch' },
  headerActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  kpi: { flexGrow: 1, flexBasis: 200, paddingVertical: 18, paddingHorizontal: 20, gap: 6 },
  row: { gap: 16 },
  rowWide: { flexDirection: 'row', alignItems: 'flex-start' },
  panel: { paddingVertical: 18, paddingHorizontal: 20, gap: 12 },
  tr: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  alert: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  alertDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  buyer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
});
