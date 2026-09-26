import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ImageUp, Ruler, RotateCcw, X } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OkraPod } from '@/components/illustrations';
import { MaturityBadge } from '@/components/maturity-badge';
import { HeroBackground } from '@/components/screen';
import { Button, IconButton } from '@/components/ui/button';
import { InfoStat } from '@/components/ui/section-header';
import { Card } from '@/components/ui/surface';
import { Txt } from '@/components/ui/text';
import { Colors, MaxContentWidth, Palette, Radius, Shadow } from '@/constants/theme';
import { getFarm } from '@/data/farms';
import { SIZE } from '@/data/harvest';
import { checkPod, type PodCheckResult } from '@/services/pod-check';
import { harvestActions } from '@/state/harvest-store';

type Phase = 'camera' | 'analyzing' | 'result';
type Shot = { uri?: string; sample: boolean };

/** Phone photo check: photograph a pod, get length and grade. */
export default function PodCheckScreen() {
  const params = useLocalSearchParams<{ farm?: string; row?: string }>();
  const farmId = params.farm || undefined;
  const row = params.row ? Number(params.row) : undefined;
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('camera');
  const [shot, setShot] = useState<Shot | null>(null);
  const [result, setResult] = useState<PodCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/harvest'));

  const analyze = async (next: Shot, base64?: string) => {
    setShot(next);
    setPhase('analyzing');
    setError(null);
    try {
      const r = await checkPod({ base64, seed: `${next.uri?.length ?? 0}-${Date.now()}`, farmId, row });
      setResult(r);
      harvestActions.addCheck({
        farmId,
        row,
        lengthCm: r.lengthCm,
        maturity: r.maturity,
        grade: r.grade,
        confidence: r.confidence,
        photoUri: next.uri,
        simulated: r.simulated,
      });
      setPhase('result');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The check failed. Try again.');
      setPhase('camera');
    }
  };

  const takePhoto = async () => {
    const photo = await camera.current?.takePictureAsync({ base64: true, quality: 0.6 });
    if (photo) analyze({ uri: photo.uri, sample: false }, photo.base64);
  };

  /** Use a photo already on the phone instead of taking a new one. */
  const pickPhoto = async () => {
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.6,
      base64: true,
    });
    if (picked.canceled) return;
    const asset = picked.assets[0];
    analyze({ uri: asset.uri, sample: false }, asset.base64 ?? undefined);
  };

  const reset = () => {
    setShot(null);
    setResult(null);
    setPhase('camera');
  };

  const cameraReady = permission?.granted && !cameraError;
  const where = farmId ? `${getFarm(farmId).name}${row ? ` · Row ${row}` : ''}` : 'Any farm';

  return (
    <View style={styles.root}>
      <HeroBackground />
      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 },
        ]}>
        <View style={styles.header}>
          <IconButton icon={X} label="Close photo check" onPress={close} />
          <View style={{ flex: 1, gap: 4 }}>
            <Txt variant="micro" color={Colors.textSecondary}>
              {where}
            </Txt>
            <Txt variant="displaySm" accessibilityRole="header">
              Pod check
            </Txt>
          </View>
        </View>

        <View style={styles.frame}>
          {phase === 'camera' && cameraReady ? (
            <CameraView
              ref={camera}
              style={StyleSheet.absoluteFill}
              facing="back"
              onMountError={(e) => setCameraError(e.message)}
            />
          ) : null}
          {phase === 'camera' && !cameraReady ? (
            <View style={styles.noCamera}>
              <Camera size={32} color={Colors.textAccent} strokeWidth={1.75} />
              <Txt variant="body" weight={700} align="center">
                {cameraError
                  ? 'No camera found on this device.'
                  : permission && !permission.canAskAgain
                    ? 'Camera access is off. Turn it on in Settings to check pods.'
                    : 'Allow the camera to measure pods.'}
              </Txt>
              {!cameraError && permission?.canAskAgain !== false ? (
                <Button label="Allow camera" size="md" onPress={requestPermission} />
              ) : null}
              <Button
                label="Choose from photos"
                variant="secondary"
                size="md"
                icon={ImageUp}
                onPress={pickPhoto}
              />
            </View>
          ) : null}

          {phase !== 'camera' && shot ? (
            shot.sample || !shot.uri ? (
              <View style={styles.sampleTray}>
                <OkraPod width={220} />
              </View>
            ) : (
              <Image source={{ uri: shot.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
            )
          ) : null}

          {phase === 'camera' && cameraReady ? (
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              <View style={styles.guide} />
            </View>
          ) : null}

          {phase === 'result' && result ? (
            <View
              pointerEvents="none"
              style={[
                styles.box,
                {
                  left: `${result.box.x * 100}%`,
                  top: `${result.box.y * 100}%`,
                  width: `${result.box.w * 100}%`,
                  height: `${result.box.h * 100}%`,
                  borderColor: result.maturity === 'overgrown' ? Colors.danger : Colors.accent,
                },
              ]}>
              <View
                style={[
                  styles.boxTag,
                  { backgroundColor: result.maturity === 'overgrown' ? Colors.danger : Colors.accent },
                ]}>
                <Txt
                  variant="caption"
                  weight={800}
                  color={result.maturity === 'overgrown' ? Colors.surfaceCard : Colors.textOnAccent}
                  tabular>
                  {result.lengthCm.toFixed(1)} cm
                </Txt>
              </View>
            </View>
          ) : null}

          {phase === 'analyzing' ? (
            <View style={styles.analyzing}>
              <ActivityIndicator color={Colors.surfaceCard} />
              <Txt variant="body" weight={700} color={Colors.surfaceCard}>
                Measuring the pod…
              </Txt>
            </View>
          ) : null}
        </View>

        {phase === 'camera' ? (
          <>
            <View style={styles.tip}>
              <Ruler size={18} color={Colors.textAccent} strokeWidth={2} />
              <Txt variant="small" color={Colors.textBody} style={{ flex: 1 }}>
                Lay the pod flat and fit the whole pod inside the dashed box.
              </Txt>
            </View>
            {error ? (
              <Txt variant="small" weight={700} color={Colors.dangerFg}>
                {error}
              </Txt>
            ) : null}
            <View style={styles.shutterRow}>
              <View style={styles.shutterSide}>
                <IconButton icon={ImageUp} label="Choose from photos" size={52} onPress={pickPhoto} />
                <Txt variant="caption" weight={700} color={Colors.textSecondary}>
                  Photos
                </Txt>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Take photo"
                disabled={!cameraReady}
                onPress={takePhoto}
                style={({ pressed }) => [
                  styles.shutter,
                  !cameraReady && { opacity: 0.4 },
                  pressed && { transform: [{ scale: 0.94 }] },
                ]}>
                <View style={styles.shutterInner} />
              </Pressable>
              {/* Keeps the shutter centred. */}
              <View style={styles.shutterSide} />
            </View>
            <Button
              label="Try with a sample pod"
              variant="ghost"
              size="md"
              block
              onPress={() => analyze({ sample: true })}
            />
          </>
        ) : null}

        {phase === 'result' && result ? (
          <Card style={styles.result}>
            <View style={styles.resultHead}>
              <Txt variant="displayXl" tabular>
                {result.lengthCm.toFixed(1)} cm
              </Txt>
              <MaturityBadge maturity={result.maturity} />
            </View>
            <Txt variant="body" color={Colors.textBody}>
              {result.maturity === 'ready'
                ? `Pick it now. Grade ${result.grade} pods sell fresh to restaurants.`
                : result.maturity === 'too_small'
                  ? `Leave it. It should reach ${SIZE.readyMin} cm in a day or two.`
                  : 'Too tough to sell fresh. Put it in the processor bin.'}
            </Txt>
            <View style={styles.facts}>
              <InfoStat label="Grade" value={result.grade} />
              <InfoStat label="Confidence" value={`${Math.round(result.confidence * 100)}%`} />
            </View>
            {result.simulated ? (
              <Txt variant="caption" color={Colors.textSecondary}>
                Demo result: no pod-check model is connected yet (set EXPO_PUBLIC_POD_CHECK_URL).
              </Txt>
            ) : null}
            <View style={styles.resultActions}>
              <Button label="Check another" variant="secondary" size="md" icon={RotateCcw} onPress={reset} />
              <Button label="Done" size="md" onPress={close} style={{ flexGrow: 1 }} />
            </View>
          </Card>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgApp },
  body: { paddingHorizontal: 24, gap: 16, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  frame: {
    width: '100%',
    aspectRatio: 3 / 4,
    maxHeight: 520,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: Palette.ink900,
    boxShadow: Shadow.float,
  },
  noCamera: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 24,
  },
  sampleTray: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Palette.ink100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guide: {
    position: 'absolute',
    left: '14%',
    right: '14%',
    top: '32%',
    height: '32%',
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  box: { position: 'absolute', borderWidth: 3, borderRadius: 8 },
  boxTag: {
    position: 'absolute',
    top: -26,
    left: -3,
    height: 22,
    paddingHorizontal: 8,
    borderRadius: 6,
    justifyContent: 'center',
  },
  analyzing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(30, 26, 22, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  tip: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  shutterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28 },
  shutterSide: { width: 64, alignItems: 'center', gap: 4 },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.accent,
    boxShadow: Shadow.glow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: { width: 58, height: 58, borderRadius: 29, borderWidth: 3, borderColor: Colors.surfaceCard },
  result: { padding: 18, gap: 12 },
  resultHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  facts: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  resultActions: { flexDirection: 'row', gap: 8 },
});
