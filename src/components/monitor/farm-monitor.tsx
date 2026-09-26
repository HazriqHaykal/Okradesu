import {
  BatteryMedium,
  Check,
  CloudRain,
  RadioTower,
  Sun,
  TriangleAlert,
  WifiOff,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { SensorChart } from '@/components/monitor/sensor-chart';
import { SensorNodes } from '@/components/monitor/sensor-nodes';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from '@/components/ui/section-header';
import { IconWell, Meter } from '@/components/ui/surface';
import { Txt } from '@/components/ui/text';
import { Colors, Palette, Radius, Shadow } from '@/constants/theme';
import {
  METRICS,
  alertsFor,
  assess,
  fmt,
  type FarmAlert,
  type Level,
  type MetricSpec,
  type MonitorFarm,
  type Severity,
} from '@/data/monitor';
import type { useLiveFarm } from '@/hooks/use-live-farm';
import type { Weather } from '@/services/weather';

type Live = ReturnType<typeof useLiveFarm>;

export const LEVEL_COLOR: Record<Level, { fg: string; marker: string }> = {
  ok: { fg: Colors.textSecondary, marker: Colors.textPrimary },
  warn: { fg: Colors.textAccent, marker: Palette.orange600 },
  critical: { fg: Colors.dangerFg, marker: Colors.danger },
};

export function FarmMonitor({
  farm,
  live,
  lightsOn,
  weather,
}: {
  farm: MonitorFarm;
  live: Live;
  lightsOn: boolean;
  weather: Weather;
}) {
  const [resolved, setResolved] = useState<string[]>([]);
  const alerts = alertsFor(farm, weather, live.reading, lightsOn).filter((a) => !resolved.includes(a.id));
  const outdoor = farm.type === 'outdoor';

  return (
    <View style={styles.wrap}>
      <LiveStatus farm={farm} live={live} />

      <View style={styles.sensorGrid}>
        {METRICS.map((spec) => (
          <SensorTile
            key={spec.key}
            spec={spec}
            value={live.reading[spec.key]}
            farm={farm}
            lightsOn={lightsOn}
          />
        ))}
      </View>

      <SectionHeader title="Sensor nodes" />
      <SensorNodes farm={farm} live={live} />

      <SectionHeader title="Last 24 hours" />
      <SensorChart history={live.history} type={farm.type} />

      {outdoor ? (
        <>
          <SectionHeader title="Weather" />
          <WeatherCard weather={weather} />
          <SolarNode farm={farm} />
        </>
      ) : null}

      <SectionHeader title={alerts.length ? `Alerts · ${alerts.length}` : 'Alerts'} />
      <AlertList alerts={alerts} onResolve={(id) => setResolved((r) => [...r, id])} />
    </View>
  );
}

function LiveStatus({ farm, live }: { farm: MonitorFarm; live: Live }) {
  if (live.offline) {
    const mins = Math.round(live.secondsAgo / 60);
    return (
      <View style={[styles.status, { backgroundColor: Palette.orange100 }]}>
        <WifiOff size={16} color={Colors.textAccent} strokeWidth={2} />
        <Txt variant="small" color={Colors.textBody} style={{ flex: 1 }}>
          <Txt variant="small" weight={800}>
            Offline · last reading {mins} min ago.
          </Txt>{' '}
          {farm.buffered} readings are saved and will upload when the LoRa link is back.
        </Txt>
      </View>
    );
  }
  return (
    <View style={[styles.status, { backgroundColor: Colors.successBg }]}>
      <View style={styles.liveDot} />
      <Txt variant="small" weight={700} color={Colors.successFg} style={{ flex: 1 }} tabular>
        Live via gateway {farm.gateway} · updated {live.secondsAgo < 2 ? 'just now' : `${live.secondsAgo} s ago`}
      </Txt>
      <RadioTower size={15} color={Colors.successFg} strokeWidth={2} />
    </View>
  );
}

function SensorTile({
  spec,
  value,
  farm,
  lightsOn,
}: {
  spec: MetricSpec;
  value: number;
  farm: MonitorFarm;
  lightsOn: boolean;
}) {
  const Icon = spec.icon;
  const { level, note } = assess(spec, value, farm.type, lightsOn);
  const c = LEVEL_COLOR[level];
  const [s0, s1] = spec.scale;
  const pct = (v: number) => Math.min(98, Math.max(0, ((v - s0) / (s1 - s0)) * 100));
  const [tLo, tHi] = spec.target[farm.type];
  const band = !(spec.key === 'light' && farm.type === 'outdoor');
  return (
    <View
      style={styles.sensor}
      accessible
      accessibilityLabel={`${spec.label} ${fmt(spec, value)} ${spec.unit}. ${note}`}>
      <View style={styles.sensorHead}>
        <Txt variant="micro" color={Colors.textSecondary}>
          {spec.label}
        </Txt>
        <Icon size={16} color={level === 'ok' ? Colors.textSecondary : c.fg} strokeWidth={2} />
      </View>
      <View style={styles.sensorValue}>
        <Txt variant="title" tabular>
          {fmt(spec, value)}
        </Txt>
        <Txt variant="small" weight={600} color={Colors.textSecondary}>
          {spec.unit}
        </Txt>
      </View>
      <View style={styles.gauge}>
        {band ? (
          <View style={[styles.band, { left: `${pct(tLo)}%`, width: `${pct(tHi) - pct(tLo)}%` }]} />
        ) : null}
        <View style={[styles.marker, { left: `${pct(value)}%`, backgroundColor: c.marker }]} />
      </View>
      <Txt variant="caption" weight={level === 'ok' ? 600 : 800} color={c.fg} numberOfLines={2}>
        {note}
      </Txt>
    </View>
  );
}

export function WeatherCard({ weather, compact }: { weather: Weather; compact?: boolean }) {
  const NowIcon = weather.now.icon;
  const updated = weather.fetchedAt
    ? `Open-Meteo · ${new Date(weather.fetchedAt).toTimeString().slice(0, 5)}`
    : 'Sample · offline';
  return (
    <View style={[styles.weather, compact && styles.weatherCompact]}>
      <View style={styles.weatherTop}>
        <IconWell icon={NowIcon} size={40} radius={Radius.sm} />
        <View style={{ flex: 1 }}>
          <Txt variant="micro" color={Colors.textSecondary}>
            {weather.area} · now
          </Txt>
          <Txt variant="bodyLg" weight={800}>
            {weather.now.temp}°C · {weather.now.label}
          </Txt>
        </View>
        <Badge label={updated} tone={weather.source === 'live' ? 'success' : 'neutral'} />
      </View>
      <View style={styles.days}>
        {weather.days.map((d) => {
          const Icon = d.icon;
          const wet = d.rain >= 70 || d.mm >= 5;
          return (
            <View key={d.day} style={[styles.day, wet && { backgroundColor: Palette.orange100 }]}>
              <Txt variant="caption" weight={700} color={Colors.textSecondary}>
                {d.day}
              </Txt>
              <Icon size={20} color={wet ? Colors.textAccent : Colors.textPrimary} strokeWidth={2} />
              <Txt variant="small" weight={800} tabular>
                {d.hi}° / {d.lo}°
              </Txt>
              <Txt variant="caption" weight={wet ? 800 : 600} color={wet ? Colors.textAccent : Colors.textSecondary} tabular>
                {d.rain}%{d.mm >= 1 ? ` · ${Math.round(d.mm)} mm` : ''}
              </Txt>
            </View>
          );
        })}
      </View>
      <View style={styles.advice}>
        <CloudRain
          size={14}
          color={weather.skipWatering ? Colors.textAccent : Colors.textSecondary}
          strokeWidth={2}
        />
        <Txt variant="small" weight={700} color={Colors.textBody} style={{ flex: 1 }}>
          {weather.advice}
        </Txt>
      </View>
    </View>
  );
}

function SolarNode({ farm }: { farm: MonitorFarm }) {
  const pct = farm.battery ?? 0;
  return (
    <View style={styles.node}>
      <IconWell icon={BatteryMedium} size={40} radius={Radius.sm} />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={styles.nodeRow}>
          <Txt variant="body" weight={800}>
            Solar sensor node
          </Txt>
          <Txt variant="small" weight={800} tabular>
            {pct}%
          </Txt>
        </View>
        <Meter value={pct} color={pct > 30 ? Colors.success : Colors.danger} />
        <View style={styles.nodeRow}>
          <Sun size={12} color={Colors.textSecondary} strokeWidth={2} />
          <Txt variant="caption" color={Colors.textSecondary} style={{ flex: 1 }}>
            Charging from its panel · no wiring, months per battery
          </Txt>
        </View>
      </View>
    </View>
  );
}

const SEVERITY: Record<Severity, { bg: string; fg: string; icon: LucideIcon; label: string }> = {
  critical: { bg: Colors.dangerBg, fg: Colors.dangerFg, icon: TriangleAlert, label: 'Critical' },
  warning: { bg: Palette.orange100, fg: Colors.textAccent, icon: TriangleAlert, label: 'Warning' },
  info: { bg: Colors.surfaceSunken, fg: Colors.textBody, icon: Check, label: 'Info' },
};

const KIND_LABEL: Record<FarmAlert['kind'], string> = {
  disaster: 'Disaster',
  facility: 'Facility',
  network: 'Network',
  sensor: 'Sensor',
};

export function AlertList({ alerts, onResolve }: { alerts: FarmAlert[]; onResolve: (id: string) => void }) {
  if (alerts.length === 0) {
    return (
      <View style={[styles.alert, { backgroundColor: Colors.successBg }]}>
        <Check size={16} color={Colors.successFg} strokeWidth={2.5} />
        <Txt variant="small" weight={700} color={Colors.successFg}>
          All readings are in range.
        </Txt>
      </View>
    );
  }
  return (
    <View style={{ gap: 10 }}>
      {alerts.map((a) => {
        const s = SEVERITY[a.severity];
        const Icon = s.icon;
        return (
          <View key={a.id} style={[styles.alert, { backgroundColor: s.bg }]}>
            <Icon size={16} color={s.fg} strokeWidth={2.5} style={{ marginTop: 2 }} />
            <View style={{ flex: 1, gap: 4 }}>
              <View style={styles.alertHead}>
                <Badge
                  label={`${KIND_LABEL[a.kind]} · ${s.label}`}
                  tone={a.severity === 'critical' ? 'danger' : a.severity === 'warning' ? 'accent' : 'neutral'}
                />
                <Txt variant="caption" color={Colors.textSecondary}>
                  {a.time}
                </Txt>
              </View>
              <Txt variant="body" weight={800} color={s.fg}>
                {a.title}
              </Txt>
              <Txt variant="small" color={Colors.textBody}>
                {a.detail}
              </Txt>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Resolve: ${a.title}`}
              onPress={() => onResolve(a.id)}
              hitSlop={6}
              style={({ pressed }) => [styles.resolve, pressed && { backgroundColor: Palette.orange100 }]}>
              <Txt variant="micro" color={Colors.textPrimary}>
                Resolve
              </Txt>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
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
  weather: { backgroundColor: Colors.bgApp, borderRadius: Radius.lg, padding: 14, gap: 12 },
  weatherCompact: { backgroundColor: Colors.surfaceCard, boxShadow: Shadow.card },
  weatherTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  days: { flexDirection: 'row', gap: 8 },
  day: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceCard,
  },
  advice: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  node: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: Radius.lg,
    backgroundColor: Colors.bgApp,
  },
  nodeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  alert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: Radius.md,
  },
  alertHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  resolve: {
    paddingHorizontal: 10,
    height: 28,
    justifyContent: 'center',
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceCard,
    boxShadow: Shadow.tile,
  },
});
