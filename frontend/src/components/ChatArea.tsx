'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, Mic, MoreVertical, Phone, Video, Search, UserPlus, Hash, FileText, Pin, Plus, MessageSquareText, Image as ImageIcon, Calendar, Edit2, Forward, X } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useMessages, usePresence } from '../hooks/useSupabase';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

interface ChatAreaProps {
  roomId: string;
  onBack?: () => void;
}

export default function ChatArea({ roomId, onBack }: ChatAreaProps) {
  const { messages, sendMessage, editMessage, forwardMessage } = useMessages(roomId);
  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [isPublicRoom, setIsPublicRoom] = useState<string | null>(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  
  // Forward modal states
  const [forwardMsg, setForwardMsg] = useState<any>(null);
  const [targetUsername, setTargetUsername] = useState('');
  const [forwardError, setForwardError] = useState('');
  const [forwarding, setForwarding] = useState(false);

  // Mock Voice Recording state
  const [isRecording, setIsRecording] = useState(false);

  // Online Presence
  const onlineUsers = usePresence(currentUserId);

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

      const PUBLIC_ROOMS: Record<string, string> = {
        '11111111-1111-1111-1111-111111111111': 'General',
        '22222222-2222-2222-2222-222222222222': 'Product',
        '33333333-3333-3333-3333-333333333333': 'Engineering'
      };

      if (PUBLIC_ROOMS[roomId]) {
        setIsPublicRoom(PUBLIC_ROOMS[roomId]);
        // Ensure the public room exists in the conversations table so foreign key constraints don't fail
        supabase.from('conversations').upsert({ id: roomId, type: 'direct' }).then();
        return;
      }

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
    const fileName = prompt("Enter a file name to attach (e.g., photo.jpg, document.pdf):");
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
      <div className="flex h-full items-center justify-center rounded-[24px] border border-[var(--border-color-strong)] bg-[var(--bg-hover)] p-6 text-[var(--text-main)] w-full">
        <p className="text-sm text-[var(--text-muted)]">No room selected. Please select or start a chat.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full w-full overflow-hidden md:rounded-2xl lg:rounded-[32px] md:border border-[var(--border-color)] md:shadow-2xl bg-[var(--bg-main)] whatsapp-bg animate-slide-in-right">

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col relative border-r border-[var(--border-color)]">
          {/* Chat Header (Sticky) */}
          <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-panel)]/95 px-2 sm:px-6 py-2 sm:py-3 backdrop-blur-md shadow-sm">
            <div className="flex items-center gap-1 sm:gap-4">
              {/* Back Button (Mobile Only) */}
              {onBack && (
                <button onClick={onBack} className="md:hidden flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--text-strong)] hover:bg-[var(--bg-hover)] transition-colors -ml-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
              )}
              
              <div className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[rgb(var(--accent-main))] text-sm font-bold text-[var(--text-strong)] shadow-sm overflow-hidden shrink-0 cursor-pointer">
                {isPublicRoom ? (
                  <Hash className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                ) : (otherUser?.avatar_url && otherUser.avatar_url.startsWith('http')) ? (
                  <img src={otherUser.avatar_url} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  (otherUser?.name || 'U').charAt(0).toUpperCase()
                )}
                <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#070913] ${onlineUsers.has(otherUser?.id) ? 'bg-emerald-500' : 'bg-gray-500'}`}></div>
              </div>
              <div>
                <h1 className="text-lg font-bold text-[var(--text-strong)] tracking-tight">
                  {isPublicRoom ? isPublicRoom : (otherUser ? otherUser.name : 'Loading...')}
                </h1>
                <p className="text-xs font-medium text-[var(--text-muted)]">
                  {isPublicRoom ? 'Public Room · Everyone' : 'Member · '}
                  {!isPublicRoom && (
                    onlineUsers.has(otherUser?.id) 
                      ? <span className="text-emerald-400">Online</span>
                      : <span className="text-gray-500">Offline</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-0.5 sm:gap-2">
              <button className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors"><Video className="h-5 w-5" /></button>
              <button className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors"><Phone className="h-4 w-4" /></button>
              <button className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors"><Search className="h-5 w-5" /></button>
              <button className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors"><MoreVertical className="h-5 w-5" /></button>
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
                  <div key={msg.id} className={`flex w-full gap-2 animate-fade-up ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {/* Only show avatars for group/public rooms, not 1-on-1 */}
                    {isPublicRoom && !isMe && (
                      <div className="hidden md:flex h-8 w-8 shrink-0 mt-auto items-center justify-center rounded-full bg-[var(--bg-hover)] text-xs font-bold text-[var(--text-main)] shadow-sm border border-[var(--border-color)] overflow-hidden">
                        {(msg.users?.avatar_url && msg.users.avatar_url.startsWith('http')) ? (
                           <img src={msg.users.avatar_url} alt="avatar" className="h-full w-full object-cover" />
                        ) : (
                           (msg.users?.name || msg.sender_id || 'U').charAt(0).toUpperCase()
                        )}
                      </div>
                    )}
                    
                    <div className={`relative group flex flex-col min-w-[100px] max-w-[85%] sm:max-w-[75%] md:max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                      {/* Name for public rooms */}
                      {isPublicRoom && !isMe && (
                        <span className="text-xs font-bold text-[var(--text-muted)] ml-2 mb-1 truncate w-full text-left" style={{ color: `hsl(${(msg.sender_id.charCodeAt(0) * 45) % 360}, 70%, 65%)` }}>
                          {msg.users?.name || `User ${msg.sender_id?.substring(0, 4)}`}
                        </span>
                      )}

                      <div className={`relative w-full px-3 pt-2 pb-[22px] text-[15px] leading-relaxed shadow-sm whitespace-pre-wrap break-all ${
                        isMe 
                          ? 'bg-[#005c4b] text-[#e9edef] rounded-[16px] rounded-tr-[4px]' 
                          : 'bg-[#202c33] text-[#e9edef] rounded-[16px] rounded-tl-[4px] border border-white/5'
                      }`}>
                        {/* Action Dropdown Chevron (Hover) */}
                        <div className={`absolute top-1 right-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-[#005c4b] to-transparent ${!isMe && 'from-[#202c33]'} z-10`}>
                          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded px-2 py-1">
                            {isMe && (
                              <button 
                                onClick={() => { setEditingMsgId(msg.id); setDraft(msg.content); }}
                                className="text-white/80 hover:text-white"
                                title="Edit Message"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button 
                              onClick={() => setForwardMsg(msg)}
                              className="text-white/80 hover:text-white"
                              title="Forward Message"
                            >
                              <Forward className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Message Content */}
                        <div className="pr-4">{msg.content}</div>
                        
                        {/* Time inside bubble */}
                        <div className="absolute bottom-1 right-2 text-[10px] text-white/60 font-medium flex items-center gap-1">
                          {timeString}
                          {isMe && (
                            <svg viewBox="0 0 16 15" width="16" height="15" className="text-[#53bdeb] opacity-80" fill="currentColor">
                              <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="sticky bottom-0 z-20 p-2 sm:p-4 w-full bg-transparent">
            {showEmojiPicker && (
              <div className="absolute bottom-full left-2 sm:left-4 mb-2 z-50 shadow-2xl rounded-2xl overflow-hidden border border-[var(--border-color)] max-w-[90vw]">
                <EmojiPicker 
                  onEmojiClick={(emojiData) => setDraft(prev => prev + emojiData.emoji)}
                  theme={'dark' as any}
                />
              </div>
            )}
            
            {editingMsgId && (
              <div className="mb-2 flex items-center justify-between rounded-t-xl bg-[var(--bg-hover)] px-3 sm:px-4 py-2 text-xs sm:text-sm text-[var(--text-muted)] border border-[var(--border-color)] border-b-0 mx-2">
                <div className="flex items-center gap-2">
                  <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  Editing message
                </div>
                <button onClick={() => { setEditingMsgId(null); setDraft(''); }} className="hover:text-[var(--text-strong)]"><X className="h-4 w-4" /></button>
              </div>
            )}

            <div className="flex items-end gap-2 max-w-4xl mx-auto pb-safe">
              <div className={`relative flex flex-1 items-end bg-[#202c33] transition-all shadow-lg border border-[var(--border-color)] ${editingMsgId ? 'rounded-b-[24px]' : 'rounded-[24px]'}`}>
                <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`p-3 transition-colors shrink-0 ${showEmojiPicker ? 'text-[rgb(var(--accent-main))]' : 'text-[var(--text-muted)] hover:text-white'}`}><Smile className="h-6 w-6" /></button>
                
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
                  className="max-h-[120px] min-h-[44px] w-full flex-1 resize-none bg-transparent py-3 text-[15px] text-[#e9edef] placeholder-[#8696a0] outline-none scrollbar-hide leading-normal"
                  placeholder={isPublicRoom ? `Message #${isPublicRoom}` : (otherUser ? `Message` : 'Type a message')}
                />
                
                <div className="flex items-center p-2 gap-1 shrink-0">
                  <button onClick={handleMediaUpload} className="p-2 text-[var(--text-muted)] hover:text-white transition-colors" title="Attach"><Paperclip className="h-5 w-5" /></button>
                  {draft.trim() === '' && (
                    <button className="hidden sm:block p-2 text-[var(--text-muted)] hover:text-white transition-colors" title="Camera"><ImageIcon className="h-5 w-5" /></button>
                  )}
                </div>
              </div>
              
              <button 
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all shadow-lg ${
                  draft.trim() ? 'bg-[#00a884] text-white hover:bg-[#008f6f]' : 'bg-[#00a884] text-white hover:bg-[#008f6f]'
                }`} 
                onClick={() => draft.trim() ? handleSend() : setIsRecording(!isRecording)}
              >
                {draft.trim() ? (
                  <Send className="h-5 w-5 ml-1" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </button>
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
    </>
  );
}
