import { useEffect, useState } from 'react';

import { supabase, uniqueChannel } from '@/lib/supabase';
import type { AgentStep } from '@/services/agent';

/**
 * Live progress of one advisor run: which agent is doing what, as it happens.
 * Follows one run for the component's life; key the component by run id.
 */
export function useAgentSteps(runId: string | null) {
  const [steps, setSteps] = useState<AgentStep[]>([]);

  useEffect(() => {
    if (!runId || !supabase) return;
    const db = supabase;
    const add = (s: AgentStep) =>
      setSteps((list) => (list.some((x) => x.id === s.id) ? list : [...list, s].sort((a, b) => a.id - b.id)));

    const channel = db
      .channel(uniqueChannel(`agent-steps-${runId}`))
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'agent_steps', filter: `run_id=eq.${runId}` },
        (payload) => add(payload.new as AgentStep),
      )
      .subscribe();
    // Catch steps written before the subscription was ready.
    db.from('agent_steps')
      .select('id, agent, message, created_at')
      .eq('run_id', runId)
      .order('id')
      .then(({ data }) => data?.forEach((s) => add(s as AgentStep)));

    return () => {
      db.removeChannel(channel);
    };
  }, [runId]);

  return steps;
}
