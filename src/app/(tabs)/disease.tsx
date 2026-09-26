import { Bell, TriangleAlert } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { CropScanner } from '@/components/crop-scanner';
import { Screen } from '@/components/screen';
import { Badge } from '@/components/ui/badge';
import { IconButton } from '@/components/ui/button';
import { ScreenTitle, SectionHeader } from '@/components/ui/section-header';
import { Card, Meter } from '@/components/ui/surface';
import { Txt } from '@/components/ui/text';
import { Colors, Radius, Shadow } from '@/constants/theme';
import { MAIN_RISK, OTHER_RISKS, getFarm } from '@/data/farms';

export default function DiseaseScreen() {
  const riskFarm = getFarm(MAIN_RISK.farmId);
  return (
    <Screen>
      <ScreenTitle
        kicker="Leaf camera · disease risk"
        title="Disease"
        right={<IconButton icon={Bell} label="Alerts, 2 new" href="/alerts" dot />}
      />

      <CropScanner />

      <SectionHeader title="Disease Risk" />
      <Card style={styles.risk}>
        <View style={styles.riskHead}>
          <View style={{ gap: 4, flexShrink: 1 }}>
            <Txt variant="micro" color={Colors.textSecondary}>
              {riskFarm.building} · {riskFarm.name}
            </Txt>
            <Txt variant="title">{MAIN_RISK.disease}</Txt>
          </View>
          <Badge label="Rising" tone="danger" icon={TriangleAlert} />
        </View>
        <View style={{ gap: 6 }}>
          <View style={styles.meterLabels}>
            <Txt variant="small" weight={700} color={Colors.dangerFg}>
              High risk · {MAIN_RISK.percent}%
            </Txt>
            <Txt variant="small" weight={600} color={Colors.textSecondary}>
              before symptoms show
            </Txt>
          </View>
          <Meter value={MAIN_RISK.percent} color={Colors.danger} />
        </View>
        <View style={{ gap: 4 }}>
          {MAIN_RISK.reasons.map((r) => (
            <View key={r} style={styles.reason}>
              <View style={styles.bullet} />
              <Txt variant="body" color={Colors.textBody} style={{ flex: 1 }}>
                {r}
              </Txt>
            </View>
          ))}
        </View>
        <Txt variant="small" color={Colors.textSecondary}>
          White spots usually appear 3–5 days after conditions like these.
        </Txt>
      </Card>

      <View style={styles.smallRow}>
        {OTHER_RISKS.map((r) => (
          <View key={r.label} style={styles.small}>
            <Txt variant="micro" color={Colors.textSecondary}>
              {r.label}
            </Txt>
            <Badge label={r.value} tone={r.tone} />
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  risk: { padding: 18, gap: 14 },
  riskHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  meterLabels: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  reason: { flexDirection: 'row', gap: 8 },
  bullet: { width: 6, height: 6, marginTop: 7, borderRadius: 3, backgroundColor: Colors.danger },
  smallRow: { flexDirection: 'row', gap: 10 },
  small: {
    flex: 1,
    padding: 12,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceCard,
    boxShadow: Shadow.tile,
    gap: 6,
  },
});
