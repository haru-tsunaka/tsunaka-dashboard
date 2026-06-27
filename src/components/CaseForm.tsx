'use client';

import { useState, useEffect } from 'react';
import type { Case } from '@/lib/types';
import { CASE_STATUSES, PAYMENT_STATUSES, CATEGORIES, HOURLY_RATE } from '@/lib/constants';
import MoneyInput from '@/components/MoneyInput';
import { toHalfWidth } from '@/lib/formatting';
import SubmitButton from './SubmitButton';

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
  menu: null,
  plan: null,
  est_hours_hearing: null,
  est_hours_planning: null,
  est_hours_shooting: null,
  est_hours_editing: null,
  actual_hours_hearing: null,
  actual_hours_planning: null,
  actual_hours_shooting: null,
  actual_hours_editing: null,
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

  const [estHearing, setEstHearing] = useState(data.est_hours_hearing ?? '');
  const [estPlanning, setEstPlanning] = useState(data.est_hours_planning ?? '');
  const [estShooting, setEstShooting] = useState(data.est_hours_shooting ?? '');
  const [estEditing, setEstEditing] = useState(data.est_hours_editing ?? '');
  const [quotedAmount, setQuotedAmount] = useState(data.quoted_amount);
  const [manualOverride, setManualOverride] = useState(false);

  // 工数変更時に見積金額を自動計算（手動上書きでない場合）
  useEffect(() => {
    if (manualOverride) return;
    const total =
      (Number(estHearing) || 0) +
      (Number(estPlanning) || 0) +
      (Number(estShooting) || 0) +
      (Number(estEditing) || 0);
    setQuotedAmount(total > 0 ? total * HOURLY_RATE : 0);
  }, [estHearing, estPlanning, estShooting, estEditing, manualOverride]);

  const totalEst =
    (Number(estHearing) || 0) +
    (Number(estPlanning) || 0) +
    (Number(estShooting) || 0) +
    (Number(estEditing) || 0);

  return (
    <form action={action} className="space-y-8">
      {/* 基本情報 */}
      <Section label="基本情報">
        <Field label="おもいの名前" required>
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
        <Field label="概要">
          <textarea name="description" defaultValue={data.description || ''} rows={3}
            className="form-input" />
        </Field>
      </Section>

      {/* ステータス */}
      <Section label="ステータス">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {/* つくるもの */}
      <Section label="つくるもの">
        <Field label="納品物">
          <textarea name="deliverables" defaultValue={data.deliverables || ''} rows={3}
            className="form-input" placeholder="例: PR動画（3分）、レタッチ済み写真20枚" />
        </Field>
      </Section>

      {/* 見積もり */}
      <Section label="見積もり">
        <div className="p-4 bg-brand-bg rounded-lg space-y-3">
          <p className="text-xs font-semibold text-brand-muted tracking-wide mb-2">想定工数</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <HoursInput label="ヒアリング" name="est_hours_hearing" value={estHearing} onChange={setEstHearing} />
            <HoursInput label="企画・構成" name="est_hours_planning" value={estPlanning} onChange={setEstPlanning} />
            <HoursInput label="撮影" name="est_hours_shooting" value={estShooting} onChange={setEstShooting} />
            <HoursInput label="編集〜納品" name="est_hours_editing" value={estEditing} onChange={setEstEditing} />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-brand-border">
            <span className="text-xs text-brand-muted">
              合計: <span className="font-bold text-navy">{totalEst}h</span>
              <span className="ml-2 text-brand-muted/60">x {HOURLY_RATE.toLocaleString()}円</span>
            </span>
            <span className="text-sm font-bold text-navy">
              {quotedAmount !== null ? `¥${quotedAmount.toLocaleString()}` : '-'}
            </span>
          </div>
        </div>
      </Section>

      {/* 収支 */}
      <Section label="収支">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="見積金額（円）">
            <input type="hidden" name="quoted_amount" value={quotedAmount ?? ''} />
            <input
              type="text"
              inputMode="numeric"
              value={quotedAmount !== null ? quotedAmount.toLocaleString() : ''}
              onChange={(e) => {
                const num = Number(e.target.value.replace(/[^0-9]/g, ''));
                setQuotedAmount(num || null);
                setManualOverride(true);
              }}
              className="form-input"
            />
          </Field>
          <Field label="経費（円）">
            <MoneyInput name="expenses" defaultValue={data.expenses} />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {/* ボタン */}
      <div className="pt-4">
        <SubmitButton
          label="保存"
          pendingLabel="保存中..."
          className="w-full sm:w-auto px-8 py-3 rounded-lg bg-navy text-white font-medium text-sm tracking-wide hover:bg-navy-light transition-colors active:scale-[0.98] disabled:opacity-50"
        />
      </div>
    </form>
  );
}

function HoursInput({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: number | string;
  onChange?: (v: number | string) => void;
}) {
  const [display, setDisplay] = useState(value !== '' && value !== null ? String(value) : '');

  return (
    <div>
      <label className="block text-xs text-brand-muted mb-1">{label}</label>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          name={name}
          value={display}
          onChange={(e) => {
            const v = toHalfWidth(e.target.value).replace(/[^0-9.]/g, '');
            setDisplay(v);
            onChange?.(v === '' ? '' : Number(v));
          }}
          placeholder="0"
          className="form-input text-right"
          style={{ paddingRight: '2.5rem' }}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-brand-muted pointer-events-none">h</span>
      </div>
    </div>
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
