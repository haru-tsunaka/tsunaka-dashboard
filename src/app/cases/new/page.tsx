import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CaseForm from '@/components/CaseForm';
import Link from 'next/link';

export default function NewCasePage() {
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
      quoted_amount: formData.get('quoted_amount') ? Number(formData.get('quoted_amount')) : null,
      payment_status: formData.get('payment_status') as string,
      expenses: Number(formData.get('expenses')) || 0,
      next_action: (formData.get('next_action') as string) || null,
      next_action_by: (formData.get('next_action_by') as string) || null,
      contact_method: (formData.get('contact_method') as string) || null,
      contact_info: (formData.get('contact_info') as string) || null,
      deliverables: (formData.get('deliverables') as string) || null,
      user_id: user.id,
    });

    if (!error) redirect('/');
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/" className="text-brand-muted text-sm hover:text-navy transition-colors mb-6 inline-block">
        &larr; ダッシュボードに戻る
      </Link>
      <h1 className="font-serif text-navy text-2xl font-bold mb-8">新規案件</h1>
      <CaseForm action={createCase} />
    </div>
  );
}
