'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { ArrowRight } from 'lucide-react';
import Logo from '../../../components/Logo';

export default function OnboardingPage() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userAuth, setUserAuth] = useState<any>(null);
  const router = useRouter();

  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const handleSession = async (session: any) => {
      setUserAuth(session.user);
      
      // If they already have a username, skip onboarding
      const { data: userProfile } = await supabase
        .from('users')
        .select('username')
        .eq('id', session.user.id)
        .single();
        
      if (userProfile?.username) {
        router.push('/workspace/chat');
      } else {
        setCheckingSession(false);
      }
    };

    const checkUser = async () => {
      // Check current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session) {
        handleSession(session);
      } else {
        // If no session found, or error occurred (e.g. OAuth failed), redirect to login
        router.push('/auth/login');
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        handleSession(session);
      }
    });

    checkUser();

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAuth) return;
    
    setLoading(true);
    setError('');

    const cleanUsername = username.trim().toLowerCase();

    // Check if username is taken
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', cleanUsername)
      .single();

    if (existingUser && existingUser.id !== userAuth.id) {
      setError('This username is already taken. Please choose another.');
      setLoading(false);
      return;
    }

    // Update or insert into users table
    const { error: dbError } = await supabase.from('users').upsert({
      id: userAuth.id,
      email: userAuth.email,
      name: userAuth.user_metadata?.full_name || userAuth.email?.split('@')[0] || 'Member',
      username: cleanUsername,
      avatar_url: (userAuth.user_metadata?.full_name || userAuth.email || 'M').substring(0, 2).toUpperCase(),
    });

    if (dbError) {
      setError('Failed to save username: ' + dbError.message);
      setLoading(false);
      return;
    }

    router.push('/workspace/chat');
  };

  if (checkingSession || !userAuth) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-[#020617] p-6">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--border-color-strong)] border-t-sky-500"></div>
          <p className="text-sm text-[var(--text-muted)] animate-pulse">Setting up your workspace...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-[#020617] p-6">
      <div className="w-full max-w-md rounded-[32px] border border-[var(--border-color-strong)] bg-[var(--bg-panel)]/50 p-8 shadow-2xl backdrop-blur-xl sm:p-12">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex justify-center">
            <Logo size={56} showText={false} />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-strong)]">Choose your username</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">This is how your team will find and mention you in the workspace.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-sm font-medium text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">Unique Username</label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-[var(--text-muted)] font-bold">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_.-]/g, ''))}
                required
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] py-3 pl-10 pr-4 text-[var(--text-strong)] outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                placeholder="sarah123"
              />
            </div>
            <p className="mt-2 text-xs text-[var(--text-muted)]">Only letters, numbers, underscores, and periods.</p>
          </div>

          <button
            type="submit"
            disabled={loading || username.length < 3}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-violet-500 px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Continue to Workspace'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </main>
  );
}
