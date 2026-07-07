-- 単発/継続の区別
alter table cases add column is_recurring boolean not null default false;
