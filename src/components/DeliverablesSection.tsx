'use client';

import { useState } from 'react';
import type { CaseDeliverable } from '@/lib/types';
import { DELIVERABLE_STATUSES, DELIVERABLE_STATUS_COLORS } from '@/lib/constants';
import MoneyInput from './MoneyInput';
import SubmitButton from './SubmitButton';

export default function DeliverablesSection({
  deliverables,
  addAction,
  updateAction,
  deleteAction,
  showFinancials = true,
}: {
  deliverables: CaseDeliverable[];
  addAction: (formData: FormData) => Promise<void>;
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
  showFinancials?: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const totalAmount = deliverables.reduce((sum, d) => sum + (d.amount || 0), 0);
  const totalExpense = deliverables.reduce((sum, d) => sum + (d.expense_amount || 0), 0);
  const paidCount = deliverables.filter(d => d.status === '入金済み').length;

  return (
    <div>
      {/* サマリー */}
      {deliverables.length > 0 && showFinancials && (
        <div className="flex items-center gap-4 text-xs text-brand-muted mb-4">
          <span>合計: <span className="font-bold text-navy">{totalAmount.toLocaleString()}円</span></span>
          {totalExpense > 0 && <span>経費: {totalExpense.toLocaleString()}円</span>}
          <span>入金: {paidCount}/{deliverables.length}件</span>
        </div>
      )}

      {/* 一覧 */}
      {deliverables.length > 0 ? (
        <div className="space-y-3 mb-4">
          {deliverables.map((d) =>
            editingId === d.id ? (
              <DeliverableForm
                key={d.id}
                deliverable={d}
                action={async (formData) => {
                  await updateAction(formData);
                  setEditingId(null);
                }}
                deleteAction={deleteAction}
                onCancel={() => setEditingId(null)}
                submitLabel="保存"
                showFinancials={showFinancials}
              />
            ) : (
              <DeliverableCard
                key={d.id}
                deliverable={d}
                onEdit={() => setEditingId(d.id)}
                showFinancials={showFinancials}
              />
            )
          )}
        </div>
      ) : (
        <p className="text-brand-muted text-sm mb-4">納品物が登録されていません</p>
      )}

      {/* 追加フォーム */}
      {showForm ? (
        <DeliverableForm
          action={async (formData) => {
            await addAction(formData);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
          submitLabel="追加"
          showFinancials={showFinancials}
        />
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="text-sm text-navy hover:text-navy-light transition-colors"
        >
          + 納品物を追加
        </button>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = DELIVERABLE_STATUS_COLORS[status as keyof typeof DELIVERABLE_STATUS_COLORS]
    || { bg: 'bg-gray-100', text: 'text-brand-muted' };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${colors.bg} ${colors.text}`}>
      {status}
    </span>
  );
}

function DeliverableCard({
  deliverable: d,
  onEdit,
  showFinancials,
}: {
  deliverable: CaseDeliverable;
  onEdit: () => void;
  showFinancials: boolean;
}) {
  return (
    <div className="bg-white rounded-lg border border-brand-border p-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <StatusBadge status={d.status} />
            <p className="font-medium text-sm truncate">{d.title}</p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-brand-muted">
            {d.shooting_date && <span>撮影: {d.shooting_date}</span>}
            {d.due_date && <span>納期: {d.due_date}</span>}
            {showFinancials && d.amount != null && (
              <span className="font-medium text-navy">{d.amount.toLocaleString()}円</span>
            )}
            {showFinancials && d.expense_amount > 0 && (
              <span>(経費: {d.expense_amount.toLocaleString()}円)</span>
            )}
            {showFinancials && d.payment_date && (
              <span>入金日: {d.payment_date}</span>
            )}
          </div>
          {d.description && (
            <p className="text-xs text-brand-muted mt-1.5 whitespace-pre-wrap">{d.description}</p>
          )}
        </div>
        <button
          onClick={onEdit}
          className="text-brand-muted hover:text-navy transition-colors text-xs ml-3 shrink-0"
        >
          編集
        </button>
      </div>
    </div>
  );
}

function DeliverableForm({
  deliverable,
  action,
  deleteAction,
  onCancel,
  submitLabel,
  showFinancials,
}: {
  deliverable?: CaseDeliverable;
  action: (formData: FormData) => Promise<void>;
  deleteAction?: (formData: FormData) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
  showFinancials: boolean;
}) {
  return (
    <form action={action} className="bg-white rounded-lg border border-brand-border p-4 space-y-3">
      {deliverable && <input type="hidden" name="deliverable_id" value={deliverable.id} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-brand-muted mb-1">タイトル <span className="text-red-400">*</span></label>
          <input name="deliverable_title" required defaultValue={deliverable?.title || ''} className="form-input" placeholder="例: ピックルボール 6/14" />
        </div>
        <div>
          <label className="block text-xs text-brand-muted mb-1">ステータス</label>
          <select name="deliverable_status" defaultValue={deliverable?.status || '予定'} className="form-input">
            {DELIVERABLE_STATUSES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-brand-muted mb-1">撮影日</label>
          <input type="date" name="deliverable_shooting_date" defaultValue={deliverable?.shooting_date || ''} className="form-input" />
        </div>
        <div>
          <label className="block text-xs text-brand-muted mb-1">納期</label>
          <input type="date" name="deliverable_due_date" defaultValue={deliverable?.due_date || ''} className="form-input" />
        </div>
      </div>

      {showFinancials && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-brand-muted mb-1">金額</label>
            <MoneyInput name="deliverable_amount" defaultValue={deliverable?.amount} />
          </div>
          <div>
            <label className="block text-xs text-brand-muted mb-1">経費</label>
            <MoneyInput name="deliverable_expense" defaultValue={deliverable?.expense_amount} />
          </div>
          <div>
            <label className="block text-xs text-brand-muted mb-1">入金日</label>
            <input type="date" name="deliverable_payment_date" defaultValue={deliverable?.payment_date || ''} className="form-input" />
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs text-brand-muted mb-1">メモ</label>
        <textarea name="deliverable_description" rows={2} defaultValue={deliverable?.description || ''} className="form-input" placeholder="備考・詳細" />
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <SubmitButton
            label={submitLabel}
            pendingLabel={`${submitLabel}中...`}
            className="px-5 py-2.5 rounded-lg bg-navy text-white text-xs font-medium hover:bg-navy-light transition-colors active:scale-[0.98] disabled:opacity-50"
          />
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 text-xs text-brand-muted hover:text-brand-text transition-colors"
          >
            キャンセル
          </button>
        </div>
        {deliverable && deleteAction && (
          <button
            type="button"
            onClick={() => {
              const formData = new FormData();
              formData.append('deliverable_id', deliverable.id);
              deleteAction(formData);
            }}
            className="text-xs text-brand-muted hover:text-red-500 transition-colors"
          >
            削除
          </button>
        )}
      </div>
    </form>
  );
}
