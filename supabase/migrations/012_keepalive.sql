-- Supabase の無料プランは1週間アクセスがないと一時停止する（2026-11-17 に止まって Hitoha / Hitoha Daily にログインできなくなった）
-- GitHub Actions（.github/workflows/supabase-keepalive.yml）が毎日 keepalive() を呼んで、最後に呼ばれた時刻をここに残す
-- Supabase SQL Editor で実行してください

create table if not exists public.keepalive (
  id integer primary key default 1 check (id = 1),
  pinged_at timestamptz not null default now()
);
insert into public.keepalive (id) values (1) on conflict (id) do nothing;

-- テーブルは直接さわれないようにして、関数からだけ時刻を更新する
alter table public.keepalive enable row level security;

create or replace function public.keepalive()
returns timestamptz
language sql
security definer
set search_path = public
as $$
  update public.keepalive set pinged_at = now() where id = 1 returning pinged_at;
$$;

revoke all on function public.keepalive() from public;
grant execute on function public.keepalive() to anon, authenticated;
