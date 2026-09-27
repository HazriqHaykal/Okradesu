import { Image } from 'expo-image';
import { Aperture, Check, LoaderCircle, ScanEye, WifiOff } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { Button } from '@/components/ui/button';
import { Txt } from '@/components/ui/text';
import { Colors, Fonts, Palette, Radius, Shadow } from '@/constants/theme';
import { cameraFrame, type Detection, type DetectionKind, type MonitorFarm } from '@/data/monitor';

const W = 160;
const H = 100;

const KIND: Record<DetectionKind, { stroke: string; tag: string; ink: string; label: string; dash?: string }> = {
  ready: { stroke: Colors.accent, tag: Colors.accent, ink: Colors.textOnAccent, label: 'Ready' },
  small: { stroke: Palette.white, tag: Palette.white, ink: Colors.textPrimary, label: 'Too small', dash: '2 1.5' },
  overgrown: { stroke: Colors.danger, tag: Colors.danger, ink: Palette.white, label: 'Overgrown' },
  flower: { stroke: '#F4D35E', tag: '#F4D35E', ink: Colors.textPrimary, label: 'Flower' },
};

type Snap = 'idle' | 'sending' | 'thinking' | 'queued' | 'done';

const clock = (t: number) => new Date(t).toTimeString().slice(0, 5);

/**
 * Latest camera snapshot with the edge-AI detections drawn on it. The Pi runs
 * YOLO on the farm and only the counts travel over LoRa; the annotated image is
 * uploaded when there is Wi-Fi. Pass `imageUrl` once real snapshots exist.
 */
export function CameraCard({
  farm,
  extraReady = 0,
  online,
  imageUrl,
}: {
  farm: MonitorFarm;
  extraReady?: number;
  online: boolean;
  imageUrl?: string;
}) {
  const [takenAt, setTakenAt] = useState(() => {
    const d = new Date();
    d.setHours(10, 0, 0, 0);
    return d.getTime() > Date.now() ? d.getTime() - 86400000 : d.getTime();
  });
  const [snap, setSnap] = useState<Snap>('idle');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, []);

  const detections = cameraFrame(farm, extraReady);
  const count = (k: DetectionKind) => detections.filter((d) => d.kind === k).length;

  function takeSnapshot() {
    if (!online) {
      setSnap('queued');
      return;
    }
    setSnap('sending');
    const later = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));
    later(1000, () => setSnap('thinking'));
    later(3000, () => {
      setTakenAt(Date.now());
      setSnap('done');
    });
    later(5500, () => setSnap((s) => (s === 'done' ? 'idle' : s)));
  }

  const busy = snap === 'sending' || snap === 'thinking';
  const status: Record<Exclude<Snap, 'idle'>, { icon: typeof Check; text: string; fg: string }> = {
    sending: { icon: LoaderCircle, text: 'Asking the camera over LoRa…', fg: Colors.textAccent },
    thinking: { icon: ScanEye, text: 'Running YOLO on the Pi…', fg: Colors.textAccent },
    queued: { icon: WifiOff, text: 'Queued, the camera will shoot when the link is back', fg: Colors.warnFg },
    done: { icon: Check, text: `New snapshot · ${count('ready')} ready pods in view`, fg: Colors.successFg },
  };
  const st = snap === 'idle' ? null : status[snap];
  const StIcon = st?.icon;

  return (
    <View style={styles.wrap}>
      <View
        style={styles.frame}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`Camera snapshot of ${farm.name} at ${clock(takenAt)}: ${count('ready')} ready pods, ${count('small')} too small, ${count('overgrown')} overgrown, ${count('flower')} flowers.`}>
        {imageUrl ? (
          <Image source={imageUrl} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <Scene />
        )}
        <Svg style={StyleSheet.absoluteFill} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          {detections.map((d, i) => (
            <Box key={i} d={d} />
          ))}
        </Svg>
        <View style={[styles.chip, { left: 10 }]}>
          <View style={[styles.rec, { backgroundColor: online ? Colors.danger : Palette.ink300 }]} />
          <Txt variant="micro" color={Palette.white}>
            {online ? 'Edge AI' : 'Last frame'}
          </Txt>
        </View>
        <View style={[styles.chip, { right: 10 }]}>
          <Txt variant="micro" color={Palette.white} tabular>
            {farm.name} · {clock(takenAt)}
          </Txt>
        </View>
      </View>

      <View style={styles.counts}>
        <Count kind="ready" n={count('ready')} />
        <Count kind="small" n={count('small')} />
        <Count kind="overgrown" n={count('overgrown')} />
        <Count kind="flower" n={count('flower')} />
      </View>

      <View style={styles.footer}>
        <Txt variant="caption" color={Colors.textSecondary} style={{ flex: 1 }}>
          Farm-wide {farm.podsReady} ready · {farm.newFlowers} new flowers. Only counts go over LoRa (about 40 bytes);
          photos upload over Wi-Fi.
        </Txt>
        <Button
          label="Snap now"
          icon={Aperture}
          size="sm"
          variant="surface"
          disabled={busy}
          onPress={takeSnapshot}
        />
      </View>
      {st && StIcon ? (
        <View accessibilityLiveRegion="polite" style={styles.status}>
          <StIcon size={13} color={st.fg} strokeWidth={2.5} />
          <Txt variant="caption" weight={700} color={st.fg}>
            {st.text}
          </Txt>
        </View>
      ) : null}
    </View>
  );
}

function Box({ d }: { d: Detection }) {
  const k = KIND[d.kind];
  const x = (d.x / 100) * W;
  const y = (d.y / 100) * H;
  const w = (d.w / 100) * W;
  const h = (d.h / 100) * H;
  const text = d.kind === 'flower' ? 'flower' : `${d.cm} cm`;
  const tagW = text.length * 2.3 + 3;
  const tagY = y - 5.5 < 0 ? y + h : y - 5.5;
  return (
    <G>
      {d.kind === 'flower' ? (
        <G>
          <Circle cx={x + w / 2} cy={y + h / 2} r={Math.min(w, h) / 2.4} fill="#F7E27B" />
          <Circle cx={x + w / 2} cy={y + h / 2} r={Math.min(w, h) / 7} fill="#7A2941" />
        </G>
      ) : (
        <Ellipse
          cx={x + w / 2}
          cy={y + h / 2}
          rx={w / 2.8}
          ry={h / 2.15}
          fill={d.kind === 'overgrown' ? '#7C8A3E' : '#4F8A32'}
          stroke="#2F5A1E"
          strokeWidth={0.4}
        />
      )}
      <Rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill="none"
        stroke={k.stroke}
        strokeWidth={0.9}
        strokeDasharray={k.dash}
        rx={1}
      />
      <Rect x={x} y={tagY} width={tagW} height={5.5} fill={k.tag} rx={1} />
      <SvgText x={x + 1.5} y={tagY + 4.1} fontSize={3.6} fontFamily={Fonts.bold} fill={k.ink}>
        {text}
      </SvgText>
    </G>
  );
}

/** Stand-in for the camera photo: a row of okra plants under daylight. */
function Scene() {
  const stems = [14, 34, 54, 74, 94, 114, 134, 150];
  return (
    <Svg style={StyleSheet.absoluteFill} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#E8EFD6" />
          <Stop offset="0.75" stopColor="#9BB375" />
          <Stop offset="1" stopColor="#8A6A45" />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={W} height={H} fill="url(#sky)" />
      {stems.map((sx, i) => (
        <G key={sx}>
          <Path d={`M${sx} ${H} C ${sx - 2} 70, ${sx + 3} 40, ${sx} 4`} stroke="#3F6B2A" strokeWidth={1.4} fill="none" />
          {[18, 40, 62].map((ly, j) => (
            <Ellipse
              key={ly}
              cx={sx + ((i + j) % 2 ? 7 : -7)}
              cy={ly + (i % 3) * 3}
              rx={8}
              ry={3.4}
              fill={(i + j) % 2 ? '#6E9A48' : '#5C8A3C'}
              opacity={0.85}
              transform={`rotate(${(i + j) % 2 ? -18 : 18} ${sx} ${ly})`}
            />
          ))}
        </G>
      ))}
    </Svg>
  );
}

function Count({ kind, n }: { kind: DetectionKind; n: number }) {
  const k = KIND[kind];
  return (
    <View style={styles.count}>
      <View
        style={[
          styles.swatch,
          { borderColor: kind === 'small' ? Palette.ink300 : k.stroke },
          kind === 'small' && { borderStyle: 'dashed' },
        ]}
      />
      <Txt variant="caption" weight={600} color={Colors.textBody}>
        {k.label}
      </Txt>
      <Txt variant="small" weight={800} tabular>
        {n}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  frame: {
    aspectRatio: W / H,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceTint,
    boxShadow: Shadow.float,
  },
  chip: {
    position: 'absolute',
    top: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 24,
    paddingHorizontal: 9,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(30, 26, 22, 0.6)',
  },
  rec: { width: 7, height: 7, borderRadius: 4 },
  counts: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  count: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  swatch: { width: 12, height: 12, borderRadius: 3, borderWidth: 2 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
