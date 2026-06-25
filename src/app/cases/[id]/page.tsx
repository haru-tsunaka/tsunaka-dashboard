import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Case, CaseContact, ProgressLog } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import ProgressLogSection from '@/components/ProgressLog';
import ContactSection from '@/components/ContactSection';
import Link from 'next/link';
import { PAYMENT_COLORS } from '@/lib/constants';
import DeleteCaseButton from '@/components/DeleteCaseButton';

function formatDate(date: string | null) {
  if (!date) return '未定';
  const d = new Date(date + 'T00:00:00');
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

function formatDateTime(date: string | null) {
  if (!date) return '未定';
  const d = new Date(date);
  const dateStr = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  const h = d.getHours();
  const m = d.getMinutes();
  if (h === 0 && m === 0) return dateStr;
  return `${dateStr} ${h}:${String(m).padStart(2, '0')}`;
}

function formatYen(amount: number | null) {
  if (amount === null || amount === undefined) return '未定';
  return `¥${amount.toLocaleString()}`;
}

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: caseData } = await supabase
    .from('cases')
    .select('*')
    .eq('id', id)
    .single();

  if (!caseData) notFound();

  const c = caseData as Case;

  const { data: logs } = await supabase
    .from('progress_logs')
    .select('*')
    .eq('case_id', id)
    .order('created_at', { ascending: false });

  const { data: contacts } = await supabase
    .from('case_contacts')
    .select('*')
    .eq('case_id', id)
    .order('created_at', { ascending: true });

  async function addLog(formData: FormData) {
    'use server';
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const content = formData.get('content') as string;
    if (!content.trim()) return;

    await supabase.from('progress_logs').insert({
      case_id: id,
      content: content.trim(),
      user_id: user.id,
    });

    redirect(`/cases/${id}`);
  }

  async function addContact(formData: FormData) {
    'use server';
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    await supabase.from('case_contacts').insert({
      case_id: id,
      name: (formData.get('contact_name') as string).trim(),
      name_reading: (formData.get('contact_name_reading') as string) || null,
      department: (formData.get('contact_department') as string) || null,
      role: (formData.get('contact_role') as string) || null,
      contact_method: (formData.get('contact_method') as string) || null,
      contact_info: (formData.get('contact_info') as string) || null,
      memo: (formData.get('contact_memo') as string) || null,
      user_id: user.id,
    });

    redirect(`/cases/${id}`);
  }

  async function deleteContact(formData: FormData) {
    'use server';
    const supabase = await createClient();
    const contactId = formData.get('contact_id') as string;
    await supabase.from('case_contacts').delete().eq('id', contactId);
    redirect(`/cases/${id}`);
  }

  async function deleteCase() {
    'use server';
    const supabase = await createClient();
    await supabase.from('cases').delete().eq('id', id);
    redirect('/');
  }

  const isOverdue = c.next_action_by && new Date(c.next_action_by) < new Date();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/" className="text-brand-muted text-sm hover:text-navy transition-colors mb-6 inline-block">
        &larr; ダッシュボードに戻る
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-serif text-navy text-2xl font-bold mb-2">{c.name}</h1>
          {c.client_name && <p className="text-brand-muted text-sm">{c.client_name}</p>}
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={c.status} />
          <Link
            href={`/cases/${c.id}/edit`}
            className="px-5 py-2 rounded-lg border border-brand-border text-brand-muted text-xs font-medium hover:border-navy hover:text-navy transition-colors"
          >
            編集
          </Link>
        </div>
      </div>

      {/* Info sections */}
      <div className="space-y-8">
        {/* Client */}
        <InfoSection label="クライアント">
          <InfoGrid>
            <InfoItem label="カテゴリ" value={c.category} />
          </InfoGrid>
          {c.description && (
            <p className="text-sm text-brand-text mt-4 whitespace-pre-wrap">{c.description}</p>
          )}
        </InfoSection>

        {/* Contacts */}
        <InfoSection label="担当者" bg>
          <ContactSection
            contacts={(contacts || []) as CaseContact[]}
            addContactAction={addContact}
            deleteContactAction={deleteContact}
          />
        </InfoSection>

        {/* Schedule */}
        <InfoSection label="スケジュール">
          <InfoGrid>
            <InfoItem label="イベント・撮影日" value={formatDate(c.event_date)} />
            <InfoItem label="納期" value={formatDate(c.deadline)} />
          </InfoGrid>
        </InfoSection>

        {/* 収支 */}
        <InfoSection label="収支" bg>
          <InfoGrid>
            <InfoItem label="見積金額" value={formatYen(c.quoted_amount)} />
            <InfoItem label="入金額" value={formatYen(c.payment_amount)} />
            <InfoItem label="経費" value={formatYen(c.expenses)} />
            <InfoItem
              label="入金状況"
              value={
                <span className="flex items-center gap-2">
                  {c.payment_status}
                  <span className={`w-2 h-2 rounded-full ${PAYMENT_COLORS[c.payment_status]}`} />
                </span>
              }
            />
            {c.payment_amount !== null && (
              <InfoItem label="粗利" value={formatYen(c.payment_amount - c.expenses)} />
            )}
            <InfoItem label="入金日" value={c.payment_date ? formatDate(c.payment_date) : '未入金'} />
          </InfoGrid>
        </InfoSection>

        {/* Next Action */}
        <InfoSection label="次のアクション">
          <div className={isOverdue ? 'text-red-600' : ''}>
            <p className="text-sm whitespace-pre-wrap">{c.next_action || '未設定'}</p>
            {c.next_action_by && (
              <p className="text-xs text-brand-muted mt-2">期限: {formatDateTime(c.next_action_by)}</p>
            )}
          </div>
        </InfoSection>

        {/* Deliverables */}
        <InfoSection label="納品物" bg>
          <p className="text-sm whitespace-pre-wrap">{c.deliverables || '未設定'}</p>
        </InfoSection>

        {/* Progress Log */}
        <InfoSection label="進捗ログ">
          <ProgressLogSection logs={(logs || []) as ProgressLog[]} addLogAction={addLog} />
        </InfoSection>
      </div>

      {/* Delete */}
      <div className="mt-16 pt-8 border-t border-brand-border">
        <DeleteCaseButton deleteAction={deleteCase} />
      </div>
    </div>
  );
}

function InfoSection({
  label,
  bg,
  children,
}: {
  label: string;
  bg?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-lg p-6 ${bg ? 'bg-brand-bg' : ''}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-6 h-px bg-gold" />
        <span className="text-xs font-semibold text-gold tracking-widest">{label}</span>
      </div>
      {children}
    </div>
  );
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{children}</div>;
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-brand-muted mb-0.5">{label}</p>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
