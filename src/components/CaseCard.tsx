import Link from 'next/link';
import type { Case } from '@/lib/types';
import StatusBadge from './StatusBadge';
import { PAYMENT_COLORS } from '@/lib/constants';

function formatDate(date: string | null) {
  if (!date) return null;
  const d = new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatYen(amount: number | null) {
  if (amount === null || amount === undefined) return null;
  return `¥${amount.toLocaleString()}`;
}

export default function CaseCard({ c }: { c: Case }) {
  const nearestDate = c.event_date || c.deadline;
  const isOverdue = c.next_action_by && new Date(c.next_action_by) < new Date();

  return (
    <Link href={`/cases/${c.id}`} className="block">
      <div className="bg-white rounded-lg border border-brand-border p-5 hover:shadow-md transition-shadow">
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
          <div className={`text-sm mb-3 ${isOverdue ? 'text-red-600' : 'text-brand-text'}`}>
            <span className="text-brand-muted text-xs">NEXT: </span>
            <span className="line-clamp-1">{c.next_action}</span>
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
