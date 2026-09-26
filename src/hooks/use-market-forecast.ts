import { useMemo } from 'react';

import { FARMS } from '@/data/farms';
import { dailyCounts, forecastFarm } from '@/lib/forecast';
import { marketToday, useMarket } from '@/state/market-store';

/**
 * 7-day forecast for every farm, recomputed when new camera results arrive.
 * Mean temperature and disease risk come from the farm records (person A's
 * sensor_readings and the advisor's alerts).
 */
export function useMarketForecast() {
  const detections = useMarket((s) => s.detections);
  const today = marketToday();
  const forecasts = useMemo(
    () =>
      FARMS.map((f) =>
        forecastFarm({
          farmId: f.id,
          history: dailyCounts(detections, f.id),
          today,
          meanTempC: f.meanTempC,
          diseaseRisk: f.risk,
        }),
      ),
    [detections, today],
  );
  const histories = useMemo(
    () => Object.fromEntries(FARMS.map((f) => [f.id, dailyCounts(detections, f.id)])),
    [detections],
  );
  return { forecasts, histories, today };
}
