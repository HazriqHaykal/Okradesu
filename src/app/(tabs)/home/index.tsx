import { router } from 'expo-router';
import {
  ArrowRight,
  Bell,
  ChevronRight,
  Droplet,
  Droplets,
  Fan,
  LayoutDashboard,
  Lightbulb,
  MapPin,
  RadioTower,
  Sprout,
  Sun,
  TriangleAlert,
  Warehouse,
  type LucideIcon,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { WeatherCard } from '@/components/monitor/farm-monitor';
import { DemoTrigger } from '@/components/monitor/demo-panel';
import { TodayPlan, buildPlan } from '@/components/monitor/today-plan';
import { Screen } from '@/components/screen';
import { Badge } from '@/components/ui/badge';
import { Button, IconButton } from '@/components/ui/button';
import { Chip, ChipRow } from '@/components/ui/chip';
import { ScreenTitle, SectionHeader } from '@/components/ui/section-header';
import { Card, IconWell } from '@/components/ui/surface';
import { Txt } from '@/components/ui/text';
import { Colors, Radius, Shadow } from '@/constants/theme';
import { FARMS, FARMS_ONLINE, LAST_SCAN, TOTAL_PODS_TODAY, type Farm } from '@/data/farms';

export default function HomeScreen() {
  const { weather } = useWeather();
  const farms = useFarms();
  const podsToday = farms.reduce((n, f) => n + f.podsReady, 0);
  const onlineCount = farms.filter((f) => f.status === 'online').length;
  const bufferedTotal = farms.reduce((n, f) => n + f.buffered, 0);
  // Home lists events and soil problems; humidity warnings stay on each farm's page.
  const allAlerts = farms.flatMap((f) => alertsFor(f, weather))
    .filter((a) => a.kind !== 'sensor' || a.severity === 'critical' || /-(moisture|ec)$/.test(a.id))
    // One gateway alert covers every farm behind it.
    .filter((a, i, list) => list.findIndex((b) => b.id === a.id) === i)
    .sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'critical' ? -1 : 1));
  const tasks = buildPlan(farms, allAlerts, weather);
  const [now] = useState(() => new Date());
  const today = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' });
  const needsYou = new Set(allAlerts.map((a) => a.farmId));
  const [filter, setFilter] = useState<Filter>('all');
  // Farms that need the farmer come first.
  const sortedFarms = farms.filter((f) => filter === 'all' || f.type === filter).sort(
    (a, b) => Number(needsYou.has(b.id)) - Number(needsYou.has(a.id)),
  );
  const offline = farms.filter((f) => f.status === 'local');
  const outdoorCount = farms.filter((f) => f.type === 'outdoor').length;

  return (
    <Screen contentStyle={{ gap: 0 }}>
      <DemoTrigger>
        <ScreenTitle
          kicker={`${greeting(now.getHours())} · ${today} · ${weather.now.temp}°C ${weather.now.label.toLowerCase()}`}
          title={`Hi, ${displayName()}`}
          right={
            <View style={styles.topActions}>
              <IconButton icon={Bell} label={`Alerts, ${allAlerts.length} new`} href="/alerts" dot />
              <IconButton icon={LayoutDashboard} label="Open web dashboard" href="/dashboard" />
            </View>
          }
        />
      </DemoTrigger>
      <Txt variant="body" color={Colors.textBody} style={styles.lede}>
        {tasks.length
          ? `You have ${tasks.length} things to do across your ${farms.length} farms in ${FARMER.area}. Camera scan finished at ${LAST_SCAN}.`
          : `Nothing needs you today. Your ${farms.length} farms in ${FARMER.area} are running on their own.`}
      </Txt>

      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={{ gap: 6 }}>
            <Txt variant="micro">Your harvest today</Txt>
            <Txt variant="displayXl">{podsToday} pods</Txt>
          </View>
          <Badge label={`${farms.length} farms`} tone="neutral" />
        </View>
        <Txt variant="body" weight={500}>
          Best picked before 11:00, while pods are under 10 cm. 12 more turn ready tomorrow.
        </Txt>
        <Button label="Open harvest map" variant="surface" size="md" icon={ArrowRight} block href="/harvest" />
      </View>

      {tasks.length ? (
        <View style={styles.section}>
          <SectionHeader title="Your plan today" />
          <TodayPlan tasks={tasks} onOpen={(id) => openFarm(id)} />
        </View>
      ) : null}

      {/* ── Farm Monitor ─────────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader title="Farm Monitor" />
        <View style={styles.stats}>
          <MiniStat label="Online" value={`${onlineCount}/${farms.length}`} />
          <MiniStat label="Alerts" value={`${allAlerts.length}`} tone={allAlerts.length ? 'danger' : undefined} />
          <MiniStat label="Outdoor" value={`${outdoorCount}`} />
          <MiniStat label="Indoor" value={`${farms.length - outdoorCount}`} />
        </View>

        {allAlerts.slice(0, 3).map((a) => {
          const farm = farms.find((f) => f.id === a.farmId)!;
          const critical = a.severity === 'critical';
          return (
            <Pressable
              key={a.id}
              accessibilityRole="link"
              accessibilityLabel={`${farm.name}: ${a.title}`}
              onPress={() => openFarm(farm)}
              style={({ pressed }) => [
                styles.alert,
                { backgroundColor: critical ? Colors.dangerBg : Palette.orange100 },
                pressed && styles.pressed,
              ]}>
              <TriangleAlert
                size={16}
                color={critical ? Colors.dangerFg : Colors.textAccent}
                strokeWidth={2.5}
              />
              <View style={{ flex: 1 }}>
                <Txt variant="small" weight={800} color={critical ? Colors.dangerFg : Colors.textAccent}>
                  {farm.name} · {a.title}
                </Txt>
                <Txt variant="caption" color={Colors.textBody} numberOfLines={1}>
                  {a.detail}
                </Txt>
              </View>
              <ChevronRight size={16} color={Colors.textSecondary} strokeWidth={2} />
            </Pressable>
          );
        })}

        <WeatherCard weather={weather} compact />

        <Card style={styles.network}>
          <IconWell icon={RadioTower} size={36} radius={Radius.sm} />
          <Txt variant="small" color={Colors.textBody} style={{ flex: 1 }}>
            <Txt variant="small" weight={800}>
              LoRa network
            </Txt>{' '}
            · {onlineCount} of {farms.length} farms online through one gateway.
            {offline.length === farms.length
              ? ` The gateway is down; every farm is running on its own controller, ${bufferedTotal} readings saved.`
              : offline.length > 0
                ? ` ${offline.map((f) => f.name).join(', ')} ${offline.length > 1 ? 'are' : 'is'} running on ${offline.length > 1 ? 'their' : 'its'} own controller, ${bufferedTotal} readings saved.`
                : ''}
          </Txt>
        </Card>
      </View>

      {/* ── Smart Control ────────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader title="Smart Control" />
        <Card style={styles.controls}>
          <ControlRow
            icon={Droplets}
            title="Irrigation"
            detail={`All farms · ${weather.skipWatering ? 'outdoor pumps skip today, rain due' : DEVICE_RULES.pump.outdoor}`}
            action="Field A"
            onPress={() => openFarm('field-a', 'control')}
          />
          <ControlRow
            icon={Lightbulb}
            title="LED lights"
            detail="Indoor · 14 h on at night rates, 20:00 to 10:00"
            action="Classroom 2"
            onPress={() => openFarm('classroom-2', 'control')}
          />
          <ControlRow
            icon={Fan}
            title="Air fans"
            detail="Indoor · auto above 75% humidity, 2 farms running"
            action="Post Office"
            onPress={() => openFarm('post-office', 'control')}
            last
          />
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Browse by Farm" />
        <View style={styles.tiles}>
          {FARMS.map((f) => (
            <FarmTile key={f.id} farm={f} />
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Your Farms" />
        <ChipRow>
          <Chip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
          <Chip label="Outdoor" icon={Sun} selected={filter === 'outdoor'} onPress={() => setFilter('outdoor')} />
          <Chip
            label="Indoor"
            icon={Warehouse}
            selected={filter === 'indoor'}
            onPress={() => setFilter('indoor')}
          />
        </ChipRow>
        <View style={styles.grid}>
          {sortedFarms.map((f) => (
            <FarmCard
              key={f.id}
              farm={f}
              hazard={allAlerts.some((a) => a.farmId === f.id && a.kind === 'disaster')}
              needsYou={needsYou.has(f.id)}
            />
          ))}
        </View>
      </View>
    </Screen>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: 'danger' }) {
  return (
    <View style={[styles.mini, tone === 'danger' && { backgroundColor: Colors.dangerBg }]}>
      <Txt variant="micro" color={tone === 'danger' ? Colors.dangerFg : Colors.textSecondary}>
        {label}
      </Txt>
      <Txt variant="heading" tabular color={tone === 'danger' ? Colors.dangerFg : Colors.textPrimary}>
        {value}
      </Txt>
    </View>
  );
}

function ControlRow({
  icon,
  title,
  detail,
  action,
  onPress,
  last,
}: {
  icon: LucideIcon;
  title: string;
  detail: string;
  action: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${title}. ${detail}. Open ${action} controls`}
      onPress={onPress}
      style={({ pressed }) => [styles.controlRow, !last && styles.controlDivider, pressed && styles.pressed]}>
      <IconWell icon={icon} size={40} />
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="bodyLg" weight={800}>
          {title}
        </Txt>
        <Txt variant="small" color={Colors.textSecondary}>
          {detail}
        </Txt>
      </View>
      <View style={styles.controlAction}>
        <Txt variant="caption" weight={700} color={Colors.textAccent}>
          {action}
        </Txt>
        <ChevronRight size={14} color={Colors.textAccent} strokeWidth={2} />
      </View>
    </Pressable>
  );
}

function FarmTile({ farm }: { farm: MonitorFarm }) {
  const Icon = farm.icon;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Open ${farm.name}`}
      onPress={() => openFarm(farm)}
      style={styles.tile}>
      {({ pressed }) => (
        <>
          <View
            style={[styles.tileBox, pressed && { boxShadow: `0px 0px 0px 2px ${Colors.accent}, ${Shadow.glow}` }]}>
            <View style={styles.tileWell}>
              <Icon size={20} color={Colors.textAccent} strokeWidth={2} />
            </View>
          </View>
          <Txt variant="caption" weight={600} numberOfLines={1}>
            {farm.name}
          </Txt>
        </>
      )}
    </Pressable>
  );
}

function FarmCard({ farm, hazard, needsYou }: { farm: MonitorFarm; hazard: boolean; needsYou: boolean }) {
  const Icon = farm.icon;
  const outdoor = farm.type === 'outdoor';
  const dry = farm.base.moisture < 35;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${farm.name}, ${outdoor ? 'outdoor' : 'indoor'}, ${farm.place}, ${farm.podsReady} pods ready, soil ${farm.base.moisture}%`}
      onPress={() => openFarm(farm)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.cardWell}>
        <Icon size={40} color={Colors.textAccent} strokeWidth={1.75} />
        <View style={styles.cardBadge}>
          {hazard ? (
            <Badge label={farm.hazard === 'flood' ? 'Flood risk' : 'Landslide risk'} tone="danger" />
          ) : farm.risk ? (
            <Badge label={farm.risk} tone="danger" />
          ) : farm.status === 'online' ? (
            <Badge label="Online" tone="success" />
          ) : (
            <Badge label="Local mode" tone="accent" />
          )}
        </View>
        {needsYou ? <View style={styles.needsDot} accessibilityLabel="Needs you" /> : null}
        <View style={styles.cardType}>
          <Badge label={outdoor ? 'Outdoor' : 'Indoor'} tone="neutral" icon={outdoor ? Sun : Warehouse} />
        </View>
      </View>
      <View style={styles.cardRow}>
        <Txt variant="bodyLg" weight={800} numberOfLines={1} style={{ flexShrink: 1 }}>
          {farm.name}
        </Txt>
        <View style={styles.pods}>
          <Sprout size={12} color={Colors.accent} strokeWidth={2} />
          <Txt variant="caption" weight={700} tabular>
            {farm.podsReady}
          </Txt>
        </View>
      </View>
      <View style={styles.cardMeta}>
        <Droplet size={12} color={dry ? Colors.textAccent : Colors.textSecondary} strokeWidth={2} />
        <Txt
          variant="caption"
          weight={dry ? 800 : 400}
          color={dry ? Colors.textAccent : Colors.textSecondary}
          numberOfLines={1}
          style={{ flexShrink: 1 }}>
          Soil {farm.base.moisture}% · {farm.base.air}°C
        </Txt>
      </View>
      <View style={styles.cardMeta}>
        <MapPin size={12} color={Colors.textSecondary} strokeWidth={2} />
        <Txt variant="caption" color={Colors.textSecondary} numberOfLines={1} style={{ flexShrink: 1 }}>
          {farm.place}
        </Txt>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topActions: { flexDirection: 'row', gap: 8 },
  lede: { marginTop: 8 },
  hero: {
    marginTop: 24,
    backgroundColor: Colors.accent,
    borderRadius: Radius.xl,
    padding: 20,
    gap: 12,
    boxShadow: Shadow.glow,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  stats: { flexDirection: 'row', gap: 8 },
  mini: {
    flex: 1,
    gap: 2,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceCard,
    boxShadow: Shadow.tile,
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
  },
  network: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    boxShadow: Shadow.tile,
  },
  controls: { paddingHorizontal: 14 },
  controlRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  controlDivider: { borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  controlAction: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  section: { marginTop: 24, gap: 12 },
  tiles: { flexDirection: 'row', justifyContent: 'space-between' },
  tile: { alignItems: 'center', gap: 6, width: 72 },
  tileBox: {
    width: 54,
    height: 54,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceCard,
    boxShadow: Shadow.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileWell: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.lg,
    padding: 8,
    gap: 6,
    boxShadow: Shadow.card,
  },
  cardPressed: { boxShadow: Shadow.float, transform: [{ translateY: -2 }] },
  cardWell: {
    height: 104,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBadge: { position: 'absolute', top: 6, left: 6 },
  cardType: { position: 'absolute', bottom: 6, left: 6 },
  needsDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent,
    borderWidth: 2,
    borderColor: Colors.surfaceCard,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
  },
  pods: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 2 },
});
