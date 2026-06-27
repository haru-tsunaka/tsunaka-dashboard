import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Case, ProgressLog } from '@/lib/types';
import LogForm from '@/components/LogForm';
import LogTimeline from '@/components/LogTimeline';

export default async function LogPage({
  searchParams,
}: {
  searchParams: Promise<{ case_id?: string; title?: string; content?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // 案件一覧（選択用）
  const { data: cases } = await supabase
    .from('cases')
    .select('id, name, client_name, status')
    .in('status', ['商談中', '準備中', '進行中', '納品済み'])
    .order('created_at', { ascending: false });

  // 直近の記録（全案件横断）
  const { data: logs } = await supabase
    .from('progress_logs')
    .select('*, cases!inner(name, client_name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30);

  async function addLog(formData: FormData) {
    'use server';
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const title = formData.get('title') as string;
    if (!title?.trim()) return;

    const startedAt = formData.get('started_at') as string;
    const endedAt = formData.get('ended_at') as string;
    const hours = formData.get('hours') as string;

    const caseId = formData.get('case_id') as string;

    const { error } = await supabase.from('progress_logs').insert({
      case_id: caseId,
      title: title.trim(),
      content: (formData.get('content') as string)?.trim() || '',
      work_phase: (formData.get('work_phase') as string) || null,
      hours: hours ? Number(hours) : null,
      started_at: startedAt || null,
      ended_at: endedAt || null,
      user_id: user.id,
    });

    if (error) {
      console.error('Failed to add log:', error);
      return;
    }

    revalidatePath('/log');
    revalidatePath(`/cases/${caseId}`);
  }

  async function cancelLog(formData: FormData) {
    'use server';
    const supabase = await createClient();
    const logId = formData.get('log_id') as string;
    const caseId = formData.get('case_id') as string;
    await supabase.from('progress_logs').update({ is_cancelled: true }).eq('id', logId);
    revalidatePath('/log');
    revalidatePath(`/cases/${caseId}`);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 md:py-8 pb-12">
      <h1 className="font-serif text-navy text-xl md:text-2xl font-bold mb-6">きろく</h1>

      <LogForm
        cases={(cases || []) as Case[]}
        action={addLog}
        defaultCaseId={params.case_id}
        defaultTitle={params.title}
        defaultContent={params.content}
      />

      <div className="mt-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-6 h-px bg-gold" />
          <span className="text-xs font-semibold text-gold tracking-widest">最近のきろく</span>
        </div>
        <LogTimeline logs={(logs || []) as (ProgressLog & { cases: { name: string; client_name: string | null } })[]} cancelAction={cancelLog} />
      </div>
    </div>
  );
}
