'use client';

import Link from 'next/link';
import { ArrowRight, MessageSquareText, Sparkles } from 'lucide-react';
import Shell from '../../../components/Shell';

const rooms = [
  { id: '11111111-1111-1111-1111-111111111111', label: 'General', blurb: 'Daily team updates and quick check-ins.' },
  { id: '22222222-2222-2222-2222-222222222222', label: 'Product', blurb: 'Roadmaps, launches, and customer context.' },
  { id: '33333333-3333-3333-3333-333333333333', label: 'Engineering', blurb: 'Implementation progress and technical decisions.' },
];

export default function ChatLandingPage() {
  return (
    <Shell>
      <div className="flex h-full w-full flex-col items-center justify-center p-4 sm:p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-5xl space-y-6 sm:space-y-8">
          <div className="rounded-2xl sm:rounded-[32px] border border-[var(--border-color-strong)] bg-[var(--bg-panel)] p-6 sm:p-10 lg:p-14 text-center shadow-xl">
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-[rgb(var(--accent-main))]">Workspace chat</p>
            <h1 className="mt-4 text-4xl lg:text-5xl font-bold text-[var(--text-strong)] tracking-tight">Choose a room that fits your workflow.</h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-[var(--text-muted)]">The new interface keeps conversation lightweight, focused, and easy to move between while the backend stays connected.</p>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:pb-0 md:snap-none px-2 sm:px-0">
            {rooms.map((room) => (
              <Link key={room.id} href={`/workspace/chat/${room.id}`} className="group flex flex-col justify-between rounded-[24px] sm:rounded-[28px] border border-[var(--border-color-strong)] bg-[var(--bg-panel)] p-6 sm:p-8 transition-all hover:-translate-y-1 hover:border-[rgb(var(--accent-main))]/50 hover:shadow-2xl hover:shadow-[rgb(var(--accent-main))]/10 min-w-[85vw] sm:min-w-[300px] md:min-w-0 snap-center shrink-0">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-[rgb(var(--accent-main))]/10 text-[rgb(var(--accent-main))] transition-colors group-hover:bg-[rgb(var(--accent-main))] group-hover:text-white">
                      <MessageSquareText className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100 group-hover:text-[rgb(var(--accent-main))]" />
                  </div>
                  <h3 className="mt-4 sm:mt-6 text-lg sm:text-xl font-bold text-[var(--text-strong)]">{room.label}</h3>
                  <p className="mt-2 sm:mt-3 text-xs sm:text-sm leading-relaxed text-[var(--text-muted)]">{room.blurb}</p>
                </div>
                <div className="mt-6 sm:mt-8 flex items-center gap-2 text-xs sm:text-sm font-bold text-[rgb(var(--accent-main))] transition-transform group-hover:translate-x-1">
                  Enter room
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}
