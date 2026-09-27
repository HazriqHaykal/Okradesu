/**
 * Loads the okra knowledge base (knowledge/*.md) into Supabase for the AI
 * agents' search_knowledge tool (RAG). Each "## Section" becomes one chunk,
 * embedded with gemini-embedding-2 (768 dimensions). Replaces what was there,
 * so run it again after editing any guide. Run after supabase/knowledge.sql:
 *
 *   node --env-file=.env.local scripts/ingest-knowledge.mjs
 *
 * Needs EXPO_PUBLIC_SUPABASE_URL, GEMINI_API_KEY and SUPABASE_SERVICE_ROLE_KEY
 * (writes bypass the read-only policy; keep that key out of the app and git).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createClient } from '@supabase/supabase-js';

const DIR = 'knowledge';
const MODEL = 'models/gemini-embedding-2';
const DIMENSIONS = 768;
/** Documents are embedded as "title | text"; queries use the matching search prefix (see tools.ts). */
const asDocument = (title, text) => `title: ${title} | text: ${text}`;

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const geminiKey = process.env.GEMINI_API_KEY;
if (!url || !serviceKey || !geminiKey) {
  console.error('Set EXPO_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and GEMINI_API_KEY (e.g. in .env.local).');
  process.exit(1);
}
const db = createClient(url, serviceKey, { auth: { persistSession: false } });

// ── Split guides into sections ─────────────────────────────────────
function parse(file) {
  const doc = file.replace(/\.md$/, '');
  const text = readFileSync(join(DIR, file), 'utf8').replace(/\r\n/g, '\n');
  const title = text.match(/^# (.+)$/m)?.[1]?.trim();
  const topic = text.match(/^Topic:\s*(\w+)/m)?.[1]?.trim();
  if (!title || !topic) throw new Error(`${file}: needs a "# Title" line and a "Topic:" line.`);
  return text
    .split(/^## /m)
    .slice(1)
    .map((block) => {
      const [heading, ...body] = block.split('\n');
      return { doc, title, topic, section: heading.trim(), content: body.join('\n').trim() };
    })
    .filter((c) => c.content);
}

const chunks = readdirSync(DIR)
  .filter((f) => f.endsWith('.md') && f.toLowerCase() !== 'readme.md')
  .sort()
  .flatMap(parse);
console.log(`Found ${chunks.length} sections in ${new Set(chunks.map((c) => c.doc)).size} guides.`);

// ── Embed (batches of up to 100) ───────────────────────────────────
async function embed(texts) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${MODEL}:batchEmbedContents`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': geminiKey },
    body: JSON.stringify({
      requests: texts.map((text) => ({ model: MODEL, content: { parts: [{ text }] }, output_dimensionality: DIMENSIONS })),
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Embedding failed (${res.status}): ${json.error?.message ?? 'unknown error'}`);
  return json.embeddings.map((e) => e.values);
}

const rows = [];
for (let i = 0; i < chunks.length; i += 100) {
  const batch = chunks.slice(i, i + 100);
  const vectors = await embed(batch.map((c) => asDocument(`${c.title} › ${c.section}`, c.content)));
  batch.forEach((c, j) => rows.push({ ...c, embedding: vectors[j] }));
}

// ── Replace the table's contents ───────────────────────────────────
const { error: delError } = await db.from('knowledge_chunks').delete().gte('id', 0);
if (delError) throw new Error(`Could not clear knowledge_chunks: ${delError.message}`);
const { error } = await db.from('knowledge_chunks').insert(rows);
if (error) throw new Error(`Could not insert: ${error.message}`);
console.log(`Loaded ${rows.length} sections into knowledge_chunks.`);
