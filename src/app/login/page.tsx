'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('メールアドレスまたはパスワードが正しくありません');
      setLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-brand-bg">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="font-serif text-navy text-3xl font-bold tracking-wider mb-2">繋叶</h1>
          <p className="text-brand-muted text-sm tracking-wide">Dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-xl p-8 shadow-sm border border-brand-border">
          <div className="mb-5">
            <label className="block text-xs text-brand-muted mb-1.5 tracking-wide">EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-brand-border text-sm focus:outline-none focus:border-gold transition-colors"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-xs text-brand-muted mb-1.5 tracking-wide">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-brand-border text-sm focus:outline-none focus:border-gold transition-colors"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs mb-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full bg-gold text-navy font-bold text-sm tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  );
}
