'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, MessageCircle, X } from 'lucide-react';
import Shell from '../../../components/Shell';
import { supabase } from '../../../lib/supabaseClient';
import ChatArea from '../../../components/ChatArea';

export default function DirectMessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // New Chat Modal States
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [newChatUsername, setNewChatUsername] = useState('');
  const [newChatError, setNewChatError] = useState('');
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  useEffect(() => {
    const fetchDMs = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const myId = session.user.id;
      setCurrentUserId(myId);

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
  }, [activeConversationId]); // Re-fetch if active conversation changes (to show new chats in sidebar)

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
      setActiveConversationId(conv.id);
    } else {
      setNewChatError('Failed to start conversation.');
    }
    setIsCreatingChat(false);
  };

  const filteredConversations = conversations.filter(conv => 
    conv.users?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    conv.users?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Shell>
      <div className="flex h-full w-full overflow-hidden text-[var(--text-main)] relative">
        
        {/* DM Sidebar List */}
        <div className={`flex flex-col border-r border-[var(--border-color)] bg-[var(--bg-sidebar)] backdrop-blur-sm shrink-0 w-full md:w-[320px] lg:w-[360px] ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-[var(--border-color)] flex flex-col gap-3">
             <div className="flex items-center justify-between">
               <h2 className="text-xl font-bold text-[var(--text-strong)] tracking-tight">Messages</h2>
               <button 
                 onClick={() => setIsNewChatModalOpen(true)}
                 className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm hover:bg-emerald-400 transition-colors"
                 title="New Chat"
               >
                 <Plus className="h-4 w-4" />
               </button>
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
                  onClick={() => setActiveConversationId(conv.conversation_id)}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-3 text-sm transition-all ${
                    activeConversationId === conv.conversation_id 
                      ? 'bg-[rgb(var(--accent-main))] text-white shadow-md' 
                      : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <div className="flex items-center gap-3 w-full overflow-hidden">
                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--bg-hover)] text-[rgb(var(--accent-main))] font-bold shadow-sm overflow-hidden border border-[var(--border-color)]">
                      {(conv.users?.avatar_url && conv.users.avatar_url.startsWith('http')) ? (
                        <img src={conv.users.avatar_url} alt="avatar" className="h-full w-full object-cover" />
                      ) : (
                        (conv.users?.name || 'U').charAt(0).toUpperCase()
                      )}
                      {activeConversationId === conv.conversation_id && !conv.users?.avatar_url && (
                        <div className="absolute inset-0 bg-white/20"></div>
                      )}
                    </div>
                    <div className="flex flex-col items-start overflow-hidden w-full text-left">
                      <span className={`font-semibold truncate w-full ${activeConversationId === conv.conversation_id ? 'text-white' : 'text-[var(--text-strong)]'}`}>
                        {conv.users?.name || 'Unknown'}
                      </span>
                      <span className={`text-[11px] truncate w-full ${activeConversationId === conv.conversation_id ? 'text-white/80' : 'text-[var(--text-muted)]'}`}>
                        @{conv.users?.username}
                      </span>
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
            <div className="h-full w-full overflow-hidden bg-transparent">
              <ChatArea roomId={activeConversationId} onBack={() => setActiveConversationId(null)} />
            </div>
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
    </Shell>
  );
}
