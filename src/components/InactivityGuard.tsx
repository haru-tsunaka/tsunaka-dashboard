'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';

const TIMEOUT_MS = 5 * 60 * 1000; // 5分
const STORAGE_KEY = 'hitoha_last_activity';

function getLastActivity(): number {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? parseInt(stored, 10) : Date.now();
}

function updateActivity() {
  localStorage.setItem(STORAGE_KEY, Date.now().toString());
}

export default function InactivityGuard() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/login') return;

    // 初回マウント時にチェック（iOS PWAの復帰対策）
    const elapsed = Date.now() - getLastActivity();
    if (elapsed > TIMEOUT_MS) {
      const supabase = createClient();
      supabase.auth.signOut().then(() => {
        router.push('/login');
      });
      return;
    }

    // 操作時にlocalStorageへ記録
    updateActivity();

    const handleActivity = () => updateActivity();

    const checkInactivity = async () => {
      if (Date.now() - getLastActivity() > TIMEOUT_MS) {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
      }
    };

    // フォアグラウンド復帰時チェック
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkInactivity();
      }
    };

    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);
    document.addEventListener('visibilitychange', handleVisibility);

    const interval = setInterval(checkInactivity, 60 * 1000);

    return () => {
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, [pathname, router]);

  return null;
}
