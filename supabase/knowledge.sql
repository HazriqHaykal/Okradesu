-- Okra knowledge base for the AI agents (RAG). Run once in the Supabase SQL
-- editor, then load the guides with scripts/ingest-knowledge.mjs. Safe to
-- re-run (recreates the table; re-ingest afterwards).
--
-- One row per "## Section" of a guide in knowledge/*.md, with its
-- gemini-embedding-2 vector (768 dimensions).

create extension if not exists vector;

drop function if exists match_knowledge(vector, int, text);
drop table if exists knowledge_chunks;

create table knowledge_chunks (
  id         bigint generated always as identity primary key,
  -- File name without .md, e.g. "disease-downy-mildew".
  doc        text not null,
  title      text not null,
  -- disease | growing | harvest | storage | pests | sop | market
  topic      text not null,
  section    text not null,
  content    text not null,
  embedding  vector(768) not null,
  updated_at timestamptz not null default now(),
  unique (doc, section)
);

create index knowledge_chunks_embedding on knowledge_chunks using hnsw (embedding vector_cosine_ops);

-- Nearest sections to a query embedding (cosine similarity, 1 = identical).
create or replace function match_knowledge(query_embedding vector(768), match_count int default 4, only_topic text default null)
returns table (doc text, title text, topic text, section text, content text, similarity float)
language sql stable as $$
  select k.doc, k.title, k.topic, k.section, k.content, 1 - (k.embedding <=> query_embedding) as similarity
  from knowledge_chunks k
  where only_topic is null or k.topic = only_topic
  order by k.embedding <=> query_embedding
  limit least(match_count, 10);
$$;

-- Readable by the app and the agents; written only by the ingest script
-- (service role).
alter table knowledge_chunks enable row level security;
create policy "demo read" on knowledge_chunks for select using (true);
