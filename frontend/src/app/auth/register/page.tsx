'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Logo from '../../../components/Logo';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Check if username is already taken
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', username.trim().toLowerCase())
      .single();

    if (existingUser) {
      setError('This username is already taken.');
      setLoading(false);
      return;
    }

    // 1. Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        }
      }
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // 2. Add them to public.users table
    if (authData.user) {
      const { error: dbError } = await supabase.from('users').upsert({
        id: authData.user.id,
        name: name,
        email: email,
        username: username.trim().toLowerCase(),
        avatar_url: name.substring(0, 2).toUpperCase(),
      });

      if (dbError) {
        setError('Failed to create user profile: ' + dbError.message);
        setLoading(false);
        return;
      }
    }

    // Direct them to chat
    router.push('/workspace/chat');
  };

  const handleGoogleLogin = async () => {
    try {
      alert("Google login button clicked! Attempting to contact Supabase...");
      setLoading(true);
      setError('');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/onboarding`
        }
      });

      if (error) {
        alert("Supabase returned an error: " + error.message);
        console.error('Supabase Google OAuth Error:', error);
        setError(error.message);
        setLoading(false);
      }
    } catch (err: any) {
      alert("A crash occurred: " + err.message);
      console.error('Unexpected Google OAuth Catch Error:', err);
      setError(err.message || 'An unexpected error occurred during Google sign-in.');
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-[#020617] p-6">
      <div className="w-full max-w-md rounded-[32px] border border-[var(--border-color-strong)] bg-[var(--bg-panel)]/50 p-8 shadow-2xl backdrop-blur-xl sm:p-12">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex justify-center">
            <Logo size={56} showText={false} />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-strong)]">Create an account</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">Join your Nexus AI workspace</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-sm font-medium text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-4 py-3 text-[var(--text-strong)] outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              placeholder="e.g. sarah123"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-4 py-3 text-[var(--text-strong)] outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              placeholder="Sarah Chen"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-4 py-3 text-[var(--text-strong)] outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-4 py-3 text-[var(--text-strong)] outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-violet-500 px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create account'}
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border-color)]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-[var(--bg-panel)] px-2 text-[var(--text-muted)]">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-4 py-3 text-sm font-bold text-[var(--text-strong)] transition hover:bg-[var(--bg-hover)] disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-[var(--text-muted)]">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-semibold text-sky-400 hover:text-sky-300">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
