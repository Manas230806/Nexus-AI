'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, MessageCircle, X, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Shell from '../../../components/Shell';
import { supabase } from '../../../lib/supabaseClient';
import ChatArea from '../../../components/ChatArea';

export default function DirectMessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dpPreviewUser, setDpPreviewUser] = useState<{ name: string, avatar_url: string } | null>(null);

  const handleOpenChat = (id: string) => {
    setActiveConversationId(id);
    if (window.location.hash !== '#chat') {
      window.history.pushState({ chat: id }, '', window.location.pathname + window.location.search + '#chat');
    }
  };

  const handleCloseChat = () => {
    setActiveConversationId(null);
    if (window.location.hash === '#chat') {
      window.history.back();
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      if (activeConversationId) {
        setActiveConversationId(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeConversationId]);

  // New Chat Modal States
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [newChatUsername, setNewChatUsername] = useState('');
  const [newChatError, setNewChatError] = useState('');
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  // New Group Modal States
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [newGroupError, setNewGroupError] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  useEffect(() => {
    const fetchDMs = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const myId = session.user.id;
      setCurrentUserId(myId);

      // Find all conversations this user is part of
      const { data: myParticipants } = await supabase
        .from('participants')
        .select('conversation_id, conversations(id, type, name, avatar_url)')
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

      const processedConversations = myParticipants.map(p => {
        const conv = p.conversations as any;
        if (conv?.type === 'group') {
          return {
            conversation_id: conv.id,
            type: 'group',
            name: conv.name || 'Unnamed Group',
            avatar_url: conv.avatar_url,
            username: 'group'
          };
        } else {
          const otherP = otherParticipants?.find((op: any) => op.conversation_id === conv?.id);
          const otherUser = otherP?.users as any;
          return {
            conversation_id: conv?.id,
            type: 'direct',
            name: (Array.isArray(otherUser) ? otherUser[0] : otherUser)?.name || 'Unknown',
            avatar_url: (Array.isArray(otherUser) ? otherUser[0] : otherUser)?.avatar_url,
            username: (Array.isArray(otherUser) ? otherUser[0] : otherUser)?.username || 'unknown',
            user_id: otherP?.user_id
          };
        }
      });
      
      const { data: latestMessages } = await supabase
        .from('messages')
        .select('conversation_id, created_at')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: false });

      const latestMsgMap: Record<string, string> = {};
      latestMessages?.forEach(m => {
        if (!latestMsgMap[m.conversation_id]) {
          latestMsgMap[m.conversation_id] = m.created_at;
        }
      });

      const finalConversations = processedConversations.map(c => ({
        ...c,
        latest_message_at: latestMsgMap[c.conversation_id] || null
      }));
      
      setConversations(finalConversations);
      setLoading(false);
    };

    fetchDMs();
  }, [activeConversationId]); // Re-fetch if active conversation changes (to show new chats in sidebar)

  useEffect(() => {
    if (isNewGroupModalOpen && allUsers.length === 0) {
      const fetchUsers = async () => {
        const { data } = await supabase.from('users').select('id, name, username, avatar_url');
        if (data && currentUserId) {
          setAllUsers(data.filter(u => u.id !== currentUserId));
        }
      };
      fetchUsers();
    }
  }, [isNewGroupModalOpen, currentUserId, allUsers.length]);

  const handleStartNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatUsername.trim() || !currentUserId) return;
    setIsCreatingChat(true);
    setNewChatError('');

    const cleanSearch = newChatUsername.trim().toLowerCase().replace('@', '');
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('username', cleanSearch)
      .single();

    if (userError || !targetUser) {
      setNewChatError('User not found. Please check the username.');
      setIsCreatingChat(false);
      return;
    }

    if (currentUserId === targetUser.id) {
       setNewChatError('You cannot chat with yourself!');
       setIsCreatingChat(false);
       return;
    }

    // Check if conversation already exists
    // (A bit complex to do in one query without a custom RPC, so we will just create a new one for now or handle it simply)
    // For simplicity, we just create a new direct conversation. 
    // In a full production app, you'd check if a conversation with these exactly two users already exists.

    const { data: conv } = await supabase.from('conversations').insert([{ type: 'direct' }]).select().single();
    if (conv) {
      await supabase.from('participants').insert([
        { user_id: currentUserId, conversation_id: conv.id },
        { user_id: targetUser.id, conversation_id: conv.id }
      ]);
      
      setIsNewChatModalOpen(false);
      setNewChatUsername('');
      handleOpenChat(conv.id);
    } else {
      setNewChatError('Failed to start conversation.');
    }
    setIsCreatingChat(false);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || selectedUserIds.length === 0 || !currentUserId) return;
    setIsCreatingGroup(true);
    setNewGroupError('');

    // Include the creator and the target users
    const participantIds = Array.from(new Set([currentUserId, ...selectedUserIds]));
    
    const { data: conv, error: convError } = await supabase.from('conversations').insert([{ type: 'group', name: newGroupName.trim() }]).select().single();
    if (convError) {
      console.error('Insert error:', convError);
      setNewGroupError(`Failed to create group: ${convError.message}`);
      setIsCreatingGroup(false);
      return;
    }
    
    if (conv) {
      const participantInserts = participantIds.map(id => ({
        user_id: id,
        conversation_id: conv.id
      }));
      await supabase.from('participants').insert(participantInserts);
      
      setIsNewGroupModalOpen(false);
      setNewGroupName('');
      setSelectedUserIds([]);
      setGroupSearchQuery('');
      handleOpenChat(conv.id);
    } else {
      setNewGroupError('Failed to create group: Unknown error');
    }
    setIsCreatingGroup(false);
  };

  const filteredConversations = conversations.filter(conv => 
    conv.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    conv.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Shell>
      <div className="flex h-full w-full overflow-hidden text-[var(--text-main)] relative">
        
        {/* DM Sidebar List */}
        <div className={`flex flex-col border-r border-[var(--border-color)] bg-[var(--bg-sidebar)] backdrop-blur-sm shrink-0 w-full md:w-[320px] lg:w-[360px] ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-[var(--border-color)] flex flex-col gap-3">
             <div className="flex items-center justify-between">
               <h2 className="text-xl font-bold text-[var(--text-strong)] tracking-tight">Messages</h2>
               <div className="flex items-center gap-2">
                 <button 
                   onClick={() => setIsNewChatModalOpen(true)}
                   className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm hover:bg-emerald-400 transition-colors"
                   title="New Chat"
                 >
                   <Plus className="h-4 w-4" />
                 </button>
                 <button 
                   onClick={() => setIsNewGroupModalOpen(true)}
                   className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-white shadow-sm hover:bg-sky-400 transition-colors"
                   title="New Group"
                 >
                   <Users className="h-4 w-4" />
                 </button>
               </div>
             </div>
             <div className="relative flex items-center rounded-xl bg-[var(--bg-panel)] border border-[var(--border-color)] px-3 py-2 transition-colors focus-within:border-[rgb(var(--accent-main))]/50 shadow-inner">
              <Search className="h-4 w-4 text-[var(--text-muted)]" />
              <input 
                type="text" 
                placeholder="Search conversations..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ml-2 w-full bg-transparent text-sm text-[var(--text-main)] placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide py-3 px-2 space-y-1">
            {loading ? (
              <div className="px-3 py-4 text-center text-sm text-[var(--text-muted)]">Loading...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-[var(--text-muted)]">No direct messages found.</div>
            ) : (
              filteredConversations.map((conv) => (
                <button 
                  key={conv.conversation_id} 
                  onClick={() => {
                    handleOpenChat(conv.conversation_id);
                    try { localStorage.setItem(`lastViewed_${conv.conversation_id}`, new Date().toISOString()); } catch(e) {}
                  }}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-3 text-sm transition-all ${
                    activeConversationId === conv.conversation_id 
                      ? 'bg-[rgb(var(--accent-main))] text-white shadow-md' 
                      : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <div className="flex items-center gap-3 w-full overflow-hidden">
                    <div 
                      onClick={(e) => { e.stopPropagation(); setDpPreviewUser({ name: conv.name || 'Unknown', avatar_url: conv.avatar_url || '' }); }}
                      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--bg-hover)] text-[var(--text-strong)] font-bold shadow-sm overflow-hidden border border-[var(--border-color)] cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      {(conv.avatar_url && conv.avatar_url.startsWith('http')) ? (
                        <img src={conv.avatar_url} alt="avatar" className="h-full w-full object-cover" />
                      ) : (
                        (conv.name || 'U').charAt(0).toUpperCase()
                      )}
                      {activeConversationId === conv.conversation_id && !conv.avatar_url && (
                        <div className="absolute inset-0 bg-white/20"></div>
                      )}
                    </div>
                    <div className="flex flex-col items-start overflow-hidden w-full text-left relative">
                      <span className={`font-semibold truncate w-full pr-4 ${activeConversationId === conv.conversation_id ? 'text-white' : 'text-[var(--text-strong)]'}`}>
                        {conv.name || 'Unknown'}
                      </span>
                      {(() => {
                        let isUnread = false;
                        try {
                          const lastViewed = localStorage.getItem(`lastViewed_${conv.conversation_id}`);
                          isUnread = !!(conv.latest_message_at && (!lastViewed || new Date(conv.latest_message_at) > new Date(lastViewed)));
                        } catch(e) {}
                        return isUnread && activeConversationId !== conv.conversation_id ? (
                          <div className="absolute top-1.5 right-0 w-2.5 h-2.5 bg-[#25D366] rounded-full shadow-sm"></div>
                        ) : null;
                      })()}
                      {conv.type !== 'group' && (
                        <span className={`text-[11px] truncate w-full ${activeConversationId === conv.conversation_id ? 'text-white/80' : 'text-[var(--text-muted)]'}`}>
                          @{conv.username}
                        </span>
                      )}
                      {conv.type === 'group' && (
                        <span className={`text-[11px] truncate w-full ${activeConversationId === conv.conversation_id ? 'text-white/80' : 'text-emerald-500'}`}>
                          Private Group
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
          
          {/* Mobile FAB for new chat */}
          <button 
            onClick={() => setIsNewChatModalOpen(true)}
            className="md:hidden absolute bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#00a884] text-white shadow-xl hover:bg-[#008f6f] transition-all z-30"
          >
            <MessageCircle className="h-6 w-6" />
          </button>
        </div>

        {/* Main DM Chat Area */}
        <div className={`flex-1 flex flex-col bg-[var(--bg-main)] ${!activeConversationId ? 'hidden md:flex' : 'flex'}`}>
          {activeConversationId ? (
            <motion.div 
              className="h-full w-full overflow-hidden bg-transparent"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }) => {
                if (Math.abs(offset.x) > 100 || Math.abs(velocity.x) > 500) {
                  handleCloseChat();
                }
              }}
            >
              <ChatArea 
                roomId={activeConversationId} 
                onBack={handleCloseChat} 
                onAvatarChange={(url) => {
                  setConversations(prev => prev.map(conv => 
                    conv.conversation_id === activeConversationId
                      ? { ...conv, avatar_url: url }
                      : conv
                  ));
                }}
              />
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
               <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mb-6 border border-emerald-500/20 shadow-lg">
                 <MessageCircle className="h-10 w-10" />
               </div>
               <h2 className="text-2xl font-bold text-[var(--text-strong)]">Your Messages</h2>
               <p className="mt-3 text-[var(--text-muted)] max-w-md text-center leading-relaxed">
                 Select a conversation from the sidebar or click the <Plus className="inline h-4 w-4 bg-emerald-500 text-white rounded-full p-0.5 mx-1" /> button to start a new chat by searching for a username.
               </p>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-[var(--text-main)]">
          <div className="w-full max-w-md rounded-3xl border border-[var(--border-color-strong)] bg-[var(--bg-panel)] shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] px-6 py-4">
              <h3 className="text-xl font-bold text-[var(--text-strong)] flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-emerald-500" />
                New Conversation
              </h3>
              <button onClick={() => { setIsNewChatModalOpen(false); setNewChatError(''); }} className="rounded-full p-2 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-strong)] transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 bg-[var(--bg-main)]">
              {newChatError && (
                <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400 font-medium text-center">
                  {newChatError}
                </div>
              )}

              <form onSubmit={handleStartNewChat} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-main)] mb-2">Target Username</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-bold">@</span>
                    <input 
                      autoFocus
                      type="text" 
                      value={newChatUsername}
                      onChange={(e) => setNewChatUsername(e.target.value)}
                      placeholder="username"
                      required
                      className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] py-3.5 pl-10 pr-4 text-sm text-[var(--text-strong)] outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm transition-all"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsNewChatModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl font-semibold text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isCreatingChat}
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 font-bold text-white shadow-md transition hover:bg-emerald-400 disabled:opacity-50"
                  >
                    {isCreatingChat ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                        Starting...
                      </>
                    ) : (
                      'Start Chat'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* DP Full Screen Preview Modal */}
      <AnimatePresence>
        {dpPreviewUser && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 cursor-pointer"
            onClick={() => setDpPreviewUser(null)}
          >
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-sm w-full aspect-square md:max-w-md bg-[var(--bg-panel)] rounded-full overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] cursor-default" 
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setDpPreviewUser(null)} 
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
              {(dpPreviewUser.avatar_url && dpPreviewUser.avatar_url.startsWith('http')) ? (
                <img src={dpPreviewUser.avatar_url} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-[rgb(var(--accent-main))] text-[120px] font-bold text-white">
                  {(dpPreviewUser.name || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* New Group Modal */}
      {isNewGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-[var(--text-main)]">
          <div className="w-full max-w-md rounded-3xl border border-[var(--border-color-strong)] bg-[var(--bg-panel)] shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] px-6 py-4">
              <h3 className="text-xl font-bold text-[var(--text-strong)] flex items-center gap-2">
                <Users className="h-5 w-5 text-sky-500" />
                New Group
              </h3>
              <button onClick={() => { setIsNewGroupModalOpen(false); setNewGroupError(''); }} className="rounded-full p-2 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-strong)] transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 bg-[var(--bg-main)]">
              <form onSubmit={handleCreateGroup} className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-main)] mb-2">Group Name</label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g. Weekend Trip"
                    className="w-full rounded-xl border border-[var(--border-color-strong)] bg-[var(--bg-panel)] px-4 py-3 text-[var(--text-main)] outline-none focus:border-sky-500 transition-colors shadow-inner"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-main)] mb-2">Select Participants</label>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      value={groupSearchQuery}
                      onChange={(e) => setGroupSearchQuery(e.target.value)}
                      placeholder="Search users..."
                      className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] py-2 pl-9 pr-4 text-sm text-[var(--text-main)] outline-none focus:border-sky-500 transition-colors"
                    />
                  </div>
                  <div className="h-48 overflow-y-auto rounded-xl border border-[var(--border-color-strong)] bg-[var(--bg-main)] p-2 space-y-1">
                    {allUsers
                      .filter(u => u.name?.toLowerCase().includes(groupSearchQuery.toLowerCase()) || u.username?.toLowerCase().includes(groupSearchQuery.toLowerCase()))
                      .map(user => {
                        const isSelected = selectedUserIds.includes(user.id);
                        return (
                          <div 
                            key={user.id}
                            onClick={() => {
                              setSelectedUserIds(prev => 
                                isSelected ? prev.filter(id => id !== user.id) : [...prev, user.id]
                              );
                            }}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-sky-500/10 border border-sky-500/20' : 'hover:bg-[var(--bg-hover)] border border-transparent'}`}
                          >
                            <div className="h-8 w-8 rounded-full bg-[var(--bg-panel)] overflow-hidden shrink-0 flex items-center justify-center font-bold text-sm border border-[var(--border-color)] text-[var(--text-strong)]">
                              {(user.avatar_url && user.avatar_url.startsWith('http')) ? (
                                <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                              ) : (
                                (user.name || 'U').charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="flex flex-col flex-1 overflow-hidden">
                              <span className="text-sm font-semibold truncate text-[var(--text-strong)]">{user.name}</span>
                              <span className="text-xs text-[var(--text-muted)] truncate">@{user.username}</span>
                            </div>
                            <div className={`h-4 w-4 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-sky-500 border-sky-500' : 'border-[var(--border-color-strong)]'}`}>
                              {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
                
                {newGroupError && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                    {newGroupError}
                  </div>
                )}
                
                <div className="flex items-center justify-end gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => { setIsNewGroupModalOpen(false); setNewGroupError(''); setSelectedUserIds([]); setGroupSearchQuery(''); }}
                    className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingGroup || !newGroupName.trim() || selectedUserIds.length === 0}
                    className="rounded-xl bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-sky-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingGroup ? 'Creating...' : `Create Group (${selectedUserIds.length})`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
