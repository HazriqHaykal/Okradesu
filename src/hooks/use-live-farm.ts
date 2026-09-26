/**
 * Simulated live feed for one farm: a new reading every 5 s, a 24 h history,
 * and device commands that travel "over LoRa". Swap the internals for a
 * Supabase realtime subscription (sensor_readings / commands) when the
 * gateway is ready; the screens only use what these hooks return.
 */
import { useEffect, useRef, useState } from 'react';

import {
  LIGHT_SCHEDULE,
  METRICS,
  OFFLINE_AFTER_MIN,
  type DeviceKey,
  type MetricKey,
  type MonitorFarm,
  type Reading,
} from '@/data/monitor';

const READING_EVERY_MS = 5000;
const SEND_MS = 1200;
const WATER_MS = 20000;

export type Controls = {
  ledOn: boolean;
  brightness: number;
  fanOn: boolean;
  /** Epoch ms of the last watering, if any. */
  wateredAt: number | null;
};

const NEUTRAL: Controls = { ledOn: true, brightness: 100, fanOn: false, wateredAt: null };

export const lightsScheduledOn = (hour: number) =>
  hour >= LIGHT_SCHEDULE.onFrom || hour < LIGHT_SCHEDULE.onTo;

const NOISE: Record<MetricKey, number> = {
  moisture: 0.8,
  ph: 0.06,
  ec: 0.05,
  air: 0.4,
  humidity: 1.2,
  light: 10,
};

function rand(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** One reading at a moment in time; daily curves for temperature, humidity and sunlight. */
export function sample(farm: MonitorFarm, at: Date, seed: number, c: Controls = NEUTRAL): Reading {
  const hour = at.getHours() + at.getMinutes() / 60;
  const outdoor = farm.type === 'outdoor';
  const day = Math.sin((2 * Math.PI * (hour - 9)) / 24);
  const b = farm.base;
  const jitter = (key: MetricKey, i: number) =>
    (rand(seed * 7 + i + farm.id.length) - 0.5) * NOISE[key] * (outdoor && key === 'light' ? 4 : 1);

  const sun = Math.max(0, Math.sin((Math.PI * (hour - 5)) / 14));
  const light = outdoor ? b.light * sun : c.ledOn ? (b.light * c.brightness) / 100 : 0;

  const sinceWater = c.wateredAt ? (at.getTime() - c.wateredAt) / 60000 : Infinity;
  const watered = sinceWater >= 0 && sinceWater < 30 ? 9 * (1 - sinceWater / 30) : 0;

  const r: Reading = {
    moisture: b.moisture + watered + jitter('moisture', 1),
    ph: b.ph + jitter('ph', 2),
    ec: b.ec + jitter('ec', 3),
    air: b.air + (outdoor ? 3 : 1) * day + jitter('air', 4),
    humidity: b.humidity - (outdoor ? 8 : 3) * day - (c.fanOn ? 7 : 0) + jitter('humidity', 5),
    light: light > 0 ? Math.max(0, light + jitter('light', 6)) : 0,
  };
  for (const m of METRICS) r[m.key] = Math.min(m.scale[1], Math.max(m.scale[0], r[m.key]));
  return r;
}

export type HistoryPoint = { at: number; reading: Reading };

export function useLiveFarm(farm: MonitorFarm, controls: Controls = NEUTRAL) {
  const [now, setNow] = useState(() => Date.now());
  const [mountedAt] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const online = farm.status === 'online';
  const tick = Math.floor(now / READING_EVERY_MS);
  // An offline farm shows the last reading the gateway received.
  const updatedAt = online ? tick * READING_EVERY_MS : mountedAt - farm.silentFor * 60000;
  const reading = sample(farm, new Date(updatedAt), online ? tick : 0, controls);

  const hourKey = Math.floor(updatedAt / 3600000);
  const history: HistoryPoint[] = Array.from({ length: 24 }, (_, i) => {
    const at = (hourKey - 24 + i + 1) * 3600000;
    return { at, reading: sample(farm, new Date(at), hourKey - 24 + i, NEUTRAL) };
  });
  history.push({ at: updatedAt, reading });

  const secondsAgo = Math.max(0, Math.round((now - updatedAt) / 1000));
  return {
    reading,
    history,
    updatedAt,
    secondsAgo,
    offline: secondsAgo > OFFLINE_AFTER_MIN * 60,
    hour: new Date(now).getHours(),
  };
}

// ── Commands ───────────────────────────────────────────────────────
export type CommandState = 'sending' | 'queued' | 'done' | null;

export type DeviceState = { auto: boolean; on: boolean; level: number };

export function useDeviceControl(farm: MonitorFarm) {
  const online = farm.status === 'online';
  const [devices, setDevices] = useState<Record<DeviceKey, DeviceState>>({
    pump: { auto: true, on: false, level: 100 },
    led: { auto: true, on: true, level: 100 },
    fan: { auto: true, on: false, level: 100 },
  });
  const [command, setCommand] = useState<Record<DeviceKey, CommandState>>({
    pump: null,
    led: null,
    fan: null,
  });
  const [wateredAt, setWateredAt] = useState<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, []);

  const later = (ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  };

  /** Sends a command down through the gateway; the device state changes once the node confirms. */
  function send(device: DeviceKey, patch: Partial<DeviceState>) {
    if (!online) {
      setCommand((c) => ({ ...c, [device]: 'queued' }));
      return;
    }
    setCommand((c) => ({ ...c, [device]: 'sending' }));
    later(SEND_MS, () => {
      setDevices((d) => ({ ...d, [device]: { ...d[device], ...patch } }));
      setCommand((c) => ({ ...c, [device]: 'done' }));
      later(2500, () => setCommand((c) => (c[device] === 'done' ? { ...c, [device]: null } : c)));
    });
  }

  function waterNow() {
    send('pump', { on: true });
    if (!online) return;
    later(SEND_MS, () => setWateredAt(Date.now()));
    later(SEND_MS + WATER_MS, () => setDevices((d) => ({ ...d, pump: { ...d.pump, on: false } })));
  }

  const setAuto = (device: DeviceKey, auto: boolean) =>
    setDevices((d) => ({ ...d, [device]: { ...d[device], auto } }));

  return { devices, command, wateredAt, send, waterNow, setAuto, online };
}
