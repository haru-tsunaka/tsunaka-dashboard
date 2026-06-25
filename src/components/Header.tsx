'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (profile?.role === 'owner') setIsOwner(true);
    };
    checkRole();
  }, []);

  if (pathname === '/login') return null;

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="bg-navy sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-serif text-white text-lg font-bold tracking-wider">繋叶</span>
            <span className="text-white/70 text-sm tracking-wide ml-1">Hitoha</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/"
              className={`text-sm transition-colors ${
                pathname === '/' ? 'text-white' : 'text-white/50 hover:text-white/80'
              }`}
            >
              案件
            </Link>
            {isOwner && (
              <Link
                href="/analytics"
                className={`text-sm transition-colors ${
                  pathname === '/analytics' ? 'text-white' : 'text-white/50 hover:text-white/80'
                }`}
              >
                KPI
              </Link>
            )}
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="text-white/50 hover:text-white/80 text-xs tracking-wide transition-colors"
        >
          ログアウト
        </button>
      </div>
    </header>
  );
}
