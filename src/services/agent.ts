/**
 * The AI farm advisor (Supabase Edge Function `agent`): an orchestrator agent
 * that delegates to Monitor & Control, Crop Health, Harvest and Market
 * specialists. Any action comes back as a proposal the farmer confirms here,
 * and confirming it goes through the same paths the app already uses.
 */
import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import { marketActions } from '@/state/market-store';
import type { ListingGrade, ListingType } from '@/types/market';

export type Proposal =
  | {
      id: string;
      kind: 'device';
      title: string;
      reason: string;
      params: { farm_id: string; device: 'pump' | 'led' | 'fan'; on: boolean; level: number };
    }
  | {
      id: string;
      kind: 'listing';
      title: string;
      reason: string;
      params: {
        farm_id: string;
        harvest_date: string;
        quantity_kg: number;
        grade: ListingGrade;
        price_per_kg: number;
        listing_type: ListingType;
      };
    }
  | { id: string; kind: 'confirm_reservation'; title: string; reason: string; params: { reservation_id: string } };

/** Conversation as the Edge Function returns it (Gemini turns); sent back unchanged on the next question. */
export type AgentHistory = { role: 'user' | 'model'; parts: unknown[] }[];

export type AgentId = 'orchestrator' | 'monitor' | 'health' | 'harvest' | 'market';

export const AGENT_LABEL: Record<AgentId, string> = {
  orchestrator: 'Orchestrator',
  monitor: 'Monitor & Control',
  health: 'Crop Health',
  harvest: 'Harvest',
  market: 'Market',
};

/** What each agent keeps an eye on (shown before any run). */
export const AGENT_ABOUT: Record<AgentId, string> = {
  orchestrator: 'Plans, asks the specialists, settles conflicts and writes your plan.',
  monitor: 'Live sensors, LoRa network, weather and watering.',
  health: 'Mildew and disease risk from humidity and temperature; fans and LEDs.',
  harvest: "Today's camera counts: what must be picked and in which rows.",
  market: '7-day yield forecast, surplus, listings and buyers.',
};

/** A data reference, e.g. { label: "Live sensors", detail: "5/6 farms reporting · 08:09" }. */
export type Source = { tool: string; label: string; detail: string };

/** Who did what in one run: each specialist's task, report and the data it read. */
export type Trace = { agent: AgentId; task: string; report: string; sources: Source[] }[];

export type AgentReply = { reply: string; proposals: Proposal[]; history: AgentHistory; trace: Trace };

export type AgentStep = { id: number; agent: AgentId; message: string; created_at: string };

/** Id for one run, so the app can follow its steps live. */
export const newRunId = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

export type Briefing = { id: number; created_at: string; summary: string; proposals: Proposal[]; trace: Trace };

export const agentAvailable = !!supabase;

async function invoke<T>(body: object): Promise<T> {
  if (!supabase) throw new Error('Connect Supabase to use the advisor.');
  const { data, error } = await supabase.functions.invoke('agent', { body });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const detail = await error.context.json().catch(() => null);
      throw new Error(detail?.error ?? 'The advisor could not answer. Try again.');
    }
    throw new Error('Could not reach the advisor. Check your connection.');
  }
  return data as T;
}

export function askAgent(history: AgentHistory, question: string, runId: string) {
  return invoke<AgentReply>({ mode: 'chat', history, question, run_id: runId });
}

export async function runBriefing(runId: string) {
  return invoke<{ briefing: Briefing; trace: Trace }>({ mode: 'briefing', run_id: runId });
}

export async function latestBriefing(): Promise<Briefing | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('agent_briefings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Briefing | null;
}

// ── Confirming a proposal ──────────────────────────────────────────
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** How long to wait for the gateway to confirm a command before calling it queued. */
const ACK_WAIT_MS = 10000;

/** Carries out a proposal the farmer confirmed; returns a short status line. */
export async function confirmProposal(p: Proposal): Promise<string> {
  switch (p.kind) {
    case 'device': {
      if (!supabase) throw new Error('Connect Supabase to send commands.');
      const { data, error } = await supabase
        .from('commands')
        .insert({ farm_id: p.params.farm_id, device: p.params.device, on: p.params.on, level: p.params.level })
        .select('id')
        .single();
      if (error) throw new Error(error.message);
      for (let waited = 0; waited < ACK_WAIT_MS; waited += 1000) {
        await wait(1000);
        const { data: row } = await supabase.from('commands').select('status').eq('id', data.id).single();
        if (row?.status === 'done') return 'Done · the gateway confirmed it';
      }
      return 'Queued · it runs when the gateway is back';
    }
    case 'listing':
      await marketActions.createListing(p.params);
      return 'Listed · buyers can see it now';
    case 'confirm_reservation':
      await marketActions.setReservationStatus(p.params.reservation_id, 'confirmed');
      return 'Confirmed · the buyer is told';
  }
}
