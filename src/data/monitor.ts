/**
 * Farm Monitor + Smart Control data for the Home tab.
 *
 * Outdoor fields (sunlight, solar sensor nodes) are the main tier; the indoor
 * farms from `farms.ts` are the premium add-on. Readings are simulated in
 * `use-live-farm.ts` until the LoRa gateway writes real ones. The shapes follow
 * the team handoff format: farm_id, type, soil_moisture, ph, ec, temp,
 * humidity, light, time.
 */
import {
  CloudDrizzle,
  Droplet,
  FlaskConical,
  Leaf,
  Mountain,
  Sun,
  Thermometer,
  type LucideIcon,
} from 'lucide-react-native';

import { FARMS, type FarmStatus } from '@/data/farms';
import type { DemoState } from '@/data/demo';
import { HEAVY_MM, type Weather, type WeatherDay } from '@/services/weather';

export type FarmType = 'outdoor' | 'indoor';
export type MetricKey = 'moisture' | 'ph' | 'ec' | 'air' | 'humidity' | 'light';
export type Reading = Record<MetricKey, number>;
export type Level = 'ok' | 'warn' | 'critical';

// ── Sensor thresholds (one place to tune them) ────────────────────
type Range = [number, number];

export type MetricSpec = {
  key: MetricKey;
  label: string;
  short: string;
  unit: string;
  icon: LucideIcon;
  decimals: number;
  /** Gauge scale. */
  scale: Range;
  target: Record<FarmType, Range>;
  /** Outside this range the reading is critical; between it and target, a warning. */
  limit: Record<FarmType, Range>;
  low: string;
  high: string;
};

const both = (r: Range): Record<FarmType, Range> => ({ outdoor: r, indoor: r });

export const METRICS: MetricSpec[] = [
  {
    key: 'moisture',
    label: 'Soil moisture',
    short: 'Moisture',
    unit: '%',
    icon: Droplet,
    decimals: 0,
    scale: [0, 100],
    target: both([35, 45]),
    limit: both([30, 60]),
    low: 'Soil is dry, water soon',
    high: 'Soil is waterlogged',
  },
  {
    key: 'ph',
    label: 'Soil pH',
    short: 'pH',
    unit: 'pH',
    icon: FlaskConical,
    decimals: 1,
    scale: [4, 9],
    target: both([6, 6.8]),
    limit: both([5.5, 7.5]),
    low: 'Soil too acidic, add lime',
    high: 'Soil too alkaline',
  },
  {
    key: 'ec',
    label: 'Nutrients',
    short: 'Nutrients',
    unit: 'mS/cm',
    icon: Leaf,
    decimals: 1,
    scale: [0, 3.2],
    target: both([1.2, 2]),
    limit: both([0.8, 2.8]),
    low: 'Nutrients low, add fertiliser',
    high: 'Too much fertiliser, flush',
  },
  {
    key: 'air',
    label: 'Air temp',
    short: 'Temp',
    unit: '°C',
    icon: Thermometer,
    decimals: 1,
    scale: [0, 45],
    target: both([24, 30]),
    limit: both([15, 35]),
    low: 'Too cold for okra',
    high: 'Heat stress, pods toughen',
  },
  {
    key: 'humidity',
    label: 'Humidity',
    short: 'Humidity',
    unit: '%',
    icon: CloudDrizzle,
    decimals: 0,
    scale: [0, 100],
    target: both([60, 75]),
    limit: both([40, 85]),
    low: 'Air is very dry',
    high: 'Humid, fungal risk rising',
  },
  {
    key: 'light',
    label: 'Light',
    short: 'Light',
    unit: 'µmol',
    icon: Sun,
    decimals: 0,
    scale: [0, 1800],
    // Outdoor light follows the sun, so it never raises a warning.
    target: { outdoor: [0, 1800], indoor: [350, 500] },
    limit: { outdoor: [0, 1800], indoor: [250, 700] },
    low: 'Plants need more light',
    high: 'Light too strong',
  },
];

export const metric = (key: MetricKey) => METRICS.find((m) => m.key === key)!;

export function levelOf(spec: MetricSpec, value: number, type: FarmType): Level {
  const [tLo, tHi] = spec.target[type];
  const [lLo, lHi] = spec.limit[type];
  if (value < lLo || value > lHi) return 'critical';
  if (value < tLo || value > tHi) return 'warn';
  return 'ok';
}

export function noteOf(spec: MetricSpec, value: number, type: FarmType): string {
  const [lo, hi] = spec.target[type];
  if (spec.key === 'light' && type === 'outdoor') return 'Sunlight';
  if (value < lo) return spec.low;
  if (value > hi) return spec.high;
  return `Target ${fmt(spec, lo)}–${fmt(spec, hi)}`;
}

export const fmt = (spec: MetricSpec, v: number) => v.toFixed(spec.decimals);

/** Level and note for a reading; indoor light reads zero while the LEDs rest, which is expected. */
export function assess(spec: MetricSpec, value: number, type: FarmType, lightsOn = true) {
  if (spec.key === 'light' && type === 'indoor' && !lightsOn) {
    return { level: 'ok' as Level, note: 'LEDs off, cheaper night hours' };
  }
  return { level: levelOf(spec, value, type), note: noteOf(spec, value, type) };
}

// ── Farms ──────────────────────────────────────────────────────────
export type MonitorFarm = {
  id: string;
  name: string;
  type: FarmType;
  building: string;
  place: string;
  plants: number;
  day: number;
  podsReady: number;
  newFlowers: number;
  status: FarmStatus;
  risk?: string;
  icon: LucideIcon;
  gateway: string;
  lastSync: string;
  /** Minutes since the gateway last heard from this farm. */
  silentFor: number;
  /** Readings held at the gateway / controller waiting to upload. */
  buffered: number;
  base: Reading;
  /** What heavy rain threatens on this outdoor field. */
  hazard?: 'landslide' | 'flood';
  /** Solar sensor node (outdoor only). */
  battery?: number;
  /** Indoor only: light level measured per growing row, µmol. */
  rowLight?: number[];
  energy?: { kwhToday: number; nightShare: number; savedYen: number };
  /** Has a harvest map on the Harvest tab. */
  inHarvest: boolean;
  /** Set by demo mode: the whole gateway is unreachable, not just this farm. */
  gatewayDown?: boolean;
};

const OUTDOOR: MonitorFarm[] = [
  {
    id: 'field-a',
    hazard: 'flood',
    name: 'Field A',
    type: 'outdoor',
    building: 'Riverside plot',
    place: 'Riverside · 120 plants',
    plants: 120,
    day: 58,
    podsReady: 31,
    newFlowers: 22,
    status: 'online',
    icon: Sun,
    gateway: 'G-01',
    lastSync: '1 min ago',
    silentFor: 0,
    buffered: 0,
    base: { moisture: 32, ph: 6.4, ec: 1.0, air: 29, humidity: 65, light: 1400 },
    battery: 82,
    inHarvest: false,
  },
  {
    id: 'hillside',
    name: 'Hillside',
    type: 'outdoor',
    building: 'Terraced slope',
    place: 'Kawabe slope · 80 plants',
    plants: 80,
    day: 51,
    podsReady: 18,
    newFlowers: 11,
    status: 'online',
    hazard: 'landslide',
    icon: Mountain,
    gateway: 'G-01',
    lastSync: '3 min ago',
    silentFor: 0,
    buffered: 0,
    base: { moisture: 54, ph: 6.2, ec: 1.4, air: 27.5, humidity: 78, light: 1100 },
    battery: 64,
    inHarvest: false,
  },
];

const INDOOR_EXTRA: Record<string, Pick<MonitorFarm, 'base' | 'rowLight' | 'energy' | 'silentFor' | 'buffered'>> = {
  'classroom-2': {
    base: { moisture: 38, ph: 6.5, ec: 1.6, air: 27.4, humidity: 81, light: 420 },
    rowLight: [425, 418, 431, 409],
    energy: { kwhToday: 18.4, nightShare: 78, savedYen: 2400 },
    silentFor: 2,
    buffered: 0,
  },
  gymnasium: {
    base: { moisture: 41, ph: 6.6, ec: 1.5, air: 26.8, humidity: 72, light: 455 },
    rowLight: [452, 460, 447, 458, 451, 449],
    energy: { kwhToday: 31.2, nightShare: 81, savedYen: 4100 },
    silentFor: 4,
    buffered: 0,
  },
  'house-4': {
    base: { moisture: 36, ph: 6.3, ec: 1.4, air: 25.9, humidity: 69, light: 390 },
    rowLight: [392, 388, 395],
    energy: { kwhToday: 12.1, nightShare: 74, savedYen: 1500 },
    silentFor: 38,
    buffered: 46,
  },
  'post-office': {
    base: { moisture: 44, ph: 6.7, ec: 1.7, air: 26.1, humidity: 84, light: 410 },
    rowLight: [418, 251, 422, 415],
    energy: { kwhToday: 15.8, nightShare: 76, savedYen: 1900 },
    silentFor: 1,
    buffered: 0,
  },
};

const INDOOR: MonitorFarm[] = FARMS.filter((f) => f.kind === 'indoor').map((f) => ({
  id: f.id,
  name: f.name,
  type: 'indoor' as const,
  building: f.building,
  place: f.place,
  plants: f.plants,
  day: f.day,
  podsReady: f.podsReady,
  newFlowers: f.newFlowers,
  status: f.status,
  risk: f.risk,
  icon: f.icon,
  gateway: f.gateway,
  lastSync: f.lastSync,
  inHarvest: true,
  ...INDOOR_EXTRA[f.id],
}));

/** Outdoor pod counts come from the same camera detections as the harvest map. */
const OUTDOOR_LIVE: MonitorFarm[] = OUTDOOR.map((o) => {
  const f = FARMS.find((x) => x.id === o.id);
  return f ? { ...o, podsReady: f.podsReady, newFlowers: f.newFlowers, inHarvest: true } : o;
});

export const MONITOR_FARMS: MonitorFarm[] = [...OUTDOOR_LIVE, ...INDOOR];

export const getMonitorFarm = (id: string | undefined) =>
  MONITOR_FARMS.find((f) => f.id === id) ?? MONITOR_FARMS[0];

/** Demo mode pushes the simulated farms into the tabletop scenarios. */
export function applyDemo(farm: MonitorFarm, demo: DemoState): MonitorFarm {
  let f = farm;
  if (demo.drySoil && f.id === 'field-a') f = { ...f, base: { ...f.base, moisture: 24 } };
  if (demo.humid && f.id === 'gymnasium') f = { ...f, base: { ...f.base, humidity: 88 } };
  if (demo.newPods && f.id === 'field-a') f = { ...f, podsReady: f.podsReady + demo.newPods };
  if (demo.gatewayDown) {
    f = {
      ...f,
      status: 'local',
      gatewayDown: true,
      silentFor: Math.max(f.silentFor, 6),
      buffered: f.buffered + 72,
      lastSync: f.status === 'online' ? '6 min ago' : f.lastSync,
    };
  }
  return f;
}

/** Farm counts as offline when the gateway has heard nothing for 5 minutes. */
export const OFFLINE_AFTER_MIN = 5;

// ── Alerts (disaster, facility, network) ──────────────────────────
export type Severity = 'info' | 'warning' | 'critical';
export type AlertKind = 'disaster' | 'facility' | 'network' | 'sensor';

export type FarmAlert = {
  id: string;
  farmId: string;
  kind: AlertKind;
  severity: Severity;
  title: string;
  detail: string;
  time: string;
};

export const FARM_ALERTS: FarmAlert[] = [
  {
    id: 'post-office-led',
    farmId: 'post-office',
    kind: 'facility',
    severity: 'warning',
    title: 'Row 2 light 40% lower',
    detail: 'Light check reads 251 µmol against about 420 on the other rows. Check the LED strip on row 2.',
    time: '05:30 AM',
  },
];

/** Readings that are out of range become alerts too. */
export function sensorAlerts(farm: MonitorFarm, reading: Reading, lightsOn = true): FarmAlert[] {
  return METRICS.flatMap((spec) => {
    const { level, note } = assess(spec, reading[spec.key], farm.type, lightsOn);
    if (level === 'ok') return [];
    return [
      {
        id: `${farm.id}-${spec.key}`,
        farmId: farm.id,
        kind: 'sensor' as const,
        severity: level === 'critical' ? ('critical' as const) : ('warning' as const),
        title: note,
        detail: `${spec.label} is ${fmt(spec, reading[spec.key])} ${spec.unit}, target ${spec.target[farm.type]
          .map((v) => fmt(spec, v))
          .join('–')}.`,
        time: 'Now',
      },
    ];
  });
}

const HAZARD = {
  landslide: { title: 'Landslide risk', warn: 20, critical: HEAVY_MM, advice: 'Stay off the slope' },
  flood: { title: 'Flood risk', warn: HEAVY_MM, critical: 80, advice: 'Move tools and crates to high ground' },
} as const;

/** Disaster alerts for outdoor fields, from the live forecast. */
export function weatherAlerts(farm: MonitorFarm, weather: Weather): FarmAlert[] {
  if (!farm.hazard) return [];
  const h = HAZARD[farm.hazard];
  const day = weather.days.reduce<WeatherDay | null>((m, d) => (!m || d.mm > m.mm ? d : m), null);
  if (!day || day.mm < h.warn) return [];
  const critical = day.mm >= h.critical;
  const when = day.day === 'Today' ? 'today' : `on ${day.day}`;
  return [
    {
      id: `${farm.id}-${farm.hazard}`,
      farmId: farm.id,
      kind: 'disaster',
      severity: critical ? 'critical' : 'warning',
      title: `${h.title} ${when}`,
      detail: `${Math.round(day.mm)} mm of rain is forecast ${when} (${day.rain}% chance). ${h.advice} until it passes. Neighbours are warned on LINE.`,
      time: weather.source === 'live' ? 'Forecast' : 'Sample',
    },
  ];
}

/** A farm the gateway can't hear. Demo mode takes the whole gateway down, which is one alert. */
function networkAlerts(farm: MonitorFarm): FarmAlert[] {
  if (farm.status === 'online') return [];
  const onSite = farm.type === 'indoor' ? 'lights, water and air' : 'watering';
  return [
    farm.gatewayDown
      ? {
          id: `gateway-${farm.gateway}`,
          farmId: farm.id,
          kind: 'network',
          severity: 'critical',
          title: `Gateway ${farm.gateway} unreachable`,
          detail: `No uplink for ${farm.silentFor} min. Every farm keeps running on its own controller and saves readings until it is back.`,
          time: 'Now',
        }
      : {
          id: `${farm.id}-link`,
          farmId: farm.id,
          kind: 'network',
          severity: 'warning',
          title: 'LoRa link lost',
          detail: `The controller is running ${onSite} on its own. ${farm.buffered} readings are saved and will upload when the link is back.`,
          time: farm.lastSync,
        },
  ];
}

export const alertsFor = (
  farm: MonitorFarm,
  weather: Weather,
  reading: Reading = farm.base,
  lightsOn = true,
) => [
  ...weatherAlerts(farm, weather),
  ...networkAlerts(farm),
  ...FARM_ALERTS.filter((a) => a.farmId === farm.id),
  ...sensorAlerts(farm, reading, lightsOn),
];

// ── Smart Control ─────────────────────────────────────────────────
export type DeviceKey = 'pump' | 'led' | 'fan';

export const LIGHT_SCHEDULE = {
  /** 14 h on, placed in the cheaper night-rate hours. */
  onFrom: 20,
  onTo: 10,
  cameraAt: 10,
};

export const DEVICE_RULES: Record<DeviceKey, Record<FarmType, string>> = {
  pump: {
    outdoor: 'Waters 20 s when soil is under 30%, skips when rain is forecast',
    indoor: 'Waters 20 s when soil is under 30%',
  },
  led: { outdoor: '', indoor: '14 h on, 10 h off · on 20:00 to 10:00 at night rates' },
  fan: { outdoor: '', indoor: 'Runs 20 min when humidity is above 75%' },
};

export const devicesFor = (type: FarmType): DeviceKey[] => (type === 'outdoor' ? ['pump'] : ['pump', 'led', 'fan']);

// ── Sensor nodes (LoRa) ───────────────────────────────────────────
export type NodeKind = 'sensor' | 'climate' | 'relay' | 'camera';

export type SensorNode = {
  id: string;
  kind: NodeKind;
  role: string;
  /** Seconds between uplinks. */
  every: number;
  rssi: number;
  snr: number;
  /** Battery %, or null on mains power. */
  battery: number | null;
  packetsToday: number;
};

const CODE: Record<string, string> = {
  'field-a': 'FA',
  hillside: 'HS',
  'classroom-2': 'C2',
  gymnasium: 'GY',
  'house-4': 'H4',
  'post-office': 'PO',
};

/** Signal falls off with distance from the gateway; the hillside is the far edge. */
const RSSI: Record<string, number> = {
  'field-a': -94,
  hillside: -109,
  'classroom-2': -82,
  gymnasium: -85,
  'house-4': -112,
  'post-office': -98,
};

export function nodesFor(farm: MonitorFarm): SensorNode[] {
  const c = CODE[farm.id] ?? farm.id.slice(0, 2).toUpperCase();
  const r = RSSI[farm.id] ?? -95;
  const snr = Math.round(((r + 120) / 4) * 10) / 10;
  if (farm.type === 'outdoor') {
    const b = farm.battery ?? 80;
    return [
      { id: `${c}-S1`, kind: 'sensor', role: 'Soil + climate · solar', every: 5, rssi: r, snr, battery: b, packetsToday: 6120 },
      { id: `${c}-S2`, kind: 'sensor', role: 'Soil + climate · solar', every: 5, rssi: r - 3, snr: snr - 1, battery: b - 9, packetsToday: 6104 },
      { id: `${c}-C1`, kind: 'camera', role: 'Camera + edge AI (Pi)', every: 600, rssi: r + 2, snr: snr + 0.5, battery: 71, packetsToday: 58 },
    ];
  }
  return [
    { id: `${c}-S1`, kind: 'sensor', role: 'Soil moisture, pH, EC', every: 5, rssi: r, snr, battery: null, packetsToday: 6131 },
    { id: `${c}-E1`, kind: 'climate', role: 'Air, humidity, light', every: 5, rssi: r - 2, snr: snr - 0.5, battery: null, packetsToday: 6128 },
    { id: `${c}-R1`, kind: 'relay', role: 'Relay · LEDs, pump, fans', every: 30, rssi: r + 1, snr, battery: null, packetsToday: 1022 },
    { id: `${c}-C1`, kind: 'camera', role: 'Camera + edge AI (Pi)', every: 600, rssi: r + 3, snr: snr + 1, battery: null, packetsToday: 58 },
  ];
}

// ── Camera + edge AI ──────────────────────────────────────────────
export type DetectionKind = 'ready' | 'small' | 'overgrown' | 'flower';

export type Detection = {
  kind: DetectionKind;
  /** Box in % of the frame. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Pod length in cm (pods only). */
  cm?: number;
  confidence: number;
};

/** One camera frame: a row of plants with what the model found in it. */
export function cameraFrame(farm: MonitorFarm, extraReady = 0): Detection[] {
  const seed = farm.id.length;
  const pods: Detection[] = [
    { kind: 'ready', x: 10, y: 40, w: 7, h: 24, cm: 8.1, confidence: 0.94 },
    { kind: 'ready', x: 31, y: 34, w: 7, h: 26, cm: 8.7, confidence: 0.91 },
    { kind: 'small', x: 50, y: 48, w: 5, h: 15, cm: 4.2, confidence: 0.88 },
    { kind: 'ready', x: 62, y: 40, w: 7, h: 25, cm: 7.6, confidence: 0.93 },
    { kind: 'overgrown', x: 82, y: 38, w: 8, h: 34, cm: 13.4, confidence: 0.86 },
    { kind: 'flower', x: 20, y: 20, w: 9, h: 13, confidence: 0.9 },
    { kind: 'flower', x: 74, y: 19, w: 9, h: 12, confidence: 0.87 },
    { kind: 'small', x: 40, y: 74, w: 5, h: 14, cm: 3.8, confidence: 0.82 },
  ];
  const extra: Detection[] = [
    { kind: 'ready', x: 21, y: 68, w: 7, h: 24, cm: 7.9, confidence: 0.92 },
    { kind: 'ready', x: 55, y: 70, w: 7, h: 24, cm: 8.3, confidence: 0.9 },
  ];
  // Shift the frame a little per farm so each camera looks different.
  return [...pods, ...extra.slice(0, Math.min(2, Math.ceil(extraReady / 6)))].map((d, i) => ({
    ...d,
    x: Math.min(88, Math.max(2, d.x + ((seed * (i + 1)) % 5) - 2)),
  }));
}
