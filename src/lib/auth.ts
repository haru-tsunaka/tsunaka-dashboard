import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export type UserRole = 'owner' | 'manager' | 'staff' | 'member';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  userId: string;
  role: UserRole;
  status: UserStatus;
}

/** サーバーサイドでユーザーのプロフィールを取得 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  return {
    userId: user.id,
    role: profile.role as UserRole,
    status: profile.status as UserStatus,
  };
}

/** ログイン済み + approved のプロフィールを取得。未ログインなら /login へ */
export async function requireApprovedUser(): Promise<UserProfile> {
  const profile = await getUserProfile();
  if (!profile) redirect('/login');
  if (profile.status !== 'approved') redirect('/pending');
  return profile;
}

/** owner 専用ページ用 */
export async function requireOwner(): Promise<UserProfile> {
  const profile = await requireApprovedUser();
  if (profile.role !== 'owner') redirect('/');
  return profile;
}

export function canSeeFinancials(role: UserRole): boolean {
  return role === 'owner' || role === 'manager';
}

export function canSeeContacts(role: UserRole): boolean {
  return role === 'owner' || role === 'manager';
}

export function canAccessAnalytics(role: UserRole): boolean {
  return role === 'owner';
}
