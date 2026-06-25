import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Case } from '@/lib/types';
import Link from 'next/link';

const ANNUAL_TARGET = 600000;
const MONTHLY_TARGET = ANNUAL_TARGET / 12;

function formatYen(amount: number) {
  return `¥${Math.round(amount).toLocaleString()}`;
}

function getMonthKey(date: string) {
  const d = new Date(date + 'T00:00:00');
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthLabel(key: string) {
  const [y, m] = key.split('-');
  return `${y}年${Number(m)}月`;
}

export default async function AnalyticsPage() {
  const supabase = await createClient();

  // 権限チェック
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'owner') {
    redirect('/');
  }

  // 案件データ取得
  const { data: cases } = await supabase
    .from('cases')
    .select('*')
    .order('created_at', { ascending: true });

  const allCases = (cases || []) as Case[];

  // 今年度のデータ
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const thisYearCases = allCases.filter((c) => {
    const d = new Date(c.created_at);
    return d.getFullYear() === currentYear;
  });

  // 年間実績
  const annualRevenue = thisYearCases
    .filter((c) => c.payment_status === '入金済み' && c.quoted_amount)
    .reduce((sum, c) => sum + (c.quoted_amount || 0), 0);

  const annualExpenses = thisYearCases
    .filter((c) => c.payment_status === '入金済み')
    .reduce((sum, c) => sum + (c.expenses || 0), 0);

  const annualProfit = annualRevenue - annualExpenses;
  const annualProgress = ANNUAL_TARGET > 0 ? Math.min((annualRevenue / ANNUAL_TARGET) * 100, 100) : 0;

  // 今月の実績
  const thisMonthCases = thisYearCases.filter((c) => {
    const d = new Date(c.created_at);
    return d.getMonth() + 1 === currentMonth;
  });

  const monthlyRevenue = thisMonthCases
    .filter((c) => c.payment_status === '入金済み' && c.quoted_amount)
    .reduce((sum, c) => sum + (c.quoted_amount || 0), 0);

  const monthlyProgress = MONTHLY_TARGET > 0 ? Math.min((monthlyRevenue / MONTHLY_TARGET) * 100, 100) : 0;

  // パイプライン
  const pipeline = {
    negotiating: allCases.filter((c) => c.status === '商談中'),
    preparing: allCases.filter((c) => c.status === '準備中'),
    inProgress: allCases.filter((c) => c.status === '進行中'),
    delivered: allCases.filter((c) => c.status === '納品済み'),
  };

  const pipelineValue = (cases: Case[]) =>
    cases.reduce((sum, c) => sum + (c.quoted_amount || 0), 0);

  // カテゴリ別集計（入金済みのみ）
  const paidCases = thisYearCases.filter((c) => c.payment_status === '入金済み' && c.quoted_amount);
  const categoryMap = new Map<string, { revenue: number; count: number }>();
  paidCases.forEach((c) => {
    const cat = c.category || 'other';
    const existing = categoryMap.get(cat) || { revenue: 0, count: 0 };
    categoryMap.set(cat, {
      revenue: existing.revenue + (c.quoted_amount || 0),
      count: existing.count + 1,
    });
  });

  // 月別推移（今年）
  const monthlyMap = new Map<string, { revenue: number; expenses: number; count: number }>();
  for (let m = 1; m <= 12; m++) {
    const key = `${currentYear}-${String(m).padStart(2, '0')}`;
    monthlyMap.set(key, { revenue: 0, expenses: 0, count: 0 });
  }
  thisYearCases
    .filter((c) => c.payment_status === '入金済み')
    .forEach((c) => {
      const key = getMonthKey(c.created_at);
      const existing = monthlyMap.get(key);
      if (existing) {
        monthlyMap.set(key, {
          revenue: existing.revenue + (c.quoted_amount || 0),
          expenses: existing.expenses + (c.expenses || 0),
          count: existing.count + 1,
        });
      }
    });

  // 全案件数
  const totalCases = allCases.length;
  const activeCases = allCases.filter((c) => c.status !== '完了').length;
  const avgDealSize = paidCases.length > 0
    ? paidCases.reduce((sum, c) => sum + (c.quoted_amount || 0), 0) / paidCases.length
    : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-navy text-2xl font-bold">KPI</h1>
        <Link href="/" className="text-brand-muted text-sm hover:text-navy transition-colors">
          案件一覧へ &rarr;
        </Link>
      </div>

      {/* 年間目標 */}
      <div className="bg-white rounded-lg border border-brand-border p-6 mb-6">
        <SectionLabel label="年間目標" />
        <div className="mb-4">
          <div className="flex items-end justify-between mb-2">
            <span className="text-sm text-brand-muted">{currentYear}年度</span>
            <span className="text-sm font-medium">
              {formatYen(annualRevenue)} / {formatYen(ANNUAL_TARGET)}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-4">
            <div
              className="bg-navy rounded-full h-4 transition-all duration-500"
              style={{ width: `${annualProgress}%` }}
            />
          </div>
          <p className="text-right text-xs text-brand-muted mt-1">達成率 {Math.round(annualProgress)}%</p>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <KpiCard label="売上" value={formatYen(annualRevenue)} />
          <KpiCard label="経費" value={formatYen(annualExpenses)} />
          <KpiCard label="粗利" value={formatYen(annualProfit)} />
        </div>
      </div>

      {/* 今月 */}
      <div className="bg-white rounded-lg border border-brand-border p-6 mb-6">
        <SectionLabel label="今月" />
        <div className="mb-4">
          <div className="flex items-end justify-between mb-2">
            <span className="text-sm text-brand-muted">{currentMonth}月</span>
            <span className="text-sm font-medium">
              {formatYen(monthlyRevenue)} / {formatYen(MONTHLY_TARGET)}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-4">
            <div
              className="bg-gold rounded-full h-4 transition-all duration-500"
              style={{ width: `${monthlyProgress}%` }}
            />
          </div>
          <p className="text-right text-xs text-brand-muted mt-1">
            あと {formatYen(Math.max(MONTHLY_TARGET - monthlyRevenue, 0))}
          </p>
        </div>
      </div>

      {/* パイプライン */}
      <div className="bg-white rounded-lg border border-brand-border p-6 mb-6">
        <SectionLabel label="パイプライン" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <PipelineCard label="商談中" count={pipeline.negotiating.length} value={pipelineValue(pipeline.negotiating)} />
          <PipelineCard label="準備中" count={pipeline.preparing.length} value={pipelineValue(pipeline.preparing)} />
          <PipelineCard label="進行中" count={pipeline.inProgress.length} value={pipelineValue(pipeline.inProgress)} />
          <PipelineCard label="納品済み" count={pipeline.delivered.length} value={pipelineValue(pipeline.delivered)} />
        </div>
      </div>

      {/* 概要 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-brand-border p-5 text-center">
          <p className="text-xs text-brand-muted mb-1">全案件数</p>
          <p className="text-2xl font-bold text-navy">{totalCases}</p>
        </div>
        <div className="bg-white rounded-lg border border-brand-border p-5 text-center">
          <p className="text-xs text-brand-muted mb-1">進行中</p>
          <p className="text-2xl font-bold text-navy">{activeCases}</p>
        </div>
        <div className="bg-white rounded-lg border border-brand-border p-5 text-center">
          <p className="text-xs text-brand-muted mb-1">平均単価</p>
          <p className="text-2xl font-bold text-navy">{avgDealSize > 0 ? formatYen(avgDealSize) : '-'}</p>
        </div>
      </div>

      {/* 月別推移 */}
      <div className="bg-white rounded-lg border border-brand-border p-6 mb-6">
        <SectionLabel label="月別推移" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border">
                <th className="text-left text-xs text-brand-muted py-2 font-medium">月</th>
                <th className="text-right text-xs text-brand-muted py-2 font-medium">売上</th>
                <th className="text-right text-xs text-brand-muted py-2 font-medium">経費</th>
                <th className="text-right text-xs text-brand-muted py-2 font-medium">粗利</th>
                <th className="text-right text-xs text-brand-muted py-2 font-medium">件数</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(monthlyMap.entries())
                .filter(([key]) => {
                  const m = Number(key.split('-')[1]);
                  return m <= currentMonth;
                })
                .map(([key, data]) => (
                  <tr key={key} className="border-b border-brand-border/50">
                    <td className="py-2 text-brand-text">{getMonthLabel(key)}</td>
                    <td className="py-2 text-right">{formatYen(data.revenue)}</td>
                    <td className="py-2 text-right text-brand-muted">{formatYen(data.expenses)}</td>
                    <td className="py-2 text-right">{formatYen(data.revenue - data.expenses)}</td>
                    <td className="py-2 text-right text-brand-muted">{data.count}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* カテゴリ別 */}
      {categoryMap.size > 0 && (
        <div className="bg-white rounded-lg border border-brand-border p-6">
          <SectionLabel label="カテゴリ別売上" />
          <div className="space-y-3">
            {Array.from(categoryMap.entries()).map(([cat, data]) => (
              <div key={cat} className="flex items-center justify-between">
                <span className="text-sm">{cat}</span>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-brand-muted">{data.count}件</span>
                  <span className="text-sm font-medium">{formatYen(data.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-6 h-px bg-gold" />
      <span className="text-xs font-semibold text-gold tracking-widest">{label}</span>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-xs text-brand-muted mb-1">{label}</p>
      <p className="text-lg font-bold text-brand-text">{value}</p>
    </div>
  );
}

function PipelineCard({ label, count, value }: { label: string; count: number; value: number }) {
  return (
    <div className="bg-brand-bg rounded-lg p-4 text-center">
      <p className="text-xs text-brand-muted mb-1">{label}</p>
      <p className="text-lg font-bold text-navy">{count}<span className="text-xs font-normal text-brand-muted ml-0.5">件</span></p>
      <p className="text-xs text-brand-muted mt-1">{formatYen(value)}</p>
    </div>
  );
}
