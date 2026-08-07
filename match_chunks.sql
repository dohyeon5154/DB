-- chunks 테이블의 id가 bigint(숫자)인 경우에 맞춘 코드
create or replace function match_chunks (
  query_embedding vector(768),
  match_count int default 3
)
returns table (
  id bigint,     -- 👈 uuid 대신 bigint로 변경
  content text,
  similarity float
)
language sql stable
as $$
  select
    id,
    content,
    -- (1 - 거리)를 계산하여 1.0(100%)에 가까울수록 유사하도록 변환
    1 - (chunks.embedding <=> query_embedding) as similarity
  from chunks
  where chunks.embedding is not null
  order by chunks.embedding <=> query_embedding asc -- 거리가 가까운 순서대로 정렬
  limit match_count;
$$;