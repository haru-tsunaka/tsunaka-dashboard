'use client';

import { useState } from 'react';
import type { Case } from '@/lib/types';
import { CASE_STATUSES, PAYMENT_STATUSES, CATEGORIES } from '@/lib/constants';

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
      <Section label="BASIC INFO">
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
      <Section label="STATUS">
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
      <Section label="SCHEDULE">
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

      {/* 予算 */}
      <Section label="BUDGET">
        <div className="grid grid-cols-2 gap-4">
          <Field label="見積金額（円）">
            <input type="number" name="quoted_amount" defaultValue={data.quoted_amount ?? ''}
              className="form-input" />
          </Field>
          <Field label="経費（円）">
            <input type="number" name="expenses" defaultValue={data.expenses}
              className="form-input" />
          </Field>
        </div>
      </Section>

      {/* 次のアクション */}
      <Section label="NEXT ACTION">
        <Field label="次にやること">
          <textarea name="next_action" defaultValue={data.next_action || ''} rows={2}
            className="form-input" />
        </Field>
        <Field label="期限">
          <input type="date" name="next_action_by" defaultValue={data.next_action_by || ''}
            className="form-input" />
        </Field>
      </Section>

      {/* 連絡先 */}
      <Section label="CONTACT">
        <div className="grid grid-cols-2 gap-4">
          <Field label="連絡手段">
            <select name="contact_method" defaultValue={data.contact_method || ''} className="form-input">
              <option value="">未設定</option>
              <option value="email">Email</option>
              <option value="DM">Instagram DM</option>
              <option value="LINE">LINE</option>
            </select>
          </Field>
          <Field label="連絡先">
            <input name="contact_info" defaultValue={data.contact_info || ''}
              className="form-input" />
          </Field>
        </div>
      </Section>

      {/* 納品物 */}
      <Section label="DELIVERABLES">
        <Field label="納品物">
          <textarea name="deliverables" defaultValue={data.deliverables || ''} rows={3}
            className="form-input" placeholder="例: 公式PV（2〜3分）、レタッチ済み写真20枚" />
        </Field>
      </Section>

      {/* ボタン */}
      <div className="flex items-center gap-3 pt-4">
        <button
          type="submit"
          className="px-8 py-3 rounded-full bg-gold text-navy font-bold text-sm tracking-wide hover:opacity-90 transition-opacity"
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
