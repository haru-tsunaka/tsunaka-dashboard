'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function PendingPage() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-start justify-center px-4 pt-20 bg-brand-bg">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="font-serif text-navy text-3xl font-bold tracking-wider mb-3">Hitoha</h1>
          <p className="text-brand-muted text-xs tracking-wide leading-relaxed">いまと、これからを、ひとはにのせて。</p>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-sm border border-brand-border text-center">
          <p className="text-sm text-brand-text mb-2">アクセスの承認待ちです</p>
          <p className="text-xs text-brand-muted mb-6">管理者が承認するまでお待ちください</p>

          <button
            onClick={handleLogout}
            className="text-xs text-brand-muted hover:text-navy transition-colors"
          >
            ログアウト
          </button>
        </div>
      </div>
    </div>
  );
}
