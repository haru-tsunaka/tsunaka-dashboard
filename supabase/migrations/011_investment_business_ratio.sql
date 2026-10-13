-- 投資の家事按分：事業で使う割合（%）
-- amount は本体価格のまま残し、投資として数えるのは amount × business_ratio / 100
-- Supabase SQL Editor で実行してください

alter table public.investments
  add column business_ratio integer not null default 100
  check (business_ratio between 1 and 100);
