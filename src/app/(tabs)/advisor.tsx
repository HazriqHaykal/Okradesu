import { Bell } from 'lucide-react-native';

import { AgentChat } from '@/components/advisor/agent-chat';
import { BriefingCard } from '@/components/advisor/briefing-card';
import { SampleAdvisor } from '@/components/advisor/sample-advisor';
import { Screen } from '@/components/screen';
import { IconButton } from '@/components/ui/button';
import { ScreenTitle, SectionHeader } from '@/components/ui/section-header';
import { agentAvailable } from '@/services/agent';

/** AI advisor: the morning plan plus a chat that checks every farm module and suggests actions to confirm. */
export default function AdvisorScreen() {
  return (
    <Screen>
      <ScreenTitle
        kicker={agentAvailable ? 'AI advisor · all farms' : 'Disease risk · next steps'}
        title="Advisor"
        right={<IconButton icon={Bell} label="Alerts" href="/alerts" />}
      />
      {agentAvailable ? (
        <>
          <BriefingCard />
          <SectionHeader title="Ask the Advisor" />
          <AgentChat />
        </>
      ) : (
        <SampleAdvisor />
      )}
    </Screen>
  );
}
