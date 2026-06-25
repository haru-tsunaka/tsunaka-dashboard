-- 案件担当者テーブル（複数人対応）
-- Supabase SQL Editor で実行してください

create table public.case_contacts (
  id            uuid primary key default gen_random_uuid(),
  case_id       uuid references public.cases(id) on delete cascade not null,
  name          text not null,
  department    text,
  role          text,
  contact_method text,
  contact_info  text,
  created_at    timestamptz default now(),
  user_id       uuid references auth.users(id) not null
);

create index idx_contacts_case on public.case_contacts(case_id);

alter table public.case_contacts enable row level security;

create policy "Users can manage contacts for their own cases"
  on public.case_contacts for all
  using (auth.uid() = (select user_id from public.cases where id = case_id))
  with check (auth.uid() = (select user_id from public.cases where id = case_id));
