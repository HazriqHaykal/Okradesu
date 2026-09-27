/**
 * Live feed for one farm: latest reading, a 24 h history and device
 * commands. With Supabase configured it follows `sensor_readings` and
 * `commands` (written by person A's gateway, or scripts/mock-gateway.mjs
 * until the hardware is ready). Without it, readings are simulated here.
 * The screens only use what these hooks return, so both look the same.
 */
import { useEffect, useRef, useState } from 'react';

import { supabase, uniqueChannel } from '@/lib/supabase';

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

function useSimLiveFarm(farm: MonitorFarm, controls: Controls = NEUTRAL) {
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
    /** True when the gateway has never sent this farm a reading. */
    neverSeen: false,
    hour: new Date(now).getHours(),
  };
}

// ── Gateway feed (Supabase) ────────────────────────────────────────
type ReadingRow = {
  soil_moisture: number;
  ph: number;
  ec: number;
  temp: number;
  humidity: number;
  light: number;
};

/** Handoff format (soil_moisture, temp, …) → the app's metric keys. */
const toReading = (r: ReadingRow): Reading => ({
  moisture: Number(r.soil_moisture),
  ph: Number(r.ph),
  ec: Number(r.ec),
  air: Number(r.temp),
  humidity: Number(r.humidity),
  light: Number(r.light),
});

const HOUR_MS = 3600000;

function useGatewayLiveFarm(farm: MonitorFarm, _controls?: Controls) {
  const [now, setNow] = useState(() => Date.now());
  const [mountedAt] = useState(() => Date.now());
  const [loaded, setLoaded] = useState(false);
  const [latest, setLatest] = useState<HistoryPoint | null>(null);
  const [hourly, setHourly] = useState<HistoryPoint[]>([]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const db = supabase!;
    let alive = true;
    const point = (r: ReadingRow & { recorded_at: string }): HistoryPoint => ({
      at: Date.parse(r.recorded_at),
      reading: toReading(r),
    });

    Promise.all([
      db.from('sensor_readings').select('*').eq('farm_id', farm.id).order('recorded_at', { ascending: false }).limit(1),
      db.from('sensor_readings_hourly').select('*').eq('farm_id', farm.id).order('hour'),
    ]).then(([last, hours]) => {
      if (!alive) return;
      if (last.data?.[0]) setLatest(point(last.data[0]));
      setHourly((hours.data ?? []).map((h) => ({ at: Date.parse(h.hour), reading: toReading(h) })));
      setLoaded(true);
    });

    const channel = db
      .channel(uniqueChannel(`readings-${farm.id}`))
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sensor_readings', filter: `farm_id=eq.${farm.id}` },
        (payload) => setLatest(point(payload.new as ReadingRow & { recorded_at: string })),
      )
      .subscribe();
    return () => {
      alive = false;
      db.removeChannel(channel);
    };
  }, [farm.id]);

  const reading = latest?.reading ?? farm.base;
  const updatedAt = latest?.at ?? mountedAt;

  // 24 hourly points plus the latest reading; hours the gateway missed repeat the last known value.
  const hourKey = Math.floor(updatedAt / HOUR_MS);
  const history: HistoryPoint[] = [];
  let carry = hourly[0]?.reading ?? reading;
  for (let i = 0; i < 24; i++) {
    const at = (hourKey - 24 + i + 1) * HOUR_MS;
    const found = hourly.find((h) => Math.floor(h.at / HOUR_MS) === Math.floor(at / HOUR_MS));
    if (found) carry = found.reading;
    history.push({ at, reading: carry });
  }
  history.push({ at: updatedAt, reading });

  const secondsAgo = Math.max(0, Math.round((now - updatedAt) / 1000));
  const neverSeen = loaded && !latest;
  return {
    reading,
    history,
    updatedAt,
    secondsAgo,
    offline: neverSeen || secondsAgo > OFFLINE_AFTER_MIN * 60,
    neverSeen,
    hour: new Date(now).getHours(),
  };
}

export const useLiveFarm = supabase ? useGatewayLiveFarm : useSimLiveFarm;

// ── Commands ───────────────────────────────────────────────────────
export type CommandState = 'sending' | 'queued' | 'done' | null;

export type DeviceState = { auto: boolean; on: boolean; level: number };

function useSimDeviceControl(farm: MonitorFarm) {
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

// ── Commands through Supabase ─────────────────────────────────────
/** No confirmation from the gateway by then: the command waits there as queued. */
const ACK_TIMEOUT_MS = 10000;

function useGatewayDeviceControl(farm: MonitorFarm) {
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
  /** Commands waiting for the gateway, by id. */
  const pending = useRef(new Map<number, { device: DeviceKey; patch: Partial<DeviceState> }>());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const later = (ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  };

  useEffect(() => {
    const db = supabase!;
    const list = timers.current;
    const channel = db
      .channel(uniqueChannel(`commands-${farm.id}`))
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'commands', filter: `farm_id=eq.${farm.id}` },
        (payload) => {
          const row = payload.new as { id: number; status: string };
          const cmd = pending.current.get(row.id);
          if (!cmd || row.status !== 'done') return;
          pending.current.delete(row.id);
          setDevices((d) => ({ ...d, [cmd.device]: { ...d[cmd.device], ...cmd.patch } }));
          setCommand((c) => ({ ...c, [cmd.device]: 'done' }));
          if (cmd.device === 'pump' && cmd.patch.on) {
            setWateredAt(Date.now());
            list.push(setTimeout(() => setDevices((d) => ({ ...d, pump: { ...d.pump, on: false } })), WATER_MS));
          }
          list.push(
            setTimeout(() => setCommand((c) => (c[cmd.device] === 'done' ? { ...c, [cmd.device]: null } : c)), 2500),
          );
        },
      )
      .subscribe();
    return () => {
      db.removeChannel(channel);
      list.forEach(clearTimeout);
    };
  }, [farm.id]);

  /** Inserts a command for the gateway; the device changes once the gateway confirms it. */
  async function send(device: DeviceKey, patch: Partial<DeviceState>) {
    setCommand((c) => ({ ...c, [device]: 'sending' }));
    const next = { ...devices[device], ...patch };
    const { data, error } = await supabase!
      .from('commands')
      .insert({ farm_id: farm.id, device, on: next.on, level: next.level })
      .select('id')
      .single();
    if (error || !data) {
      setCommand((c) => ({ ...c, [device]: 'queued' }));
      return;
    }
    pending.current.set(data.id, { device, patch });
    later(ACK_TIMEOUT_MS, () => {
      if (pending.current.has(data.id)) setCommand((c) => ({ ...c, [device]: 'queued' }));
    });
  }

  const waterNow = () => send('pump', { on: true });

  const setAuto = (device: DeviceKey, auto: boolean) =>
    setDevices((d) => ({ ...d, [device]: { ...d[device], auto } }));

  return { devices, command, wateredAt, send, waterNow, setAuto, online };
}

export const useDeviceControl = supabase ? useGatewayDeviceControl : useSimDeviceControl;
