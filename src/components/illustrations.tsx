/**
 * Flat SVG illustrations for Smart Harvest: okra pods, okra flowers and a
 * "what the camera saw" row snapshot drawn from a detection. They stand in
 * for real camera frames until the Pi uploads snapshots.
 */
import { useId, useMemo } from 'react';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { Colors, Fonts, Palette } from '@/constants/theme';
import type { DetectionRow } from '@/data/detections';
import type { FarmKind } from '@/data/farms';

export type PodTone = 'fresh' | 'small' | 'overgrown';

const POD = {
  fresh: { body: '#5E8C31', ridge: '#3F6B22', cap: '#2F5419' },
  small: { body: '#7FAF45', ridge: '#5E8C31', cap: '#3F6B22' },
  overgrown: { body: '#8A8F3C', ridge: '#646A26', cap: '#4B4F1C' },
} as const;

/** Pod drawn in a 100×30 box pointing right; callers transform it. */
function PodPaths({ tone }: { tone: PodTone }) {
  const c = POD[tone];
  return (
    <>
      <Path d="M12 5 C40 3 75 8 98 15 C75 22 40 27 12 25 Z" fill={c.body} />
      <Path d="M14 11 C45 10 75 12 94 15" stroke={c.ridge} strokeWidth={1.4} fill="none" />
      <Path d="M14 19 C45 20 75 18 94 15" stroke={c.ridge} strokeWidth={1.4} fill="none" />
      <Path d="M20 8 C45 7 70 10 86 13" stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={1.6} fill="none" />
      <Path d="M3 15 L15 4 L12 15 L15 26 Z" fill={c.cap} />
      <Rect x={0} y={13} width={6} height={4} rx={1} fill={c.cap} />
    </>
  );
}

export function OkraPod({ width = 120, tone = 'fresh' }: { width?: number; tone?: PodTone }) {
  return (
    <Svg width={width} height={(width * 30) / 100} viewBox="0 0 100 30">
      <PodPaths tone={tone} />
    </Svg>
  );
}

function FlowerPaths() {
  return (
    <>
      {[0, 72, 144, 216, 288].map((a) => (
        <Ellipse key={a} cx={20} cy={10} rx={7} ry={10} fill="#F4E7A1" transform={`rotate(${a} 20 20)`} />
      ))}
      <Circle cx={20} cy={20} r={6} fill="#7A1F3D" />
      <Circle cx={20} cy={20} r={2.5} fill="#E9C46A" />
    </>
  );
}

export function OkraFlower({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <FlowerPaths />
    </Svg>
  );
}

// ── Row snapshot ───────────────────────────────────────────────────
type ItemKind = 'must' | 'ready' | 'small' | 'overgrown' | 'flower';

export const DETECTION_STYLE: Record<ItemKind, { color: string; label: string }> = {
  must: { color: Colors.danger, label: 'Must pick' },
  ready: { color: Colors.accent, label: 'Ready' },
  small: { color: Palette.ink300, label: 'Too small' },
  overgrown: { color: Palette.orange800, label: 'Overgrown' },
  flower: { color: Colors.success, label: 'Flower' },
};

const POD_LEN: Record<Exclude<ItemKind, 'flower'>, number> = {
  must: 30,
  ready: 26,
  small: 16,
  overgrown: 38,
};

function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Illustrated camera frame of one row with the Edge AI's boxes on it:
 * red = must pick today, orange = ready, grey = too small, brown = overgrown,
 * green = new flower.
 */
export function RowSnapshot({
  det,
  kind,
  seed,
  width,
  height,
  labels = false,
}: {
  det: DetectionRow;
  kind: FarmKind;
  seed: number;
  width: number;
  height: number;
  labels?: boolean;
}) {
  const gid = `sky-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const stems = width < 160 ? 3 : 5;
  const soilY = height * 0.86;

  const items = useMemo(() => {
    const list: ItemKind[] = [
      ...Array<ItemKind>(det.overdue).fill('must'),
      ...Array<ItemKind>(det.ready - det.overdue).fill('ready'),
      ...Array<ItemKind>(det.overgrown).fill('overgrown'),
      ...Array<ItemKind>(det.small).fill('small'),
      ...Array<ItemKind>(det.flowers).fill('flower'),
    ];
    // Compact thumbnails show a sample so boxes stay readable.
    const shown = width < 160 ? list.filter((_, i) => i % 2 === 0).slice(0, 9) : list;
    const rand = rng(seed * 97 + det.row * 13);
    const perStem = Math.max(1, Math.ceil(shown.length / stems));
    const scale = width < 160 ? 0.62 : 1;
    const order = shown.map((k, i) => ({ k, r: rand(), i })).sort((a, b) => a.r - b.r);
    return order.map(({ k }, i) => {
      const stem = i % stems;
      const slot = Math.floor(i / stems);
      const x = ((stem + 0.5) / stems) * width + (rand() - 0.5) * (width / stems) * 0.35;
      const y = height * 0.12 + ((slot + 0.5) / perStem) * (soilY - height * 0.2);
      return { k, x, y, scale };
    });
  }, [det, seed, stems, width, height, soilY]);

  const outdoor = kind === 'outdoor';
  // The window can report 0 width on the first web render.
  if (width <= 0 || height <= 0) return null;
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <LinearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={outdoor ? '#D8E9F3' : '#FFF4E6'} />
          <Stop offset="1" stopColor={outdoor ? '#F3EEDD' : '#F3E3CF'} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill={`url(#${gid})`} />
      {!outdoor
        ? [0.2, 0.5, 0.8].map((f) => (
            <Rect
              key={f}
              x={width * f - 22}
              y={4}
              width={44}
              height={5}
              rx={2.5}
              fill="#FFFFFF"
              opacity={0.9}
            />
          ))
        : null}
      <Rect x={0} y={soilY} width={width} height={height - soilY} fill={outdoor ? '#8B6A4A' : '#6E5238'} />

      {Array.from({ length: stems }, (_, s) => {
        const x = ((s + 0.5) / stems) * width;
        return (
          <G key={s}>
            <Line
              x1={x}
              y1={soilY}
              x2={x}
              y2={height * 0.06}
              stroke="#4F7A2A"
              strokeWidth={width < 160 ? 2 : 3}
            />
            {[0.25, 0.45, 0.65].map((f, j) => (
              <Ellipse
                key={j}
                cx={x + (j % 2 ? 1 : -1) * (width / stems) * 0.18}
                cy={height * f}
                rx={(width / stems) * 0.2}
                ry={height * 0.05}
                fill="#7DAA4A"
                opacity={0.85}
                transform={`rotate(${j % 2 ? -25 : 25} ${x} ${height * f})`}
              />
            ))}
          </G>
        );
      })}

      {items.map(({ k, x, y, scale }, i) => {
        const style = DETECTION_STYLE[k];
        if (k === 'flower') {
          const size = 18 * scale;
          return (
            <G key={i}>
              <G transform={`translate(${x - size / 2} ${y - size / 2}) scale(${size / 40})`}>
                <FlowerPaths />
              </G>
              <Rect
                x={x - size / 2 - 3}
                y={y - size / 2 - 3}
                width={size + 6}
                height={size + 6}
                rx={3}
                stroke={style.color}
                strokeWidth={1.5}
                fill="none"
              />
            </G>
          );
        }
        const len = POD_LEN[k] * scale;
        const tone: PodTone = k === 'small' ? 'small' : k === 'overgrown' ? 'overgrown' : 'fresh';
        const bw = len * 0.52;
        const bh = len * 1.08;
        return (
          <G key={i}>
            <G transform={`translate(${x} ${y}) rotate(-80) scale(${len / 100}) translate(-50 -15)`}>
              <PodPaths tone={tone} />
            </G>
            <Rect
              x={x - bw / 2}
              y={y - bh / 2}
              width={bw}
              height={bh}
              rx={3}
              stroke={style.color}
              strokeWidth={k === 'must' ? 2.2 : 1.5}
              fill="none"
            />
            {labels && k !== 'small' ? (
              <G>
                <Rect
                  x={x - bw / 2}
                  y={y - bh / 2 - 11}
                  width={k === 'overgrown' ? 44 : 34}
                  height={11}
                  rx={2}
                  fill={style.color}
                />
                <SvgText
                  x={x - bw / 2 + 3}
                  y={y - bh / 2 - 2.5}
                  fontSize={8}
                  fontFamily={Fonts.bold}
                  fill={k === 'ready' ? Palette.ink900 : '#FFFFFF'}>
                  {k === 'must' ? 'must' : k === 'ready' ? 'ready' : 'overgr.'}
                </SvgText>
              </G>
            ) : null}
          </G>
        );
      })}
    </Svg>
  );
}
