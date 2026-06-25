'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';

const TIMEOUT_MS = 5 * 60 * 1000; // 5分

export default function InactivityGuard() {
  const lastActivity = useRef(Date.now());
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/login') return;

    const updateActivity = () => {
      lastActivity.current = Date.now();
    };

    const checkInactivity = async () => {
      if (Date.now() - lastActivity.current > TIMEOUT_MS) {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
      }
    };

    // アプリがフォアグラウンドに復帰したときチェック
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkInactivity();
      } else {
        // バックグラウンドに入った時点の時間を記録
        lastActivity.current = Date.now();
      }
    };

    // ユーザー操作で最終アクティブ時間を更新
    window.addEventListener('touchstart', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);
    document.addEventListener('visibilitychange', handleVisibility);

    // 定期チェック（開きっぱなし対策）
    const interval = setInterval(checkInactivity, 60 * 1000);

    return () => {
      window.removeEventListener('touchstart', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, [pathname, router]);

  return null;
}
