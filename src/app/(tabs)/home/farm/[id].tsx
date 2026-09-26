import { Link, router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Fan, Lightbulb, RadioTower, Droplets, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RowSnapshot } from '@/components/illustrations';
import { Screen } from '@/components/screen';
import { Badge } from '@/components/ui/badge';
import { IconButton } from '@/components/ui/button';
import { InfoStat, SectionHeader } from '@/components/ui/section-header';
import { Divider, IconWell } from '@/components/ui/surface';
import { Txt } from '@/components/ui/text';
import { Toggle } from '@/components/ui/toggle';
import { Colors, MaxContentWidth, Palette, Radius, Shadow, TabBarSpace } from '@/constants/theme';
import { getFarm, type Sensor } from '@/data/farms';
import { captureFor, harvestPlan } from '@/data/harvest';

type DeviceId = 'led' | 'pump' | 'fan';

type Device = { id: DeviceId; name: string; icon: LucideIcon; auto: string; manual: string };

/** Outdoor fields only get dry-soil alerts; indoor rooms run pumps, LEDs and fans. */
const OUTDOOR_DEVICES: Device[] = [
  {
    id: 'pump',
    name: 'Irrigation alerts',
    icon: Droplets,
    auto: 'On · alert when soil is under 30%',
    manual: 'Paused · no dry-soil alerts',
  },
];

const INDOOR_DEVICES: Device[] = [
  {
    id: 'led',
    name: 'LED grow lights',
    icon: Lightbulb,
    auto: 'Auto · 16 h day, off at 22:00',
    manual: 'Manual · on until you switch it off',
  },
  {
    id: 'pump',
    name: 'Watering pump',
    icon: Droplets,
    auto: 'Auto · next run 14:00 if soil is under 35%',
    manual: 'Manual · paused, water from here',
  },
  {
    id: 'fan',
    name: 'Air fans',
    icon: Fan,
    auto: 'Auto · runs when humidity is above 75%',
    manual: 'Manual · held at current speed',
  },
];

export default function FarmDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const farm = getFarm(id);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const snapWidth = Math.min(width, MaxContentWidth) - 80;
  const topRow = harvestPlan({ farmId: farm.id })[0];
  const devices = farm.kind === 'outdoor' ? OUTDOOR_DEVICES : INDOOR_DEVICES;
  const [auto, setAuto] = useState<Record<DeviceId, boolean>>({ led: true, pump: true, fan: true });

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/home'));

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.topRow}>
        <IconButton icon={ChevronLeft} label="Back" onPress={goBack} />
      </View>
      <View style={styles.renderWrap}>
        {topRow ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`Latest camera frame, row ${topRow.row}. Open row details`}
            onPress={() =>
              router.push({
                pathname: '/harvest/[farmId]/[row]',
                params: { farmId: farm.id, row: String(topRow.row) },
              })
            }
            style={styles.snap}>
            <RowSnapshot det={topRow} kind={farm.kind} seed={topRow.row} width={snapWidth} height={210} />
            <View style={styles.snapChip}>
              <Txt variant="caption" weight={700} color={Colors.surfaceCard}>
                Row {topRow.row} · {captureFor(farm).label}
              </Txt>
            </View>
          </Pressable>
        ) : null}
      </View>

      <View style={[styles.sheet, { paddingBottom: insets.bottom + TabBarSpace }]}>
        <View style={styles.titleRow}>
          <Txt variant="title" accessibilityRole="header" style={{ flexShrink: 1 }}>
            {farm.name}
          </Txt>
          {farm.status === 'online' ? (
            <Badge label="Online" tone="success" icon={RadioTower} />
          ) : (
            <Badge label="Local mode" tone="accent" icon={RadioTower} />
          )}
        </View>

        <View style={styles.facts}>
          <InfoStat label={farm.kind === 'outdoor' ? 'Location' : 'Building'} value={farm.building} />
          <InfoStat label="Plants" value={`${farm.plants} · day ${farm.day}`} />
          <InfoStat label="Last sync" value={farm.lastSync} />
        </View>

        <Txt variant="body" color={Colors.textBody}>
          {farm.kind === 'outdoor'
            ? `${farm.power}. Linked through LoRa gateway ${farm.gateway}; if the signal drops, the gateway keeps the readings and uploads them later.`
            : farm.status === 'online'
              ? `Linked through LoRa gateway ${farm.gateway}. If the signal drops, the controller in this room keeps the lights, water and air on schedule until it reconnects.`
              : `The link to gateway ${farm.gateway} dropped ${farm.lastSync}. The controller in this room is keeping the lights, water and air on schedule, and will sync when it reconnects.`}
        </Txt>

        <View style={styles.harvestRow}>
          <Txt variant="body" weight={700}>
            {farm.podsReady} pods ready · {farm.newFlowers} new flowers
          </Txt>
          <Link href={{ pathname: '/harvest', params: { farm: farm.id } }} style={styles.link}>
            <Txt variant="small" weight={600} color={Colors.textAccent}>
              See Map
            </Txt>
          </Link>
        </View>

        <SectionHeader title="Sensors" />
        <View style={styles.sensorGrid}>
          {farm.sensors.map((s) => (
            <SensorTile key={s.key} sensor={s} />
          ))}
        </View>

        <SectionHeader title="Equipment" />
        <View>
          {devices.map((d, i) => {
            const on = auto[d.id];
            return (
              <View key={d.id}>
                {i > 0 ? <Divider /> : null}
                <View style={styles.device}>
                  <IconWell icon={d.icon} size={40} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt variant="bodyLg" weight={800}>
                      {d.name}
                    </Txt>
                    <Txt variant="small" color={Colors.textSecondary}>
                      {on ? d.auto : d.manual}
                    </Txt>
                  </View>
                  <Toggle
                    label={`Automatic control for ${d.name}`}
                    value={on}
                    onValueChange={(v) => setAuto((a) => ({ ...a, [d.id]: v }))}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}

function SensorTile({ sensor: s }: { sensor: Sensor }) {
  const Icon = s.icon;
  return (
    <View style={styles.sensor} accessible accessibilityLabel={`${s.label} ${s.value} ${s.unit}. ${s.note}`}>
      <View style={styles.sensorHead}>
        <Txt variant="micro" color={Colors.textSecondary}>
          {s.label}
        </Txt>
        <Icon size={16} color={s.warn ? Colors.textAccent : Colors.textSecondary} strokeWidth={2} />
      </View>
      <View style={styles.sensorValue}>
        <Txt variant="title" tabular>
          {s.value}
        </Txt>
        <Txt variant="small" weight={600} color={Colors.textSecondary}>
          {s.unit}
        </Txt>
      </View>
      <View style={styles.gauge}>
        <View style={[styles.band, { left: `${s.band[0]}%`, width: `${s.band[1]}%` }]} />
        <View
          style={[
            styles.marker,
            {
              left: `${Math.min(98, s.marker)}%`,
              backgroundColor: s.warn ? Colors.danger : Colors.textPrimary,
            },
          ]}
        />
      </View>
      <Txt
        variant="caption"
        weight={s.warn ? 800 : 600}
        color={s.warn ? Colors.dangerFg : Colors.textSecondary}>
        {s.note}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 0, paddingBottom: 0, gap: 0, flexGrow: 1 },
  topRow: { paddingHorizontal: 24, flexDirection: 'row' },
  renderWrap: { paddingHorizontal: 40, paddingTop: 12 },
  snap: { borderRadius: Radius.xl, overflow: 'hidden', boxShadow: Shadow.card },
  snapChip: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    paddingHorizontal: 10,
    height: 24,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(30, 26, 22, 0.72)',
    justifyContent: 'center',
  },
  sheet: {
    flexGrow: 1,
    marginTop: 20,
    backgroundColor: Colors.surfaceCard,
    borderTopLeftRadius: Radius.sheet,
    borderTopRightRadius: Radius.sheet,
    paddingTop: 24,
    paddingHorizontal: 24,
    gap: 16,
    boxShadow: Shadow.float,
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  facts: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  harvestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingLeft: 14,
    paddingRight: 8,
    borderRadius: Radius.md,
    backgroundColor: Palette.orange100,
  },
  link: { paddingVertical: 14, paddingHorizontal: 6 },
  sensorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sensor: {
    flexBasis: '46%',
    flexGrow: 1,
    backgroundColor: Colors.bgApp,
    borderRadius: Radius.md,
    padding: 12,
    gap: 6,
  },
  sensorHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sensorValue: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  gauge: { height: 6, borderRadius: Radius.pill, backgroundColor: Colors.borderSubtle, marginVertical: 3 },
  band: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: Radius.pill,
    backgroundColor: Palette.orange300,
  },
  marker: { position: 'absolute', top: -3, width: 4, height: 12, marginLeft: -2, borderRadius: 2 },
  device: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
});
