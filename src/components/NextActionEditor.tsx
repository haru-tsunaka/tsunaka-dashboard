'use client';

import { useState } from 'react';

function formatForInput(value: string | null) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function formatDateTime(date: string | null) {
  if (!date) return null;
  const d = new Date(date);
  const dateStr = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  const h = d.getHours();
  const m = d.getMinutes();
  if (h === 0 && m === 0) return dateStr;
  return `${dateStr} ${h}:${String(m).padStart(2, '0')}`;
}

export default function NextActionEditor({
  nextAction,
  nextActionBy,
  nextActionMemo,
  isOverdue,
  action,
  completeAction,
}: {
  nextAction: string | null;
  nextActionBy: string | null;
  nextActionMemo: string | null;
  isOverdue: boolean;
  action: (formData: FormData) => Promise<void>;
  completeAction: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [completing, setCompleting] = useState(false);

  if (editing) {
    return (
      <form action={async (formData) => {
        await action(formData);
        setEditing(false);
      }} className="space-y-3">
        <div>
          <label className="block text-xs text-brand-muted mb-1">次にやること</label>
          <textarea
            name="next_action"
            defaultValue={nextAction || ''}
            rows={2}
            className="form-input"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-xs text-brand-muted mb-1">期限</label>
          <input
            type="datetime-local"
            name="next_action_by"
            defaultValue={formatForInput(nextActionBy)}
            className="form-input"
          />
        </div>
        <div>
          <label className="block text-xs text-brand-muted mb-1">メモ</label>
          <textarea
            name="next_action_memo"
            defaultValue={nextActionMemo || ''}
            rows={2}
            className="form-input"
            placeholder="補足や備忘録など"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-navy text-white text-xs font-medium hover:bg-navy-light transition-colors active:scale-[0.98]"
          >
            保存
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="px-4 py-2.5 text-xs text-brand-muted hover:text-brand-text transition-colors"
          >
            キャンセル
          </button>
        </div>
      </form>
    );
  }

  if (!nextAction) {
    return (
      <div
        onClick={() => setEditing(true)}
        className="cursor-pointer group rounded-lg p-3 -m-3 hover:bg-brand-bg transition-colors"
      >
        <p className="text-sm text-brand-muted">未設定</p>
        <p className="text-[10px] text-brand-muted/0 group-hover:text-brand-muted/50 transition-colors mt-1">タップして追加</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg p-3 -m-3">
      <div className={isOverdue ? 'text-red-600' : ''}>
        <p className="text-sm whitespace-pre-wrap">{nextAction}</p>
        {nextActionBy && (
          <p className={`text-xs mt-2 ${isOverdue ? 'text-red-600 font-medium' : 'text-brand-muted'}`}>
            期限: {formatDateTime(nextActionBy)}
          </p>
        )}
        {nextActionMemo && (
          <p className="text-xs text-brand-muted mt-2 whitespace-pre-wrap border-t border-brand-border pt-2">{nextActionMemo}</p>
        )}
      </div>
      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={async () => {
            setCompleting(true);
            await completeAction();
            setCompleting(false);
          }}
          disabled={completing}
          className="px-5 py-2.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors active:scale-[0.98] disabled:opacity-50"
        >
          {completing ? '完了処理中...' : '完了'}
        </button>
        <button
          onClick={() => setEditing(true)}
          className="px-4 py-2.5 text-xs text-brand-muted hover:text-navy transition-colors"
        >
          編集
        </button>
      </div>
    </div>
  );
}
