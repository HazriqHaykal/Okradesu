import { Bell, Sparkles } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AgentChat } from '@/components/advisor/agent-chat';
import { HeroBackground, Screen } from '@/components/screen';
import { IconButton } from '@/components/ui/button';
import { Card, IconWell } from '@/components/ui/surface';
import { Txt } from '@/components/ui/text';
import { Colors } from '@/constants/theme';
import { agentAvailable } from '@/services/agent';

const title = (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
    <IconWell icon={Sparkles} size={40} />
    <Txt variant="displaySm" accessibilityRole="header" style={{ flex: 1 }}>
      Okradesu AI
    </Txt>
    <IconButton icon={Bell} label="Alerts" href="/alerts" />
  </View>
);

/**
 * Okradesu AI: just a chat with the agent team (an orchestrator and Monitor,
 * Crop Health, Harvest and Market specialists). This morning's plan opens the
 * conversation. The middle tab.
 */
export default function AdvisorScreen() {
  if (!agentAvailable) {
    return (
      <Screen>
        {title}
        <Card style={{ padding: 16 }}>
          <Txt variant="body" color={Colors.textBody}>
            Okradesu AI needs Supabase. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
            to .env.local and restart the app.
          </Txt>
        </Card>
      </Screen>
    );
  }

  return (
    <View style={styles.root}>
      <HeroBackground />
      <AgentChat header={title} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgApp },
});
