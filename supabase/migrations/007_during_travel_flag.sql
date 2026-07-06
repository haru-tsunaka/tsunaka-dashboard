-- 移動中の作業フラグ: 移動ログと時間が重複する作業を識別する
alter table progress_logs
  add column is_during_travel boolean not null default false;
