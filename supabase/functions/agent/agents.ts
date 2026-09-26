/**
 * Multi-agent orchestration. An orchestrator agent plans, hands focused
 * tasks to specialist agents (in parallel when they're independent) and
 * merges their reports into one answer. Each specialist sees only its own
 * module's tools; none can act on its own (actions are proposals the farmer
 * confirms).
 */
import {
  ApiError,
  FunctionCallingConfigMode,
  GoogleGenAI,
  type Content,
  type FunctionCall,
  type FunctionDeclaration,
  type GenerateContentConfig,
} from 'npm:@google/genai@^2.24';

import { TOOLS, runTool, sourceOf, type Source, type ToolContext } from './tools.ts';

/**
 * Models to try in order. Free-tier quota is per model, so when one is used
 * up (429) the agent moves to the next; an overloaded model (503) is retried
 * briefly first. Once a model answers, that agent stays on it for the run.
 */
/** Plans and writes the farmer-facing answer. */
export const ORCHESTRATOR_MODELS = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite'];
/** Narrow, tool-heavy tasks; lighter models spread the quota. */
export const SPECIALIST_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-3.6-flash'];
const OVERLOAD_RETRY_MS = 2000;

export type AgentId = 'orchestrator' | 'monitor' | 'health' | 'harvest' | 'market';
export type StepFn = (agent: AgentId, message: string) => Promise<void>;
/** What one specialist was asked, what it reported and which data it read. */
export type Trace = { agent: AgentId; task: string; report: string; sources: Source[] };

// ── One model call, moving down the model list while Gemini is busy ─
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const status = (e: unknown) => (e instanceof ApiError ? e.status : 0);

/** Tries models[from…] in order; returns the response and which model answered. */
async function generate(ai: GoogleGenAI, models: string[], from: number, contents: Content[], config: GenerateContentConfig) {
  let lastError: unknown;
  for (let i = from; i < models.length; i++) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return { response: await ai.models.generateContent({ model: models[i], contents, config }), index: i };
      } catch (e) {
        lastError = e;
        if (status(e) === 503 && attempt === 0) {
          await sleep(OVERLOAD_RETRY_MS);
          continue;
        }
        if (status(e) === 503 || status(e) === 429 || status(e) === 404) break; // next model
        throw e;
      }
    }
  }
  throw lastError;
}

const textOf = (content: Content) =>
  (content.parts ?? [])
    .filter((p) => p.text && !p.thought)
    .map((p) => p.text)
    .join('')
    .trim();

/**
 * The agent loop every agent shares: call the model, run the function calls
 * it asks for (all of one turn together), feed results back, until it answers.
 */
async function runLoop(opts: {
  ai: GoogleGenAI;
  models: string[];
  system: string;
  declarations: FunctionDeclaration[];
  contents: Content[];
  maxRounds: number;
  execute: (call: FunctionCall) => Promise<Record<string, unknown>>;
}) {
  const { ai, contents } = opts;
  const config: GenerateContentConfig = {
    systemInstruction: opts.system,
    tools: [{ functionDeclarations: opts.declarations }],
  };
  // Stay on the model that answered: Gemini's thought signatures belong to it.
  let modelIndex = 0;
  for (let round = 0; round <= opts.maxRounds; round++) {
    const last = round === opts.maxRounds;
    const { response, index } = await generate(
      ai,
      opts.models,
      modelIndex,
      contents,
      // Out of rounds: no more calls, answer with what it has.
      last ? { ...config, toolConfig: { functionCallingConfig: { mode: FunctionCallingConfigMode.NONE } } } : config,
    );
    modelIndex = index;
    const content = response.candidates?.[0]?.content;
    if (!content) return { text: '', contents };
    // Keep the whole model turn (including thought signatures) so the next call continues correctly.
    contents.push({ role: 'model', parts: content.parts ?? [] });

    const calls = response.functionCalls ?? [];
    if (!calls.length) return { text: textOf(content), contents };

    const results = await Promise.all(calls.map(opts.execute));
    contents.push({
      role: 'user',
      parts: calls.map((c, i) => ({ functionResponse: { id: c.id, name: c.name, response: results[i] } })),
    });
  }
  return { text: '', contents };
}

// ── Specialists ────────────────────────────────────────────────────
const FARM_CONTEXT = `Connected Okra Farm is a community okra co-op in Hinode, Japan: outdoor fields (Field A by the river, Hillside on a slope; summer supply, solar sensor nodes, pump only) and indoor rooms in empty buildings (Classroom 2, Gymnasium, House 4, Post Office; off-season supply, with LEDs, pump and fans). A LoRa gateway links every farm; a camera with edge AI counts flowers and pods per row. Times and dates are Japan time.`;

const SPECIALIST_RULES = `You are one specialist in a team led by an orchestrator agent. Do only the task you are given, within your area.
- Use your tools for real data; never invent a number. If a tool fails, say what you couldn't check.
- You cannot act. If an action is clearly worth doing now, call a propose_* tool (at most two); the farmer confirms it later. Never say an action is done.
- A farm whose LoRa link is offline runs on its own controller; commands to it wait at the gateway.
- Report back to the orchestrator in a few short factual bullets with farm names, numbers and units, and list any proposals you made. Say which data each finding comes from and its time when known (e.g. "sensor reading 08:09", "camera 05:40", "weather forecast"). No greeting, no markdown.`;

type Specialist = { label: string; area: string; tools: string[] };

export const SPECIALISTS: Record<Exclude<AgentId, 'orchestrator'>, Specialist> = {
  monitor: {
    label: 'Monitor & Control agent',
    area: 'Live sensor readings, out-of-range alerts, LoRa network status, weather and irrigation. Decides whether fields need watering and flags landslide risk at Hillside and flood risk at Field A. Never propose watering an outdoor field when rain is forecast for today or tomorrow: the rain will water it.',
    tools: ['get_farms_overview', 'get_sensor_history', 'get_weather', 'propose_device_command'],
  },
  health: {
    label: 'Crop Health agent',
    area: 'Disease risk for the crop: mildew and other fungal risk from humidity staying above 75% for hours, temperature and weak airflow, especially in indoor rooms. Suggests ventilation (fans) and LED changes.',
    tools: ['get_farms_overview', 'get_sensor_history', 'get_weather', 'propose_device_command'],
  },
  harvest: {
    label: 'Harvest agent',
    area: "Today's picking plan from the camera: pods that must be picked today before they become overgrown, pods ready, which rows first, estimated kg, and overgrown pods for processors.",
    tools: ['get_harvest_plan', 'get_weather'],
  },
  market: {
    label: 'Market agent',
    area: '7-day yield forecast, kg already reserved by buyers, surplus alerts (amber over 10% unsold, red over 25%), listings, pending buyer reservations, and selling overgrown pods to processors, so okra sells before it spoils. When a red surplus alert still has kg not yet listed, propose a surplus listing for the biggest one.',
    tools: ['get_market_outlook', 'get_listings', 'propose_listing', 'propose_confirm_reservation'],
  },
};

/** Short, farmer-readable description of each tool call, for the live progress feed. */
const TOOL_STEP: Record<string, string> = {
  get_farms_overview: 'reading every farm’s sensors',
  get_sensor_history: 'checking the last hours of readings',
  get_weather: 'checking the weather',
  get_harvest_plan: 'reading today’s camera counts',
  get_market_outlook: 'forecasting yield and surplus',
  get_listings: 'reading listings and buyers',
};

async function runSpecialist(
  ai: GoogleGenAI,
  id: Exclude<AgentId, 'orchestrator'>,
  task: string,
  ctx: ToolContext,
  step: StepFn,
) {
  const spec = SPECIALISTS[id];
  const sources: Source[] = [];
  const declarations = TOOLS.filter((t) => spec.tools.includes(t.name)).map((t) => ({
    name: t.name,
    description: t.description,
    parametersJsonSchema: t.parameters,
  }));
  await step(id, `started: ${task}`);
  const { text } = await runLoop({
    ai,
    models: SPECIALIST_MODELS,
    system: `${FARM_CONTEXT}\n\nYou are the ${spec.label}. Your area: ${spec.area}\n\n${SPECIALIST_RULES}`,
    declarations,
    contents: [{ role: 'user', parts: [{ text: `Task from the orchestrator: ${task}` }] }],
    maxRounds: 6,
    execute: async (call) => {
      const name = call.name ?? '';
      if (!spec.tools.includes(name)) return { error: `${name} is not one of your tools.` };
      if (TOOL_STEP[name]) await step(id, TOOL_STEP[name]);
      const outcome = await runTool(ctx, name, call.args ?? {});
      const source = sourceOf(ctx, name, call.args ?? {}, outcome);
      if (source) sources.push(source);
      const made = outcome.ok ? (outcome.result as { status?: string; title?: string }) : null;
      if (made?.status === 'proposed' && made.title) await step(id, `suggested: ${made.title}`);
      return outcome.ok ? { output: outcome.result } : { error: outcome.error };
    },
  });
  const report = text || 'No findings (the specialist did not answer).';
  await step(id, 'reported back');
  return { report, sources };
}

// ── Orchestrator ───────────────────────────────────────────────────
const DELEGATE_TOOLS: FunctionDeclaration[] = (Object.keys(SPECIALISTS) as Exclude<AgentId, 'orchestrator'>[]).map(
  (id) => ({
    name: `ask_${id}_agent`,
    description: `Delegate a task to the ${SPECIALISTS[id].label}. Its area: ${SPECIALISTS[id].area} Returns its report and any actions it proposed.`,
    parametersJsonSchema: {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          description: 'A clear, self-contained task: what to check, which farms or dates matter, and what to report back.',
        },
      },
      required: ['task'],
      additionalProperties: false,
    },
  }),
);

export const ORCHESTRATOR_SYSTEM = `${FARM_CONTEXT}

You are the orchestrator of a team of farm AI agents. You help the farmer, often an older person reading on a phone, decide what to do today: keep crops healthy, pick at the right time, and sell okra before it spoils.

Your team (each has only its own tools):
- Monitor & Control agent: sensors, alerts, network, weather, irrigation.
- Crop Health agent: disease and mildew risk, ventilation.
- Harvest agent: today's picking plan and overgrown pods.
- Market agent: forecast, surplus, listings and buyers.

How to work:
- You have no farm data yourself. Plan which specialists the question needs, then delegate with ask_*_agent calls. Call independent specialists in the same turn so they work in parallel. For a broad question ("what should I do today?") use all four.
- Give each specialist a precise task. Follow up with a second task only if a report leaves an important gap or two reports conflict.
- Connect their findings: e.g. rain coming (Monitor) → skip watering and do outdoor picking early (Harvest); mildew risk (Crop Health) → fans; overdue pods (Harvest) → overgrown listing (Market).
- Specialists may have proposed actions; the farmer sees each one with a Confirm button. If a suggestion conflicts with the overall picture (e.g. watering a field that rain will soak today), withdraw it with drop_suggestion. Mention the remaining ones as suggestions; never say an action is done.

How to answer the farmer:
- Write for an older farmer glancing at a phone. Simple everyday words, no jargon, no markdown (no **, #, or tables). Don't mention the agents by name unless asked.
- First line: a headline of at most 12 words saying the most important thing. No date and no "Morning plan for…" prefix.
- Then 3 to 5 bullets, most urgent first. Each bullet starts with "• ", then one topic word and a colon (Weather:, Harvest:, Crops:, Equipment:, Market:), then ONE short sentence of at most 20 words: what to do, where, and why.
- Keep numbers few and round: at most two per bullet, whole percents and degrees (54%, 20 °C), kg to one decimal, ¥ without decimals. Leave out details the farmer can't act on.
- Every bullet is based on data a specialist read. End each bullet with its reference in square brackets, just the data name, e.g. [Live sensors], [Weather forecast], [Camera counts], [Market forecast], [Listings].
- If a specialist couldn't check something, say so.`;

const DROP_TOOL: FunctionDeclaration = {
  name: 'drop_suggestion',
  description:
    "Withdraw a specialist's suggested action (by its exact title) when it conflicts with other findings, so the farmer isn't shown it.",
  parametersJsonSchema: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Exact title of the suggestion, as listed in proposed_actions.' },
      reason: { type: 'string', description: 'A few words, e.g. "rain today".' },
    },
    required: ['title', 'reason'],
    additionalProperties: false,
  },
};

/** Runs the whole team for one question; returns the answer, the updated conversation and who did what. */
export async function orchestrate(ai: GoogleGenAI, contents: Content[], ctx: ToolContext, step: StepFn) {
  const trace: Trace[] = [];
  await step('orchestrator', 'planning which agents to ask');
  const { text } = await runLoop({
    ai,
    models: ORCHESTRATOR_MODELS,
    system: ORCHESTRATOR_SYSTEM,
    declarations: [...DELEGATE_TOOLS, DROP_TOOL],
    contents,
    maxRounds: 3,
    execute: async (call) => {
      if (call.name === 'drop_suggestion') {
        const { title = '', reason = '' } = (call.args ?? {}) as { title?: string; reason?: string };
        const i = ctx.proposals.findIndex((p) => p.title === title);
        if (i < 0) return { error: `No suggestion titled "${title}".` };
        ctx.proposals.splice(i, 1);
        await step('orchestrator', `dropped: ${title}${reason ? ` (${reason})` : ''}`);
        return { output: 'Withdrawn.' };
      }
      const id = (call.name ?? '').replace(/^ask_|_agent$/g, '') as Exclude<AgentId, 'orchestrator'>;
      const task = String((call.args as { task?: string } | undefined)?.task ?? '').trim();
      if (!SPECIALISTS[id]) return { error: `No agent called ${call.name}.` };
      if (!task) return { error: 'Give the agent a task.' };
      const before = ctx.proposals.length;
      const { report, sources } = await runSpecialist(ai, id, task, ctx, step);
      trace.push({ agent: id, task, report, sources });
      return {
        report,
        data_read: sources.map((x) => `${x.label} (${x.detail})`),
        proposed_actions: ctx.proposals.slice(before).map((p) => p.title),
      };
    },
  });
  await step('orchestrator', 'writing the answer');
  return { reply: text, contents, trace };
}
