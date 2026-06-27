'use client';

import type { ProgressLog } from '@/lib/types';
import Link from 'next/link';
import { formatDateTimeFull, formatHoursJa, phaseLabel } from '@/lib/formatting';

export default function ProgressLogSection({
  logs,
  caseId,
  cancelLogAction,
}: {
  logs: ProgressLog[];
  caseId: string;
  cancelLogAction: (formData: FormData) => Promise<void>;
}) {
  return (
    <div>
      {/* きろくページへのリンク */}
      <div className="mb-6">
        <Link
          href={`/log?case_id=${caseId}`}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-navy text-white text-xs font-medium tracking-wide hover:bg-navy-light transition-colors active:scale-[0.98]"
        >
          きろくを追加
        </Link>
      </div>

      {/* Timeline */}
      {logs.length > 0 ? (
        <div className="relative pl-6">
          <div className="space-y-6">
            {logs.map((log, index) => {
              const cancelled = log.is_cancelled;
              const title = (log.title || '').replace(/[\u2705\u2611\uFE0F]\s?/g, '');
              const content = (log.content || '').replace(/[\u2705\u2611\uFE0F]\s?/g, '');
              const displayTitle = title || content.split('\n')[0] || '';
              const displayContent = title ? content : content.split('\n').slice(1).join('\n');
              const phase = phaseLabel(log.work_phase);
              return (
                <div key={log.id} className={`relative ${cancelled ? 'opacity-50' : ''}`}>
                  <div className={`absolute left-[-20px] top-1.5 w-3 h-3 rounded-full border-2 z-10 ${cancelled ? 'border-brand-muted bg-gray-100' : 'border-gold bg-white'}`} />
                  {index < logs.length - 1 && (
                    <div className="absolute left-[-15px] top-[12px] w-px bg-gold/30" style={{ bottom: '-36px' }} />
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-brand-muted mb-1">
                        {formatDateTimeFull(log.created_at)}
                        {phase && (
                          <span className="ml-2 px-1.5 py-0.5 bg-navy/10 text-navy rounded text-[10px] font-medium">{phase}</span>
                        )}
                        {log.hours !== null && Number(log.hours) > 0 && (
                          <span className={`ml-1.5 font-medium ${cancelled ? 'text-brand-muted' : 'text-navy'}`}>{formatHoursJa(Number(log.hours))}</span>
                        )}
                        {cancelled && (
                          <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-500 rounded text-[10px] font-medium">取消</span>
                        )}
                      </p>
                      {displayTitle && (
                        <p className={`text-sm font-medium ${cancelled ? 'line-through' : ''}`}>{displayTitle}</p>
                      )}
                      {displayContent && (
                        <p className={`text-xs text-brand-muted whitespace-pre-wrap mt-0.5 ${cancelled ? 'line-through' : ''}`}>{displayContent}</p>
                      )}
                    </div>
                    {!cancelled && (
                      <form action={cancelLogAction}>
                        <input type="hidden" name="log_id" value={log.id} />
                        <button
                          type="submit"
                          className="text-[10px] text-brand-muted hover:text-red-500 transition-colors shrink-0 mt-0.5"
                          onClick={(e) => {
                            if (!confirm('このログを取り消しますか？（見え消しになります）')) {
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
      ) : (
        <p className="text-brand-muted text-sm text-center py-4">まだログがありません</p>
      )}
    </div>
  );
}
