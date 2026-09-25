import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeroBackground } from '@/components/screen';
import { Button } from '@/components/ui/button';
import { RenderPlaceholder } from '@/components/ui/render-placeholder';
import { Txt } from '@/components/ui/text';
import { Colors } from '@/constants/theme';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const enter = () => router.replace('/home');

  return (
    <View style={styles.root}>
      <HeroBackground />
      <View style={[styles.inner, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.collage}>
          <RenderPlaceholder
            label="Okra basket"
            height={160}
            radius={999}
            style={[styles.tile, { left: 0, top: 16, width: 180 }]}
          />
          <RenderPlaceholder
            label="Okra pods"
            height={124}
            style={[styles.tile, { right: 0, top: 44, width: 150 }]}
          />
          <RenderPlaceholder
            label="School-room farm"
            height={160}
            style={[styles.tile, { left: 64, top: 194, width: 222 }]}
          />
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
  copy: { alignItems: 'center', gap: 14 },
  lede: { maxWidth: 300 },
  actions: { alignSelf: 'stretch', gap: 10, marginTop: 12 },
});
