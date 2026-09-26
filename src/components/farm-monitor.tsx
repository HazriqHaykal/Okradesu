import { Image } from 'expo-image';
import { useIsFocused } from 'expo-router';
import {
  CloudDrizzle,
  Droplet,
  Smartphone,
  Thermometer,
  TriangleAlert,
  VideoOff,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { CameraViewport, ViewportCover, ViewportMessage, viewportStyles } from '@/components/camera-viewport';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/surface';
import { Txt } from '@/components/ui/text';
import { Colors, Radius } from '@/constants/theme';
import { assessDiseaseRisk, type RiskLevel } from '@/services/diseaseRisk';
import { ESP32_FRAME_INTERVAL_MS, esp32FrameUrl, isEsp32Configured } from '@/services/esp32Camera';
import {
  FARM_SENSORS_INTERVAL_MS,
  fetchFarmReadings,
  isFarmSensorsConfigured,
  type FarmReadings,
} from '@/services/farmSensors';

const RISK: Record<RiskLevel, { label: string; tone: BadgeTone; dot: string }> = {
  low: { label: 'Low', tone: 'success', dot: Colors.success },
  moderate: { label: 'Moderate', tone: 'accent', dot: Colors.accent },
  high: { label: 'High', tone: 'danger', dot: Colors.danger },
};

const timeLabel = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/**
 * Farm Monitor: the farm's ESP32-CAM field view plus its environmental sensors,
 * turned into a disease-risk indicator. It flags conditions; it doesn't diagnose.
 */
export function FarmMonitor({ header, onUsePhone }: { header: ReactNode; onUsePhone: () => void }) {
  const focused = useIsFocused();

  const cameraConnected = isEsp32Configured();
  const [frameUrl, setFrameUrl] = useState(esp32FrameUrl);
  const [cameraFailed, setCameraFailed] = useState(false);

  const sensorsConnected = isFarmSensorsConfigured();
  const [readings, setReadings] = useState<FarmReadings | null>(null);
  const [sensorsFailed, setSensorsFailed] = useState(false);

  // The board serves single JPEG frames; pull a new one on an interval while the tab is open.
  useEffect(() => {
    if (!cameraConnected || !focused) return;
    const timer = setInterval(() => setFrameUrl(esp32FrameUrl()), ESP32_FRAME_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [cameraConnected, focused]);

  useEffect(() => {
    if (!sensorsConnected || !focused) return;
    let cancelled = false;
    const load = async () => {
      try {
        const next = await fetchFarmReadings();
        if (cancelled) return;
        setReadings(next);
        setSensorsFailed(false);
      } catch {
        if (!cancelled) setSensorsFailed(true);
      }
    };
    load();
    const timer = setInterval(load, FARM_SENSORS_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [sensorsConnected, focused]);

  const usePhone = (
    <Button label="Use phone camera" size="sm" icon={Smartphone} style={viewportStyles.centered} onPress={onUsePhone} />
  );

  const risk = readings ? assessDiseaseRisk(readings) : null;
  const sensorBadge: { label: string; tone: BadgeTone } = !sensorsConnected
    ? { label: 'Not connected', tone: 'neutral' }
    : sensorsFailed
      ? { label: 'Offline', tone: 'danger' }
      : readings
        ? { label: `Updated ${timeLabel(readings.receivedAt)}`, tone: 'success' }
        : { label: 'Connecting', tone: 'neutral' };

  return (
    <Card style={styles.card}>
      {header}

      <CameraViewport
        aspectRatio={4 / 3}
        badge={cameraConnected && !cameraFailed ? { label: 'ESP32-CAM · Live', tone: 'success' } : null}>
        {cameraConnected ? (
          <>
            {frameUrl && focused ? (
              <Image
                source={{ uri: frameUrl }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={0}
                accessibilityLabel="ESP32-CAM live field view"
                onLoad={() => setCameraFailed(false)}
                onError={() => setCameraFailed(true)}
              />
            ) : null}
            {cameraFailed ? (
              <ViewportCover>
                <ViewportMessage
                  icon={VideoOff}
                  title="Can’t reach the ESP32-CAM"
                  body="Check the farm camera is powered and on the same network."
                  action={usePhone}
                />
              </ViewportCover>
            ) : null}
          </>
        ) : (
          <ViewportMessage
            icon={VideoOff}
            title="ESP32-CAM not connected yet"
            body="Connect the farm camera to monitor crop conditions and disease risk."
            action={usePhone}
          />
        )}
      </CameraViewport>

      <View style={styles.sectionHead}>
        <Txt variant="micro" color={Colors.textSecondary}>
          Farm sensors
        </Txt>
        <Badge label={sensorBadge.label} tone={sensorBadge.tone} />
      </View>
      <View style={styles.readings}>
        <Reading
          icon={Thermometer}
          label="Temperature"
          value={readings ? readings.temperatureC.toFixed(1) : null}
          unit="°C"
          warn={!!readings && readings.temperatureC > 35}
        />
        <Reading
          icon={CloudDrizzle}
          label="Humidity"
          value={readings ? `${Math.round(readings.humidityPct)}` : null}
          unit="%"
          warn={!!readings && readings.humidityPct > 75}
        />
        <Reading
          icon={Droplet}
          label="Soil moisture"
          value={readings ? `${Math.round(readings.soilMoisturePct)}` : null}
          unit="%"
          warn={!!readings && readings.soilMoisturePct > 45}
        />
      </View>

      <View style={styles.risk}>
        <View style={styles.sectionHead}>
          <Txt variant="micro" color={Colors.textSecondary}>
            Disease risk
          </Txt>
          {risk ? (
            <Badge
              label={RISK[risk.level].label}
              tone={RISK[risk.level].tone}
              icon={risk.level === 'low' ? undefined : TriangleAlert}
            />
          ) : null}
        </View>

        {risk ? (
          <>
            <Txt variant="heading">{risk.title}</Txt>
            <View style={{ gap: 4 }}>
              {risk.reasons.map((reason) => (
                <View key={reason} style={styles.reason}>
                  <View style={[styles.bullet, { backgroundColor: RISK[risk.level].dot }]} />
                  <Txt variant="body" color={Colors.textBody} style={{ flex: 1 }}>
                    {reason}
                  </Txt>
                </View>
              ))}
            </View>
            <View style={{ gap: 2 }}>
              <Txt variant="micro" color={Colors.textSecondary}>
                Recommended action
              </Txt>
              <Txt variant="body" weight={600}>
                {risk.action}
              </Txt>
            </View>
            <Txt variant="caption" color={Colors.textSecondary}>
              Based on sensor conditions. A risk indicator, not a diagnosis.
            </Txt>
          </>
        ) : (
          <>
            <Txt variant="bodyLg" weight={800}>
              {sensorsConnected && sensorsFailed ? 'Can’t reach the farm sensors' : 'Waiting for sensor data'}
            </Txt>
            <Txt variant="small" color={Colors.textSecondary}>
              {sensorsConnected
                ? 'Risk appears here as soon as the first readings arrive.'
                : 'Risk is worked out from temperature, humidity and soil moisture once the farm sensors are connected.'}
            </Txt>
          </>
        )}
      </View>
    </Card>
  );
}

function Reading({
  icon: Icon,
  label,
  value,
  unit,
  warn,
}: {
  icon: LucideIcon;
  label: string;
  value: string | null;
  unit: string;
  warn: boolean;
}) {
  return (
    <View
      style={styles.reading}
      accessible
      accessibilityLabel={value === null ? `${label}: no reading yet` : `${label} ${value} ${unit}`}>
      <Icon size={16} color={warn ? Colors.textAccent : Colors.textSecondary} strokeWidth={2} />
      <Txt variant="micro" color={Colors.textSecondary} numberOfLines={2}>
        {label}
      </Txt>
      <View style={styles.readingValue}>
        <Txt variant="heading" tabular color={warn ? Colors.dangerFg : Colors.textPrimary}>
          {value ?? '--'}
        </Txt>
        <Txt variant="small" weight={600} color={Colors.textSecondary}>
          {unit}
        </Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, gap: 12 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  readings: { flexDirection: 'row', gap: 8 },
  reading: {
    flex: 1,
    minWidth: 0,
    backgroundColor: Colors.bgApp,
    borderRadius: Radius.md,
    padding: 10,
    gap: 4,
  },
  readingValue: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  risk: { backgroundColor: Colors.bgApp, borderRadius: Radius.md, padding: 14, gap: 10 },
  reason: { flexDirection: 'row', gap: 8 },
  bullet: { width: 6, height: 6, marginTop: 7, borderRadius: 3 },
});
