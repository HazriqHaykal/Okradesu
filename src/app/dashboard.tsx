import { router, type Href } from 'expo-router';
import {
  Bell,
  ChevronLeft,
  House,
  LayoutDashboard,
  ListChecks,
  MessageCircle,
  RadioTower,
  Sprout,
  Store,
  Sun,
  Warehouse,
  type LucideIcon,
} from 'lucide-react-native';
import { Fragment, useMemo, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { farmStatus } from '@/components/farm-status';
import { ForecastChart } from '@/components/forecast-chart';
import { HarvestGrid, UpcomingChart } from '@/components/harvest-map';
import { DemoTrigger } from '@/components/monitor/demo-panel';
import { TodayPlan, buildPlan } from '@/components/monitor/today-plan';
import { HeroBackground } from '@/components/screen';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Button, IconButton } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import { Card, Divider } from '@/components/ui/surface';
import { Txt } from '@/components/ui/text';
import { Colors, Palette, Radius, Shadow } from '@/constants/theme';
import { BUYERS, FORECAST_OPEN, FORECAST_TOTAL } from '@/data/farms';
import { planTotals } from '@/data/harvest';
import type { FarmAlert, MonitorFarm } from '@/data/monitor';
import { useFarmAlerts } from '@/hooks/use-farm-alerts';
import { useHarvest } from '@/hooks/use-harvest';
import { pickedToday, useHarvestStore } from '@/state/harvest-store';

const NAV: { label: string; icon: LucideIcon; href?: Href }[] = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Farms', icon: House, href: '/home' },
  { label: 'Harvest map', icon: Sprout, href: '/harvest' },
  { label: 'Market', icon: Store, href: '/market' },
  { label: 'Advisor', icon: MessageCircle, href: '/advisor' },
  { label: 'Alerts', icon: Bell, href: '/alerts' },
];

const BUYER_BADGE: Record<string, { label: string; tone: BadgeTone }> = {
  confirmed: { label: 'Confirmed', tone: 'success' },
  offer: { label: 'Offer sent', tone: 'accent' },
  pending: { label: 'Pending', tone: 'accent' },
};

const openFarm = (id: string) => router.navigate({ pathname: '/home/farm/[id]', params: { id } });

/** Responsive web dashboard: sidebar at desktop widths, single column on phones. */
export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const wide = width >= 1024;
  const medium = width >= 720;

  const { farms, alerts, weather } = useFarmAlerts();
  const { grid, plan, upcoming } = useHarvest();
  const batches = useHarvestStore((s) => s.batches);
  const picked = useMemo(() => pickedToday(batches), [batches]);
  const remaining = plan.filter((r) => !picked.has(r.key));
  const totals = planTotals(remaining);
  const tasks = buildPlan(farms, alerts, weather);
  const online = farms.filter((f) => f.status === 'online').length;
  const critical = alerts.filter((a) => a.severity === 'critical').length;
  const soldPct = Math.round(((FORECAST_TOTAL - FORECAST_OPEN) / FORECAST_TOTAL) * 100);
  const [now] = useState(() => new Date());
  const today = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <View style={[styles.root, wide && styles.rootWide]}>
      <HeroBackground />
      {wide ? <Sidebar online={online} total={farms.length} /> : null}
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
              {today} · {weather.now.temp}°C {weather.now.label.toLowerCase()}
            </Txt>
            <DemoTrigger>
              <Txt variant="displayXl" accessibilityRole="header">
                Overview
              </Txt>
            </DemoTrigger>
          </View>
          <View style={styles.headerActions}>
            <Button label="Open harvest map" size="md" variant="secondary" icon={Sprout} href="/harvest" />
            <Button label={`Offer ${FORECAST_OPEN} kg`} size="md" icon={Store} href="/market" />
          </View>
        </View>

        <View style={styles.kpis}>
          <Kpi
            label="Ready to pick today"
            value={`${totals.ready} pods`}
            sub={`${totals.must} must be picked today`}
            color={Colors.textAccent}
          />
          <Kpi
            label="Farms connected"
            value={`${online} / ${farms.length}`}
            sub={
              online < farms.length ? 'Offline farms keep running on their own' : 'All farms online over LoRa'
            }
          />
          <Kpi
            label="Alerts"
            value={`${alerts.length}`}
            sub={critical ? `${critical} need action now` : 'Nothing urgent'}
            color={critical ? Colors.dangerFg : Colors.textPrimary}
          />
          <Kpi
            label="Sold ahead"
            value={`${soldPct}%`}
            sub={`${FORECAST_OPEN} kg still unmatched`}
            color={Colors.successFg}
          />
        </View>

        <Row wide={wide}>
          <Panel wide={wide} flex={1.3}>
            <SectionHeader title="Harvest Map" action="Open" href="/harvest" />
            <HarvestGrid grid={grid} picked={picked} maxCell={40} />
            <Button
              label={remaining.length ? `Start picking · ${remaining.length} rows` : 'All picked'}
              icon={ListChecks}
              size="md"
              disabled={!remaining.length}
              href="/picking"
            />
          </Panel>
          <Panel wide={wide} flex={1}>
            <SectionHeader title="Today" action="Alerts" href="/alerts" />
            {tasks.length ? (
              <TodayPlan tasks={tasks} limit={5} onOpen={openFarm} />
            ) : (
              <Txt variant="body" color={Colors.textSecondary}>
                Nothing needs you today.
              </Txt>
            )}
          </Panel>
        </Row>

        <Row wide={wide}>
          <Panel wide={wide} flex={1.3}>
            <SectionHeader title="Farms" action="Open app" href="/home" />
            <FarmTable farms={farms} alerts={alerts} compact={!medium} />
          </Panel>
          <Panel wide={wide} flex={1}>
            <SectionHeader title="Coming Up" />
            <UpcomingChart days={upcoming} height={wide ? 140 : 110} framed={false} />
          </Panel>
        </Row>

        <Row wide={wide}>
          <Panel wide={wide} flex={1.3}>
            <SectionHeader title="Sales Forecast · Next 7 Days" action="Market" href="/market" />
            <ForecastChart height={wide ? 150 : 120} barWidth={44} showUnit={medium} />
          </Panel>
          <Panel wide={wide} flex={1}>
            <SectionHeader title="Buyers This Week" />
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
          </Panel>
        </Row>
      </ScrollView>
    </View>
  );
}

function Sidebar({ online, total }: { online: number; total: number }) {
  return (
    <View style={styles.sidebar}>
      <View style={{ paddingHorizontal: 8, gap: 4 }}>
        <Txt variant="displaySm">Connected Okra</Txt>
        <Txt variant="micro" color={Colors.textSecondary}>
          Farm dashboard
        </Txt>
      </View>
      <View style={{ gap: 4 }}>
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
          {online} of {total} farms connected through one gateway.
          {online < total ? ' Offline farms keep running on their own and upload later.' : ''}
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
      <Txt variant="title" color={color} tabular style={{ fontSize: 32, lineHeight: 38 }}>
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

function Panel({ wide, flex, children }: { wide: boolean; flex: number; children: ReactNode }) {
  return <Card style={[styles.panel, wide && { flex }]}>{children}</Card>;
}

function FarmTable({
  farms,
  alerts,
  compact,
}: {
  farms: MonitorFarm[];
  alerts: FarmAlert[];
  compact: boolean;
}) {
  const cols = compact
    ? (['Farm', 'Pods', 'Status'] as const)
    : (['Farm', 'Type', 'Soil', 'Humidity', 'Pods', 'Status'] as const);
  const flex = (c: string) => (c === 'Farm' ? 1.6 : c === 'Status' || c === 'Type' ? 1.3 : 0.8);

  const cell = (f: MonitorFarm, c: (typeof cols)[number]): ReactNode => {
    switch (c) {
      case 'Farm':
        return (
          <Pressable accessibilityRole="link" onPress={() => openFarm(f.id)} style={{ gap: 1 }}>
            <Txt variant="body" weight={800}>
              {f.name}
            </Txt>
            <Txt variant="caption" color={Colors.textSecondary} numberOfLines={1}>
              {f.building}
            </Txt>
          </Pressable>
        );
      case 'Type':
        return (
          <Badge
            label={f.type === 'outdoor' ? 'Outdoor' : 'Indoor'}
            tone="neutral"
            icon={f.type === 'outdoor' ? Sun : Warehouse}
          />
        );
      case 'Soil': {
        const dry = f.base.moisture < 35;
        return (
          <Txt
            variant="body"
            tabular
            weight={dry ? 800 : 400}
            color={dry ? Colors.textAccent : Colors.textPrimary}>
            {f.base.moisture}%
          </Txt>
        );
      }
      case 'Humidity': {
        const humid = f.base.humidity > 75;
        return (
          <Txt
            variant="body"
            tabular
            weight={humid ? 800 : 400}
            color={humid ? Colors.dangerFg : Colors.textPrimary}>
            {f.base.humidity}%
          </Txt>
        );
      }
      case 'Pods':
        return (
          <Txt variant="body" weight={800} tabular>
            {f.podsReady}
          </Txt>
        );
      case 'Status': {
        const s = farmStatus(f, alerts);
        return (
          <View style={styles.status}>
            <View style={[styles.dot, { backgroundColor: s.dot }]} />
            <Txt variant="small" weight={700} color={s.text} numberOfLines={1}>
              {s.label}
            </Txt>
          </View>
        );
      }
    }
  };

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
      {farms.map((f) => (
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
  main: { gap: 20, width: '100%', maxWidth: 1280, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 },
  headerStack: { flexDirection: 'column', alignItems: 'stretch' },
  headerActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  kpi: { flexGrow: 1, flexBasis: 200, paddingVertical: 18, paddingHorizontal: 20, gap: 6 },
  row: { gap: 16 },
  rowWide: { flexDirection: 'row', alignItems: 'stretch' },
  panel: { paddingVertical: 18, paddingHorizontal: 20, gap: 14 },
  tr: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 11 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  buyer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
});
