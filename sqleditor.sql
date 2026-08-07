create extension if not exists pg_net with schema extensions;
create schema if not exists supabase_functions;

create or replace function supabase_functions.http_request()
returns trigger
language plpgsql
security definer
as $$
declare
  request_id bigint;
  v_headers jsonb;
  -- 👇 복사하신 anon public 키를 여기에 넣어주세요!
  v_anon_key text := '여기에_복사한_ANON_KEY_붙여넣기'; 
begin
  -- 1. Authorization 헤더 생성
  v_headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || v_anon_key
  );

  -- 2. 인증 키를 포함하여 Edge Function 호출 (기존 함수를 완전히 대체함)
  select net.http_post(
    url := TG_ARGV[0],
    headers := v_headers,
    body := row_to_json(NEW)::jsonb
  ) into request_id;

  return NEW;
end;
$$;