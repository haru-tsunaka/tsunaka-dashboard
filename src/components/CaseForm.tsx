'use client';

import { useState } from 'react';
import type { Case } from '@/lib/types';
import { CASE_STATUSES, PAYMENT_STATUSES, CATEGORIES } from '@/lib/constants';
import MoneyInput from '@/components/MoneyInput';

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

type CaseFormData = Omit<Case, 'id' | 'created_at' | 'updated_at' | 'user_id'>;

const defaultData: CaseFormData = {
  name: '',
  client_name: '',
  category: 'other',
  description: '',
  status: '商談中',
  event_date: null,
  deadline: null,
  quoted_amount: null,
  payment_status: '未入金',
  expenses: 0,
  next_action: '',
  next_action_by: null,
  next_action_memo: null,
  payment_amount: null,
  payment_date: null,
  contact_method: '',
  contact_info: '',
  deliverables: '',
};

export default function CaseForm({
  initialData,
  action,
}: {
  initialData?: Case;
  action: (formData: FormData) => Promise<void>;
}) {
  const [data] = useState<CaseFormData>(() => {
    if (!initialData) return defaultData;
    return { ...defaultData, ...initialData };
  });

  return (
    <form action={action} className="space-y-8">
      {/* 基本情報 */}
      <Section label="基本情報">
        <Field label="案件名" required>
          <input name="name" defaultValue={data.name} required
            className="form-input" />
        </Field>
        <Field label="クライアント名">
          <input name="client_name" defaultValue={data.client_name || ''}
            className="form-input" />
        </Field>
        <Field label="カテゴリ">
          <select name="category" defaultValue={data.category} className="form-input">
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </Field>
        <Field label="案件概要">
          <textarea name="description" defaultValue={data.description || ''} rows={3}
            className="form-input" />
        </Field>
      </Section>

      {/* ステータス */}
      <Section label="ステータス">
        <div className="grid grid-cols-2 gap-4">
          <Field label="ステータス">
            <select name="status" defaultValue={data.status} className="form-input">
              {CASE_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="入金状況">
            <select name="payment_status" defaultValue={data.payment_status} className="form-input">
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      {/* スケジュール */}
      <Section label="スケジュール">
        <div className="grid grid-cols-2 gap-4">
          <Field label="イベント・撮影日">
            <input type="date" name="event_date" defaultValue={data.event_date || ''}
              className="form-input" />
          </Field>
          <Field label="納期">
            <input type="date" name="deadline" defaultValue={data.deadline || ''}
              className="form-input" />
          </Field>
        </div>
      </Section>

      {/* 収支 */}
      <Section label="収支">
        <div className="grid grid-cols-2 gap-4">
          <Field label="見積金額（円）">
            <MoneyInput name="quoted_amount" defaultValue={data.quoted_amount} />
          </Field>
          <Field label="経費（円）">
            <MoneyInput name="expenses" defaultValue={data.expenses} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="入金額（円）">
            <MoneyInput name="payment_amount" defaultValue={data.payment_amount} />
          </Field>
          <Field label="入金日">
            <input type="date" name="payment_date" defaultValue={data.payment_date || ''}
              className="form-input" />
          </Field>
        </div>
      </Section>

      {/* 次のアクション */}
      <Section label="次のアクション">
        <Field label="次にやること">
          <textarea name="next_action" defaultValue={data.next_action || ''} rows={2}
            className="form-input" />
        </Field>
        <Field label="期限">
          <input type="datetime-local" name="next_action_by" defaultValue={formatForInput(data.next_action_by)}
            className="form-input" />
        </Field>
      </Section>

      {/* 納品物 */}
      <Section label="納品物">
        <Field label="納品物">
          <textarea name="deliverables" defaultValue={data.deliverables || ''} rows={3}
            className="form-input" placeholder="例: 公式PV（2〜3分）、レタッチ済み写真20枚" />
        </Field>
      </Section>

      {/* ボタン */}
      <div className="flex items-center gap-3 pt-4">
        <button
          type="submit"
          className="px-8 py-3 rounded-lg bg-navy text-white font-medium text-sm tracking-wide hover:bg-navy-light transition-colors"
        >
          保存
        </button>
      </div>
    </form>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-6 h-px bg-gold" />
        <span className="text-xs font-semibold text-gold tracking-widest">{label}</span>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-brand-muted mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
