import type { CaseStatus } from '@/lib/types';
import { STATUS_COLORS } from '@/lib/constants';

export default function StatusBadge({ status }: { status: CaseStatus }) {
  const colors = STATUS_COLORS[status];
  return (
    <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
      {status}
    </span>
  );
}
