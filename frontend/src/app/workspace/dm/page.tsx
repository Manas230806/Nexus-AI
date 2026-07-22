'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, MessageCircle } from 'lucide-react';
import Shell from '../../../components/Shell';
import { supabase } from '../../../lib/supabaseClient';
import Link from 'next/link';

export default function DirectMessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDMs = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const myId = session.user.id;

      // Find all conversations this user is part of
      const { data: myParticipants } = await supabase
        .from('participants')
        .select('conversation_id')
        .eq('user_id', myId);

      if (!myParticipants || myParticipants.length === 0) {
        setLoading(false);
        return;
      }

      const convIds = myParticipants.map(p => p.conversation_id);

      // Find the OTHER participants in these conversations
      const { data: otherParticipants } = await supabase
        .from('participants')
        .select('conversation_id, user_id, users(name, username, avatar_url)')
        .in('conversation_id', convIds)
        .neq('user_id', myId);

      if (otherParticipants) {
        setConversations(otherParticipants);
      }
      setLoading(false);
    };

    fetchDMs();
  }, []);

  return (
    <Shell>
      <div className="flex h-full w-full overflow-hidden text-[var(--text-main)]">
        
        {/* DM Sidebar List */}
        <div className="flex w-[260px] flex-col border-r border-[var(--border-color)] bg-[var(--bg-sidebar)] backdrop-blur-sm">
          <div className="p-4 border-b border-[var(--border-color)]">
             <div className="relative flex items-center rounded-xl bg-[var(--bg-panel)] border border-[var(--border-color)] px-3 py-2 transition-colors focus-within:border-[rgb(var(--accent-main))]/50">
              <Search className="h-4 w-4 text-[var(--text-muted)]" />
              <input 
                type="text" 
                placeholder="Find a conversation..." 
                className="ml-2 w-full bg-transparent text-sm text-[var(--text-main)] placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide py-4 px-3 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 px-2">Recent Messages</div>
            
            {loading ? (
              <div className="px-3 text-sm text-[var(--text-muted)]">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="px-3 text-sm text-[var(--text-muted)]">No direct messages yet.</div>
            ) : (
              conversations.map((conv) => (
                <Link key={conv.conversation_id} href={`/workspace/chat/${conv.conversation_id}`} className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-all text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[rgb(var(--accent-main))]/20 text-[rgb(var(--accent-main))] font-bold shadow-sm">
                      {conv.users?.avatar_url || 'U'}
                    </div>
                    <div className="flex flex-col items-start overflow-hidden">
                      <span className="font-medium text-[var(--text-strong)] truncate">{conv.users?.name || 'Unknown'}</span>
                      <span className="text-[10px] text-[var(--text-muted)] truncate">@{conv.users?.username}</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Main DM Chat Area Placeholder */}
        <div className="flex-1 flex flex-col items-center justify-center bg-[var(--bg-main)]">
           <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--bg-hover)] text-[var(--text-muted)] mb-6">
             <MessageCircle className="h-8 w-8" />
           </div>
           <h2 className="text-2xl font-bold text-[var(--text-strong)]">Your Direct Messages</h2>
           <p className="mt-2 text-[var(--text-muted)] max-w-md text-center">Select a conversation from the sidebar or click the + button in the main navigation to start a new message by searching for a username.</p>
        </div>
      </div>
    </Shell>
  );
}
