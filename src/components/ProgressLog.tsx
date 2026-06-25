'use client';

import type { ProgressLog } from '@/lib/types';

function formatDateTime(date: string) {
  const d = new Date(date);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}


export default function ProgressLogSection({
  logs,
  addLogAction,
}: {
  logs: ProgressLog[];
  addLogAction: (formData: FormData) => Promise<void>;
}) {
  return (
    <div>
      {/* Add log form */}
      <form action={addLogAction} className="mb-8 space-y-2">
        <input
          name="title"
          placeholder="タイトル"
          className="w-full px-4 py-3 rounded-lg border border-brand-border text-sm focus:outline-none focus:border-gold transition-colors"
          required
        />
        <textarea
          name="content"
          placeholder="メモ（任意）"
          rows={2}
          className="w-full px-4 py-3 rounded-lg border border-brand-border text-sm focus:outline-none focus:border-gold transition-colors resize-none"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-navy text-white text-xs font-medium tracking-wide hover:bg-navy-light transition-colors"
          >
            追加
          </button>
        </div>
      </form>

      {/* Timeline */}
      {logs.length > 0 ? (
        <div className="relative pl-6">
          <div className="space-y-6">
            {logs.map((log, index) => {
              const title = (log.title || '').replace(/[\u2705\u2611\uFE0F]\s?/g, '');
              const content = (log.content || '').replace(/[\u2705\u2611\uFE0F]\s?/g, '');
              // 旧データ: titleがなくcontentに全部入ってる場合、1行目をtitle扱い
              const displayTitle = title || content.split('\n')[0] || '';
              const displayContent = title ? content : content.split('\n').slice(1).join('\n');
              return (
                <div key={log.id} className="relative">
                  <div className="absolute left-[-20px] top-1.5 w-3 h-3 rounded-full border-2 border-gold bg-white z-10" />
                  {index < logs.length - 1 && (
                    <div className="absolute left-[-15px] top-[12px] w-px bg-gold/30" style={{ bottom: '-36px' }} />
                  )}
                  <p className="text-xs text-brand-muted mb-1">{formatDateTime(log.created_at)}</p>
                  {displayTitle && <p className="text-sm font-medium">{displayTitle}</p>}
                  {displayContent && <p className="text-xs text-brand-muted whitespace-pre-wrap mt-0.5">{displayContent}</p>}
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
