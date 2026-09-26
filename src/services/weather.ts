/**
 * Forecast for the outdoor fields from Open-Meteo (free, no API key).
 * https://open-meteo.com/en/docs
 *
 * Falls back to a sample forecast when the phone is offline, so the Farm
 * Monitor still renders; `source` says which one is on screen.
 */
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
  type LucideIcon,
} from 'lucide-react-native';

export const WEATHER_AREA = { name: 'Hinode', latitude: 35.742, longitude: 139.257, timezone: 'Asia/Tokyo' };

/** Rain that makes the outdoor pumps skip a day. */
const SKIP_PROB = 70;
const SKIP_MM = 5;
/** Rain that raises a landslide / flood warning. */
export const HEAVY_MM = 50;

export type WeatherDay = {
  date: string;
  day: string;
  icon: LucideIcon;
  label: string;
  hi: number;
  lo: number;
  rain: number;
  mm: number;
};

export type Weather = {
  area: string;
  now: { temp: number; label: string; icon: LucideIcon };
  days: WeatherDay[];
  /** True when rain today or tomorrow will water the fields anyway. */
  skipWatering: boolean;
  advice: string;
  /** The first day with heavy rain, if any. */
  heavyRain: WeatherDay | null;
  source: 'live' | 'sample';
  fetchedAt: number | null;
};

/** WMO weather codes, grouped the way a farmer reads them. */
export function describe(code: number): { label: string; icon: LucideIcon } {
  if (code === 0) return { label: 'Clear', icon: Sun };
  if (code <= 2) return { label: 'Partly cloudy', icon: CloudSun };
  if (code === 3) return { label: 'Overcast', icon: Cloud };
  if (code === 45 || code === 48) return { label: 'Fog', icon: CloudFog };
  if (code >= 51 && code <= 57) return { label: 'Drizzle', icon: CloudDrizzle };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return { label: code >= 80 ? 'Showers' : 'Rain', icon: CloudRain };
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { label: 'Snow', icon: CloudSnow };
  if (code >= 95) return { label: 'Thunderstorm', icon: CloudLightning };
  return { label: 'Cloudy', icon: Cloud };
}

function dayLabel(date: string, i: number) {
  if (i === 0) return 'Today';
  // Noon avoids the date slipping a day in other time zones.
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' });
}

/** Turns a raw forecast into the watering decision and the line shown under the card. */
function decide(days: WeatherDay[]) {
  const [today, tomorrow] = days;
  const heavyRain = days.find((d) => d.mm >= HEAVY_MM) ?? null;
  const wetToday = !!today && today.mm >= SKIP_MM;
  const wetTomorrow = !!tomorrow && (tomorrow.rain >= SKIP_PROB || tomorrow.mm >= SKIP_MM);
  let advice: string;
  if (heavyRain) {
    advice = `Heavy rain ${heavyRain.day === 'Today' ? 'today' : `on ${heavyRain.day}`}: ${Math.round(heavyRain.mm)} mm. Pumps skip watering; keep off slopes.`;
  } else if (wetToday) {
    advice = `Raining today (${today.mm.toFixed(1)} mm), so the outdoor pumps skip watering.`;
  } else if (wetTomorrow) {
    advice = `Rain likely tomorrow (${tomorrow.rain}%), so the outdoor pumps skip watering today.`;
  } else {
    advice = 'No rain due, so the outdoor pumps water as normal.';
  }
  return { heavyRain, skipWatering: !!heavyRain || wetToday || wetTomorrow, advice };
}

type OpenMeteo = {
  current: { temperature_2m: number; weather_code: number };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: (number | null)[];
    precipitation_sum: (number | null)[];
  };
};

export async function fetchWeather(signal?: AbortSignal): Promise<Weather> {
  const a = WEATHER_AREA;
  const params = new URLSearchParams({
    latitude: String(a.latitude),
    longitude: String(a.longitude),
    current: 'temperature_2m,weather_code',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum',
    timezone: a.timezone,
    forecast_days: '3',
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal });
  if (!res.ok) throw new Error(`Open-Meteo responded ${res.status}`);
  const json = (await res.json()) as OpenMeteo;
  const d = json.daily;
  const days: WeatherDay[] = d.time.map((date, i) => ({
    date,
    day: dayLabel(date, i),
    ...describe(d.weather_code[i]),
    hi: Math.round(d.temperature_2m_max[i]),
    lo: Math.round(d.temperature_2m_min[i]),
    rain: d.precipitation_probability_max[i] ?? 0,
    mm: d.precipitation_sum[i] ?? 0,
  }));
  const now = describe(json.current.weather_code);
  return {
    area: a.name,
    now: { temp: Math.round(json.current.temperature_2m), ...now },
    days,
    ...decide(days),
    source: 'live',
    fetchedAt: Date.now(),
  };
}

/** Demo mode: heavy rain tomorrow, whatever the real forecast says. */
export function withHeavyRain(w: Weather): Weather {
  const days = w.days.map((d, i) => (i === 1 ? { ...d, ...describe(65), rain: 95, mm: 72 } : d));
  return { ...w, days, ...decide(days) };
}

const SAMPLE_DAYS: WeatherDay[] = [
  { date: '', day: 'Today', ...describe(2), hi: 31, lo: 22, rain: 10, mm: 0 },
  { date: '', day: 'Sun', ...describe(63), hi: 26, lo: 21, rain: 90, mm: 72 },
  { date: '', day: 'Mon', ...describe(53), hi: 25, lo: 20, rain: 40, mm: 6 },
];

/** Shown before the first fetch and whenever the network is unavailable. */
export const SAMPLE_WEATHER: Weather = {
  area: WEATHER_AREA.name,
  now: { temp: 29, ...describe(2) },
  days: SAMPLE_DAYS,
  ...decide(SAMPLE_DAYS),
  source: 'sample',
  fetchedAt: null,
};
