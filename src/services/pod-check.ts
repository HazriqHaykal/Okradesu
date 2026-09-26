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

/**
 * Stand-in until the model is live. Predictable on stage: the first check is
 * always a ready 7.5 cm pod, then it cycles through the other outcomes.
 */
const DEMO_LENGTHS = [7.5, 8.3, 6.2, 12.8];
let demoIndex = 0;

async function simulate(_seed: string): Promise<PodCheckResult> {
  await new Promise((r) => setTimeout(r, 900));
  const lengthCm = DEMO_LENGTHS[demoIndex++ % DEMO_LENGTHS.length];
  return {
    lengthCm,
    confidence: 0.94,
    box: { x: 0.18, y: 0.34, w: 0.64, h: 0.3 },
    reference: 'coin',
    ...gradePod(lengthCm),
    simulated: true,
  };
}
