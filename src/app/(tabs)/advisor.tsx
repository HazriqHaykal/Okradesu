import { Bell } from 'lucide-react-native';

import { AgentChat } from '@/components/advisor/agent-chat';
import { BriefingCard } from '@/components/advisor/briefing-card';
import { AgentDataFeed } from '@/components/advisor/data-feed';
import { Screen } from '@/components/screen';
import { IconButton } from '@/components/ui/button';
import { ScreenTitle, SectionHeader } from '@/components/ui/section-header';
import { Card } from '@/components/ui/surface';
import { Txt } from '@/components/ui/text';
import { Colors } from '@/constants/theme';
import { agentAvailable } from '@/services/agent';

/**
 * AI advisor: the morning plan plus a chat with the agent team (an
 * orchestrator and Monitor, Crop Health, Harvest and Market specialists).
 * The middle tab.
 */
export default function AdvisorScreen() {
  return (
    <Screen>
      <ScreenTitle
        kicker="AI agent team · all farms"
        title="Advisor"
        right={<IconButton icon={Bell} label="Alerts" href="/alerts" />}
      />
      {agentAvailable ? (
        <>
          <AgentDataFeed />
          <BriefingCard />
          <SectionHeader title="Ask the Advisor" />
          <AgentChat />
        </>
      ) : (
        <Card style={{ padding: 16 }}>
          <Txt variant="body" color={Colors.textBody}>
            The AI advisor needs Supabase. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY to
            .env.local and restart the app.
          </Txt>
        </Card>
      )}
    </Screen>
  );
}
