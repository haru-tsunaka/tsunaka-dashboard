'use client';

import { useState } from 'react';
import MoneyInput from '@/components/MoneyInput';
import SubmitButton from './SubmitButton';
import { INVESTMENT_CATEGORIES, investmentBusinessAmount, type Investment } from '@/lib/types';
import { formatYen, formatDate } from '@/lib/formatting';

export default function InvestmentSection({
  investments,
  totalInvested,
  totalRecovered,
  tableMissing,
  addAction,
  deleteAction,
}: {
  investments: Investment[];
  totalInvested: number;
  totalRecovered: number;
  tableMissing: boolean;
  addAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [showList, setShowList] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  if (tableMissing) {
    return (
      <p className="text-xs text-brand-muted">
        投資を記録する表がまだありません。supabase/migrations/010_investments.sql を Supabase の SQL Editor で実行してください。
      </p>
    );
  }

  const rate = totalInvested > 0 ? Math.round((totalRecovered / totalInvested) * 100) : 0;
  const barPct = Math.max(0, Math.min(rate, 100));

  return (
    <>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-xs text-brand-muted mb-1">投資した額</p>
          <p className="text-lg font-bold text-brand-text">{formatYen(totalInvested)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-brand-muted mb-1">回収した額</p>
          <p className="text-lg font-bold text-brand-text">{formatYen(totalRecovered)}</p>
          <p className="text-[10px] text-brand-muted mt-0.5">入金済みの粗利の合計</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-brand-muted mb-1">回収率</p>
          <p className="text-lg font-bold text-navy">{totalInvested > 0 ? `${rate}%` : '-'}</p>
        </div>
      </div>

      {totalInvested > 0 ? (
        <div className="mb-2">
          <div className="w-full bg-gray-100 rounded-full h-4">
            <div className="bg-navy rounded-full h-4 transition-all duration-500" style={{ width: `${barPct}%` }} />
          </div>
          <p className="text-xs text-brand-muted text-right mt-1">
            {totalRecovered >= totalInvested
              ? `投資を回収して、${formatYen(totalRecovered - totalInvested)} プラス`
              : `回収まであと ${formatYen(totalInvested - totalRecovered)}`}
          </p>
        </div>
      ) : (
        <p className="text-xs text-brand-muted mb-2">カメラやレンズなど、これまで買った機材を足すと、どれだけ回収できたかが出ます。</p>
      )}

      {investments.length > 0 && (
        <div className="border-t border-brand-border/50 pt-4 mt-4">
          <button
            type="button"
            onClick={() => setShowList(!showList)}
            className="text-xs text-brand-muted hover:text-navy transition-colors"
          >
            {showList ? '一覧を閉じる' : `投資の一覧（${investments.length}件）`}
          </button>
          {showList && (
            <div className="mt-3 space-y-2">
              {investments.map((inv) => (
                <div key={inv.id} className="flex items-start justify-between gap-3 py-1.5">
                  <div className="min-w-0">
                    <p className="text-sm break-words">{inv.title}</p>
                    <p className="text-[10px] text-brand-muted">
                      {inv.category}
                      {inv.purchased_at && ` ・ ${formatDate(inv.purchased_at)}`}
                      {inv.note && ` ・ ${inv.note}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-sm font-medium">{formatYen(investmentBusinessAmount(inv))}</span>
                      {(inv.business_ratio ?? 100) < 100 && (
                        <p className="text-[10px] text-brand-muted">
                          {formatYen(inv.amount)} × {inv.business_ratio}%
                        </p>
                      )}
                    </div>
                    {confirmingId === inv.id ? (
                      <form action={deleteAction} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={inv.id} />
                        <SubmitButton
                          label="消す"
                          pendingLabel="..."
                          className="px-3 py-1 rounded-full bg-red-500 text-white text-[10px] font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
                        />
                        <button type="button" onClick={() => setConfirmingId(null)} className="text-[10px] text-brand-muted">
                          戻す
                        </button>
                      </form>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmingId(inv.id)}
                        className="text-[10px] text-brand-muted/50 hover:text-red-500 transition-colors"
                      >
                        削除
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showForm ? (
        <form action={addAction} className="border-t border-brand-border/50 pt-4 mt-4 space-y-3">
          <input name="title" required placeholder="例: Sony FE 50mm F1.4 GM" className="form-input" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-brand-muted mb-1">本体価格</p>
              <MoneyInput name="amount" placeholder="例: 180,000" />
            </div>
            <div>
              <p className="text-[10px] text-brand-muted mb-1">事業で使う割合（家事按分）</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="business_ratio"
                  min={1}
                  max={100}
                  defaultValue={100}
                  inputMode="numeric"
                  className="form-input"
                />
                <span className="text-sm text-brand-muted">%</span>
              </div>
            </div>
          </div>
          <select name="category" defaultValue="機材" className="form-input" aria-label="分類">
            {INVESTMENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input type="date" name="purchased_at" className="form-input" aria-label="買った日" />
            <input name="note" placeholder="メモ（例: 中古で購入）" className="form-input" />
          </div>
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="text-xs text-brand-muted hover:text-navy transition-colors">
              戻す
            </button>
            <SubmitButton
              label="追加"
              pendingLabel="保存中..."
              className="px-4 py-2.5 rounded-lg bg-navy text-white text-xs font-medium hover:bg-navy-light transition-colors whitespace-nowrap disabled:opacity-50"
            />
          </div>
        </form>
      ) : (
        <div className="border-t border-brand-border/50 pt-4 mt-4 text-right">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="text-xs text-navy hover:text-navy-light transition-colors"
          >
            ＋ 投資を足す
          </button>
        </div>
      )}
    </>
  );
}
