import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useIsFocused } from 'expo-router';
import { Camera, Images, RotateCcw, ScanSearch, TriangleAlert } from 'lucide-react-native';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';

import { CameraViewport, ViewportMessage, viewportStyles, type ViewportBadge } from '@/components/camera-viewport';
import { CropHealthResultCard } from '@/components/crop-health-result';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/surface';
import { Txt } from '@/components/ui/text';
import { Colors, Radius } from '@/constants/theme';
import { analyzeCropHealth, CropHealthError, type CropHealthResult } from '@/services/cropHealthAI';

type Capture = { uri: string; from: 'phone' | 'photos' };

const FROM_LABEL: Record<Capture['from'], string> = {
  phone: 'Phone camera',
  photos: 'From photos',
};

function describeError(e: unknown): string {
  if (!(e instanceof CropHealthError)) return 'Unable to analyze the image. Please try again.';
  switch (e.kind) {
    case 'no_image':
      return 'No photo to analyze. Retake the photo and try again.';
    case 'network':
      return 'Can’t reach the Crop Health server. Check that it’s running and that this device is on the same Wi-Fi as the computer, then try again.';
    case 'timeout':
      return 'The Crop Health server took too long to respond. Check your connection and try again.';
    case 'http':
      if (e.status === 400 || e.status === 422) {
        return 'The server couldn’t read this photo. Retake it and try again.';
      }
      return `The Crop Health server couldn’t analyze this photo (error ${e.status}). Try again in a moment.`;
    case 'invalid_response':
      return 'The Crop Health server sent an unexpected reply. Try again in a moment.';
  }
}

/**
 * Leaf Scan: photograph one leaf with the phone and screen it with the Crop
 * Health AI (FastAPI + YOLO) through analyzeCropHealth().
 */
export function LeafScan({ header, onBusyChange }: { header: ReactNode; onBusyChange: (busy: boolean) => void }) {
  const focused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const asked = useRef(false);
  const camera = useRef<CameraView>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [capture, setCapture] = useState<Capture | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<CropHealthResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Ask for the camera once when Leaf Scan opens; after that the in-box button handles it.
  useEffect(() => {
    if (asked.current || !permission || permission.granted || !permission.canAskAgain) return;
    asked.current = true;
    requestPermission();
  }, [permission, requestPermission]);

  const select = (uri: string, from: Capture['from']) => {
    setCapture({ uri, from });
    setResult(null);
    setError(null);
  };

  const retake = () => {
    setCapture(null);
    setCameraReady(false);
    setResult(null);
    setError(null);
  };

  const takePhoto = async () => {
    if (!camera.current || !cameraReady || capturing) return;
    setCapturing(true);
    try {
      const picture = await camera.current.takePictureAsync({ quality: 0.8 });
      if (!picture?.uri) throw new Error('Camera returned no image URI');
      select(picture.uri, 'phone');
    } catch (e) {
      console.warn('[LeafScan] takePictureAsync failed:', e);
      setError('Couldn’t take the photo. Try again.');
    } finally {
      setCapturing(false);
    }
  };

  const pickFromPhotos = async () => {
    try {
      const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.8 });
      if (picked.canceled) return;
      const uri = picked.assets?.[0]?.uri;
      if (uri) select(uri, 'photos');
      else setError('Couldn’t load that photo. Pick another one.');
    } catch (e) {
      console.warn('[LeafScan] launchImageLibraryAsync failed:', e);
      setError('Couldn’t open your photos. Check that Okradesu is allowed to access them.');
    }
  };

  const analyze = async () => {
    if (analyzing) return;
    if (!capture?.uri) {
      setError(describeError(new CropHealthError('no_image', 'No captured image')));
      return;
    }
    setAnalyzing(true);
    onBusyChange(true);
    setResult(null);
    setError(null);
    try {
      const res = await analyzeCropHealth(capture.uri);
      if (res.success === false) throw new CropHealthError('invalid_response', 'success: false');
      setResult(res);
    } catch (e) {
      console.warn('[LeafScan] analyze failed:', e);
      setError(describeError(e));
    } finally {
      setAnalyzing(false);
      onBusyChange(false);
    }
  };

  let view: ReactNode;
  let badge: ViewportBadge = null;

  if (capture) {
    view = (
      <Image
        source={{ uri: capture.uri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        accessibilityLabel="Captured leaf photo"
      />
    );
    badge = { label: `Captured · ${FROM_LABEL[capture.from]}`, tone: 'solid' };
  } else if (!permission) {
    view = <ActivityIndicator color={Colors.accent} />;
  } else if (!permission.granted) {
    view = (
      <ViewportMessage
        icon={Camera}
        title="Camera access needed"
        body="Allow camera access to photograph an okra leaf for screening."
        action={
          permission.canAskAgain ? (
            <Button label="Allow camera" size="sm" style={viewportStyles.centered} onPress={requestPermission} />
          ) : (
            <Button
              label="Open settings"
              size="sm"
              style={viewportStyles.centered}
              onPress={() => Linking.openSettings()}
            />
          )
        }
      />
    );
  } else {
    // Unmounted when the tab isn't focused so the camera is released.
    view = focused ? (
      <CameraView
        ref={camera}
        style={StyleSheet.absoluteFill}
        facing="back"
        onCameraReady={() => setCameraReady(true)}
        onMountError={() => setError('The phone camera couldn’t start. Close other camera apps and try again.')}
      />
    ) : null;
    badge = { label: 'Phone camera · Live', tone: 'success' };
  }

  return (
    <>
      <Card style={styles.card}>
        {header}

        <CameraViewport badge={badge}>{view}</CameraViewport>

        <View style={styles.controls}>
          {capture ? (
            <>
              <Button
                label={analyzing ? 'Analyzing…' : 'Analyze leaf'}
                icon={ScanSearch}
                block
                disabled={analyzing}
                onPress={analyze}
              />
              <Button label="Retake" icon={RotateCcw} variant="secondary" block disabled={analyzing} onPress={retake} />
            </>
          ) : (
            <>
              <Button
                label={capturing ? 'Capturing…' : 'Capture'}
                icon={Camera}
                block
                disabled={!permission?.granted || !cameraReady || capturing}
                onPress={takePhoto}
              />
              <Button label="From photos" icon={Images} variant="secondary" block onPress={pickFromPhotos} />
            </>
          )}
        </View>
      </Card>

      {analyzing ? (
        <Card style={styles.loading}>
          <ActivityIndicator color={Colors.accent} />
          <View style={{ flex: 1, gap: 2 }}>
            <Txt variant="bodyLg" weight={800}>
              Analyzing leaf…
            </Txt>
            <Txt variant="small" color={Colors.textSecondary}>
              This usually takes a few seconds.
            </Txt>
          </View>
        </Card>
      ) : null}

      {error ? (
        <View style={styles.errorBanner}>
          <TriangleAlert size={20} color={Colors.dangerFg} strokeWidth={2} />
          <Txt variant="body" color={Colors.dangerFg} style={{ flex: 1 }}>
            {error}
          </Txt>
        </View>
      ) : null}

      {result ? <CropHealthResultCard result={result} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, gap: 12 },
  controls: { gap: 10 },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.dangerBg,
  },
});
