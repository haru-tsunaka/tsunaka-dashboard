-- hearing → meeting に改名

-- カラム名変更
alter table public.cases rename column est_hours_hearing to est_hours_meeting;
alter table public.cases rename column actual_hours_hearing to actual_hours_meeting;

-- progress_logs の work_phase 値を変更
update public.progress_logs set work_phase = 'meeting' where work_phase = 'hearing';
