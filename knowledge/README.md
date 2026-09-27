# Okradesu knowledge base

Short guides the AI agents search (RAG) and cite as `[Guide: …]`.

**Status: DRAFT.** Written by AI from general okra knowledge for the hackathon
demo. Before real use, have each guide checked by JA or your prefecture's
agricultural extension office, and replace or extend it with their material.
Pesticide and fungicide choices are deliberately left to those experts.

## Format

- One Markdown file per topic. The first line is `# Title`, then a
  `Topic:` line (disease, growing, harvest, storage, pests, sop, market).
- Each `## Section` becomes one searchable chunk, so keep sections
  self-contained (repeat the crop or farm name rather than "it").
- Targets and rules match the app (src/data/monitor.ts, src/data/harvest.ts,
  src/constants/market.ts). Change both together.
- This README is not ingested.

## Updating

After editing any file here, re-run the ingest script so the agents see it:

    node --env-file=.env.local scripts/ingest-knowledge.mjs

It needs `SUPABASE_SERVICE_ROLE_KEY` (never an `EXPO_PUBLIC_` variable) and
`GEMINI_API_KEY` in `.env.local`.
