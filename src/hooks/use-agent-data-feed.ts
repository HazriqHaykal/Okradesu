/**
 * The data each advisor agent reads, straight from the farm database (no AI),
 * so the Advisor tab always shows real numbers with where they came from.
 */
import { useEffect, useState } from 'react';

import { FARMS } from '@/data/farms';
import { useMarketForecast } from '@/hooks/use-market-forecast';
import { supabase } from '@/lib/supabase';
import { availableKg, supplyByDay } from '@/lib/forecast';
import { useMarket } from '@/state/market-store';

/** Same rule as the app and the agents: silent for 5 minutes = offline. */
const OFFLINE_AFTER_MS = 5 * 60 * 1000;
const REFRESH_MS = 30 * 1000;

type SensorRow = { farm_id: string; humidity: number; soil_moisture: number; recorded_at: string };

const clock = (iso: string) => new Date(iso).toTimeString().slice(0, 5);

function useLatestSensors() {
  const [rows, setRows] = useState<SensorRow[] | null>(null);
  const [error, setError] = useState(false);
  /** When the rows were read; "reporting" is judged against this. */
  const [checkedAt, setCheckedAt] = useState(0);

  useEffect(() => {
    if (!supabase) return;
    const db = supabase;
    let alive = true;
    const load = async () => {
      const since = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
      const { data, error: e } = await db
        .from('sensor_readings')
        .select('farm_id, humidity, soil_moisture, recorded_at')
        .gte('recorded_at', since)
        .order('recorded_at', { ascending: false })
        .limit(300);
      if (!alive) return;
      setError(!!e);
      setCheckedAt(Date.now());
      if (data) setRows(data as SensorRow[]);
    };
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  // Latest reading per farm.
  const latest = new Map<string, SensorRow>();
  for (const r of rows ?? []) if (!latest.has(r.farm_id)) latest.set(r.farm_id, r);
  return { latest, loaded: rows !== null, error, checkedAt };
}

export type FeedLine = { value: string; source: string };

export function useAgentDataFeed() {
  const sensors = useLatestSensors();
  const market = useMarket((s) => s);
  const { forecasts, histories, today } = useMarketForecast();

  // Monitor: who is reporting, and when.
  const reporting = [...sensors.latest.values()].filter(
    (r) => sensors.checkedAt - Date.parse(r.recorded_at) < OFFLINE_AFTER_MS,
  );
  const newest = [...sensors.latest.values()][0];
  const monitor: FeedLine = !sensors.loaded
    ? { value: 'Reading sensors…', source: 'Live sensors' }
    : {
        value: `${reporting.length} of ${FARMS.length} farms reporting`,
        source: newest ? `Live sensors · ${clock(newest.recorded_at)}` : 'Live sensors · no readings in 2 h',
      };

  // Crop health: the most humid indoor room (mildew needs humidity above 75%).
  const indoor = FARMS.filter((f) => f.kind === 'indoor')
    .map((f) => ({ farm: f, r: sensors.latest.get(f.id) }))
    .filter((x) => x.r);
  const humid = indoor.sort((a, b) => b.r!.humidity - a.r!.humidity)[0];
  const health: FeedLine = humid
    ? {
        value: `${humid.farm.name} ${Math.round(humid.r!.humidity)}% humidity${humid.r!.humidity > 75 ? ' · mildew risk' : ''}${humid.farm.risk ? ` · ${humid.farm.risk}` : ''}`,
        source: `Live sensors · ${clock(humid.r!.recorded_at)}`,
      }
    : { value: sensors.loaded ? 'No indoor readings yet' : 'Reading sensors…', source: 'Live sensors' };

  // Harvest: today's camera counts.
  const todayCounts = FARMS.map((f) => histories[f.id]?.find((h) => h.date === today)).filter(Boolean);
  const ready = todayCounts.reduce((n, h) => n + (h?.ready ?? 0), 0);
  const must = todayCounts.reduce((n, h) => n + (h?.overdue ?? 0), 0);
  const lastScan = market.detections.reduce((m, d) => (d.recorded_at > m ? d.recorded_at : m), '');
  const harvest: FeedLine =
    market.status !== 'ready'
      ? { value: 'Reading camera counts…', source: 'Camera counts' }
      : todayCounts.length
        ? { value: `${ready} pods ready · ${must} must pick today`, source: `Camera counts · ${clock(lastScan)}` }
        : { value: 'No camera counts for today yet', source: 'Camera counts' };

  // Market: this week's surplus and what's on offer.
  const surplus = supplyByDay(forecasts, market.listings, market.reservations).reduce((n, d) => n + d.surplusKg, 0);
  const open = market.listings.filter(
    (l) => l.status === 'open' && l.harvest_date >= today && availableKg(l, market.reservations) > 0,
  ).length;
  const pending = market.reservations.filter((r) => r.status === 'pending').length;
  const marketLine: FeedLine =
    market.status !== 'ready'
      ? { value: 'Reading the market…', source: 'Market forecast' }
      : {
          value: `${surplus.toFixed(1)} kg surplus this week · ${open} open listings${pending ? ` · ${pending} to confirm` : ''}`,
          source: 'Market forecast · 7 days',
        };

  return { monitor, health, harvest, market: marketLine, sensorsError: sensors.error };
}
