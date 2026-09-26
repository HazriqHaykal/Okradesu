import { router } from 'expo-router';
import { ArrowRight, Bell, ChevronDown, ChevronUp, LayoutDashboard, RadioTower } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { farmStatus, type FarmStatus } from '@/components/farm-status';
import { DemoTrigger } from '@/components/monitor/demo-panel';
import { TodayPlan, buildPlan } from '@/components/monitor/today-plan';
import { Screen } from '@/components/screen';
import { Button, IconButton } from '@/components/ui/button';
import { ScreenTitle, SectionHeader } from '@/components/ui/section-header';
import { Txt } from '@/components/ui/text';
import { Colors, Radius, Shadow } from '@/constants/theme';
import { planTotals } from '@/data/harvest';
import type { MonitorFarm } from '@/data/monitor';
import { displayName, greeting } from '@/data/profile';
import { useFarmAlerts } from '@/hooks/use-farm-alerts';
import { useHarvest } from '@/hooks/use-harvest';

/** Tasks shown before "See all". */
const TOP_TASKS = 3;

const openFarm = (id: string) => router.push({ pathname: '/home/farm/[id]', params: { id } });

export default function HomeScreen() {
  const { farms, alerts, weather } = useFarmAlerts();
  const { plan } = useHarvest();
  const totals = planTotals(plan);
  const [showAll, setShowAll] = useState(false);
  const [now] = useState(() => new Date());

  const tasks = buildPlan(farms, alerts, weather);
  const online = farms.filter((f) => f.status === 'online').length;
  const today = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <Screen contentStyle={{ gap: 0 }}>
      <DemoTrigger>
        <ScreenTitle
          kicker={`${greeting(now.getHours())} · ${today} · ${weather.now.temp}°C ${weather.now.label.toLowerCase()}`}
          title={`Hi, ${displayName()}`}
          right={
            <View style={styles.topActions}>
              <IconButton
                icon={Bell}
                label={`Alerts, ${alerts.length} new`}
                href="/alerts"
                dot={alerts.length > 0}
              />
              <IconButton icon={LayoutDashboard} label="Open web dashboard" href="/dashboard" />
            </View>
          }
        />
      </DemoTrigger>

      {/* One number, one button */}
      <View style={styles.hero}>
        <Txt variant="micro">Ready to pick today</Txt>
        <Txt variant="displayXl" style={styles.heroNumber}>
          {totals.ready} pods
        </Txt>
        <View style={styles.mustRow}>
          <View style={styles.mustPill}>
            <Txt variant="small" weight={800} color={Colors.surfaceCard} tabular>
              {totals.must} must pick
            </Txt>
          </View>
          <Txt variant="body" weight={600} style={{ flex: 1 }}>
            {weather.skipWatering
              ? 'before the rain, ideally by 11:00'
              : 'before they turn tough, ideally by 11:00'}
          </Txt>
        </View>
        <Button label="Start harvest" variant="surface" icon={ArrowRight} block href="/harvest" />
      </View>

      {/* What needs the farmer */}
      {tasks.length ? (
        <View style={styles.section}>
          <SectionHeader title="Today" />
          <TodayPlan tasks={tasks} limit={showAll ? undefined : TOP_TASKS} onOpen={openFarm} />
          {tasks.length > TOP_TASKS ? (
            <Button
              label={showAll ? 'Show fewer' : `See all ${tasks.length}`}
              variant="ghost"
              size="sm"
              icon={showAll ? ChevronUp : ChevronDown}
              onPress={() => setShowAll((s) => !s)}
              style={{ alignSelf: 'center' }}
            />
          ) : null}
        </View>
      ) : null}

      {/* Every farm at a glance */}
      <View style={styles.section}>
        <SectionHeader title="Your Farms" />
        <View style={styles.grid}>
          {farms.map((f) => (
            <FarmTile key={f.id} farm={f} status={farmStatus(f, alerts)} />
          ))}
        </View>
        <View style={styles.network}>
          <RadioTower size={14} color={Colors.textSecondary} strokeWidth={2} />
          <Txt variant="caption" weight={600} color={Colors.textSecondary} style={{ flex: 1 }}>
            {online} of {farms.length} connected over LoRa.
            {online < farms.length ? ' Offline farms keep running on their own.' : ''}
          </Txt>
        </View>
      </View>
    </Screen>
  );
}

function FarmTile({ farm, status }: { farm: MonitorFarm; status: FarmStatus }) {
  const Icon = farm.icon;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${farm.name}, ${farm.type}: ${status.label}, ${farm.podsReady} pods ready`}
      onPress={() => openFarm(farm.id)}
      style={({ pressed }) => [
        styles.tile,
        status.tone === 'bad' && styles.tileBad,
        pressed && styles.tilePressed,
      ]}>
      <View style={styles.tileTop}>
        <View style={styles.tileIcon}>
          <Icon size={18} color={Colors.textAccent} strokeWidth={2} />
        </View>
        <Txt variant="caption" weight={800} tabular color={Colors.textSecondary}>
          {farm.podsReady} pods
        </Txt>
      </View>
      <Txt variant="body" weight={800} numberOfLines={1}>
        {farm.name}
      </Txt>
      <View style={styles.statusRow}>
        <View style={[styles.dot, { backgroundColor: status.dot }]} />
        <Txt variant="caption" weight={700} numberOfLines={1} color={status.text} style={{ flexShrink: 1 }}>
          {status.label}
        </Txt>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topActions: { flexDirection: 'row', gap: 8 },
  hero: {
    marginTop: 20,
    backgroundColor: Colors.accent,
    borderRadius: Radius.xl,
    padding: 20,
    gap: 10,
    boxShadow: Shadow.glow,
  },
  heroNumber: { fontSize: 56, lineHeight: 58, letterSpacing: 1 },
  mustRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mustPill: {
    backgroundColor: Colors.danger,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  section: { marginTop: 24, gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    flexBasis: '30%',
    flexGrow: 1,
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.lg,
    padding: 12,
    gap: 6,
    boxShadow: Shadow.card,
  },
  tileBad: { boxShadow: `0px 0px 0px 2px ${Colors.dangerBg}, ${Shadow.card}` },
  tilePressed: { boxShadow: Shadow.float, transform: [{ translateY: -2 }] },
  tileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tileIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  network: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
