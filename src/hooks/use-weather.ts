import { useEffect, useState } from 'react';

import { useDemo } from '@/data/demo';
import { SAMPLE_WEATHER, fetchWeather, withHeavyRain, type Weather } from '@/services/weather';

const REFRESH_MS = 30 * 60 * 1000;
const TIMEOUT_MS = 8000;

// Shared across screens so Home and each farm page don't fetch separately.
let cache: Weather | null = null;
let inflight: Promise<Weather> | null = null;

function load(): Promise<Weather> {
  if (cache?.fetchedAt && Date.now() - cache.fetchedAt < REFRESH_MS) return Promise.resolve(cache);
  if (!inflight) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    inflight = fetchWeather(ctrl.signal)
      .then((w) => (cache = w))
      .catch(() => cache ?? SAMPLE_WEATHER)
      .finally(() => {
        clearTimeout(timer);
        inflight = null;
      });
  }
  return inflight;
}

/** Live forecast for the outdoor fields, refreshed every 30 minutes. */
export function useWeather() {
  const [weather, setWeather] = useState<Weather>(cache ?? SAMPLE_WEATHER);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    let alive = true;
    const refresh = () =>
      load().then((w) => {
        if (!alive) return;
        setWeather(w);
        setLoading(false);
      });
    refresh();
    const t = setInterval(refresh, REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const demo = useDemo();
  return { weather: demo.heavyRain ? withHeavyRain(weather) : weather, loading };
}
