import { StyleSheet, View } from 'react-native';

import { AGENT_ICON } from '@/components/advisor/agent-progress';
import { Card, Divider } from '@/components/ui/surface';
import { Txt } from '@/components/ui/text';
import { Colors, Palette } from '@/constants/theme';
import { useAgentDataFeed, type FeedLine } from '@/hooks/use-agent-data-feed';
import { AGENT_LABEL, type AgentId } from '@/services/agent';

/**
 * "What the agents are watching": the live numbers each specialist reads,
 * straight from the farm database, with where each number comes from.
 */
export function AgentDataFeed() {
  const feed = useAgentDataFeed();
  const rows: [Exclude<AgentId, 'orchestrator'>, FeedLine][] = [
    ['monitor', feed.monitor],
    ['health', feed.health],
    ['harvest', feed.harvest],
    ['market', feed.market],
  ];

  return (
    <Card style={styles.card}>
      <View style={{ gap: 2 }}>
        <Txt variant="heading">What the agents are watching</Txt>
        <Txt variant="small" color={Colors.textSecondary}>
          Live from your farm database · updates every 30 s
        </Txt>
      </View>
      {rows.map(([agent, line], i) => {
        const Icon = AGENT_ICON[agent];
        return (
          <View key={agent} style={{ gap: 10 }}>
            {i > 0 ? <Divider /> : null}
            <View style={styles.row}>
              <View style={styles.icon}>
                <Icon size={16} color={Palette.leaf800} strokeWidth={2} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt variant="micro" color={Colors.textSecondary}>
                  {AGENT_LABEL[agent]} agent
                </Txt>
                <Txt variant="body" weight={700}>
                  {line.value}
                </Txt>
                <Txt variant="caption" color={Colors.textSecondary}>
                  Source: {line.source}
                </Txt>
              </View>
            </View>
          </View>
        );
      })}
      {feed.sensorsError ? (
        <Txt variant="small" weight={700} color={Colors.dangerFg}>
          Couldn&apos;t read the sensors. Check the connection.
        </Txt>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.leaf200,
  },
});
