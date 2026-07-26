import Link from 'next/link';
import { ArrowRight, MessageSquareText, ShieldCheck, Zap } from 'lucide-react';
import Logo from '../components/Logo';

const highlights = [
  { title: 'Live collaboration', description: 'Switch from ideas to decisions in real time with a fluid workspace.' },
  { title: 'Smart AI assistant', description: 'Summaries, replies, and meeting prep arrive right where your team works.' },
  { title: 'Secure by design', description: 'Enterprise-grade feel with polished flows that keep every room focused.' },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.2),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(167,139,250,0.18),_transparent_30%),linear-gradient(135deg,_#020617_0%,_#050b1e_50%,_#020617_100%)] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <header className="flex items-center justify-between rounded-full border border-slate-700/50 bg-[#0f172a]/70 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <Logo size={40} showText={false} />
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">Nexus AI</p>
              <p className="text-sm font-semibold text-white">Design-led teamwork</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="rounded-full border border-slate-700/50 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10">
              Sign in
            </Link>
            <Link href="/auth/register" className="rounded-full bg-gradient-to-r from-sky-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90">
              Create account
            </Link>
          </div>
        </header>

        <div className="mt-10 grid flex-1 items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-sm text-sky-200">
              <Zap className="h-4 w-4" />
              New • AI-powered collaboration workspace
            </div>
            <h1 className="mt-6 text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              The polished home for modern product teams.
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              A clear and elegant workspace for chat, projects, AI assistance, notes, and meetings — all designed to feel effortless from day one.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/auth/login" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90">
                Open workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/workspace/chat" className="inline-flex items-center gap-2 rounded-full border border-slate-700/50 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10">
                <MessageSquareText className="h-4 w-4" />
                Explore chat
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {highlights.map((item) => (
                <div key={item.title} className="rounded-2xl border border-slate-700/50 bg-[#0f172a]/60 p-4 backdrop-blur">
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[32px] border border-slate-700/50 bg-[#0f172a]/75 p-4 shadow-[0_30px_100px_rgba(2,6,23,0.55)] backdrop-blur-xl sm:p-6">
            <div className="rounded-[24px] border border-slate-700/50 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Live workspace preview</p>
                  <p className="mt-1 text-lg font-semibold text-white">Share updates, stay aligned</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-300">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-5 space-y-3 rounded-[24px] border border-slate-700/50 bg-[#0f172a]/70 p-4">
                <div className="rounded-2xl bg-white/5 p-3">
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>Weekly launch notes</span>
                    <span>4 min ago</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-white">The onboarding experience is now polished and shared across the team.</p>
                </div>
                <div className="rounded-2xl bg-gradient-to-r from-sky-500/15 to-violet-500/15 p-3">
                  <p className="text-sm font-semibold text-sky-200">AI summary ready</p>
                  <p className="mt-2 text-sm text-slate-300">Highlights: 7 tasks completed, 3 design iterations shipped, 1 launch checklist approved.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
