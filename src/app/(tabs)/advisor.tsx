import { router } from 'expo-router';
import { Bell, Check, MessageCircle, Send, TriangleAlert } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Badge } from '@/components/ui/badge';
import { Button, IconButton } from '@/components/ui/button';
import { SearchField } from '@/components/ui/search-field';
import { ScreenTitle, SectionHeader } from '@/components/ui/section-header';
import { Card, Meter } from '@/components/ui/surface';
import { Txt } from '@/components/ui/text';
import { Colors, Radius, Shadow } from '@/constants/theme';
import { MAIN_RISK, OTHER_RISKS, TIPS, getFarm, type AdvisorTip } from '@/data/farms';

export default function AdvisorScreen() {
  const riskFarm = getFarm(MAIN_RISK.farmId);
  const [applied, setApplied] = useState<Record<string, boolean>>({});
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});
  const [question, setQuestion] = useState('');
  const [asked, setAsked] = useState<string[]>([]);

  const runTip = (tip: AdvisorTip) => {
    if (tip.kind === 'map') {
      if (tip.row) {
        router.navigate({
          pathname: '/harvest/[farmId]/[row]',
          params: { farmId: tip.farmId, row: String(tip.row) },
        });
      } else {
        router.navigate({ pathname: '/harvest', params: { farm: tip.farmId } });
      }
      return;
    }
    setApplied((a) => ({ ...a, [tip.id]: true }));
  };

  const ask = () => {
    const q = question.trim();
    if (!q) return;
    setAsked((list) => [...list, q]);
    setQuestion('');
  };

  const tips = TIPS.filter((t) => !dismissed[t.id]);

  return (
    <Screen>
      <ScreenTitle
        kicker="Disease risk · next steps"
        title="Advisor"
        right={<IconButton icon={Bell} label="Alerts, 2 new" href="/alerts" dot />}
      />

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

      <SectionHeader title="What To Do Next" />
      {tips.length === 0 ? (
        <Txt variant="body" color={Colors.textSecondary}>
          You&apos;re all caught up. We&apos;ll suggest the next step when something changes.
        </Txt>
      ) : null}
      {tips.map((tip) => {
        const farm = getFarm(tip.farmId);
        const isApplied = applied[tip.id];
        return (
          <Card key={tip.id} style={styles.tip}>
            <Txt variant="micro" color={Colors.textSecondary}>
              {farm.building} · {farm.name}
            </Txt>
            <Txt variant="heading" style={{ lineHeight: 22 }}>
              {tip.title}
            </Txt>
            <Txt variant="body" color={Colors.textBody}>
              {tip.why}
            </Txt>
            {isApplied ? (
              <Badge label="Sent to controller" tone="success" icon={Check} />
            ) : (
              <View style={styles.tipActions}>
                <Button label={tip.action} size="md" onPress={() => runTip(tip)} style={{ flexGrow: 1 }} />
                <Button
                  label="Not now"
                  size="md"
                  variant="secondary"
                  onPress={() => setDismissed((d) => ({ ...d, [tip.id]: true }))}
                />
              </View>
            )}
          </Card>
        );
      })}

      {asked.map((q, i) => (
        <View key={i} style={{ gap: 8 }}>
          <View style={styles.bubbleMe}>
            <Txt variant="body" weight={600}>
              {q}
            </Txt>
          </View>
          <Card style={styles.bubbleAi}>
            <Txt variant="body" color={Colors.textBody}>
              Thanks — we&apos;re checking this against today&apos;s sensor readings and camera scans. The
              answer will appear here and in LINE.
            </Txt>
          </Card>
        </View>
      ))}

      <View style={styles.askRow}>
        <SearchField
          icon={MessageCircle}
          label="Ask the advisor"
          placeholder="Ask about your farm"
          value={question}
          onChangeText={setQuestion}
          onSubmitEditing={ask}
          returnKeyType="send"
        />
        <IconButton icon={Send} label="Send question" variant="accent" size={46} onPress={ask} />
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
  tip: { padding: 16, gap: 10 },
  tipActions: { flexDirection: 'row', gap: 8 },
  bubbleMe: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    backgroundColor: Colors.surfaceTint,
    borderRadius: Radius.lg,
    borderBottomRightRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  bubbleAi: { maxWidth: '90%', padding: 14, borderBottomLeftRadius: 6 },
  askRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
