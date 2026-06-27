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
    if (pathname !== '/login') checkRole();
  }, [pathname]);

  if (pathname === '/login') return null;

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="bg-navy sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-12 md:h-14 flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-6">
          <Link href="/" className="flex flex-col">
            <span className="font-serif text-white text-base md:text-lg font-bold tracking-wider leading-tight">Hitoha</span>
            <span className="text-white/35 text-[9px] tracking-wide leading-tight hidden md:block">いまと、これからを、ひとはにのせて。</span>
          </Link>
          <nav className="flex items-center gap-3 md:gap-4">
            <Link
              href="/"
              className={`text-sm py-2 transition-colors ${
                pathname === '/' ? 'text-white' : 'text-white/50 hover:text-white/80'
              }`}
            >
              おもい
            </Link>
            <Link
              href="/log"
              className={`text-sm py-2 transition-colors ${
                pathname === '/log' ? 'text-white' : 'text-white/50 hover:text-white/80'
              }`}
            >
              きろく
            </Link>
            {isOwner && (
              <>
                <Link
                  href="/analytics"
                  className={`text-sm py-2 transition-colors ${
                    pathname === '/analytics' ? 'text-white' : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  あゆみ
                </Link>
                <Link
                  href="/hours"
                  className={`text-sm py-2 transition-colors ${
                    pathname === '/hours' ? 'text-white' : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  じかん
                </Link>
              </>
            )}
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="text-white/50 hover:text-white/80 text-xs tracking-wide transition-colors py-2 pl-4"
        >
          ログアウト
        </button>
      </div>
    </header>
  );
}
