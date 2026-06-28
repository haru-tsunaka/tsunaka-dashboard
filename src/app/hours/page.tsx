import React from 'react';
import { createClient } from '@/lib/supabase/server';
import type { Case, ProgressLog } from '@/lib/types';
import { HOURLY_RATE } from '@/lib/constants';
import Link from 'next/link';
import { formatYen, formatHoursH, phaseLabel } from '@/lib/formatting';
import { requireOwner } from '@/lib/auth';

export default async function HoursPage() {
  await requireOwner();
  const supabase = await createClient();

  const { data: cases } = await supabase
    .from('cases')
    .select('*')
    .order('created_at', { ascending: false });

  const allCases = (cases || []) as Case[];

  const { data: logs } = await supabase
    .from('progress_logs')
    .select('*')
    .eq('is_cancelled', false)
    .order('created_at', { ascending: false });

  const allLogs = (logs || []) as ProgressLog[];

  // --- 工程別集計 ---
  const totalActualByPhase: Record<string, number> = {};
  let totalActualHours = 0;

  allLogs.forEach((log) => {
    const h = Number(log.hours);
    if (log.work_phase && h > 0) {
      totalActualByPhase[log.work_phase] = (totalActualByPhase[log.work_phase] || 0) + h;
      totalActualHours += h;
    }
  });

  // --- 交通費集計 ---
  const totalExpense = allLogs.reduce((sum, log) => sum + (Number(log.expense_amount) || 0), 0);

  // --- 案件別の実績 ---
  const caseHours = allCases
    .map((c) => {
      const caseLogs = allLogs.filter((l) => l.case_id === c.id);
      const total = caseLogs.reduce((sum, l) => sum + (Number(l.hours) || 0), 0);
      const expense = caseLogs.reduce((sum, l) => sum + (Number(l.expense_amount) || 0), 0);
      return { case: c, total, expense };
    })
    .filter((ch) => ch.total > 0)
    .sort((a, b) => b.total - a.total);

  // --- 案件あたり平均工数 ---
  const avgHoursPerCase = caseHours.length > 0
    ? caseHours.reduce((sum, ch) => sum + ch.total, 0) / caseHours.length
    : 0;

  // --- 実効時給 ---
  const paidCasesWithHours = caseHours.filter((ch) => ch.case.payment_status === '入金済み' && ch.case.payment_amount);
  const totalPaidRevenue = paidCasesWithHours.reduce((sum, ch) => sum + (ch.case.payment_amount || 0), 0);
  const totalPaidHours = paidCasesWithHours.reduce((sum, ch) => sum + ch.total, 0);
  const effectiveHourlyRate = totalPaidHours > 0 ? totalPaidRevenue / totalPaidHours : 0;

  // --- 案件別時給ランキング ---
  const caseHourlyRanking = paidCasesWithHours
    .map((ch) => ({
      ...ch,
      hourlyRate: (ch.case.payment_amount || 0) / ch.total,
    }))
    .sort((a, b) => b.hourlyRate - a.hourlyRate);

  // --- 見積もり精度 ---
  const casesWithBoth = allCases.filter((c) => {
    const estTotal = (Number(c.est_hours_meeting) || 0) + (Number(c.est_hours_planning) || 0) +
      (Number(c.est_hours_shooting) || 0) + (Number(c.est_hours_editing) || 0);
    if (estTotal === 0) return false;
    return allLogs.some((l) => l.case_id === c.id && Number(l.hours) > 0);
  });

  const estimateAccuracy = casesWithBoth.map((c) => {
    const estTotal = (Number(c.est_hours_meeting) || 0) + (Number(c.est_hours_planning) || 0) +
      (Number(c.est_hours_shooting) || 0) + (Number(c.est_hours_editing) || 0);
    const caseLogs = allLogs.filter((l) => l.case_id === c.id);
    const actTotal = caseLogs.reduce((sum, l) => sum + (Number(l.hours) || 0), 0);
    return { case: c, estTotal, actTotal, diff: actTotal - estTotal };
  });

  const avgEstimate = estimateAccuracy.length > 0
    ? estimateAccuracy.reduce((sum, a) => sum + a.estTotal, 0) / estimateAccuracy.length
    : 0;
  const avgActual = estimateAccuracy.length > 0
    ? estimateAccuracy.reduce((sum, a) => sum + a.actTotal, 0) / estimateAccuracy.length
    : 0;

  const phaseKeys = ['meeting', 'planning', 'shooting', 'editing'] as const;
  const estFieldMap = {
    meeting: 'est_hours_meeting',
    planning: 'est_hours_planning',
    shooting: 'est_hours_shooting',
    editing: 'est_hours_editing',
  } as const;

  const phaseAccuracy = phaseKeys.map((phase) => {
    let totalEst = 0;
    let totalAct = 0;
    let count = 0;
    casesWithBoth.forEach((c) => {
      const est = Number(c[estFieldMap[phase]]) || 0;
      const act = allLogs
        .filter((l) => l.case_id === c.id && l.work_phase === phase)
        .reduce((sum, l) => sum + (Number(l.hours) || 0), 0);
      if (est > 0 || act > 0) {
        totalEst += est;
        totalAct += act;
        count++;
      }
    });
    return {
      phase,
      label: phaseLabel(phase),
      avgEst: count > 0 ? totalEst / count : 0,
      avgAct: count > 0 ? totalAct / count : 0,
      diff: count > 0 ? (totalAct - totalEst) / count : 0,
      count,
    };
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-navy text-2xl font-bold">じかん</h1>
        <Link href="/" className="text-brand-muted text-sm hover:text-navy transition-colors">
          おもいへ &rarr;
        </Link>
      </div>

      {totalActualHours === 0 ? (
        <div className="text-center py-20">
          <p className="text-brand-muted text-sm">まだ工数の記録がありません</p>
          <p className="text-brand-muted text-xs mt-2">きろくに工程と時間を記録すると、ここに表示されます</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* じかん */}
          <div className="bg-white rounded-lg border border-brand-border p-6">
            <SectionLabel label="じかん" />
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="text-center">
                <p className="text-xs text-brand-muted mb-1">総稼働時間</p>
                <p className="text-2xl font-bold text-navy">{formatHoursH(totalActualHours)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-brand-muted mb-1">平均工数/おもい</p>
                <p className="text-2xl font-bold text-navy">{avgHoursPerCase > 0 ? formatHoursH(avgHoursPerCase) : '-'}</p>
              </div>
            </div>
            <div className="space-y-3">
              {Object.entries(totalActualByPhase)
                .sort(([, a], [, b]) => b - a)
                .map(([phase, hours]) => {
                  const pct = totalActualHours > 0 ? Math.round((hours / totalActualHours) * 100) : 0;
                  return (
                    <div key={phase}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{phaseLabel(phase)}</span>
                        <span className="text-sm font-medium">{formatHoursH(hours)}<span className="text-xs text-brand-muted ml-1">({pct}%)</span></span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-navy rounded-full h-2 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* お金 */}
          <div className="bg-white rounded-lg border border-brand-border p-6">
            <SectionLabel label="お金" />
            <div className={`grid ${totalExpense > 0 ? 'grid-cols-3' : 'grid-cols-2'} gap-4 mb-5`}>
              <div className="text-center">
                <p className="text-xs text-brand-muted mb-1">実効時給</p>
                <p className="text-2xl font-bold text-navy">{effectiveHourlyRate > 0 ? formatYen(effectiveHourlyRate) : '-'}</p>
                {effectiveHourlyRate > 0 && (
                  <p className="text-[10px] text-brand-muted mt-0.5">目安: {formatYen(HOURLY_RATE)}</p>
                )}
              </div>
              <div className="text-center">
                <p className="text-xs text-brand-muted mb-1">売上合計</p>
                <p className="text-2xl font-bold text-navy">{totalPaidRevenue > 0 ? formatYen(totalPaidRevenue) : '-'}</p>
                {paidCasesWithHours.length > 0 && (
                  <p className="text-[10px] text-brand-muted mt-0.5">{paidCasesWithHours.length}件の入金済み</p>
                )}
              </div>
              {totalExpense > 0 && (
                <div className="text-center">
                  <p className="text-xs text-brand-muted mb-1">交通費合計</p>
                  <p className="text-2xl font-bold text-navy">{formatYen(totalExpense)}</p>
                </div>
              )}
            </div>

            {/* 案件別時給ランキング */}
            {caseHourlyRanking.length > 0 && (
              <div className="border-t border-brand-border/50 pt-4">
                <p className="text-xs text-brand-muted mb-3">おもい別の時給</p>
                <div className="space-y-2">
                  {caseHourlyRanking.map((ch) => (
                    <Link
                      key={ch.case.id}
                      href={`/cases/${ch.case.id}`}
                      className="flex items-center justify-between py-1.5 hover:bg-brand-bg transition-colors -mx-2 px-2 rounded"
                    >
                      <div className="min-w-0">
                        <p className="text-sm truncate">{ch.case.name}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className="text-xs text-brand-muted">{formatHoursH(ch.total)}</span>
                        <span className={`text-sm font-bold ${ch.hourlyRate >= HOURLY_RATE ? 'text-green-600' : 'text-red-500'}`}>
                          {formatYen(ch.hourlyRate)}/h
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 見積もり精度 */}
          {estimateAccuracy.length > 0 && (
            <div className="bg-white rounded-lg border border-brand-border p-6">
              <SectionLabel label="見積もり精度" />
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-3 gap-y-1.5 items-center text-sm">
                <span />
                <span className="text-xs text-brand-muted text-right">見積もり</span>
                <span />
                <span className="text-xs text-brand-muted text-right">実績</span>
                <span className="text-xs text-brand-muted text-right">差分</span>

                <span className="font-medium">平均</span>
                <span className="text-right tabular-nums font-bold text-navy">{formatHoursH(avgEstimate)}</span>
                <span className="text-brand-muted">&rarr;</span>
                <span className="text-right tabular-nums font-bold text-navy">{formatHoursH(avgActual)}</span>
                <span className={`text-right tabular-nums font-bold ${avgActual - avgEstimate > 0 ? 'text-red-500' : 'text-green-600'}`}>
                  {avgActual - avgEstimate > 0 ? '+' : ''}{formatHoursH(Math.abs(avgActual - avgEstimate))}
                </span>

                <div className="col-span-5 border-t border-brand-border/50 my-1" />
                {phaseAccuracy.filter((p) => p.count > 0).map((p) => (
                  <React.Fragment key={p.phase}>
                    <span>{p.label}</span>
                    <span className="text-brand-muted text-right tabular-nums">{formatHoursH(p.avgEst)}</span>
                    <span className="text-brand-muted">&rarr;</span>
                    <span className="font-medium text-right tabular-nums">{formatHoursH(p.avgAct)}</span>
                    <span className={`text-right tabular-nums ${p.diff > 0 ? 'text-red-500' : 'text-green-600'}`}>
                      {p.diff > 0 ? '+' : ''}{formatHoursH(Math.abs(p.diff))}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* おもい別 */}
          <div className="bg-white rounded-lg border border-brand-border p-6">
            <SectionLabel label="おもい別" />
            <div className="space-y-2">
              {caseHours.map((ch) => (
                <Link
                  key={ch.case.id}
                  href={`/cases/${ch.case.id}`}
                  className="flex items-center justify-between py-2 border-b border-brand-border/50 hover:bg-brand-bg transition-colors -mx-2 px-2 rounded"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{ch.case.name}</p>
                    {ch.case.client_name && <p className="text-xs text-brand-muted">{ch.case.client_name}</p>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="text-sm font-bold text-navy">{formatHoursH(ch.total)}</span>
                    {ch.expense > 0 && (
                      <span className="text-xs text-brand-muted">{formatYen(ch.expense)}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
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
