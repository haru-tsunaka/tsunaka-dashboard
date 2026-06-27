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

export const HOURLY_RATE = 3000;

export const MENUS = [
  { value: 'family_photo', label: 'ファミリーフォト' },
  { value: 'anniversary_movie', label: '記念日ムービー' },
  { value: 'pr_video', label: 'PR映像制作' },
  { value: 'sns_support', label: 'SNS伴走プラン' },
  { value: 'custom', label: 'カスタム' },
] as const;

export const PLANS = [
  { value: 'light', label: 'ライト' },
  { value: 'standard', label: 'スタンダード' },
  { value: 'premium', label: 'プレミアム' },
] as const;

export type MenuPlanPreset = {
  hearing: number;
  planning: number;
  shooting: number;
  editing: number;
};

export const MENU_PLAN_PRESETS: Record<string, Record<string, MenuPlanPreset>> = {
  family_photo: {
    light:    { hearing: 0.5, planning: 0.5, shooting: 2, editing: 5 },
    standard: { hearing: 2,   planning: 2,   shooting: 4, editing: 10 },
  },
  anniversary_movie: {
    light:    { hearing: 0.5, planning: 0.5, shooting: 2, editing: 5 },
    standard: { hearing: 3,   planning: 2,   shooting: 4, editing: 10 },
  },
  pr_video: {
    standard: { hearing: 3,   planning: 2,   shooting: 4, editing: 10 },
    premium:  { hearing: 5,   planning: 4,   shooting: 7, editing: 15 },
  },
  sns_support: {
    standard: { hearing: 2,   planning: 2,   shooting: 4, editing: 10 },
  },
};
