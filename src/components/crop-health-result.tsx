import { CircleCheck, CircleHelp, TriangleAlert, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Card, Meter } from '@/components/ui/surface';
import { Txt } from '@/components/ui/text';
import { Colors } from '@/constants/theme';
import { LEAF_DISEASES } from '@/data/leafDiseases';
import type { CropHealthResult } from '@/services/cropHealthAI';
import { detectedDiseases, toPercent } from '@/services/cropHealthLabels';

const STATUS: Record<
  CropHealthResult['visual_status'],
  { title: string; badge: string; tone: BadgeTone; icon: LucideIcon; meter: string; advice: string }
> = {
  healthy: {
    title: 'Healthy',
    badge: 'No signs found',
    tone: 'success',
    icon: CircleCheck,
    meter: Colors.success,
    advice: 'No disease signs were found on this leaf. Keep checking the plant as it grows.',
  },
  disease_detected: {
    title: 'Possible Disease Detected',
    badge: 'Check plant',
    tone: 'danger',
    icon: TriangleAlert,
    meter: Colors.danger,
    advice: 'Look over this plant and its neighbours, and separate affected leaves if the signs match.',
  },
  uncertain: {
    title: 'Uncertain',
    badge: 'Retake photo',
    tone: 'accent',
    icon: CircleHelp,
    meter: Colors.accent,
    advice: 'The photo wasn’t clear enough to judge. Retake it in daylight with one leaf filling the frame.',
  },
};

/** Visual screening outcome, laid out like the Disease tab's risk card. */
export function CropHealthResultCard({ result }: { result: CropHealthResult }) {
  const s = STATUS[result.visual_status] ?? STATUS.uncertain;
  const confidence = toPercent(result.confidence);
  const threshold = toPercent(result.confidence_threshold);
  const [disease, ...others] = result.visual_status === 'disease_detected' ? detectedDiseases(result) : [];
  const info = disease ? LEAF_DISEASES[disease] : undefined;

  return (
    <Card style={styles.result}>
      <View style={styles.head}>
        <View style={{ gap: 4, flexShrink: 1 }}>
          <Txt variant="micro" color={Colors.textSecondary}>
            Visual Screening Result
          </Txt>
          <Txt variant="title">{s.title}</Txt>
        </View>
        <Badge label={s.badge} tone={s.tone} icon={s.icon} />
      </View>

      {result.visual_status === 'disease_detected' ? (
        <View style={{ gap: 2 }}>
          <Txt variant="micro" color={Colors.textSecondary}>
            Possible disease
          </Txt>
          <Txt variant="heading" color={Colors.dangerFg}>
            {disease ?? 'Unidentified leaf disease'}
          </Txt>
          {others.length > 0 ? (
            <Txt variant="small" color={Colors.textSecondary}>
              Also seen: {others.join(', ')}
            </Txt>
          ) : null}
        </View>
      ) : null}

      <View style={{ gap: 6 }}>
        <View style={styles.meterLabels}>
          <Txt variant="small" weight={700}>
            Confidence
          </Txt>
          <Txt variant="small" weight={700} tabular>
            {confidence}%
          </Txt>
        </View>
        <Meter value={confidence} color={s.meter} />
        {result.visual_status === 'uncertain' ? (
          <Txt variant="caption" color={Colors.textSecondary}>
            Below the {threshold}% needed for a clear result.
          </Txt>
        ) : null}
      </View>

      {info ? (
        <>
          <View style={styles.section}>
            <Txt variant="micro" color={Colors.textSecondary}>
              Why it happens
            </Txt>
            <Txt variant="body" color={Colors.textBody}>
              {info.why}
            </Txt>
          </View>
          <View style={styles.section}>
            <Txt variant="micro" color={Colors.textSecondary}>
              What to do
            </Txt>
            {info.actions.map((a) => (
              <View key={a} style={styles.step}>
                <View style={styles.bullet} />
                <Txt variant="body" color={Colors.textBody} style={{ flex: 1 }}>
                  {a}
                </Txt>
              </View>
            ))}
          </View>
        </>
      ) : (
        <Txt variant="body" color={Colors.textBody}>
          {s.advice}
        </Txt>
      )}
      <Txt variant="small" color={Colors.textSecondary}>
        This is a visual screening from one photo, not a diagnosis. Confirm by checking the plant, or ask
        an agricultural advisor.
      </Txt>
    </Card>
  );
}

const styles = StyleSheet.create({
  result: { padding: 18, gap: 14 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  meterLabels: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  section: { gap: 6, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.borderSubtle },
  step: { flexDirection: 'row', gap: 8 },
  bullet: { width: 6, height: 6, marginTop: 7, borderRadius: 3, backgroundColor: Colors.accent },
});
