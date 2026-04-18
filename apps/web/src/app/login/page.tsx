'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { useRouter } from 'next/navigation';
import { LOGIN_MUTATION } from '@/graphql/mutations/auth';
import { saveAuth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [login, { loading }] = useMutation(LOGIN_MUTATION, {
    onCompleted(raw) {
      const data = raw as { login: { token: string; user: { id: string; username: string } } };
      const { token, user } = data.login;
      saveAuth(token, user);
      router.push('/');
      router.refresh();
    },
    onError(err) {
      setError(err.message);
    },
  });

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError('');
    login({ variables: { username, password } });
  }

  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[oklch(0.6_0.2_250)]">FinFlow</h1>
          <p className="text-white/50 mt-2 text-sm">Sign in to your account</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col gap-5"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/50 font-medium uppercase tracking-wide">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="demo"
              required
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[oklch(0.6_0.2_250)] transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/50 font-medium uppercase tracking-wide">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[oklch(0.6_0.2_250)] transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-[oklch(0.6_0.2_250)] hover:bg-[oklch(0.65_0.2_250)] disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="text-center text-xs text-white/30">
            Demo credentials: <span className="text-white/50">demo / demo123</span>
          </p>
        </form>
      </div>
    </div>
  );
}
