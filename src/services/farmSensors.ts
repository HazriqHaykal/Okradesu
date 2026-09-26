/**
 * Farm sensor connection for the Disease tab's Farm Monitor (ESP32 temperature,
 * humidity and soil-moisture sensors).
 *
 * Not connected yet. While FARM_SENSORS_URL is null the monitor shows "--" and
 * "Waiting for sensor data"; no readings are made up. To connect, set it to the
 * endpoint that returns the latest readings as JSON:
 *
 *   { "temperature": <°C>, "humidity": <%>, "soil_moisture": <%>, "zone": "<optional, e.g. a row>" }
 *
 * If the firmware uses different field names, adjust parseReadings() below.
 */
export const FARM_SENSORS_URL = null as string | null;

/** How often the monitor asks for new readings while the tab is open. */
export const FARM_SENSORS_INTERVAL_MS = 10_000;

export type FarmReadings = {
  temperatureC: number;
  humidityPct: number;
  soilMoisturePct: number;
  /** Area the readings come from (e.g. "Row 3"), when the hardware reports one. */
  zone?: string;
  receivedAt: Date;
};

export const isFarmSensorsConfigured = () => FARM_SENSORS_URL !== null && FARM_SENSORS_URL.trim() !== '';

function parseReadings(json: unknown): FarmReadings {
  const data = (json ?? {}) as Record<string, unknown>;
  const num = (key: string) => {
    const value = Number(data[key]);
    if (data[key] === null || data[key] === undefined || !Number.isFinite(value)) {
      throw new Error(`Farm sensors: missing or invalid "${key}"`);
    }
    return value;
  };
  return {
    temperatureC: num('temperature'),
    humidityPct: num('humidity'),
    soilMoisturePct: num('soil_moisture'),
    zone: typeof data.zone === 'string' && data.zone.trim() ? data.zone.trim() : undefined,
    receivedAt: new Date(),
  };
}

export async function fetchFarmReadings(): Promise<FarmReadings> {
  if (!isFarmSensorsConfigured()) throw new Error('Farm sensors are not connected');
  const response = await fetch(FARM_SENSORS_URL!.trim());
  if (!response.ok) throw new Error(`Farm sensors error: ${response.status}`);
  return parseReadings(await response.json());
}
