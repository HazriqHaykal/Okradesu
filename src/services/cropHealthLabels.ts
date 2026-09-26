/**
 * Turns the model's raw dataset class names (e.g. "Class 2- Downy Mildew")
 * into the names shown in the app. Raw class names never reach the UI.
 */
import type { CropHealthResult } from '@/services/cropHealthAI';

const DISPLAY_NAMES: Record<string, string> = {
  'cercospora leaf spot': 'Cercospora Leaf Spot',
  'downy mildew': 'Downy Mildew',
  healthy: 'Healthy',
  'leaf curly virus': 'Leaf Curly Virus',
};

const stripClassPrefix = (raw: string) =>
  raw
    .replace(/^\s*class\s*\d+\s*-\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

/** Known name for a model label, or null if the model returned something unexpected. */
export function knownLabel(raw: string): string | null {
  return DISPLAY_NAMES[stripClassPrefix(raw).toLowerCase()] ?? null;
}

export function displayLabel(raw: string): string {
  return knownLabel(raw) ?? titleCase(stripClassPrefix(raw));
}

/** Accepts 0–1 or 0–100 and returns a whole percentage. */
export function toPercent(value: number): number {
  const pct = value <= 1 ? value * 100 : value;
  return Math.round(Math.min(100, Math.max(0, pct)));
}

/** Diseases seen in the photo, most confident first, without duplicates or "Healthy". */
export function detectedDiseases(result: CropHealthResult): string[] {
  const names = [...(result.detections ?? [])]
    .sort((a, b) => b.confidence - a.confidence)
    .map((d) => displayLabel(d.class_name))
    .filter((name) => name !== 'Healthy');
  if (names.length === 0 && result.visual_result) {
    const fromResult = knownLabel(result.visual_result);
    if (fromResult && fromResult !== 'Healthy') names.push(fromResult);
  }
  return [...new Set(names)];
}
