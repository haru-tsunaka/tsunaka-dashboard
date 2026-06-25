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
  '準備中': { bg: 'bg-blue-100', text: 'text-blue-700' },
  '進行中': { bg: 'bg-gold/20', text: 'text-gold-dark' },
  '納品済み': { bg: 'bg-green-100', text: 'text-green-700' },
  '完了': { bg: 'bg-gray-100', text: 'text-gray-500' },
};

export const PAYMENT_COLORS: Record<PaymentStatus, string> = {
  '未入金': 'bg-red-400',
  '一部入金': 'bg-yellow-400',
  '入金済み': 'bg-green-400',
};
