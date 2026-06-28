import { createClient } from '@/lib/supabase/server';
import type { Case, CaseStatus } from '@/lib/types';
import { CASE_STATUSES } from '@/lib/constants';
import CaseCard from '@/components/CaseCard';
import Link from 'next/link';
import { requireApprovedUser, canSeeFinancials } from '@/lib/auth';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: filterStatus } = await searchParams;
  const profile = await requireApprovedUser();
  const showFinancials = canSeeFinancials(profile.role);
  const supabase = await createClient();

  let query = supabase
    .from('cases')
    .select('*')
    .order('updated_at', { ascending: false });

  if (filterStatus && CASE_STATUSES.includes(filterStatus as CaseStatus)) {
    query = query.eq('status', filterStatus);
  }

  const { data: cases } = await query;
  const allCases = ((cases || []) as Case[]).sort((a, b) => {
    const aDate = a.next_action_by;
    const bDate = b.next_action_by;
    if (!aDate && !bDate) return 0;
    if (!aDate) return 1;
    if (!bDate) return -1;
    return new Date(aDate).getTime() - new Date(bDate).getTime();
  });
  const activeCases = allCases.filter((c) => c.status !== '完了');
  const completedCases = allCases.filter((c) => c.status === '完了');
  const showSplit = !filterStatus || filterStatus === '';

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 md:py-8">
      {/* Filter tabs */}
      <div className="flex items-center gap-0.5 mb-6 md:mb-8 overflow-x-auto pb-2 border-b border-brand-border scrollbar-hide -mx-4 px-4">
        <FilterTab label="全て" value="" current={filterStatus} />
        {CASE_STATUSES.map((s) => (
          <FilterTab key={s} label={s} value={s} current={filterStatus} />
        ))}
      </div>

      {/* Case grid */}
      {allCases.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(showSplit ? activeCases : allCases).map((c: Case) => (
              <CaseCard key={c.id} c={c} showFinancials={showFinancials} />
            ))}
          </div>

          {/* 完了案件（全て表示時のみ分離） */}
          {showSplit && completedCases.length > 0 && (
            <>
              <div className="flex items-center gap-3 mt-10 mb-4">
                <div className="flex-1 h-px bg-brand-border" />
                <span className="text-xs text-brand-muted">完了 ({completedCases.length})</span>
                <div className="flex-1 h-px bg-brand-border" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedCases.map((c: Case) => (
                  <CaseCard key={c.id} c={c} showFinancials={showFinancials} />
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <p className="text-brand-muted text-sm mb-6">まだおもいがありません</p>
          <Link
            href="/cases/new"
            className="inline-block px-8 py-3 rounded-lg bg-navy text-white font-medium text-sm tracking-wide hover:bg-navy-light transition-colors"
          >
            最初のおもいをつくる
          </Link>
        </div>
      )}

      {/* FAB - mobile */}
      <Link
        href="/cases/new"
        className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-5 w-14 h-14 rounded-xl bg-navy text-white flex items-center justify-center shadow-lg hover:bg-navy-light transition-colors text-2xl md:hidden active:scale-95"
      >
        +
      </Link>
      {/* FAB - desktop */}
      <div className="hidden md:block fixed bottom-8 right-8">
        <Link
          href="/cases/new"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-navy text-white font-medium text-sm tracking-wide shadow-lg hover:bg-navy-light transition-colors"
        >
          + あたらしいおもい
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
      className={`whitespace-nowrap px-3 py-2 text-sm transition-colors border-b-2 -mb-px ${
        isActive
          ? 'border-navy text-navy font-medium'
          : 'border-transparent text-brand-muted hover:text-navy/70'
      }`}
    >
      {label}
    </Link>
  );
}
