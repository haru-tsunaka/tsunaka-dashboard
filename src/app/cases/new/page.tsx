import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import CaseForm from '@/components/CaseForm';
import Link from 'next/link';
import { numOrNull } from '@/lib/formatting';
import { requireApprovedUser, canSeeFinancials } from '@/lib/auth';

export default async function NewCasePage() {
  const profile = await requireApprovedUser();
  const showFinancials = canSeeFinancials(profile.role);
  async function createCase(formData: FormData) {
    'use server';
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { error } = await supabase.from('cases').insert({
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
      next_action_by: (formData.get('next_action_by') as string) || null,
      contact_method: (formData.get('contact_method') as string) || null,
      contact_info: (formData.get('contact_info') as string) || null,
      deliverables: (formData.get('deliverables') as string) || null,
      menu: (formData.get('menu') as string) || null,
      plan: (formData.get('plan') as string) || null,
      est_hours_meeting: numOrNull(formData, 'est_hours_meeting'),
      est_hours_planning: numOrNull(formData, 'est_hours_planning'),
      est_hours_shooting: numOrNull(formData, 'est_hours_shooting'),
      est_hours_editing: numOrNull(formData, 'est_hours_editing'),
      user_id: user.id,
    });

    if (!error) {
      revalidatePath('/');
      redirect('/');
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 md:py-8 pb-12">
      <Link href="/" className="text-brand-muted text-sm hover:text-navy transition-colors mb-4 md:mb-6 inline-block py-1">
        &larr; 戻る
      </Link>
      <h1 className="font-serif text-navy text-xl md:text-2xl font-bold mb-6 md:mb-8">あたらしいおもい</h1>
      <CaseForm action={createCase} showFinancials={showFinancials} />
    </div>
  );
}
