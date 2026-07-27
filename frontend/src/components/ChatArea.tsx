'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Smile, Mic, MoreVertical, Phone, Video, Search, UserPlus, Hash, FileText, Pin, Plus, MessageSquareText, Image as ImageIcon, Calendar, Edit2, Forward, X, Camera, Trash2 } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useMessages, usePresence } from '../hooks/useSupabase';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import { DEFAULT_AVATARS } from '../lib/constants';

interface ChatAreaProps {
  roomId: string;
  onBack?: () => void;
  onAvatarChange?: (url: string) => void;
}

export default function ChatArea({ roomId, onBack, onAvatarChange }: ChatAreaProps) {
  const { messages, sendMessage, editMessage, forwardMessage, deleteMessageForEveryone } = useMessages(roomId);
  const [draft, setDraft] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
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

  // Chat Search
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');

  // Voice & File Staging states
  const [isRecording, setIsRecording] = useState(false);
  const [showUPinMenu, setShowUPinMenu] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<{name: string, type: string, data: string, size: number}[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Online Presence
  const onlineUsers = usePresence(currentUserId);

  // Deleted For Me
  const [deletedForMe, setDeletedForMe] = useState<string[]>([]);
  
  useEffect(() => {
    try {
      const stored = localStorage.getItem('deletedForMe');
      if (stored) setDeletedForMe(JSON.parse(stored));
    } catch (e) {}
  }, []);

  const handleDeleteForMe = (messageId: string) => {
    const updated = [...deletedForMe, messageId];
    setDeletedForMe(updated);
    localStorage.setItem('deletedForMe', JSON.stringify(updated));
  };

  const handleDeleteForEveryone = async (messageId: string) => {
    if (window.confirm("Delete this message for everyone?")) {
      await deleteMessageForEveryone(messageId);
    }
  };

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

      // 2. Get conversation details
      const { data: convData } = await supabase.from('conversations').select('type, name, avatar_url').eq('id', roomId).single();
      const isGroup = convData?.type === 'group';

      if (isGroup) {
        setOtherUser({
          id: 'group',
          name: convData?.name || 'Unnamed Group',
          avatar_url: convData?.avatar_url,
          isGroup: true
        });
      } else {
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
      }
    };
    if (roomId) fetchChatData();
  }, [roomId]);

  const handleSelectGroupAvatar = async (url: string) => {
    if (!roomId) return;
    try {
      await supabase.from('conversations').update({ avatar_url: url }).eq('id', roomId);
      setOtherUser((prev: any) => prev ? { ...prev, avatar_url: url } : prev);
      if (onAvatarChange) onAvatarChange(url);
      setIsAvatarModalOpen(false);
    } catch (error: any) {
      console.error('Error updating icon:', error);
      alert('Error updating group icon: ' + error.message);
    }
  };

  const MAX_FILE_SIZE = 1024 * 1024; // 1MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        alert(`File ${file.name} is too large. Max size is 1MB to prevent database lag.`);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target?.result as string;
        setStagedFiles(prev => [...prev, { name: file.name, type: file.type, data: base64Data, size: file.size }]);
      };
      reader.readAsDataURL(file);
    });
    
    e.target.value = '';
    setShowUPinMenu(false);
  };

  const removeStagedFile = (index: number) => {
    setStagedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendContact = () => {
    const name = prompt("Enter contact name:");
    const phone = prompt("Enter contact phone number:");
    if (name && phone) {
      setStagedFiles(prev => [...prev, { name, type: 'contact', data: phone, size: 0 }]);
    }
    setShowUPinMenu(false);
  };

  const parseMessageContent = (content: string) => {
    try {
      if (content.startsWith('{') && content.includes('"attachments"')) {
        const parsed = JSON.parse(content);
        return { text: parsed.text || '', attachments: parsed.attachments || [] };
      }
    } catch (e) {}
    return { text: content, attachments: [] };
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!draft.trim() && stagedFiles.length === 0) || !currentUserId) return;
    
    let contentToSave = draft.trim();
    if (stagedFiles.length > 0) {
      contentToSave = JSON.stringify({
        text: draft.trim(),
        attachments: stagedFiles
      });
    }
    
    if (editingMsgId) {
      await editMessage(editingMsgId, contentToSave);
      setEditingMsgId(null);
    } else {
      await sendMessage(contentToSave, currentUserId);
    }
    setDraft('');
    setStagedFiles([]);
    setShowEmojiPicker(false);
    setShowUPinMenu(false);
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

  const filteredMessages = messages.filter((msg: any) => {
    if (deletedForMe.includes(msg.id)) return false;
    if (!chatSearchQuery.trim()) return true;
    
    let textToSearch = msg.content;
    if (textToSearch === '[This message was deleted]') return false;
    
    try {
      if (textToSearch.startsWith('{') && textToSearch.includes('"attachments"')) {
        const parsed = JSON.parse(textToSearch);
        textToSearch = parsed.text || '';
      }
    } catch(e) {}
    
    return textToSearch.toLowerCase().includes(chatSearchQuery.toLowerCase());
  });

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
              
              <div 
                className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[rgb(var(--accent-main))] text-sm font-bold text-[var(--text-strong)] shadow-sm overflow-hidden shrink-0 cursor-pointer group"
                onClick={() => {
                  if (otherUser?.isGroup) {
                    setIsAvatarModalOpen(true);
                  }
                }}
                title={otherUser?.isGroup ? "Change group icon" : ""}
              >
                {isPublicRoom ? (
                  <Hash className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                ) : (otherUser?.avatar_url && otherUser.avatar_url.startsWith('http')) ? (
                  <img src={otherUser.avatar_url} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  (otherUser?.name || 'U').charAt(0).toUpperCase()
                )}
                <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#070913] ${(isPublicRoom || otherUser?.isGroup) ? 'hidden' : onlineUsers.has(otherUser?.id) ? 'bg-emerald-500' : 'bg-gray-500'}`}></div>
                
                {/* Overlay for Group Icon Upload */}
                {otherUser?.isGroup && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-lg font-bold text-[var(--text-strong)] tracking-tight">
                  {isPublicRoom ? isPublicRoom : (otherUser ? otherUser.name : 'Loading...')}
                </h1>
                <p className="text-xs font-medium text-[var(--text-muted)]">
                  {isPublicRoom ? 'Public Room · Everyone' : otherUser?.isGroup ? 'Private Group' : 'Member · '}
                  {!isPublicRoom && !otherUser?.isGroup && (
                    onlineUsers.has(otherUser?.id) 
                      ? <span className="text-emerald-400">Online</span>
                      : <span className="text-gray-500">Offline</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-0.5 sm:gap-2">
              <a href="https://meet.google.com/new" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors" title="Start Google Meet">
                <Video className="h-5 w-5" />
              </a>
              <button className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors" title="Voice Call (Coming Soon)"><Phone className="h-4 w-4" /></button>
              <button 
                onClick={() => { setIsSearchOpen(!isSearchOpen); if (isSearchOpen) setChatSearchQuery(''); }}
                className={`hidden sm:flex h-10 w-10 items-center justify-center rounded-full transition-colors ${isSearchOpen ? 'bg-sky-500/20 text-sky-400' : 'hover:bg-[var(--bg-hover)] text-[var(--text-muted)]'}`}
                title="Search Messages"
              >
                <Search className="h-5 w-5" />
              </button>
              <button className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors"><MoreVertical className="h-5 w-5" /></button>
            </div>
          </div>

          {/* Search Bar Expansion */}
          <AnimatePresence>
            {isSearchOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-b border-[var(--border-color)] bg-[var(--bg-panel)] overflow-hidden z-10"
              >
                <div className="p-3 px-6">
                  <div className="relative flex items-center">
                    <Search className="absolute left-3 text-[var(--text-muted)] h-4 w-4" />
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="Search in this conversation..." 
                      value={chatSearchQuery}
                      onChange={(e) => setChatSearchQuery(e.target.value)}
                      className="w-full bg-[var(--bg-hover)] rounded-xl py-2.5 pl-9 pr-10 text-sm text-[var(--text-strong)] outline-none focus:ring-1 focus:ring-sky-500/50 placeholder:text-[var(--text-muted)]"
                    />
                    {chatSearchQuery && (
                      <button 
                        onClick={() => setChatSearchQuery('')}
                        className="absolute right-3 text-[var(--text-muted)] hover:text-[var(--text-strong)] p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 scroll-smooth scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="flex justify-center mb-4">
              <span className="rounded-full bg-[var(--bg-hover)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] border border-[var(--border-color)]">
                Chat Started
              </span>
            </div>

            <div className="flex justify-center mb-6 sm:mb-8">
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-center shadow-sm backdrop-blur-md max-w-md mx-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <p className="text-[10px] sm:text-xs leading-relaxed text-emerald-600 dark:text-emerald-400 font-medium text-left">
                  Messages and files are secured with military-grade client-side AES encryption. Nobody outside of this chat, not even the database, can read them.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-6 max-w-3xl mx-auto">
              {filteredMessages.length === 0 && !chatSearchQuery && (
                <div className="text-center text-[var(--text-muted)] text-sm py-10">
                  No messages yet. Send a message to start the conversation!
                </div>
              )}
              {filteredMessages.length === 0 && chatSearchQuery && (
                <div className="text-center text-[var(--text-muted)] text-sm py-10">
                  No messages match your search.
                </div>
              )}

              {filteredMessages.map((msg: any) => {
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
                        {/* Action Dropdown Chevron */}
                        <div className={`absolute top-1 right-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10`}>
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
                            <button 
                              onClick={() => handleDeleteForMe(msg.id)}
                              className="text-white/80 hover:text-white"
                              title="Delete for me"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                            {isMe && (
                              <button 
                                onClick={() => handleDeleteForEveryone(msg.id)}
                                className="text-red-400/80 hover:text-red-400"
                                title="Delete for everyone"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Message Content */}
                        <div className={`pr-4 ${msg.content === '[This message was deleted]' ? 'italic text-white/50' : ''}`}>
                          {(() => {
                            if (msg.content === '[This message was deleted]') return msg.content;
                            const { text, attachments } = parseMessageContent(msg.content);
                            return (
                              <div className="flex flex-col gap-2">
                                {attachments && attachments.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {attachments.map((att: any, idx: number) => (
                                      <div key={idx} className="relative overflow-hidden rounded-xl border border-white/10 bg-black/20 p-1 shadow-md group">
                                        {att.type.startsWith('image/') ? (
                                          <img src={att.data} alt={att.name} className="h-32 w-auto max-w-[200px] object-cover rounded-lg cursor-pointer hover:scale-105 transition-transform" onClick={() => {
                                            setSelectedImage(att.data);
                                          }} />
                                        ) : att.type === 'contact' ? (
                                          <div className="flex flex-col gap-1 px-3 py-2 bg-black/30 rounded-lg min-w-[150px]">
                                            <div className="flex items-center gap-2 text-sky-400">
                                              <UserPlus className="h-4 w-4" />
                                              <span className="text-sm font-bold truncate">{att.name}</span>
                                            </div>
                                            <span className="text-xs text-[var(--text-muted)] font-mono">{att.data}</span>
                                            <button className="mt-1 text-[10px] uppercase font-bold text-emerald-400 hover:text-emerald-300 w-full text-center py-1 bg-emerald-500/10 rounded">Save Contact</button>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/5 rounded-lg transition-colors" onClick={() => {
                                            const a = document.createElement('a');
                                            a.href = att.data;
                                            a.download = att.name;
                                            a.click();
                                          }}>
                                            <FileText className="h-5 w-5 text-purple-400" />
                                            <span className="text-sm font-medium text-slate-200 max-w-[120px] truncate" title={att.name}>{att.name}</span>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {text && (
                                  <div className="leading-relaxed whitespace-pre-wrap">{text}</div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                        
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

            <AnimatePresence>
              {stagedFiles.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, y: 10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: 10 }}
                  transition={{ type: "spring", damping: 25, stiffness: 400 }}
                  className="max-w-4xl mx-auto px-2 mb-2 overflow-hidden"
                >
                  <div className="flex flex-wrap gap-2 p-3 bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl shadow-lg">
                    <AnimatePresence>
                      {stagedFiles.map((file, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ type: "spring", damping: 25, stiffness: 400 }}
                          className="relative group bg-[var(--bg-hover)] rounded-lg border border-[var(--border-color)] p-1 flex items-center gap-2 pr-8"
                        >
                          {file.type.startsWith('image/') ? (
                            <img src={file.data} className="h-10 w-10 object-cover rounded" />
                          ) : file.type === 'contact' ? (
                            <div className="h-10 w-10 flex items-center justify-center bg-sky-500/20 text-sky-400 rounded"><UserPlus className="h-5 w-5" /></div>
                          ) : (
                            <div className="h-10 w-10 flex items-center justify-center bg-purple-500/20 text-purple-400 rounded"><FileText className="h-5 w-5" /></div>
                          )}
                          <div className="flex flex-col max-w-[100px]">
                            <span className="text-xs font-medium truncate text-[var(--text-main)]">{file.name}</span>
                            {file.size > 0 && <span className="text-[10px] text-[var(--text-muted)]">{(file.size / 1024).toFixed(1)} KB</span>}
                          </div>
                          <button onClick={() => removeStagedFile(idx)} className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-red-400 hover:bg-[var(--bg-active)] rounded-full">
                            <X className="h-3 w-3" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-end gap-2 max-w-4xl mx-auto pb-safe">
              <div className={`relative flex flex-1 items-end bg-[#202c33] transition-all shadow-lg border border-[var(--border-color)] ${editingMsgId ? 'rounded-b-[24px]' : 'rounded-[24px]'}`}>
                <AnimatePresence>
                  {showUPinMenu && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: 10 }}
                      transition={{ type: "spring", damping: 25, stiffness: 400 }}
                      className="absolute bottom-full left-10 mb-3 z-50 flex flex-col gap-3 p-3 bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl shadow-2xl origin-bottom-left"
                    >
                      <button onClick={() => { docInputRef.current?.click(); setShowUPinMenu(false); }} className="flex flex-col items-center gap-1 group">
                        <div className="h-12 w-12 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform"><FileText className="h-5 w-5" /></div>
                        <span className="text-[10px] font-medium text-[var(--text-muted)]">Document</span>
                      </button>
                      <button onClick={() => { photoInputRef.current?.click(); setShowUPinMenu(false); }} className="flex flex-col items-center gap-1 group">
                        <div className="h-12 w-12 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform"><ImageIcon className="h-5 w-5" /></div>
                        <span className="text-[10px] font-medium text-[var(--text-muted)]">Photos</span>
                      </button>
                      <button onClick={handleSendContact} className="flex flex-col items-center gap-1 group">
                        <div className="h-12 w-12 rounded-full bg-sky-500 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform"><UserPlus className="h-5 w-5" /></div>
                        <span className="text-[10px] font-medium text-[var(--text-muted)]">Contact</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <input type="file" ref={docInputRef} onChange={handleFileChange} className="hidden" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" />
                <input type="file" ref={photoInputRef} onChange={handleFileChange} className="hidden" multiple accept="image/*" />

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
                  <button onClick={() => setShowUPinMenu(!showUPinMenu)} className={`p-2 transition-colors ${showUPinMenu ? 'text-white bg-[var(--bg-hover)] rounded-full' : 'text-[var(--text-muted)] hover:text-white'}`} title="Attach">
                    <Paperclip className="h-5 w-5" />
                  </button>
                  {draft.trim() === '' && stagedFiles.length === 0 && (
                    <button onClick={() => photoInputRef.current?.click()} className="hidden sm:block p-2 text-[var(--text-muted)] hover:text-white transition-colors" title="Photo">
                      <ImageIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
              
              <button 
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all shadow-lg ${
                  draft.trim() || stagedFiles.length > 0 ? 'bg-[#00a884] text-white hover:bg-[#008f6f]' : 'bg-[#00a884] text-white hover:bg-[#008f6f]'
                }`} 
                onClick={() => (draft.trim() || stagedFiles.length > 0) ? handleSend() : setIsRecording(!isRecording)}
              >
                {draft.trim() || stagedFiles.length > 0 ? (
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
      {/* Avatar Selection Modal */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-[var(--text-main)] animate-fade-in">
          <div className="w-full max-w-xl rounded-3xl border border-[var(--border-color-strong)] bg-[var(--bg-panel)] shadow-2xl overflow-hidden flex flex-col scale-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[var(--text-strong)]">Choose Group Avatar</h2>
              <button onClick={() => setIsAvatarModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-strong)]">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-sm text-[var(--text-muted)] mb-4">Select a style:</p>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-3 mb-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {DEFAULT_AVATARS.map((url, idx) => (
                <button 
                  key={idx}
                  onClick={() => handleSelectGroupAvatar(url)}
                  className="rounded-full overflow-hidden border-2 border-[var(--border-color)] hover:border-[rgb(var(--accent-main))] hover:scale-110 transition-all bg-[var(--bg-main)] aspect-square"
                >
                  <img src={url} alt={`Avatar ${idx}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}


      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 cursor-zoom-out"
            onClick={() => setSelectedImage(null)}
          >
            <motion.img 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              src={selectedImage} 
              alt="Fullscreen Preview" 
              className="max-h-[90vh] max-w-[95vw] object-contain rounded-lg shadow-2xl cursor-default"
              onClick={(e) => e.stopPropagation()}
            />
            <button 
              className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-lg border border-white/10 shadow-lg cursor-pointer"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-6 w-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{
        __html: `
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
      `}} />
    </>
  );
}
