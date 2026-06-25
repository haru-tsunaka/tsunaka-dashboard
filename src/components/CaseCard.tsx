import Link from 'next/link';
import type { Case } from '@/lib/types';
import StatusBadge from './StatusBadge';
import { PAYMENT_COLORS } from '@/lib/constants';

function formatDate(date: string | null) {
  if (!date) return null;
  const d = new Date(date);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

function formatDateShort(date: string | null) {
  if (!date) return null;
  const d = new Date(date + 'T00:00:00');
  const now = new Date();
  if (d.getFullYear() === now.getFullYear()) {
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

function formatDateTime(date: string | null) {
  if (!date) return null;
  const d = new Date(date);
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const dateStr = jst.getUTCFullYear() === now.getUTCFullYear()
    ? `${jst.getUTCMonth() + 1}/${jst.getUTCDate()}`
    : `${jst.getUTCFullYear()}/${jst.getUTCMonth() + 1}/${jst.getUTCDate()}`;
  const h = jst.getUTCHours();
  const m = jst.getUTCMinutes();
  if (h === 0 && m === 0) return dateStr;
  return `${dateStr} ${h}:${String(m).padStart(2, '0')}`;
}

function formatYen(amount: number | null) {
  if (amount === null || amount === undefined) return null;
  return `¥${amount.toLocaleString()}`;
}

export default function CaseCard({ c }: { c: Case }) {
  const nearestDate = c.event_date || c.deadline;
  const isOverdue = c.next_action_by && new Date(c.next_action_by) < new Date();
  const isCompleted = c.status === '完了';

  return (
    <Link href={`/cases/${c.id}`} className="block">
      <div className={`rounded-lg border p-5 transition-shadow ${
        isCompleted
          ? 'bg-gray-200 border-gray-300'
          : isOverdue
            ? 'bg-red-50 border-red-300 hover:shadow-md'
            : 'bg-white border-brand-border hover:shadow-md'
      }`}>
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-serif font-bold text-navy text-base truncate">{c.name}</h3>
            {c.client_name && (
              <p className="text-brand-muted text-xs mt-0.5">{c.client_name}</p>
            )}
          </div>
          <StatusBadge status={c.status} />
        </div>

        {c.next_action && (
          <div className={`mb-3 ${isOverdue ? 'text-red-600' : 'text-brand-text'}`}>
            <p className="text-sm line-clamp-1">{c.next_action}</p>
            {c.next_action_by && (
              <p className={`text-xs mt-0.5 ${isOverdue ? 'text-red-600 font-medium' : 'text-brand-muted'}`}>
                {isOverdue ? '期限切れ ' : ''}{formatDateTime(c.next_action_by)}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-brand-muted">
          <div className="flex items-center gap-3">
            {nearestDate && (
              <span>{formatDate(nearestDate)}</span>
            )}
            {c.quoted_amount !== null && (
              <span className="flex items-center gap-1">
                {formatYen(c.quoted_amount)}
                <span className={`w-1.5 h-1.5 rounded-full ${PAYMENT_COLORS[c.payment_status]}`} />
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
