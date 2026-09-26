/**
 * Phone photo check: send a pod photo to the pod-check model and get its
 * length and grade back.
 *
 * Set EXPO_PUBLIC_POD_CHECK_URL to person B's endpoint (the same YOLO weights
 * as the Pi, plus a ¥100-coin / ruler-card detector for scale). It receives
 * `{ image: <base64 jpeg>, farmId?, row? }` and returns
 * `{ lengthCm, confidence, box: { x, y, w, h } (0–1), reference: "coin" | "card" | "none" }`.
 * Without it, a simulated result is returned and flagged as such.
 */
import { gradePod, type Grade, type Maturity } from '@/data/harvest';

export type PodBox = { x: number; y: number; w: number; h: number };

export type PodCheckResult = {
  lengthCm: number;
  confidence: number;
  box: PodBox;
  reference: 'coin' | 'card' | 'none';
  maturity: Maturity;
  grade: Grade;
  simulated: boolean;
};

const ENDPOINT = process.env.EXPO_PUBLIC_POD_CHECK_URL;

export async function checkPod(input: { base64?: string; seed: string; farmId?: string; row?: number }) {
  if (ENDPOINT && input.base64) {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: input.base64, farmId: input.farmId, row: input.row }),
    });
    if (!res.ok) throw new Error(`Pod check failed (${res.status})`);
    const data = (await res.json()) as Omit<PodCheckResult, 'maturity' | 'grade' | 'simulated'>;
    return { ...data, ...gradePod(data.lengthCm), simulated: false } satisfies PodCheckResult;
  }
  return simulate(input.seed);
}

/** Deterministic stand-in so the flow can be demoed before the model exists. */
async function simulate(seed: string): Promise<PodCheckResult> {
  await new Promise((r) => setTimeout(r, 900));
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const lengthCm = Math.round((5.5 + (h % 80) / 10) * 10) / 10; // 5.5–13.4 cm
  const confidence = 0.82 + ((h >> 8) % 15) / 100;
  return {
    lengthCm,
    confidence,
    box: { x: 0.18, y: 0.34, w: 0.64, h: 0.3 },
    reference: 'coin',
    ...gradePod(lengthCm),
    simulated: true,
  };
}
