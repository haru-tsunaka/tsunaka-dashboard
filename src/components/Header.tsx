'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/login') return null;

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="bg-navy sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-serif text-gold text-lg font-bold tracking-wider">繋叶</span>
          <span className="text-white/60 text-sm tracking-wide">Dashboard</span>
        </Link>
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
