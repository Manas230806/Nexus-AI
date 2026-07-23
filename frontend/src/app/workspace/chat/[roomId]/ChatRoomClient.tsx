'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, Mic, MoreVertical, Phone, Video, Search, UserPlus, Hash, FileText, Pin, Plus, MessageSquareText, Image as ImageIcon, Calendar, Edit2, Forward, X } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useMessages } from '../../../../hooks/useSupabase';
import Shell from '../../../../components/Shell';
import Link from 'next/link';
import { supabase } from '../../../../lib/supabaseClient';

interface ChatRoomClientProps {
  roomId: string;
}

export default function ChatRoomClient({ roomId }: ChatRoomClientProps) {
  const { messages, sendMessage, editMessage, forwardMessage } = useMessages(roomId);
  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<any>(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  
  // Forward modal states
  const [forwardMsg, setForwardMsg] = useState<any>(null);
  const [targetUsername, setTargetUsername] = useState('');
  const [forwardError, setForwardError] = useState('');
  const [forwarding, setForwarding] = useState(false);

  // Mock Voice Recording state
  const [isRecording, setIsRecording] = useState(false);

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
    
    if (editingMsgId) {
      await editMessage(editingMsgId, draft.trim());
      setEditingMsgId(null);
    } else {
      await sendMessage(draft.trim(), currentUserId);
    }
    setDraft('');
    setShowEmojiPicker(false);
  };

  const handleMediaUpload = () => {
    const fileName = prompt("Enter a mock file name to attach (e.g., photo.jpg, document.pdf):");
    if (fileName && currentUserId) {
      sendMessage(`[File Attachment] ${fileName}`, currentUserId);
    }
  };

  const handleEventCreate = () => {
    const eventName = prompt("Enter event name for calendar:");
    if (eventName && currentUserId) {
      sendMessage(`[EVENT] ${eventName} - Scheduled via Calendar`, currentUserId);
    }
  };

  const handleForward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forwardMsg || !targetUsername.trim() || !currentUserId) return;
    setForwarding(true);
    setForwardError('');

    const cleanSearch = targetUsername.trim().toLowerCase().replace('@', '');
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('username', cleanSearch)
      .single();

    if (userError || !targetUser) {
      setForwardError('User not found. Please check the username.');
      setForwarding(false);
      return;
    }

    if (currentUserId === targetUser.id) {
       setForwardError('You cannot forward to yourself!');
       setForwarding(false);
       return;
    }

    const { data: conv } = await supabase.from('conversations').insert([{ type: 'direct' }]).select().single();
    if (conv) {
      await supabase.from('participants').insert([
        { user_id: currentUserId, conversation_id: conv.id },
        { user_id: targetUser.id, conversation_id: conv.id }
      ]);
      await forwardMessage(forwardMsg.content, conv.id, currentUserId);
      setForwardMsg(null);
      setTargetUsername('');
      alert("Message forwarded successfully!");
    } else {
      setForwardError('Failed to create conversation for forwarding.');
    }
    setForwarding(false);
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
      <div className="h-full w-full p-2 sm:p-4 lg:p-8 overflow-hidden text-[var(--text-main)]">
        <div className="flex h-full w-full overflow-hidden rounded-2xl lg:rounded-[32px] border border-[var(--border-color)] shadow-2xl bg-[var(--bg-main)]">

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-[var(--bg-main)] relative border-r border-[var(--border-color)]">
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-[var(--border-color)] px-4 sm:px-6 py-3 sm:py-4 backdrop-blur-md">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[rgb(var(--accent-main))] text-sm font-bold text-[var(--text-strong)] shadow-sm overflow-hidden shrink-0">
                {otherUser?.avatar_url ? (
                  <img src={otherUser.avatar_url} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  otherUser?.name?.charAt(0).toUpperCase() || '?'
                )}
                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#070913] bg-emerald-500"></div>
              </div>
              <div>
                <h1 className="text-lg font-bold text-[var(--text-strong)] tracking-tight">{otherUser ? otherUser.name : 'Loading...'}</h1>
                <p className="text-xs font-medium text-[var(--text-muted)]">Member · <span className="text-emerald-400">Online</span></p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <button className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors"><Phone className="h-4 w-4" /></button>
              <a href="https://meet.google.com/new" target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors" title="Start Google Meet"><Video className="h-4 w-4" /></a>
              <button className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors"><Search className="h-4 w-4" /></button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 scroll-smooth scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="flex justify-center mb-6 sm:mb-8">
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
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--bg-hover)] text-sm font-bold text-[var(--text-main)] shadow-md border border-[var(--border-color)] overflow-hidden">
                      {isMe ? 'ME' : (
                        otherUser?.avatar_url ? (
                          <img src={otherUser.avatar_url} alt="avatar" className="h-full w-full object-cover" />
                        ) : (
                          otherUser?.name?.charAt(0).toUpperCase() || 'U'
                        )
                      )}
                    </div>
                    <div className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 px-1">
                        <span className="text-sm font-semibold text-[var(--text-strong)]">{isMe ? 'You' : otherUser?.name}</span>
                        <span className="text-xs text-[var(--text-muted)]">{timeString}</span>
                      </div>
                      <div className={`relative group px-5 py-3.5 text-[15px] leading-relaxed rounded-[20px] shadow-sm max-w-lg ${
                        isMe 
                          ? 'bg-[rgb(var(--accent-main))] border-none text-white rounded-tr-sm text-left' 
                          : 'bg-[var(--bg-panel)] border border-[var(--border-color)] text-[var(--text-main)] rounded-tl-sm'
                      }`}>
                        {msg.content}
                        
                        {/* Message Actions */}
                        {isMe && (
                          <div className="absolute -left-16 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            <button 
                              onClick={() => { setEditingMsgId(msg.id); setDraft(msg.content); }}
                              className="p-1.5 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-sky-400"
                              title="Edit Message"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              onClick={() => setForwardMsg(msg)}
                              className="p-1.5 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-emerald-400"
                              title="Forward Message"
                            >
                              <Forward className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-2 sm:p-4 mx-auto w-full max-w-3xl relative">
            {showEmojiPicker && (
              <div className="absolute bottom-full right-2 sm:right-4 mb-2 z-50 shadow-2xl rounded-2xl overflow-hidden border border-[var(--border-color)] max-w-[90vw]">
                <EmojiPicker 
                  onEmojiClick={(emojiData) => setDraft(prev => prev + emojiData.emoji)}
                  theme={'dark' as any}
                />
              </div>
            )}
            
            {editingMsgId && (
              <div className="mb-2 flex items-center justify-between rounded-t-xl bg-[var(--bg-hover)] px-3 sm:px-4 py-2 text-xs sm:text-sm text-[var(--text-muted)] border border-[var(--border-color)] border-b-0">
                <div className="flex items-center gap-2">
                  <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  Editing message
                </div>
                <button onClick={() => { setEditingMsgId(null); setDraft(''); }} className="hover:text-[var(--text-strong)]"><X className="h-4 w-4" /></button>
              </div>
            )}

            <div className={`relative flex flex-col border border-[var(--border-color-strong)] bg-[var(--bg-panel)] p-1.5 sm:p-2 shadow-lg transition-all focus-within:border-[rgb(var(--accent-main))]/50 ${editingMsgId ? 'rounded-b-2xl' : 'rounded-2xl sm:rounded-[24px]'}`}>
              <div className="flex items-center gap-1 sm:gap-2 px-1 sm:px-2 pt-1 overflow-x-auto scrollbar-hide">
                <button onClick={handleMediaUpload} className="text-[var(--text-muted)] hover:text-sky-400 transition-colors shrink-0" title="Add Photo/Video/Document"><ImageIcon className="h-4 w-4 sm:h-5 sm:w-5" /></button>
                <button onClick={handleEventCreate} className="text-[var(--text-muted)] hover:text-emerald-400 transition-colors shrink-0" title="Schedule Event"><Calendar className="h-4 w-4 sm:h-5 sm:w-5" /></button>
                
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
                  className="max-h-[100px] sm:max-h-[120px] min-h-[20px] sm:min-h-[24px] w-full min-w-[120px] shrink-0 md:shrink flex-1 resize-none bg-transparent py-1.5 sm:py-2 px-2 text-[14px] sm:text-[15px] text-[var(--text-main)] placeholder-slate-500 outline-none scrollbar-hide"
                  placeholder={otherUser ? `Message ${otherUser.name}...` : 'Type a message...'}
                />
                <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`transition-colors shrink-0 ${showEmojiPicker ? 'text-[rgb(var(--accent-main))]' : 'text-[var(--text-muted)] hover:text-yellow-400'}`}><Smile className="h-4 w-4 sm:h-5 sm:w-5" /></button>
                <button onClick={() => setIsRecording(!isRecording)} className={`transition-colors shrink-0 ${isRecording ? 'text-red-500 animate-pulse' : 'text-[var(--text-muted)] hover:text-rose-400'}`} title="Voice Note"><Mic className="h-4 w-4 sm:h-5 sm:w-5" /></button>
                <button className={`ml-1 sm:ml-2 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full transition-all shrink-0 ${draft.trim() ? 'bg-[rgb(var(--accent-main))] text-[var(--text-strong)] hover:opacity-90' : 'bg-[var(--bg-hover)] text-[var(--text-muted)]'}`} onClick={() => handleSend()}>
                  <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Info Sidebar */}
        <div className="hidden lg:flex w-[280px] flex-col bg-[var(--bg-main)]/80 backdrop-blur-md p-6 overflow-y-auto">
          {/* Profile Card */}
          <div className="flex flex-col items-center text-center border-b border-[var(--border-color)] pb-6 mb-6">
            <div className="h-20 w-20 rounded-[24px] bg-[rgb(var(--accent-main))] flex items-center justify-center text-2xl font-bold text-[var(--text-strong)] shadow-lg shadow-cyan-500/20 mb-4 overflow-hidden">
              {otherUser?.avatar_url ? (
                <img src={otherUser.avatar_url} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                otherUser?.name?.charAt(0).toUpperCase() || '?'
              )}
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

      {/* Forward Modal */}
      {forwardMsg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-[var(--text-main)]">
          <div className="w-full max-w-md rounded-3xl border border-[var(--border-color-strong)] bg-[var(--bg-panel)] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[var(--text-strong)]">Forward Message</h3>
              <button onClick={() => { setForwardMsg(null); setForwardError(''); }} className="text-[var(--text-muted)] hover:text-[var(--text-strong)]">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6 p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-sm text-[var(--text-muted)] italic">
              "{forwardMsg.content.length > 100 ? forwardMsg.content.substring(0, 100) + '...' : forwardMsg.content}"
            </div>

            {forwardError && (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                {forwardError}
              </div>
            )}

            <form onSubmit={handleForward} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-[var(--text-muted)]">Forward To Username</label>
                <div className="relative mt-2">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-bold">@</span>
                  <input 
                    autoFocus
                    type="text" 
                    value={targetUsername}
                    onChange={(e) => setTargetUsername(e.target.value)}
                    placeholder="username"
                    required
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] py-3 pl-10 pr-4 text-sm text-[var(--text-strong)] outline-none focus:border-[rgb(var(--accent-main))] focus:ring-1 focus:ring-[rgb(var(--accent-main))]"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={forwarding}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {forwarding ? 'Forwarding...' : 'Send Forward'}
                <Forward className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
      `}} />
    </Shell>
  );
}
