import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Case } from '@/lib/types';
import Link from 'next/link';
import TargetForm from '@/components/TargetForm';

import { formatYen } from '@/lib/formatting';

function getMonthKey(date: string) {
  const d = new Date(date + 'T00:00:00');
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthLabel(key: string) {
  const [, m] = key.split('-');
  return `${Number(m)}月`;
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const supabase = await createClient();
  const sp = await searchParams;

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

  // 年度のリストを作成（データが存在する年 + 今年）
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const yearSet = new Set<number>([currentYear]);
  allCases.forEach((c) => {
    const dateStr = c.payment_date || c.created_at;
    const y = new Date(dateStr).getFullYear();
    if (y >= 2020 && y <= currentYear + 1) yearSet.add(y);
  });
  const availableYears = Array.from(yearSet).sort((a, b) => b - a);

  // 選択中の年度
  const selectedYear = sp.year ? Number(sp.year) : currentYear;
  const isCurrentYear = selectedYear === currentYear;

  // 目標取得
  const { data: targetData } = await supabase
    .from('targets')
    .select('*')
    .eq('year', selectedYear)
    .single();

  const annualTarget = targetData?.annual_target || 0;
  const monthlyTarget = annualTarget > 0 ? annualTarget / 12 : 0;

  // 選択年のデータ
  const yearCases = allCases.filter((c) => {
    const dateStr = c.payment_date || c.created_at;
    const d = new Date(dateStr);
    return d.getFullYear() === selectedYear;
  });

  // 年間実績
  const annualRevenue = yearCases
    .filter((c) => c.payment_status === '入金済み' && c.payment_amount)
    .reduce((sum, c) => sum + (c.payment_amount || 0), 0);

  const annualExpenses = yearCases
    .filter((c) => c.payment_status === '入金済み')
    .reduce((sum, c) => sum + (c.expenses || 0), 0);

  const annualProfit = annualRevenue - annualExpenses;
  const annualProgress = annualTarget > 0 ? Math.min((annualRevenue / annualTarget) * 100, 100) : 0;

  // 今月の実績（今年のみ）
  const thisMonthCases = isCurrentYear
    ? yearCases.filter((c) => {
        const dateStr = c.payment_date || c.created_at;
        const d = new Date(dateStr);
        return d.getMonth() + 1 === currentMonth;
      })
    : [];

  const monthlyRevenue = thisMonthCases
    .filter((c) => c.payment_status === '入金済み' && c.payment_amount)
    .reduce((sum, c) => sum + (c.payment_amount || 0), 0);

  const monthlyProgress = monthlyTarget > 0 ? Math.min((monthlyRevenue / monthlyTarget) * 100, 100) : 0;

  // パイプライン（全案件、年度関係なし）
  const pipeline = {
    negotiating: allCases.filter((c) => c.status === '商談中'),
    preparing: allCases.filter((c) => c.status === '準備中'),
    inProgress: allCases.filter((c) => c.status === '進行中'),
    delivered: allCases.filter((c) => c.status === '納品済み'),
  };

  const pipelineValue = (cases: Case[]) =>
    cases.reduce((sum, c) => sum + (c.quoted_amount || 0), 0);

  // カテゴリ別集計（入金済みのみ）
  const paidCases = yearCases.filter((c) => c.payment_status === '入金済み' && c.payment_amount);
  const categoryMap = new Map<string, { revenue: number; count: number }>();
  paidCases.forEach((c) => {
    const cat = c.category || 'other';
    const existing = categoryMap.get(cat) || { revenue: 0, count: 0 };
    categoryMap.set(cat, {
      revenue: existing.revenue + (c.payment_amount || 0),
      count: existing.count + 1,
    });
  });

  // 月別推移
  const monthlyMap = new Map<string, { revenue: number; expenses: number; count: number }>();
  const maxMonth = isCurrentYear ? currentMonth : 12;
  for (let m = 1; m <= maxMonth; m++) {
    const key = `${selectedYear}-${String(m).padStart(2, '0')}`;
    monthlyMap.set(key, { revenue: 0, expenses: 0, count: 0 });
  }
  yearCases
    .filter((c) => c.payment_status === '入金済み')
    .forEach((c) => {
      const key = getMonthKey(c.payment_date || c.created_at);
      const existing = monthlyMap.get(key);
      if (existing) {
        monthlyMap.set(key, {
          revenue: existing.revenue + (c.payment_amount || 0),
          expenses: existing.expenses + (c.expenses || 0),
          count: existing.count + 1,
        });
      }
    });

  // 概要
  const totalCases = yearCases.length;
  const activeCases = yearCases.filter((c) => c.status !== '完了').length;
  const completedCases = yearCases.filter((c) => c.status === '完了').length;
  const avgDealSize = paidCases.length > 0
    ? paidCases.reduce((sum, c) => sum + (c.payment_amount || 0), 0) / paidCases.length
    : 0;

  // リピートクライアント
  const clientCounts = new Map<string, number>();
  yearCases.forEach((c) => {
    const name = c.client_name?.trim();
    if (name) clientCounts.set(name, (clientCounts.get(name) || 0) + 1);
  });
  const uniqueClients = clientCounts.size;
  const repeatClients = Array.from(clientCounts.values()).filter((n) => n >= 2).length;
  const repeatRate = uniqueClients > 0 ? Math.round((repeatClients / uniqueClients) * 100) : 0;

  // 平均対応期間（イベント日→納品完了まで、完了案件のみ）
  const completedWithDates = yearCases.filter(
    (c) => c.status === '完了' && c.event_date && c.payment_date
  );
  const avgTurnaroundDays = completedWithDates.length > 0
    ? Math.round(
        completedWithDates.reduce((sum, c) => {
          const start = new Date(c.event_date! + 'T00:00:00').getTime();
          const end = new Date(c.payment_date! + 'T00:00:00').getTime();
          return sum + (end - start) / (1000 * 60 * 60 * 24);
        }, 0) / completedWithDates.length
      )
    : null;

  // ペースライン（今日時点での理想進捗）
  const dayOfYear = Math.floor((now.getTime() - new Date(currentYear, 0, 1).getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const daysInYear = (currentYear % 4 === 0 && (currentYear % 100 !== 0 || currentYear % 400 === 0)) ? 366 : 365;
  const yearPacePct = Math.round((dayOfYear / daysInYear) * 100);

  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const monthPacePct = Math.round((now.getDate() / daysInMonth) * 100);

  // 目標設定アクション
  async function setTarget(formData: FormData) {
    'use server';
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const year = Number(formData.get('year'));
    const amount = Number(formData.get('annual_target'));

    const { data: existing } = await supabase
      .from('targets')
      .select('id')
      .eq('year', year)
      .single();

    if (existing) {
      await supabase
        .from('targets')
        .update({ annual_target: amount })
        .eq('year', year);
    } else {
      await supabase
        .from('targets')
        .insert({ year, annual_target: amount, user_id: user.id });
    }

    redirect(`/analytics?year=${year}`);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-navy text-2xl font-bold">あゆみ</h1>
        <Link href="/" className="text-brand-muted text-sm hover:text-navy transition-colors">
          おもいへ &rarr;
        </Link>
      </div>

      {/* 年度切り替え */}
      <div className="flex items-center gap-2 mb-6">
        {availableYears.map((y) => (
          <Link
            key={y}
            href={`/analytics?year=${y}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              y === selectedYear
                ? 'bg-navy text-white'
                : 'bg-white border border-brand-border text-brand-muted hover:border-navy hover:text-navy'
            }`}
          >
            {y}年
          </Link>
        ))}
      </div>

      {/* 年間目標 */}
      <div className="bg-white rounded-lg border border-brand-border p-6 mb-6">
        <SectionLabel label="年間目標" />
        {annualTarget > 0 ? (
          <>
            <div className="mb-4">
              <div className="flex items-end justify-between mb-2">
                <span className="text-sm text-brand-muted">{selectedYear}年</span>
                <span className="text-sm font-medium">
                  {formatYen(annualRevenue)} / {formatYen(annualTarget)}
                </span>
              </div>
              <div className="relative w-full bg-gray-100 rounded-full h-4">
                <div
                  className="bg-navy rounded-full h-4 transition-all duration-500"
                  style={{ width: `${annualProgress}%` }}
                />
                {isCurrentYear && annualTarget > 0 && (
                  <div
                    className="absolute top-0 h-4 w-0.5 bg-gold"
                    style={{ left: `${yearPacePct}%` }}
                    title={`目安: ${yearPacePct}%`}
                  />
                )}
              </div>
              <div className="flex items-center justify-between mt-1">
                {isCurrentYear && annualTarget > 0 ? (
                  <p className="text-[10px] text-gold">目安 {yearPacePct}%</p>
                ) : <span />}
                <p className="text-xs text-brand-muted">達成率 {Math.round(annualProgress)}%</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <StatCard label="売上" value={formatYen(annualRevenue)} />
              <StatCard label="経費" value={formatYen(annualExpenses)} />
              <StatCard label="粗利" value={formatYen(annualProfit)} />
            </div>
          </>
        ) : (
          <div className="grid grid-cols-3 gap-4 mb-4">
            <StatCard label="売上" value={formatYen(annualRevenue)} />
            <StatCard label="経費" value={formatYen(annualExpenses)} />
            <StatCard label="粗利" value={formatYen(annualProfit)} />
          </div>
        )}
        {/* 目標設定 */}
        <TargetForm year={selectedYear} currentTarget={annualTarget} action={setTarget} />
      </div>

      {/* 今月（今年のみ表示） */}
      {isCurrentYear && monthlyTarget > 0 && (
        <div className="bg-white rounded-lg border border-brand-border p-6 mb-6">
          <SectionLabel label="今月" />
          <div className="mb-4">
            <div className="flex items-end justify-between mb-2">
              <span className="text-sm text-brand-muted">{currentMonth}月</span>
              <span className="text-sm font-medium">
                {formatYen(monthlyRevenue)} / {formatYen(monthlyTarget)}
              </span>
            </div>
            <div className="relative w-full bg-gray-100 rounded-full h-4">
              <div
                className="bg-gold rounded-full h-4 transition-all duration-500"
                style={{ width: `${monthlyProgress}%` }}
              />
              <div
                className="absolute top-0 h-4 w-0.5 bg-navy"
                style={{ left: `${monthPacePct}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[10px] text-navy">目安 {monthPacePct}%</p>
              <p className="text-xs text-brand-muted">
                あと {formatYen(Math.max(monthlyTarget - monthlyRevenue, 0))}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* パイプライン（今年のみ） */}
      {isCurrentYear && (
        <div className="bg-white rounded-lg border border-brand-border p-6 mb-6">
          <SectionLabel label="パイプライン" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <PipelineCard label="商談中" count={pipeline.negotiating.length} value={pipelineValue(pipeline.negotiating)} />
            <PipelineCard label="準備中" count={pipeline.preparing.length} value={pipelineValue(pipeline.preparing)} />
            <PipelineCard label="進行中" count={pipeline.inProgress.length} value={pipelineValue(pipeline.inProgress)} />
            <PipelineCard label="納品済み" count={pipeline.delivered.length} value={pipelineValue(pipeline.delivered)} />
          </div>
        </div>
      )}

      {/* 概要 */}
      <div className="bg-white rounded-lg border border-brand-border p-6 mb-6">
        <SectionLabel label="概要" />
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs text-brand-muted mb-1">おもいの数</p>
            <p className="text-2xl font-bold text-navy">{totalCases}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-brand-muted mb-1">完了</p>
            <p className="text-2xl font-bold text-navy">{completedCases}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-brand-muted mb-1">平均単価</p>
            <p className="text-2xl font-bold text-navy">{avgDealSize > 0 ? formatYen(avgDealSize) : '-'}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-brand-border/50">
          <div className="text-center">
            <p className="text-xs text-brand-muted mb-1">クライアント数</p>
            <p className="text-2xl font-bold text-navy">{uniqueClients}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-brand-muted mb-1">リピート率</p>
            <p className="text-2xl font-bold text-navy">{uniqueClients > 0 ? `${repeatRate}%` : '-'}</p>
            {repeatClients > 0 && (
              <p className="text-[10px] text-brand-muted mt-0.5">{repeatClients}社がリピート</p>
            )}
          </div>
          <div className="text-center">
            <p className="text-xs text-brand-muted mb-1">平均対応日数</p>
            <p className="text-2xl font-bold text-navy">{avgTurnaroundDays !== null ? `${avgTurnaroundDays}日` : '-'}</p>
          </div>
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
              {Array.from(monthlyMap.entries()).map(([key, data]) => (
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

function StatCard({ label, value }: { label: string; value: string }) {
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
