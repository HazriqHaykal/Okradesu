/**
 * Rule-based disease risk from farm sensor readings. This flags conditions that
 * favour disease; it does not diagnose one. Target bands match the farm sensor
 * notes in src/data/farms.ts (humidity 60–75%, soil moisture 35–45%, air 24–30 °C).
 */
import type { FarmReadings } from '@/services/farmSensors';

export type RiskLevel = 'low' | 'moderate' | 'high';

export type RiskAssessment = {
  level: RiskLevel;
  title: string;
  reasons: string[];
  action: string;
};

const LEVELS: RiskLevel[] = ['low', 'moderate', 'high'];

export function assessDiseaseRisk(r: FarmReadings): RiskAssessment {
  const humidity = Math.round(r.humidityPct);
  const soil = Math.round(r.soilMoisturePct);
  const temp = Math.round(r.temperatureC * 10) / 10;
  const reasons: string[] = [];
  const actions: string[] = [];

  // Leaf fungi and mildew: humid air, worse when it is also warm.
  let fungal = 0;
  if (humidity >= 85) fungal = 2;
  else if (humidity > 75) fungal = 1;
  const warm = r.temperatureC >= 20 && r.temperatureC <= 32;
  if (fungal > 0) {
    reasons.push(`Humidity ${humidity}%, above the 60–75% target`);
    if (warm) reasons.push(`${temp} °C is warm enough for leaf fungi and mildew to spread`);
    else fungal = Math.min(fungal, 1);
    actions.push('improve airflow (run the fans) and keep leaves dry');
  }

  // Waterlogged soil: root problems.
  let wet = 0;
  if (soil > 60) wet = 2;
  else if (soil > 45) wet = 1;
  if (wet > 0) {
    reasons.push(`Soil moisture ${soil}%, above the 35–45% target`);
    actions.push('hold off watering until the soil dries back to 35–45%');
  }

  // Heat stress weakens plants.
  const heat = r.temperatureC > 35 ? 1 : 0;
  if (heat > 0) {
    reasons.push(`${temp} °C is above the 24–30 °C target`);
    actions.push('ventilate or shade to bring the temperature down');
  }

  const level = LEVELS[Math.max(fungal, wet, heat)];
  if (level === 'low') {
    return {
      level,
      title: 'Low disease risk',
      reasons: ['Temperature, humidity and soil moisture are within target'],
      action: 'Keep monitoring. No action needed right now.',
    };
  }

  const title =
    fungal === 2
      ? 'High fungal disease risk'
      : wet === 2
        ? 'High root disease risk'
        : fungal > 0
          ? 'Moderate fungal disease risk'
          : 'Moderate disease risk';
  const steps = [`inspect ${r.zone ?? 'the plants'} for leaf spots, mildew or wilting`, ...actions];
  const action = steps.map((step) => `${step[0].toUpperCase()}${step.slice(1)}.`).join(' ');
  return { level, title, reasons, action };
}
