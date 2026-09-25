/**
 * Illustrative sample data until the LoRa gateway / sensor API is wired up.
 * Every screen reads from here so swapping in live data is one place.
 */
import {
  CloudDrizzle,
  Droplet,
  Leaf,
  Mail,
  School,
  Sun,
  Thermometer,
  House,
  type LucideIcon,
} from 'lucide-react-native';

export type FarmStatus = 'online' | 'local';

export type Sensor = {
  key: string;
  label: string;
  value: string;
  unit: string;
  note: string;
  icon: LucideIcon;
  /** Target band as [start %, width %] of the gauge, and the current reading's position in %. */
  band: [number, number];
  marker: number;
  warn?: boolean;
};

export type Farm = {
  id: string;
  name: string;
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
  sensors: Sensor[];
};

function sensors(o: {
  moisture: number;
  humidity: number;
  air: number;
  ec: number;
  light: number;
  soil: number;
}): Sensor[] {
  const humid = o.humidity > 75;
  return [
    {
      key: 'moisture',
      label: 'Soil moisture',
      value: `${o.moisture}`,
      unit: '%',
      note: 'Target 35–45%',
      icon: Droplet,
      band: [35, 10],
      marker: o.moisture,
    },
    {
      key: 'ec',
      label: 'Nutrients',
      value: o.ec.toFixed(1),
      unit: 'mS/cm',
      note: 'Target 1.2–2.0',
      icon: Leaf,
      band: [30, 25],
      marker: (o.ec / 3.2) * 100,
    },
    {
      key: 'air',
      label: 'Air temp',
      value: o.air.toFixed(1),
      unit: '°C',
      note: 'Target 24–30 °C',
      icon: Thermometer,
      band: [40, 30],
      marker: (o.air / 50) * 100,
    },
    {
      key: 'humidity',
      label: 'Humidity',
      value: `${o.humidity}`,
      unit: '%',
      note: humid ? 'Above 75% overnight' : 'Target 60–75%',
      icon: CloudDrizzle,
      band: [60, 15],
      marker: o.humidity,
      warn: humid,
    },
    {
      key: 'light',
      label: 'Light',
      value: `${o.light}`,
      unit: 'µmol',
      note: 'Target 350–500',
      icon: Sun,
      band: [45, 20],
      marker: (o.light / 780) * 100,
    },
    {
      key: 'soil',
      label: 'Soil temp',
      value: o.soil.toFixed(1),
      unit: '°C',
      note: 'Target 22–28 °C',
      icon: Thermometer,
      band: [40, 25],
      marker: (o.soil / 50) * 100,
    },
  ];
}

export const FARMS: Farm[] = [
  {
    id: 'classroom-2',
    name: 'Classroom 2',
    building: 'Hinode School',
    place: 'Hinode School · 48 plants',
    plants: 48,
    day: 62,
    podsReady: 14,
    newFlowers: 9,
    status: 'online',
    icon: School,
    gateway: 'G-02',
    lastSync: '2 min ago',
    sensors: sensors({ moisture: 38, humidity: 81, air: 27.4, ec: 1.6, light: 420, soil: 24.1 }),
  },
  {
    id: 'gymnasium',
    name: 'Gymnasium',
    building: 'Hinode School',
    place: 'Hinode School · 96 plants',
    plants: 96,
    day: 55,
    podsReady: 26,
    newFlowers: 17,
    status: 'online',
    icon: School,
    gateway: 'G-02',
    lastSync: '4 min ago',
    sensors: sensors({ moisture: 41, humidity: 72, air: 26.8, ec: 1.5, light: 455, soil: 23.6 }),
  },
  {
    id: 'house-4',
    name: 'House 4',
    building: 'Minami vacant house',
    place: 'Minami · 32 plants',
    plants: 32,
    day: 48,
    podsReady: 9,
    newFlowers: 6,
    status: 'local',
    icon: House,
    gateway: 'G-01',
    lastSync: '38 min ago',
    sensors: sensors({ moisture: 36, humidity: 69, air: 25.9, ec: 1.4, light: 390, soil: 23.2 }),
  },
  {
    id: 'post-office',
    name: 'Post Office',
    building: 'Kawabe closed branch',
    place: 'Kawabe · 40 plants',
    plants: 40,
    day: 70,
    podsReady: 9,
    newFlowers: 4,
    status: 'online',
    risk: 'Mildew risk',
    icon: Mail,
    gateway: 'G-01',
    lastSync: '1 min ago',
    sensors: sensors({ moisture: 44, humidity: 84, air: 26.1, ec: 1.7, light: 410, soil: 24.4 }),
  },
];

export const getFarm = (id: string | undefined) => FARMS.find((f) => f.id === id) ?? FARMS[0];

export const TOTAL_PODS_TODAY = FARMS.reduce((n, f) => n + f.podsReady, 0);
export const TOTAL_PLANTS = FARMS.reduce((n, f) => n + f.plants, 0);
export const FARMS_ONLINE = FARMS.filter((f) => f.status === 'online').length;

// ── Harvest map ────────────────────────────────────────────────────
export type PlantStage = 'ready' | 'tomorrow' | 'flowering' | 'growing';
export type Plant = { index: number; row: number; col: number; stage: PlantStage; pods: number };

export const BED_COLUMNS = 6;
const STAGES: Record<string, PlantStage> = { R: 'ready', T: 'tomorrow', F: 'flowering', G: 'growing' };

/** Daily map from the on-site camera AI, one bed laid out window-side to door. */
export function harvestMap(farm: Farm): Plant[] {
  const rows = 8;
  const seed = FARMS.indexOf(farm);
  return Array.from({ length: rows * BED_COLUMNS }, (_, i) => {
    const stage = STAGES['GRFTRGTF'[(i * 5 + Math.floor(i / BED_COLUMNS) + seed * 3) % 8]];
    const pods = stage === 'ready' ? (i % 3) + 1 : stage === 'tomorrow' ? (i % 2) + 1 : 0;
    return { index: i, row: Math.floor(i / BED_COLUMNS) + 1, col: (i % BED_COLUMNS) + 1, stage, pods };
  });
}

// ── Market ─────────────────────────────────────────────────────────
export type ForecastDay = { day: string; sold: number; open: number };

export const FORECAST: ForecastDay[] = [
  { day: 'Today', sold: 58, open: 0 },
  { day: 'Sun', sold: 54, open: 4 },
  { day: 'Mon', sold: 62, open: 0 },
  { day: 'Tue', sold: 60, open: 6 },
  { day: 'Wed', sold: 57, open: 10 },
  { day: 'Thu', sold: 40, open: 24 },
  { day: 'Fri', sold: 26, open: 34 },
];
export const FORECAST_TOTAL = FORECAST.reduce((n, d) => n + d.sold + d.open, 0);
export const FORECAST_OPEN = FORECAST.reduce((n, d) => n + d.open, 0);

export type BuyerStatus = 'confirmed' | 'offer' | 'pending';
export type Buyer = {
  id: string;
  initials: string;
  name: string;
  kind: 'Restaurant' | 'Processor';
  detail: string;
  status: BuyerStatus;
};

export const BUYERS: Buyer[] = [
  {
    id: 'tanpopo',
    initials: 'IT',
    name: 'Izakaya Tanpopo',
    kind: 'Restaurant',
    detail: '12 kg · Mon & Thu',
    status: 'confirmed',
  },
  {
    id: 'kotobuki',
    initials: 'SK',
    name: 'Soba Kotobuki',
    kind: 'Restaurant',
    detail: '8 kg · daily',
    status: 'confirmed',
  },
  {
    id: 'kawabe-pickles',
    initials: 'KP',
    name: 'Kawabe Pickles',
    kind: 'Processor',
    detail: '30 kg overgrown pods',
    status: 'offer',
  },
  {
    id: 'asahi',
    initials: 'SA',
    name: 'Shokudo Asahi',
    kind: 'Restaurant',
    detail: '5 kg · Fridays',
    status: 'pending',
  },
];

// ── Advisor ────────────────────────────────────────────────────────
export const MAIN_RISK = {
  farmId: 'post-office',
  disease: 'Powdery mildew',
  percent: 68,
  reasons: [
    'Humidity stayed above 75% for 9 hours overnight',
    'Leaf temperature 24–27 °C, ideal for spores',
    'Weak airflow along the back row',
  ],
};

export const OTHER_RISKS = [
  { label: 'Root rot', value: 'Low · 12%', tone: 'success' as const },
  { label: 'Aphids', value: 'Watch · 34%', tone: 'accent' as const },
];

export type AdvisorTip = {
  id: string;
  farmId: string;
  title: string;
  why: string;
  action: string;
  kind: 'fans' | 'map';
};

export const TIPS: AdvisorTip[] = [
  {
    id: 'fans',
    farmId: 'post-office',
    title: 'Run the fans 20 minutes every hour tonight',
    why: 'Moving air keeps humidity under 75% and dries the leaves. The controller keeps doing this even if the network drops.',
    action: 'Apply to fans',
    kind: 'fans',
  },
  {
    id: 'row3',
    farmId: 'classroom-2',
    title: 'Pick row 3 first this morning',
    why: 'Five pods there pass 10 cm by tomorrow and will be too tough to sell fresh.',
    action: 'Show on map',
    kind: 'map',
  },
];

// ── Alerts ─────────────────────────────────────────────────────────
export const ALERT_CATEGORIES = [
  { id: 'harvest', name: 'Harvest ready', desc: 'Every morning at 05:45 with the day’s pod count', on: true },
  { id: 'risk', name: 'Disease risk', desc: 'When risk rises, before symptoms appear', on: true },
  {
    id: 'device',
    name: 'Equipment & network',
    desc: 'Link drops, pump or fan faults, sensor gaps',
    on: true,
  },
  { id: 'buyer', name: 'Buyer orders', desc: 'New matches, confirmations and pickups', on: false },
];

export type AlertTone = 'accent' | 'danger' | 'success';
export const ALERT_EVENTS: { time: string; tone: AlertTone; title: string; detail: string }[] = [
  {
    time: '06:02 AM',
    tone: 'accent',
    title: 'House 4 lost its LoRa link',
    detail: 'Running on its own controller. Lights, pump and fans are on schedule.',
  },
  {
    time: '05:45 AM',
    tone: 'accent',
    title: `${TOTAL_PODS_TODAY} pods ready to pick`,
    detail: 'Harvest maps are ready for all 4 farms.',
  },
  {
    time: '05:10 AM',
    tone: 'danger',
    title: 'Mildew risk rising at the Post Office',
    detail: 'The advisor suggests running the fans tonight.',
  },
  {
    time: 'Yesterday',
    tone: 'success',
    title: 'Soba Kotobuki confirmed 8 kg',
    detail: 'Pickup Sunday 12:00 from Hinode School.',
  },
];

export const LAST_SCAN = '05:40 AM';
export const TODAY_LABEL = 'Saturday, 26 September';
