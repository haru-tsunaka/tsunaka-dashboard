-- 納品物テーブル（1つの案件に複数の納品物を紐づける）
create table public.case_deliverables (
  id              uuid primary key default gen_random_uuid(),
  case_id         uuid references public.cases(id) on delete cascade not null,
  title           text not null,
  description     text,
  amount          integer,
  expense_amount  integer default 0,
  status          text default '予定',
  shooting_date   date,
  due_date        date,
  payment_date    date,
  sort_order      integer default 0,
  created_at      timestamptz default now(),
  user_id         uuid references auth.users(id) not null
);

-- CHECK制約
alter table public.case_deliverables
  add constraint deliverable_status_check
  check (status in ('予定', '撮影前', '編集中', '納品済み', '入金済み'));

-- インデックス
create index idx_deliverables_case on public.case_deliverables(case_id);

-- RLS
alter table public.case_deliverables enable row level security;

create policy "Approved users can read deliverables"
  on public.case_deliverables for select
  using (get_my_status() = 'approved');

create policy "Approved users can insert deliverables"
  on public.case_deliverables for insert
  with check (get_my_status() = 'approved');

create policy "Approved users can update deliverables"
  on public.case_deliverables for update
  using (get_my_status() = 'approved');

create policy "Approved users can delete deliverables"
  on public.case_deliverables for delete
  using (get_my_status() = 'approved');
