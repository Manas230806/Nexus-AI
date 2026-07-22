'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, Mic, MoreVertical, Phone, Video, Search, UserPlus, Hash, FileText, Pin, Plus, MessageSquareText } from 'lucide-react';
import { useMessages } from '../../../../hooks/useSupabase';
import Shell from '../../../../components/Shell';
import Link from 'next/link';
import { supabase } from '../../../../lib/supabaseClient';

interface ChatRoomClientProps {
  roomId: string;
}

export default function ChatRoomClient({ roomId }: ChatRoomClientProps) {
  const { messages, sendMessage } = useMessages(roomId);
  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchChatData = async () => {
      // 1. Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const myId = session.user.id;
      setCurrentUserId(myId);

      // 2. Get participants in this room to find the "other" person
      const { data: participants } = await supabase
        .from('participants')
        .select('user_id')
        .eq('conversation_id', roomId);
      
      if (participants) {
        const otherParticipant = participants.find((p: any) => p.user_id !== myId);
        if (otherParticipant) {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', otherParticipant.user_id)
            .single();
          if (userData) setOtherUser(userData);
        }
      }
    };
    if (roomId) fetchChatData();
  }, [roomId]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!draft.trim() || !currentUserId) return;
    await sendMessage(draft.trim(), currentUserId);
    setDraft('');
  };

  if (!roomId) {
    return (
      <Shell>
        <div className="flex h-full items-center justify-center rounded-[24px] border border-[var(--border-color-strong)] bg-[var(--bg-hover)] p-6 text-[var(--text-main)]">
          <p className="text-sm text-[var(--text-muted)]">No room selected. Please navigate from the chat overview.</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="h-full w-full p-6 lg:p-8 overflow-hidden text-[var(--text-main)]">
        <div className="flex h-full w-full overflow-hidden rounded-[32px] border border-[var(--border-color)] shadow-2xl bg-[var(--bg-main)]">

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-[var(--bg-main)] relative border-r border-[var(--border-color)]">
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-[var(--border-color)] px-6 py-4 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[rgb(var(--accent-main))] text-sm font-bold text-[var(--text-strong)] shadow-sm">
                {otherUser ? otherUser.avatar_url : '??'}
                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#070913] bg-emerald-500"></div>
              </div>
              <div>
                <h1 className="text-lg font-bold text-[var(--text-strong)] tracking-tight">{otherUser ? otherUser.name : 'Loading...'}</h1>
                <p className="text-xs font-medium text-[var(--text-muted)]">Member · <span className="text-emerald-400">Online</span></p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors"><Phone className="h-4 w-4" /></button>
              <a href="https://meet.google.com/new" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors" title="Start Google Meet"><Video className="h-4 w-4" /></a>
              <button className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors"><Search className="h-4 w-4" /></button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 scroll-smooth scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="flex justify-center mb-8">
              <span className="rounded-full bg-[var(--bg-hover)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] border border-[var(--border-color)]">
                Chat Started
              </span>
            </div>

            <div className="flex flex-col gap-6 max-w-3xl mx-auto">
              {messages.length === 0 && (
                <div className="text-center text-[var(--text-muted)] text-sm py-10">
                  No messages yet. Send a message to start the conversation!
                </div>
              )}

              {messages.map((msg: any) => {
                const isMe = msg.sender_id === currentUserId;
                const date = new Date(msg.created_at);
                const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <div key={msg.id} className={`flex gap-4 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--bg-hover)] text-sm font-bold text-[var(--text-main)] shadow-md border border-[var(--border-color)]">
                      {isMe ? 'ME' : (otherUser?.avatar_url || 'U')}
                    </div>
                    <div className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 px-1">
                        <span className="text-sm font-semibold text-[var(--text-strong)]">{isMe ? 'You' : otherUser?.name}</span>
                        <span className="text-xs text-[var(--text-muted)]">{timeString}</span>
                      </div>
                      <div className={`relative px-5 py-3.5 text-[15px] leading-relaxed rounded-[20px] shadow-sm max-w-lg ${
                        isMe 
                          ? 'bg-[rgb(var(--accent-main))] border-none text-white rounded-tr-sm text-left' 
                          : 'bg-[var(--bg-panel)] border border-[var(--border-color)] text-[var(--text-main)] rounded-tl-sm'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-4 mx-auto w-full max-w-3xl">
            <div className="relative flex flex-col rounded-[24px] border border-[var(--border-color-strong)] bg-[var(--bg-panel)] p-2 shadow-lg transition-all focus-within:border-[rgb(var(--accent-main))]/50">
              <div className="flex items-center gap-2 px-2 pt-1">
                <button className="text-[var(--text-muted)] hover:text-[var(--text-strong)]"><Plus className="h-5 w-5" /></button>
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={1}
                  className="max-h-[120px] min-h-[24px] flex-1 resize-none bg-transparent py-2 text-[15px] text-[var(--text-main)] placeholder-slate-500 outline-none scrollbar-hide"
                  placeholder={otherUser ? `Message ${otherUser.name}...` : 'Type a message...'}
                />
                <button className="text-[var(--text-muted)] hover:text-[var(--text-strong)]"><Smile className="h-5 w-5" /></button>
                <button className="text-[var(--text-muted)] hover:text-[var(--text-strong)]"><Paperclip className="h-5 w-5" /></button>
                <button className={`ml-2 flex h-9 w-9 items-center justify-center rounded-full transition-all ${draft.trim() ? 'bg-[rgb(var(--accent-main))] text-[var(--text-strong)]' : 'bg-[#1E233E] text-[var(--text-muted)]'}`} onClick={() => handleSend()}>
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Info Sidebar */}
        <div className="hidden lg:flex w-[280px] flex-col bg-[var(--bg-main)]/80 backdrop-blur-md p-6 overflow-y-auto">
          {/* Profile Card */}
          <div className="flex flex-col items-center text-center border-b border-[var(--border-color)] pb-6 mb-6">
            <div className="h-20 w-20 rounded-[24px] bg-[rgb(var(--accent-main))] flex items-center justify-center text-2xl font-bold text-[var(--text-strong)] shadow-lg shadow-cyan-500/20 mb-4">
              {otherUser ? otherUser.avatar_url : '??'}
            </div>
            <h2 className="text-xl font-bold text-[var(--text-strong)] tracking-tight">{otherUser ? otherUser.name : '...'}</h2>
            <p className="text-sm text-[var(--text-muted)]">Member</p>
          </div>

          {/* Shared Files */}
          <div className="mb-6">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Shared Files</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-2 hover:bg-[var(--bg-hover)] transition cursor-pointer">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgb(var(--accent-main))]/20 text-[rgb(var(--accent-main))]"><FileText className="h-4 w-4" /></div>
                <span className="text-sm text-[var(--text-main)] truncate">No files shared yet.</span>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
      `}} />
    </Shell>
  );
}
