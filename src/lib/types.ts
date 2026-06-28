export type CaseStatus = '商談中' | '準備中' | '進行中' | '納品済み' | '完了';
export type PaymentStatus = '未入金' | '一部入金' | '入金済み';
export type ContactMethod = 'email' | 'DM' | 'LINE' | '';

export interface Case {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  client_name: string | null;
  category: string;
  description: string | null;
  status: CaseStatus;
  event_date: string | null;
  deadline: string | null;
  quoted_amount: number | null;
  payment_status: PaymentStatus;
  expenses: number;
  next_action: string | null;
  next_action_by: string | null;
  next_action_memo: string | null;
  contact_method: string | null;
  contact_info: string | null;
  payment_amount: number | null;
  payment_date: string | null;
  deliverables: string | null;
  menu: string | null;
  plan: string | null;
  est_hours_meeting: number | null;
  est_hours_planning: number | null;
  est_hours_shooting: number | null;
  est_hours_editing: number | null;
  actual_hours_meeting: number | null;
  actual_hours_planning: number | null;
  actual_hours_shooting: number | null;
  actual_hours_editing: number | null;
  user_id: string;
}

export interface CaseContact {
  id: string;
  case_id: string;
  name: string;
  name_reading: string | null;
  department: string | null;
  role: string | null;
  contact_method: string | null;
  contact_info: string | null;
  memo: string | null;
  created_at: string;
  user_id: string;
}

export interface ProgressLog {
  id: string;
  case_id: string;
  created_at: string;
  title: string | null;
  content: string;
  work_phase: string | null;
  hours: number | null;
  started_at: string | null;
  ended_at: string | null;
  is_cancelled: boolean;
  user_id: string;
}

export const WORK_PHASES = [
  { value: 'meeting', label: '打ち合わせ' },
  { value: 'planning', label: '企画・構成' },
  { value: 'shooting', label: '撮影' },
  { value: 'editing', label: '編集〜納品' },
  { value: 'other', label: 'その他' },
] as const;
