/**
 * Sample Edge AI results, shaped like the B → C `detections` table and the
 * B → A LoRa result message (one row per message). Replace with Supabase reads.
 *
 * `ready` counts every pod at picking size; `overdue` is the part of `ready`
 * that will be overgrown by tomorrow, so it must be picked today.
 */
export type DetectionRow = {
  row: number;
  flowers: number;
  ready: number;
  small: number;
  overgrown: number;
  overdue: number;
};

type Tuple = [row: number, flowers: number, ready: number, small: number, overgrown: number, overdue: number];

const rows = (list: Tuple[]): DetectionRow[] =>
  list.map(([row, flowers, ready, small, overgrown, overdue]) => ({
    row,
    flowers,
    ready,
    small,
    overgrown,
    overdue,
  }));

export const DETECTIONS: Record<string, DetectionRow[]> = {
  'field-a': rows([
    [1, 4, 6, 5, 0, 1],
    [2, 3, 9, 4, 1, 3],
    [3, 5, 4, 6, 0, 0],
    [4, 2, 7, 3, 2, 2],
    [5, 6, 3, 7, 0, 0],
    [6, 3, 5, 4, 0, 1],
  ]),
  'field-b': rows([
    [1, 2, 4, 3, 0, 0],
    [2, 4, 6, 2, 1, 2],
    [3, 3, 2, 5, 0, 0],
    [4, 5, 5, 4, 0, 1],
    [5, 1, 3, 2, 3, 1],
  ]),
  'classroom-2': rows([
    [1, 2, 4, 3, 0, 1],
    [2, 3, 3, 4, 0, 0],
    [3, 2, 5, 2, 0, 2],
    [4, 2, 2, 3, 0, 0],
  ]),
  gymnasium: rows([
    [1, 3, 5, 4, 0, 1],
    [2, 4, 4, 5, 0, 0],
    [3, 2, 6, 3, 1, 2],
    [4, 3, 3, 4, 0, 0],
    [5, 3, 5, 2, 0, 1],
    [6, 2, 3, 3, 0, 0],
  ]),
  'house-4': rows([
    [1, 2, 3, 2, 0, 0],
    [2, 2, 4, 3, 0, 1],
    [3, 2, 2, 2, 0, 0],
  ]),
  'post-office': rows([
    [1, 1, 2, 2, 0, 0],
    [2, 1, 3, 1, 1, 1],
    [3, 1, 2, 3, 0, 0],
    [4, 1, 2, 2, 0, 1],
  ]),
};

export const detectionTotals = (farmId: string) =>
  (DETECTIONS[farmId] ?? []).reduce(
    (t, r) => ({
      flowers: t.flowers + r.flowers,
      ready: t.ready + r.ready,
      small: t.small + r.small,
      overgrown: t.overgrown + r.overgrown,
      overdue: t.overdue + r.overdue,
    }),
    { flowers: 0, ready: 0, small: 0, overgrown: 0, overdue: 0 },
  );
