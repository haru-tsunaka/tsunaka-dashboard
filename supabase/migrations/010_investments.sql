-- 投資（機材・PCなど、案件にひもづかない長く使うもの）
-- あゆみの「投資と回収」で、入金済みの粗利がどれだけ投資を取り戻したかを見る
-- Supabase SQL Editor で実行してください

create table public.investments (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  amount        integer not null check (amount >= 0),
  category      text not null default '機材',
  purchased_at  date,
  note          text,
  created_at    timestamptz default now(),
  user_id       uuid references auth.users(id) not null
);

alter table public.investments
  add constraint investment_category_check
  check (category in ('機材', 'PC・ソフト', '学び', 'その他'));

-- RLS：お金の情報なので owner だけ
alter table public.investments enable row level security;

create policy "Owner can read investments"
  on public.investments for select
  using (public.get_my_role() = 'owner' and public.get_my_status() = 'approved');

create policy "Owner can insert investments"
  on public.investments for insert
  with check (public.get_my_role() = 'owner' and public.get_my_status() = 'approved');

create policy "Owner can update investments"
  on public.investments for update
  using (public.get_my_role() = 'owner' and public.get_my_status() = 'approved');

create policy "Owner can delete investments"
  on public.investments for delete
  using (public.get_my_role() = 'owner' and public.get_my_status() = 'approved');
