-- 繋叶 Dashboard - 初期スキーマ
-- Supabase SQL Editor で実行してください

-- Cases table
create table public.cases (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  name          text not null,
  client_name   text,
  category      text default 'other',
  description   text,
  status        text default '商談中',
  event_date    date,
  deadline      date,
  quoted_amount integer,
  payment_status text default '未入金',
  expenses      integer default 0,
  next_action   text,
  next_action_by date,
  contact_method text,
  contact_info  text,
  deliverables  text,
  user_id       uuid references auth.users(id) not null
);

-- Progress log entries
create table public.progress_logs (
  id         uuid primary key default gen_random_uuid(),
  case_id    uuid references public.cases(id) on delete cascade not null,
  created_at timestamptz default now(),
  content    text not null,
  user_id    uuid references auth.users(id) not null
);

-- Indexes
create index idx_cases_status on public.cases(status);
create index idx_cases_user on public.cases(user_id);
create index idx_logs_case on public.progress_logs(case_id);

-- RLS
alter table public.cases enable row level security;
alter table public.progress_logs enable row level security;

create policy "Users can manage their own cases"
  on public.cases for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage logs for their own cases"
  on public.progress_logs for all
  using (auth.uid() = (select user_id from public.cases where id = case_id))
  with check (auth.uid() = (select user_id from public.cases where id = case_id));

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger cases_updated_at
  before update on public.cases
  for each row execute function update_updated_at();
