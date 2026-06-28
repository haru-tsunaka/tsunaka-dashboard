import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireOwner } from '@/lib/auth';
import Link from 'next/link';

type Profile = {
  id: string;
  email: string | null;
  role: string;
  status: string;
  created_at: string;
};

const roleLabels: Record<string, string> = {
  owner: 'オーナー',
  manager: 'マネージャー',
  staff: 'スタッフ',
  member: 'メンバー',
};

const roleDescriptions: Record<string, string> = {
  member: 'ダイヤリーのみ',
  staff: '案件の閲覧・記録',
  manager: '金額・連絡先も見れる',
};

export default async function MembersPage() {
  await requireOwner();
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });

  const allProfiles = (profiles || []) as Profile[];
  const owner = allProfiles.find((p) => p.role === 'owner');
  const pendingProfiles = allProfiles.filter((p) => p.status === 'pending');
  const teamMembers = allProfiles.filter((p) => p.status === 'approved' && (p.role === 'staff' || p.role === 'manager'));
  const rejectedProfiles = allProfiles.filter((p) => p.status === 'rejected');

  async function approveWithRole(formData: FormData) {
    'use server';
    const supabase = await createClient();
    const userId = formData.get('user_id') as string;
    const role = formData.get('role') as string || 'member';
    await supabase
      .from('profiles')
      .update({ status: 'approved', role })
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

  async function removeUser(formData: FormData) {
    'use server';
    const supabase = await createClient();
    const userId = formData.get('user_id') as string;
    await supabase
      .from('profiles')
      .update({ status: 'rejected', role: 'member' })
      .eq('id', userId);
    redirect('/members');
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-navy text-2xl font-bold">なかま</h1>
        <Link href="/" className="text-brand-muted text-sm hover:text-navy transition-colors">
          おもいへ &rarr;
        </Link>
      </div>

      {/* オーナー */}
      {owner && (
        <div className="flex items-center gap-3 mb-6 px-1">
          <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">
              {(owner.email || '?')[0].toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{owner.email}</p>
            <p className="text-xs text-gold">{roleLabels.owner}</p>
          </div>
        </div>
      )}

      {/* 承認待ち */}
      {pendingProfiles.length > 0 && (
        <div className="bg-white rounded-lg border border-brand-border p-5 mb-4">
          <SectionLabel label="承認待ち" />
          <div className="space-y-5">
            {pendingProfiles.map((p) => (
              <div key={p.id} className="border-b border-brand-border/50 last:border-0 pb-4 last:pb-0">
                <p className="text-sm font-medium truncate">{p.email || '(メール不明)'}</p>
                <p className="text-xs text-brand-muted mb-3">{new Date(p.created_at).toLocaleDateString('ja-JP')} 登録</p>
                <form action={approveWithRole} className="space-y-2">
                  <input type="hidden" name="user_id" value={p.id} />
                  <select
                    name="role"
                    defaultValue="member"
                    className="w-full text-base border border-brand-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-navy"
                  >
                    <option value="member">メンバー (ダイヤリーのみ)</option>
                    <option value="staff">スタッフ (案件の閲覧・記録)</option>
                    <option value="manager">マネージャー (金額・連絡先も)</option>
                  </select>
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 py-2 text-xs rounded-lg bg-navy text-white hover:bg-navy-light transition-colors">
                      承認
                    </button>
                  </div>
                </form>
                <form action={rejectUser} className="mt-2">
                  <input type="hidden" name="user_id" value={p.id} />
                  <button type="submit" className="w-full py-2 text-xs rounded-lg border border-brand-border text-brand-muted hover:border-red-300 hover:text-red-500 transition-colors">
                    拒否
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* チームメンバー（staff/manager） */}
      {teamMembers.length > 0 && (
        <div className="bg-white rounded-lg border border-brand-border p-5 mb-4">
          <SectionLabel label="チーム" />
          <div className="space-y-4">
            {teamMembers.map((p) => (
              <div key={p.id} className="border-b border-brand-border/50 last:border-0 pb-4 last:pb-0">
                <p className="text-sm font-medium truncate">{p.email || '(メール不明)'}</p>
                <p className="text-xs text-brand-muted mb-3">
                  {roleLabels[p.role] || p.role}
                  {roleDescriptions[p.role] && ` - ${roleDescriptions[p.role]}`}
                </p>
                <form action={changeRole} className="space-y-2">
                  <input type="hidden" name="user_id" value={p.id} />
                  <select
                    name="role"
                    defaultValue={p.role}
                    className="w-full text-base border border-brand-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-navy"
                  >
                    <option value="member">メンバー</option>
                    <option value="staff">スタッフ</option>
                    <option value="manager">マネージャー</option>
                  </select>
                  <button type="submit" className="w-full py-2 text-xs rounded-lg border border-brand-border text-brand-muted hover:border-navy hover:text-navy transition-colors">
                    変更
                  </button>
                </form>
                <form action={removeUser} className="mt-2">
                  <input type="hidden" name="user_id" value={p.id} />
                  <button type="submit" className="w-full py-2 text-xs rounded-lg border border-brand-border text-brand-muted hover:border-red-300 hover:text-red-500 transition-colors">
                    外す
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* チームがいない場合 */}
      {teamMembers.length === 0 && pendingProfiles.length === 0 && (
        <div className="bg-white rounded-lg border border-brand-border p-6 mb-4">
          <p className="text-sm text-brand-muted text-center py-4">
            まだチームメンバーがいません
          </p>
        </div>
      )}

      {/* 未承認 */}
      {rejectedProfiles.length > 0 && (
        <div className="rounded-lg border border-brand-border/50 p-5">
          <SectionLabel label="未承認" />
          <div className="space-y-4">
            {rejectedProfiles.map((p) => (
              <div key={p.id} className="border-b border-brand-border/50 last:border-0 pb-4 last:pb-0">
                <p className="text-sm text-brand-muted truncate mb-3">{p.email || '(メール不明)'}</p>
                <form action={approveWithRole} className="space-y-2">
                  <input type="hidden" name="user_id" value={p.id} />
                  <select
                    name="role"
                    defaultValue="member"
                    className="w-full text-base border border-brand-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-navy"
                  >
                    <option value="member">メンバー</option>
                    <option value="staff">スタッフ</option>
                    <option value="manager">マネージャー</option>
                  </select>
                  <button type="submit" className="w-full py-2 text-xs rounded-lg border border-brand-border text-brand-muted hover:border-navy hover:text-navy transition-colors">
                    承認
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
