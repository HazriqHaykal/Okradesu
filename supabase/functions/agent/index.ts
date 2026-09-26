/**
 * AI farm advisor: a team of Gemini agents (see agents.ts). An orchestrator
 * delegates to Monitor & Control, Crop Health, Harvest and Market
 * specialists, each limited to its own module's tools, and writes one answer.
 *
 * POST { mode: "chat", history, question, run_id? } → one answer for the
 *   Advisor chat. `history` is what the last call returned (send it back
 *   unchanged, or [] to start).
 * POST { mode: "briefing", run_id? } → the morning briefing, saved to
 *   agent_briefings (pg_cron calls this at 05:45 Japan time).
 * With `run_id` (a UUID from the app), each step is written to agent_steps
 * so the app can show the agents working live.
 *
 * Nothing acts on its own: actions come back as `proposals` the farmer
 * confirms in the app.
 *
 * Secrets: GEMINI_API_KEY (supabase secrets set). SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY are provided by the platform.
 */
import { ApiError, GoogleGenAI, type Content } from 'npm:@google/genai@^2.24';
import { createClient } from 'npm:@supabase/supabase-js@2';

import { orchestrate, type AgentId, type StepFn } from './agents.ts';
import { jstDay, type Farm, type Proposal, type ToolContext } from './tools.ts';

/** Longest conversation the chat accepts (keeps usage bounded). */
const MAX_HISTORY = 60;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const BRIEFING_PROMPT = (today: string) =>
  `Morning briefing for ${today} (Japan). Ask every specialist, then write the farmer's plan for today in priority order: what needs attention first, what to pick, what to water or ventilate, and what okra to sell before it spoils.`;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

async function context(): Promise<ToolContext> {
  const { data: farms, error } = await db.from('farms').select('*');
  if (error) throw new Error(`Could not load farms: ${error.message}`);
  return { db, farms: farms as Farm[], today: jstDay(), proposals: [] as Proposal[] };
}

/** Writes progress for the app to show live; never fails the run. */
function stepWriter(runId: string | undefined): StepFn {
  if (!runId || !UUID.test(runId)) return async () => {};
  return async (agent: AgentId, message: string) => {
    await db.from('agent_steps').insert({ run_id: runId, agent, message: message.slice(0, 300) });
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) return json({ error: 'The advisor is not set up yet: add GEMINI_API_KEY to the Supabase secrets.' }, 503);
  const ai = new GoogleGenAI({ apiKey });

  let body: { mode?: string; history?: Content[]; question?: string; run_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }
  const step = stepWriter(body.run_id);

  try {
    if (body.mode === 'briefing') {
      const ctx = await context();
      const { reply, trace } = await orchestrate(
        ai,
        [{ role: 'user', parts: [{ text: BRIEFING_PROMPT(ctx.today) }] }],
        ctx,
        step,
      );
      const { data, error } = await db
        .from('agent_briefings')
        .insert({ summary: reply, proposals: ctx.proposals, trace })
        .select()
        .single();
      if (error) throw new Error(`Could not save the briefing: ${error.message}`);
      return json({ briefing: data, trace });
    }

    const question = body.question?.trim();
    const history = Array.isArray(body.history) ? body.history : [];
    if (!question) return json({ error: 'Ask a question.' }, 400);
    if (question.length > 1000) return json({ error: 'Please ask a shorter question.' }, 400);
    if (history.length > MAX_HISTORY || history.some((c) => c?.role !== 'user' && c?.role !== 'model')) {
      return json({ error: 'Start a new conversation.' }, 400);
    }
    const ctx = await context();
    const { reply, contents, trace } = await orchestrate(
      ai,
      [...history, { role: 'user', parts: [{ text: question }] }],
      ctx,
      step,
    );
    return json({
      reply: reply || "Sorry, I couldn't put an answer together. Try asking again.",
      proposals: ctx.proposals,
      history: contents,
      trace,
    });
  } catch (e) {
    await step('orchestrator', 'stopped with an error');
    if (e instanceof ApiError) {
      if (e.status === 402) return json({ error: 'Gemini credits are used up. Top up in AI Studio (ai.studio/projects → Billing), then try again.' }, 402);
      if (e.status === 429 || e.status === 503) return json({ error: 'The advisor is busy right now. Try again in a minute.' }, 503);
      if (e.status === 400 || e.status === 403) return json({ error: `The advisor is not set up correctly (${e.status}). Check GEMINI_API_KEY.` }, 500);
      return json({ error: `Advisor error (${e.status}). Try again.` }, 502);
    }
    return json({ error: e instanceof Error ? e.message : 'Something went wrong.' }, 500);
  }
});
