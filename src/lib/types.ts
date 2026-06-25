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
  contact_method: string | null;
  contact_info: string | null;
  deliverables: string | null;
  user_id: string;
}

export interface ProgressLog {
  id: string;
  case_id: string;
  created_at: string;
  content: string;
  user_id: string;
}
