import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Case, CaseContact, ProgressLog } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import ProgressLogSection from '@/components/ProgressLog';
import ContactSection from '@/components/ContactSection';
import Link from 'next/link';
import { PAYMENT_COLORS, HOURLY_RATE } from '@/lib/constants';
import DeleteCaseButton from '@/components/DeleteCaseButton';
import NextActionEditor from '@/components/NextActionEditor';
import { formatDate, formatDateTime, formatYen } from '@/lib/formatting';
import { requireApprovedUser, canSeeFinancials, canSeeContacts } from '@/lib/auth';

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireApprovedUser();
  const showFinancials = canSeeFinancials(profile.role);
  const showContacts = canSeeContacts(profile.role);
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

  async function cancelLog(formData: FormData) {
    'use server';
    const supabase = await createClient();
    const logId = formData.get('log_id') as string;
    await supabase.from('progress_logs').update({ is_cancelled: true }).eq('id', logId);
    revalidatePath(`/cases/${id}`);
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

    revalidatePath(`/cases/${id}`);
  }

  async function updateContact(formData: FormData) {
    'use server';
    const supabase = await createClient();
    const contactId = formData.get('contact_id') as string;
    await supabase.from('case_contacts').update({
      name: (formData.get('contact_name') as string).trim(),
      name_reading: (formData.get('contact_name_reading') as string) || null,
      department: (formData.get('contact_department') as string) || null,
      role: (formData.get('contact_role') as string) || null,
      contact_method: (formData.get('contact_method') as string) || null,
      contact_info: (formData.get('contact_info') as string) || null,
      memo: (formData.get('contact_memo') as string) || null,
    }).eq('id', contactId);
    revalidatePath(`/cases/${id}`);
  }

  async function deleteContact(formData: FormData) {
    'use server';
    const supabase = await createClient();
    const contactId = formData.get('contact_id') as string;
    await supabase.from('case_contacts').delete().eq('id', contactId);
    revalidatePath(`/cases/${id}`);
  }

  async function updateNextAction(formData: FormData) {
    'use server';
    const supabase = await createClient();
    await supabase.from('cases').update({
      next_action: (formData.get('next_action') as string) || null,
      next_action_by: formData.get('next_action_by') ? `${formData.get('next_action_by')}:00+09:00` : null,
      next_action_memo: (formData.get('next_action_memo') as string) || null,
    }).eq('id', id);
    revalidatePath(`/cases/${id}`);
    revalidatePath('/');
  }

  async function completeNextAction() {
    'use server';
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // 現在のネクストアクションを取得
    const { data: current } = await supabase
      .from('cases')
      .select('next_action, next_action_by, next_action_memo')
      .eq('id', id)
      .single();

    if (current?.next_action) {
      const title = current.next_action;
      const memo = current.next_action_memo || '';

      // ネクストアクションをクリア
      await supabase.from('cases').update({
        next_action: null,
        next_action_by: null,
        next_action_memo: null,
      }).eq('id', id);

      revalidatePath(`/cases/${id}`);
      revalidatePath('/');

      // きろくページへリダイレクト（内容を引き継ぎ）
      const params = new URLSearchParams({ case_id: id, title });
      if (memo) params.set('content', memo);
      redirect(`/log?${params.toString()}`);
    }

    revalidatePath(`/cases/${id}`);
    revalidatePath('/');
  }

  async function deleteCase() {
    'use server';
    const supabase = await createClient();
    await supabase.from('cases').delete().eq('id', id);
    revalidatePath('/');
    redirect('/');
  }

  const isOverdue = c.next_action_by && new Date(c.next_action_by) < new Date();

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 md:py-8 pb-12">
      <Link href="/" className="text-brand-muted text-sm hover:text-navy transition-colors mb-4 md:mb-6 inline-block py-1">
        &larr; 戻る
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 md:mb-8 gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-navy text-xl md:text-2xl font-bold mb-1">{c.name}</h1>
          {c.client_name && <p className="text-brand-muted text-xs md:text-sm">{c.client_name}</p>}
        </div>
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <StatusBadge status={c.status} />
          <Link
            href={`/cases/${c.id}/edit`}
            className="px-4 py-2 rounded-lg border border-brand-border text-brand-muted text-xs font-medium hover:border-navy hover:text-navy transition-colors"
          >
            編集
          </Link>
        </div>
      </div>

      {/* Info sections */}
      <div className="space-y-6 md:space-y-8">
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
        {showContacts && (
          <InfoSection label="担当者" bg>
            <ContactSection
              contacts={(contacts || []) as CaseContact[]}
              addContactAction={addContact}
              updateContactAction={updateContact}
              deleteContactAction={deleteContact}
            />
          </InfoSection>
        )}

        {/* Schedule */}
        <InfoSection label="スケジュール">
          <InfoGrid>
            <InfoItem label="イベント・撮影日" value={formatDate(c.event_date, '未定')} />
            <InfoItem label="納期" value={formatDate(c.deadline, '未定')} />
          </InfoGrid>
        </InfoSection>

        {/* つくるもの */}
        <InfoSection label="つくるもの" bg>
          <p className="text-sm whitespace-pre-wrap">{c.deliverables || '未設定'}</p>
        </InfoSection>

        {/* 見積もり */}
        {showFinancials && (c.est_hours_meeting !== null || c.est_hours_planning !== null || c.est_hours_shooting !== null || c.est_hours_editing !== null) && (
          <InfoSection label="見積もり">
            <HoursRow
              label="想定工数"
              meeting={c.est_hours_meeting}
              planning={c.est_hours_planning}
              shooting={c.est_hours_shooting}
              editing={c.est_hours_editing}
            />
          </InfoSection>
        )}

        {/* 実績工数（進捗ログから自動集計） */}
        {(() => {
          const actualByPhase: Record<string, number> = {};
          (logs || []).forEach((log) => {
            const l = log as ProgressLog;
            const h = Number(l.hours);
            if (l.work_phase && h > 0 && !l.is_cancelled) {
              actualByPhase[l.work_phase] = (actualByPhase[l.work_phase] || 0) + h;
            }
          });
          const hasActual = Object.keys(actualByPhase).length > 0;
          if (!hasActual) return null;

          const actMeeting = actualByPhase['meeting'] || 0;
          const actPlanning = actualByPhase['planning'] || 0;
          const actShooting = actualByPhase['shooting'] || 0;
          const actEditing = actualByPhase['editing'] || 0;
          const actTravel = actualByPhase['travel'] || 0;
          const actOther = actualByPhase['other'] || 0;
          const actTotal = actMeeting + actPlanning + actShooting + actEditing + actTravel + actOther;

          const estTotal = (c.est_hours_meeting || 0) + (c.est_hours_planning || 0) + (c.est_hours_shooting || 0) + (c.est_hours_editing || 0);
          const hasEst = estTotal > 0;
          const diff = actTotal - estTotal;

          return (
            <InfoSection label="実績工数">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <InfoItem label="打ち合わせ" value={actMeeting > 0 ? `${actMeeting}h` : '-'} />
                <InfoItem label="企画・構成" value={actPlanning > 0 ? `${actPlanning}h` : '-'} />
                <InfoItem label="撮影" value={actShooting > 0 ? `${actShooting}h` : '-'} />
                <InfoItem label="編集〜納品" value={actEditing > 0 ? `${actEditing}h` : '-'} />
                <InfoItem label="移動" value={actTravel > 0 ? `${actTravel}h` : '-'} />
              </div>
              <p className="text-xs text-brand-muted mt-2">
                合計: <span className="font-bold text-navy">{actTotal}h</span>
                {actOther > 0 && <span className="ml-1">（その他 {actOther}h 含む）</span>}
              </p>
              {showFinancials && hasEst && (
                <p className={`text-xs mt-1 ${diff > 0 ? 'text-red-500' : 'text-green-600'}`}>
                  見積もり比: {diff > 0 ? '+' : ''}{diff}h ({diff > 0 ? '+' : ''}{formatYen(diff * HOURLY_RATE)})
                </p>
              )}
            </InfoSection>
          );
        })()}

        {/* 収支 */}
        {showFinancials && <InfoSection label="収支" bg>
          <InfoGrid>
            <InfoItem label="見積金額" value={formatYen(c.quoted_amount, '未定')} />
            <InfoItem label="入金額" value={formatYen(c.payment_amount, '未定')} />
            <InfoItem label="経費" value={formatYen(c.expenses, '未定')} />
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
        </InfoSection>}

        {/* Next Action */}
        <InfoSection label="次のアクション">
          <NextActionEditor
            nextAction={c.next_action}
            nextActionBy={c.next_action_by}
            nextActionMemo={c.next_action_memo}
            isOverdue={!!isOverdue}
            action={updateNextAction}
            completeAction={completeNextAction}
          />
        </InfoSection>

        {/* Progress Log */}
        <InfoSection label="進捗ログ">
          <ProgressLogSection logs={(logs || []) as ProgressLog[]} caseId={id} cancelLogAction={cancelLog} />
        </InfoSection>
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
    <div className={`rounded-lg p-4 md:p-6 ${bg ? 'bg-brand-bg' : ''}`}>
      <div className="flex items-center gap-3 mb-3 md:mb-4">
        <div className="w-6 h-px bg-gold" />
        <span className="text-xs font-semibold text-gold tracking-widest">{label}</span>
      </div>
      {children}
    </div>
  );
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">{children}</div>;
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-brand-muted mb-0.5">{label}</p>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function HoursRow({
  label,
  meeting,
  planning,
  shooting,
  editing,
}: {
  label: string;
  meeting: number | null;
  planning: number | null;
  shooting: number | null;
  editing: number | null;
}) {
  const total = (meeting || 0) + (planning || 0) + (shooting || 0) + (editing || 0);
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <InfoItem label="打ち合わせ" value={meeting !== null ? `${meeting}h` : '-'} />
        <InfoItem label="企画・構成" value={planning !== null ? `${planning}h` : '-'} />
        <InfoItem label="撮影" value={shooting !== null ? `${shooting}h` : '-'} />
        <InfoItem label="編集〜納品" value={editing !== null ? `${editing}h` : '-'} />
      </div>
      {total > 0 && (
        <p className="text-xs text-brand-muted mt-2">
          合計: <span className="font-bold text-navy">{total}h</span>
        </p>
      )}
    </div>
  );
}
