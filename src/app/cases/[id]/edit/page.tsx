import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Case } from '@/lib/types';
import CaseForm from '@/components/CaseForm';
import DeleteCaseButton from '@/components/DeleteCaseButton';
import Link from 'next/link';
import { numOrNull } from '@/lib/formatting';
import { requireApprovedUser, canSeeFinancials } from '@/lib/auth';

export default async function EditCasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireApprovedUser();
  const showFinancials = canSeeFinancials(profile.role);
  const supabase = await createClient();

  const { data: caseData } = await supabase
    .from('cases')
    .select('*')
    .eq('id', id)
    .single();

  if (!caseData) notFound();

  async function updateCase(formData: FormData) {
    'use server';
    const supabase = await createClient();

    const { error } = await supabase
      .from('cases')
      .update({
        name: formData.get('name') as string,
        client_name: (formData.get('client_name') as string) || null,
        category: formData.get('category') as string,
        description: (formData.get('description') as string) || null,
        status: formData.get('status') as string,
        event_date: (formData.get('event_date') as string) || null,
        deadline: (formData.get('deadline') as string) || null,
        quoted_amount: numOrNull(formData, 'quoted_amount'),
        payment_status: formData.get('payment_status') as string,
        expenses: Number(formData.get('expenses')) || 0,
        payment_amount: numOrNull(formData, 'payment_amount'),
        payment_date: (formData.get('payment_date') as string) || null,
        next_action: (formData.get('next_action') as string) || null,
        next_action_by: formData.get('next_action_by') ? `${formData.get('next_action_by')}:00+09:00` : null,
        contact_method: (formData.get('contact_method') as string) || null,
        contact_info: (formData.get('contact_info') as string) || null,
        deliverables: (formData.get('deliverables') as string) || null,
        menu: (formData.get('menu') as string) || null,
        plan: (formData.get('plan') as string) || null,
        est_hours_meeting: numOrNull(formData, 'est_hours_meeting'),
        est_hours_planning: numOrNull(formData, 'est_hours_planning'),
        est_hours_shooting: numOrNull(formData, 'est_hours_shooting'),
        est_hours_editing: numOrNull(formData, 'est_hours_editing'),
      })
      .eq('id', id);

    if (!error) {
      revalidatePath(`/cases/${id}`);
      revalidatePath('/');
      redirect(`/cases/${id}`);
    }
  }

  async function deleteCase() {
    'use server';
    const supabase = await createClient();
    await supabase.from('cases').delete().eq('id', id);
    revalidatePath('/');
    redirect('/');
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 md:py-8 pb-12">
      <Link href={`/cases/${id}`} className="text-brand-muted text-sm hover:text-navy transition-colors mb-4 md:mb-6 inline-block py-1">
        &larr; 戻る
      </Link>
      <h1 className="font-serif text-navy text-xl md:text-2xl font-bold mb-6 md:mb-8">おもいを編集</h1>
      <CaseForm initialData={caseData as Case} action={updateCase} showFinancials={showFinancials} />

      <div className="mt-16 pt-8 border-t border-brand-border">
        <DeleteCaseButton deleteAction={deleteCase} />
      </div>
    </div>
  );
}
