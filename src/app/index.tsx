import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ScanEye, Sprout } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OkraPod, RowSnapshot } from '@/components/illustrations';
import { HeroBackground } from '@/components/screen';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Txt } from '@/components/ui/text';
import { Colors, Palette, Radius, Shadow } from '@/constants/theme';
import { DETECTIONS } from '@/data/detections';

/** An indoor row with a good mix of must-pick, ready and flowering pods. */
const SAMPLE_ROW = DETECTIONS.gymnasium[2];

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const enter = () => router.replace('/home');

  return (
    <View style={styles.root}>
      <HeroBackground />
      <View style={[styles.inner, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }]}>
        <View
          style={styles.collage}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants">
          {/* The app's okra slice, as on the icon. */}
          <View style={[styles.tile, styles.slice]}>
            <Image
              source={require('@/assets/images/splash-icon.png')}
              style={{ width: 150, height: 150 }}
              contentFit="contain"
            />
          </View>

          {/* Fresh pods, ready to pick. */}
          <View style={[styles.tile, styles.card, styles.pods]}>
            <View style={{ transform: [{ rotate: '-8deg' }] }}>
              <OkraPod width={112} />
            </View>
            <View style={{ transform: [{ rotate: '6deg' }], marginLeft: 18 }}>
              <OkraPod width={96} tone="small" />
            </View>
            <Badge label="Ready to pick" tone="solid" icon={Sprout} />
          </View>

          {/* What the row camera sees: every pod found and sorted. */}
          <View style={[styles.tile, styles.card, styles.camera]}>
            <RowSnapshot det={SAMPLE_ROW} kind="indoor" seed={3} width={222} height={150} />
            <View style={styles.cameraTag}>
              <ScanEye size={12} color={Colors.surfaceCard} strokeWidth={2.5} />
              <Txt variant="micro" color={Colors.surfaceCard}>
                Camera · {SAMPLE_ROW.ready} ready
              </Txt>
            </View>
          </View>
        </View>

        <View style={styles.copy}>
          <Txt variant="displayXl" align="center">
            Every okra connected. Every harvest sold.
          </Txt>
          <Txt variant="body" color={Colors.textSecondary} align="center" style={styles.lede}>
            Leave the daily watching to us. We&apos;ll tell you which pods to pick, warn you before disease
            sets in, and line up buyers ahead of time.
          </Txt>
          <View style={styles.actions}>
            <Button label="Get started" block onPress={enter} />
            <Button label="Log in with LINE" variant="secondary" block onPress={enter} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgApp },
  inner: { flex: 1, width: '100%', maxWidth: 440, alignSelf: 'center', paddingHorizontal: 32 },
  collage: { flex: 1, minHeight: 280, maxHeight: 380, position: 'relative' },
  tile: { position: 'absolute' },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.xl,
    boxShadow: Shadow.float,
    overflow: 'hidden',
  },
  slice: {
    left: 0,
    top: 12,
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: Palette.leaf200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pods: {
    right: 0,
    top: 40,
    width: 150,
    padding: 14,
    gap: 8,
    alignItems: 'flex-start',
    transform: [{ rotate: '3deg' }],
  },
  camera: { left: 56, top: 196, width: 222, height: 150, transform: [{ rotate: '-2deg' }] },
  cameraTag: {
    position: 'absolute',
    left: 10,
    top: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    height: 22,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(27, 33, 28, 0.72)',
  },
  copy: { alignItems: 'center', gap: 14 },
  lede: { maxWidth: 300 },
  actions: { alignSelf: 'stretch', gap: 10, marginTop: 12 },
});
