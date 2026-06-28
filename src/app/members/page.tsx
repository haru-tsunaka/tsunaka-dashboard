import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireOwner, type UserRole } from '@/lib/auth';
import Link from 'next/link';

type Profile = {
  id: string;
  email: string | null;
  role: string;
  status: string;
  created_at: string;
};

export default async function MembersPage() {
  await requireOwner();
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });

  const allProfiles = (profiles || []) as Profile[];
  const pendingProfiles = allProfiles.filter((p) => p.status === 'pending');
  const approvedProfiles = allProfiles.filter((p) => p.status === 'approved');
  const rejectedProfiles = allProfiles.filter((p) => p.status === 'rejected');

  async function approveUser(formData: FormData) {
    'use server';
    const supabase = await createClient();
    const userId = formData.get('user_id') as string;
    await supabase
      .from('profiles')
      .update({ status: 'approved' })
      .eq('id', userId);
    redirect('/members');
  }

  async function rejectUser(formData: FormData) {
    'use server';
    const supabase = await createClient();
    const userId = formData.get('user_id') as string;
    await supabase
      .from('profiles')
      .update({ status: 'rejected' })
      .eq('id', userId);
    redirect('/members');
  }

  async function changeRole(formData: FormData) {
    'use server';
    const supabase = await createClient();
    const userId = formData.get('user_id') as string;
    const newRole = formData.get('role') as string;
    await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);
    redirect('/members');
  }

  const roleLabels: Record<string, string> = {
    owner: 'オーナー',
    manager: 'マネージャー',
    staff: 'スタッフ',
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-navy text-2xl font-bold">なかま</h1>
        <Link href="/" className="text-brand-muted text-sm hover:text-navy transition-colors">
          おもいへ &rarr;
        </Link>
      </div>

      {/* 承認待ち */}
      {pendingProfiles.length > 0 && (
        <div className="bg-white rounded-lg border border-brand-border p-6 mb-6">
          <SectionLabel label="承認待ち" />
          <div className="space-y-3">
            {pendingProfiles.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-brand-border/50 last:border-0">
                <div>
                  <p className="text-sm font-medium">{p.email || '(メール不明)'}</p>
                  <p className="text-xs text-brand-muted">{new Date(p.created_at).toLocaleDateString('ja-JP')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <form action={approveUser}>
                    <input type="hidden" name="user_id" value={p.id} />
                    <button type="submit" className="px-3 py-1.5 text-xs rounded-lg bg-navy text-white hover:bg-navy-light transition-colors">
                      承認
                    </button>
                  </form>
                  <form action={rejectUser}>
                    <input type="hidden" name="user_id" value={p.id} />
                    <button type="submit" className="px-3 py-1.5 text-xs rounded-lg border border-brand-border text-brand-muted hover:border-red-300 hover:text-red-500 transition-colors">
                      拒否
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 承認済み */}
      <div className="bg-white rounded-lg border border-brand-border p-6 mb-6">
        <SectionLabel label="なかま" />
        {approvedProfiles.length === 0 ? (
          <p className="text-sm text-brand-muted">まだなかまがいません</p>
        ) : (
          <div className="space-y-3">
            {approvedProfiles.map((p) => (
              <div key={p.id} className="py-3 border-b border-brand-border/50 last:border-0">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.email || '(メール不明)'}</p>
                    <p className="text-xs text-brand-muted">{roleLabels[p.role] || p.role}</p>
                  </div>
                </div>
                {p.role !== 'owner' && (
                  <div className="flex items-center gap-2 mt-2">
                    <form action={changeRole} className="flex items-center gap-2 flex-1">
                      <input type="hidden" name="user_id" value={p.id} />
                      <select
                        name="role"
                        defaultValue={p.role}
                        className="text-xs border border-brand-border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-navy flex-1"
                      >
                        <option value="staff">スタッフ</option>
                        <option value="manager">マネージャー</option>
                      </select>
                      <button type="submit" className="px-3 py-1.5 text-xs rounded-lg border border-brand-border text-brand-muted hover:border-navy hover:text-navy transition-colors shrink-0">
                        変更
                      </button>
                    </form>
                    <form action={rejectUser}>
                      <input type="hidden" name="user_id" value={p.id} />
                      <button type="submit" className="px-3 py-1.5 text-xs rounded-lg border border-brand-border text-brand-muted hover:border-red-300 hover:text-red-500 transition-colors shrink-0">
                        取消
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 拒否済み */}
      {rejectedProfiles.length > 0 && (
        <div className="bg-white rounded-lg border border-brand-border p-6">
          <SectionLabel label="拒否済み" />
          <div className="space-y-3">
            {rejectedProfiles.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-brand-border/50 last:border-0">
                <p className="text-sm text-brand-muted">{p.email || '(メール不明)'}</p>
                <form action={approveUser}>
                  <input type="hidden" name="user_id" value={p.id} />
                  <button type="submit" className="px-3 py-1.5 text-xs rounded-lg border border-brand-border text-brand-muted hover:border-navy hover:text-navy transition-colors">
                    承認する
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-6 h-px bg-gold" />
      <span className="text-xs font-semibold text-gold tracking-widest">{label}</span>
    </div>
  );
}
