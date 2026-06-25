import type { CaseStatus, PaymentStatus } from './types';

export const CASE_STATUSES: CaseStatus[] = [
  '商談中', '準備中', '進行中', '納品済み', '完了'
];

export const PAYMENT_STATUSES: PaymentStatus[] = [
  '未入金', '一部入金', '入金済み'
];

export const CATEGORIES = [
  { value: 'event', label: 'イベント撮影' },
  { value: 'branding', label: 'ブランディング' },
  { value: 'wedding', label: 'ウエディング' },
  { value: 'sns', label: 'SNS運用' },
  { value: 'other', label: 'その他' },
];

export const STATUS_COLORS: Record<CaseStatus, { bg: string; text: string }> = {
  '商談中': { bg: 'bg-navy/10', text: 'text-navy' },
  '準備中': { bg: 'bg-navy/5', text: 'text-navy/70' },
  '進行中': { bg: 'bg-navy/15', text: 'text-navy' },
  '納品済み': { bg: 'bg-green-50', text: 'text-green-700' },
  '完了': { bg: 'bg-gray-100', text: 'text-brand-muted' },
};

export const PAYMENT_COLORS: Record<PaymentStatus, string> = {
  '未入金': 'bg-red-300',
  '一部入金': 'bg-amber-300',
  '入金済み': 'bg-green-300',
};
