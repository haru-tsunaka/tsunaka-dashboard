-- プロフィール・権限テーブル
-- ※すでにSQL Editorで実行済みの場合は不要

create table public.profiles (
  id uuid primary key references auth.users(id),
  role text default 'member',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Only owner can update profiles"
  on public.profiles for update
  using (auth.uid() = id);

-- 最初のユーザーをownerに設定
insert into public.profiles (id, role)
select id, 'owner' from auth.users limit 1;
