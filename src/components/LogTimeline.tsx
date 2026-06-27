'use client';

import type { ProgressLog } from '@/lib/types';
import Link from 'next/link';
import { formatTime, formatHoursJa, phaseLabel } from '@/lib/formatting';

type LogWithCase = ProgressLog & { cases: { name: string; client_name: string | null } };

export default function LogTimeline({
  logs,
  cancelAction,
}: {
  logs: LogWithCase[];
  cancelAction: (formData: FormData) => Promise<void>;
}) {
  if (logs.length === 0) {
    return <p className="text-brand-muted text-sm text-center py-8">まだきろくがありません</p>;
  }

  // 日付ごとにグルーピング
  const grouped = new Map<string, LogWithCase[]>();
  logs.forEach((log) => {
    const d = new Date(log.created_at);
    const key = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
    const arr = grouped.get(key) || [];
    arr.push(log);
    grouped.set(key, arr);
  });

  return (
    <div className="space-y-6">
      {Array.from(grouped.entries()).map(([dateStr, dayLogs]) => (
        <div key={dateStr}>
          <p className="text-xs font-medium text-brand-muted mb-3">{dateStr}</p>
          <div className="space-y-3">
            {dayLogs.map((log) => {
              const cancelled = log.is_cancelled;
              const phase = phaseLabel(log.work_phase);
              const hasTime = log.started_at && log.ended_at;
              return (
                <div
                  key={log.id}
                  className={`bg-white rounded-lg border border-brand-border p-4 ${cancelled ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {/* 案件名 */}
                      <Link
                        href={`/cases/${log.case_id}`}
                        className="text-[10px] text-navy hover:underline"
                      >
                        {log.cases.name}
                        {log.cases.client_name && <span className="text-brand-muted ml-1">({log.cases.client_name})</span>}
                      </Link>

                      {/* タイトル */}
                      <p className={`text-sm font-medium mt-0.5 ${cancelled ? 'line-through' : ''}`}>
                        {log.title}
                      </p>

                      {/* 工程・時間 */}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {phase && (
                          <span className="px-1.5 py-0.5 bg-navy/10 text-navy rounded text-[10px] font-medium">{phase}</span>
                        )}
                        {hasTime && (
                          <span className="text-[10px] text-brand-muted">
                            {formatTime(log.started_at!)} - {formatTime(log.ended_at!)}
                          </span>
                        )}
                        {log.hours !== null && Number(log.hours) > 0 && (
                          <span className={`text-xs font-medium ${cancelled ? 'text-brand-muted' : 'text-navy'}`}>
                            {formatHoursJa(Number(log.hours))}
                          </span>
                        )}
                        {cancelled && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-500 rounded text-[10px] font-medium">取消</span>
                        )}
                      </div>

                      {/* メモ */}
                      {log.content && (
                        <p className={`text-xs text-brand-muted mt-1 whitespace-pre-wrap ${cancelled ? 'line-through' : ''}`}>
                          {log.content}
                        </p>
                      )}
                    </div>

                    {!cancelled && (
                      <form action={cancelAction}>
                        <input type="hidden" name="log_id" value={log.id} />
                        <input type="hidden" name="case_id" value={log.case_id} />
                        <button
                          type="submit"
                          className="text-[10px] text-brand-muted hover:text-red-500 transition-colors shrink-0"
                          onClick={(e) => {
                            if (!confirm('このきろくを取り消しますか？')) {
                              e.preventDefault();
                            }
                          }}
                        >
                          取消
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
