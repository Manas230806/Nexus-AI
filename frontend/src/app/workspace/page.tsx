'use client';

import Link from 'next/link';
import { ArrowRight, MessageSquareText, Sparkles } from 'lucide-react';
import { useWorkspace } from '../../hooks/useWorkspace';
import Shell from '../../components/Shell';

export default function WorkspacePage() {
  const { groups, projects, loading } = useWorkspace();

  return (
    <Shell>
      <div className="p-6 lg:p-8 h-full space-y-6 overflow-y-auto">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-[var(--text-muted)]">Workspace overview</p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--text-strong)]">A polished home for your daily momentum.</h1>
          </div>
          <Link href="/workspace/chat" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-[var(--text-strong)] transition hover:opacity-90">
            <MessageSquareText className="h-4 w-4" />
            Open chat
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'Active groups', value: groups.length || 0 },
            { label: 'Projects', value: projects.length || 0 },
            { label: 'Focus mode', value: 'On' },
          ].map((item) => (
            <div key={item.label} className="rounded-[24px] border border-[var(--border-color-strong)] bg-[var(--bg-hover)] p-4">
              <p className="text-sm text-[var(--text-muted)]">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--text-strong)]">{item.value}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="rounded-[24px] border border-[var(--border-color-strong)] bg-[var(--bg-hover)] p-8 text-[var(--text-muted)]">Loading your workspace...</div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-[28px] border border-[var(--border-color-strong)] bg-[var(--bg-hover)] p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[var(--text-strong)]">Projects</h2>
                <div className="rounded-full border border-sky-400/20 bg-sky-400/10 p-2 text-sky-200">
                  <Sparkles className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {projects.length ? projects.map((project) => (
                  <div key={project._id} className="rounded-2xl border border-[var(--border-color-strong)] bg-[var(--bg-panel)]/70 p-4">
                    <p className="text-base font-semibold text-[var(--text-strong)]">{project.name}</p>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">{project.description || 'No details yet.'}</p>
                  </div>
                )) : <p className="text-sm text-[var(--text-muted)]">You do not have any projects yet.</p>}
              </div>
            </section>

            <section className="rounded-[28px] border border-[var(--border-color-strong)] bg-[var(--bg-hover)] p-5">
              <h2 className="text-xl font-semibold text-[var(--text-strong)]">Groups</h2>
              <div className="mt-5 space-y-3">
                {groups.length ? groups.map((group) => (
                  <div key={group._id} className="rounded-2xl border border-[var(--border-color-strong)] bg-[var(--bg-panel)]/70 p-4">
                    <p className="text-base font-semibold text-[var(--text-strong)]">{group.name}</p>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">{group.description || 'No description yet.'}</p>
                  </div>
                )) : <p className="text-sm text-[var(--text-muted)]">You are not part of any groups yet.</p>}
              </div>
            </section>
          </div>
        )}
      </div>
    </Shell>
  );
}
