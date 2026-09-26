import { Check, Droplets, Fan, Lightbulb, Store, TriangleAlert, Users, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IconWell } from '@/components/ui/surface';
import { Txt } from '@/components/ui/text';
import { Colors, Radius, Shadow } from '@/constants/theme';
import { confirmProposal, type Proposal } from '@/services/agent';

function iconFor(p: Proposal): LucideIcon {
  if (p.kind === 'listing') return Store;
  if (p.kind === 'confirm_reservation') return Users;
  return p.params.device === 'pump' ? Droplets : p.params.device === 'fan' ? Fan : Lightbulb;
}

type State = { step: 'idle' } | { step: 'running' } | { step: 'done'; note: string } | { step: 'failed'; note: string } | { step: 'skipped' };

/** An action the advisor suggests. Nothing happens until the farmer taps Confirm. */
export function ProposalCard({ proposal }: { proposal: Proposal }) {
  const [state, setState] = useState<State>({ step: 'idle' });

  async function confirm() {
    setState({ step: 'running' });
    try {
      setState({ step: 'done', note: await confirmProposal(proposal) });
    } catch (e) {
      setState({ step: 'failed', note: e instanceof Error ? e.message : 'Could not do that. Try again.' });
    }
  }

  return (
    <View style={[styles.card, state.step === 'skipped' && styles.skipped]}>
      <View style={styles.head}>
        <IconWell icon={iconFor(proposal)} size={36} radius={Radius.sm} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="body" weight={800}>
            {proposal.title}
          </Txt>
          <Txt variant="small" color={Colors.textSecondary}>
            {proposal.reason}
          </Txt>
        </View>
      </View>
      {state.step === 'idle' || state.step === 'running' ? (
        <View style={styles.actions}>
          <Button
            label={state.step === 'running' ? 'Working…' : 'Confirm'}
            icon={Check}
            size="sm"
            disabled={state.step === 'running'}
            onPress={confirm}
          />
          <Button
            label="Not now"
            size="sm"
            variant="ghost"
            disabled={state.step === 'running'}
            onPress={() => setState({ step: 'skipped' })}
          />
        </View>
      ) : null}
      {state.step === 'done' ? <Badge label={state.note} tone="success" icon={Check} /> : null}
      {state.step === 'failed' ? <Badge label={state.note} tone="danger" icon={TriangleAlert} /> : null}
      {state.step === 'skipped' ? <Badge label="Skipped" tone="neutral" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
    padding: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceCard,
    boxShadow: Shadow.tile,
  },
  skipped: { opacity: 0.55 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  actions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
});
