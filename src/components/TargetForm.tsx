'use client';

import { useState } from 'react';
import MoneyInput from '@/components/MoneyInput';

export default function TargetForm({
  year,
  currentTarget,
  action,
}: {
  year: number;
  currentTarget: number;
  action: (formData: FormData) => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const hasTarget = currentTarget > 0;

  if (hasTarget && !showForm) {
    return (
      <div className="mt-4 pt-4 border-t border-brand-border/50 flex items-center justify-between">
        <p className="text-xs text-brand-muted">
          目標: ¥{currentTarget.toLocaleString()}
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="text-[10px] text-brand-muted/50 hover:text-brand-muted transition-colors"
        >
          変更する
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="mt-4 pt-4 border-t border-brand-border/50">
      <input type="hidden" name="year" value={year} />
      <div className="flex items-center gap-3">
        <label className="text-xs text-brand-muted whitespace-nowrap">目標金額</label>
        <div className="flex-1">
          <MoneyInput name="annual_target" defaultValue={currentTarget || null} placeholder="例: 600,000" />
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 rounded-lg bg-navy text-white text-xs font-medium hover:bg-navy-light transition-colors whitespace-nowrap"
        >
          {hasTarget ? '更新' : '設定'}
        </button>
        {hasTarget && (
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="text-xs text-brand-muted hover:text-navy transition-colors"
          >
            戻す
          </button>
        )}
      </div>
    </form>
  );
}
