import { createClient } from '@/lib/supabase/server';
import type { Case, CaseStatus } from '@/lib/types';
import { CASE_STATUSES } from '@/lib/constants';
import CaseCard from '@/components/CaseCard';
import Link from 'next/link';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: filterStatus } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('cases')
    .select('*')
    .order('updated_at', { ascending: false });

  if (filterStatus && CASE_STATUSES.includes(filterStatus as CaseStatus)) {
    query = query.eq('status', filterStatus);
  }

  const { data: cases } = await query;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
        <FilterTab label="全て" value="" current={filterStatus} />
        {CASE_STATUSES.map((s) => (
          <FilterTab key={s} label={s} value={s} current={filterStatus} />
        ))}
      </div>

      {/* Case grid */}
      {cases && cases.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cases.map((c: Case) => (
            <CaseCard key={c.id} c={c} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-brand-muted text-sm mb-6">まだ案件がありません</p>
          <Link
            href="/cases/new"
            className="inline-block px-8 py-3 rounded-lg bg-navy text-white font-medium text-sm tracking-wide hover:bg-navy-light transition-colors"
          >
            最初の案件を追加する
          </Link>
        </div>
      )}

      {/* FAB - mobile */}
      <Link
        href="/cases/new"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-xl bg-navy text-white flex items-center justify-center shadow-lg hover:bg-navy-light transition-colors text-2xl md:hidden"
      >
        +
      </Link>
      {/* FAB - desktop */}
      <div className="hidden md:block fixed bottom-8 right-8">
        <Link
          href="/cases/new"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-navy text-white font-medium text-sm tracking-wide shadow-lg hover:bg-navy-light transition-colors"
        >
          + 新規案件
        </Link>
      </div>
    </div>
  );
}

function FilterTab({
  label,
  value,
  current,
}: {
  label: string;
  value: string;
  current?: string;
}) {
  const isActive = (current || '') === value;
  return (
    <Link
      href={value ? `/?status=${value}` : '/'}
      className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm transition-colors ${
        isActive
          ? 'bg-navy text-white'
          : 'text-brand-muted hover:bg-navy/5'
      }`}
    >
      {label}
    </Link>
  );
}
