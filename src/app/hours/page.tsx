import React from 'react';
import { createClient } from '@/lib/supabase/server';
import type { Case, ProgressLog } from '@/lib/types';
import Link from 'next/link';
import { formatHoursH, formatYen, phaseLabel, activityCategoryLabel } from '@/lib/formatting';
import { HOURLY_RATE } from '@/lib/constants';
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

  // --- 工程別集計（移動中の作業は重複するため除外） ---
  const totalActualByPhase: Record<string, number> = {};
  let totalActualHours = 0;

  allLogs.forEach((log) => {
    if (log.is_during_travel) return;
    const h = Number(log.hours);
    if (log.work_phase && h > 0) {
      totalActualByPhase[log.work_phase] = (totalActualByPhase[log.work_phase] || 0) + h;
      totalActualHours += h;
    }
  });

  // --- 案件別の実績（移動中の作業は除外） ---
  const caseHours = allCases
    .map((c) => {
      const caseLogs = allLogs.filter((l) => l.case_id === c.id && !l.is_during_travel);
      const total = caseLogs.reduce((sum, l) => sum + (Number(l.hours) || 0), 0);
      return { case: c, total };
    })
    .filter((ch) => ch.total > 0)
    .sort((a, b) => b.total - a.total);

  // --- 案件あたり平均工数 ---
  const avgHoursPerCase = caseHours.length > 0
    ? caseHours.reduce((sum, ch) => sum + ch.total, 0) / caseHours.length
    : 0;

  // --- 見積もり精度 ---
  const casesWithBoth = allCases.filter((c) => {
    const estTotal = (Number(c.est_hours_meeting) || 0) + (Number(c.est_hours_planning) || 0) +
      (Number(c.est_hours_shooting) || 0) + (Number(c.est_hours_editing) || 0);
    if (estTotal === 0) return false;
    return allLogs.some((l) => l.case_id === c.id && !l.is_during_travel && Number(l.hours) > 0);
  });

  const estimateAccuracy = casesWithBoth.map((c) => {
    const estTotal = (Number(c.est_hours_meeting) || 0) + (Number(c.est_hours_planning) || 0) +
      (Number(c.est_hours_shooting) || 0) + (Number(c.est_hours_editing) || 0);
    const caseLogs = allLogs.filter((l) => l.case_id === c.id && !l.is_during_travel);
    const actTotal = caseLogs.reduce((sum, l) => sum + (Number(l.hours) || 0), 0);
    return { case: c, estTotal, actTotal, diff: actTotal - estTotal };
  });

  const avgEstimate = estimateAccuracy.length > 0
    ? estimateAccuracy.reduce((sum, a) => sum + a.estTotal, 0) / estimateAccuracy.length
    : 0;
  const avgActual = estimateAccuracy.length > 0
    ? estimateAccuracy.reduce((sum, a) => sum + a.actTotal, 0) / estimateAccuracy.length
    : 0;

  // --- 活動（運営）の集計 ---
  const opsLogs = allLogs.filter((l) => l.case_id === null && !l.is_during_travel);
  const totalOpsHours = opsLogs.reduce((sum, l) => sum + (Number(l.hours) || 0), 0);
  const opsByCategory: Record<string, number> = {};
  opsLogs.forEach((log) => {
    const cat = log.activity_category || 'other_ops';
    const h = Number(log.hours) || 0;
    if (h > 0) {
      opsByCategory[cat] = (opsByCategory[cat] || 0) + h;
    }
  });

  // 案件ワークの時間
  const totalCaseHours = totalActualHours - totalOpsHours;

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
        .filter((l) => l.case_id === c.id && l.work_phase === phase && !l.is_during_travel)
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
            <SectionLabel label="全体" />
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

          {/* 活動（運営） */}
          {totalOpsHours > 0 && (
            <div className="bg-white rounded-lg border border-brand-border p-6">
              <SectionLabel label="活動（運営）" />
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="text-center">
                  <p className="text-xs text-brand-muted mb-1">運営時間</p>
                  <p className="text-2xl font-bold text-navy">{formatHoursH(totalOpsHours)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-brand-muted mb-1">暗黙コスト</p>
                  <p className="text-2xl font-bold text-navy">{formatYen(totalOpsHours * HOURLY_RATE)}</p>
                  <p className="text-[10px] text-brand-muted mt-0.5">{formatYen(HOURLY_RATE)}/h</p>
                </div>
              </div>
              <div className="space-y-3">
                {Object.entries(opsByCategory)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, hours]) => {
                    const pct = totalOpsHours > 0 ? Math.round((hours / totalOpsHours) * 100) : 0;
                    return (
                      <div key={cat}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">{activityCategoryLabel(cat)}</span>
                          <span className="text-sm font-medium">{formatHoursH(hours)}<span className="text-xs text-brand-muted ml-1">({pct}%)</span></span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-gold rounded-full h-2 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

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
                  <span className="text-sm font-bold text-navy shrink-0 ml-4">{formatHoursH(ch.total)}</span>
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
