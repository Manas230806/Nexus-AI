'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useUser } from '../hooks/useSupabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, MessageSquare, Bot, Mic, Users, Folder, 
  Briefcase, Zap, Calendar, Settings, Menu, X, 
  LogOut, Sun, Moon, Search, Plus, ArrowRight, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useTheme } from './ThemeProvider';
import Logo from './Logo';

const navItems = [
  { href: '/workspace', label: 'Home', icon: Home, exact: true },
  { href: '/workspace/chat', label: 'Chat', icon: MessageSquare },
  { href: '/workspace/agents', label: 'Agents', icon: Bot },
  { href: '/workspace/voice', label: 'Voice', icon: Mic },
  { href: '/workspace/meetings', label: 'Meetings', icon: Users },
  { href: '/workspace/files', label: 'Files', icon: Folder },
  { href: '/workspace/overview', label: 'Workspace', icon: Briefcase },
  { href: '/workspace/automations', label: 'Automations', icon: Zap },
  { href: '/workspace/calendar', label: 'Calendar', icon: Calendar },
  { href: '/workspace/settings', label: 'Settings', icon: Settings },
];

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { userProfile } = useUser();
  const { theme, toggleTheme } = useTheme();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };
  
  // New Message State (Keeping existing functionality)
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');
  const [searchError, setSearchError] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  const handleNewMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUsername.trim()) return;
    setSearchLoading(true);
    setSearchError('');

    const cleanSearch = searchUsername.trim().toLowerCase().replace('@', '');

    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, name')
      .eq('username', cleanSearch)
      .single();

    if (userError || !targetUser) {
      setSearchError('User not found. Please check the username.');
      setSearchLoading(false);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;

    if (!currentUserId) {
      setSearchError('You must be logged in to send a message.');
      setSearchLoading(false);
      return;
    }

    if (currentUserId === targetUser.id) {
       setSearchError('You cannot message yourself!');
       setSearchLoading(false);
       return;
    }

    const { data: conv } = await supabase.from('conversations').insert([{ type: 'direct' }]).select().single();
    
    if (conv) {
      await supabase.from('participants').insert([
        { user_id: currentUserId, conversation_id: conv.id },
        { user_id: targetUser.id, conversation_id: conv.id }
      ]);
      
      setIsNewMessageOpen(false);
      setSearchUsername('');
      router.push(`/workspace/chat/${conv.id}`);
    } else {
      setSearchError('Failed to create conversation.');
    }
    setSearchLoading(false);
  };

  const SidebarContent = (
    <div className="flex flex-col h-full overflow-hidden">
      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-6 py-6 transition-all`}>
        <div className="flex items-center gap-3">
          <Logo size={isCollapsed ? 24 : 32} />
          {!isCollapsed && <span className="font-bold text-lg hidden md:block">Nexus AI</span>}
        </div>
        <button 
          className="hidden md:flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
        <button 
          className="md:hidden text-[var(--text-muted)]" 
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {!isCollapsed && userProfile && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 mb-6">
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-hover)] p-3 backdrop-blur-md">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-sm font-bold text-white shadow-sm overflow-hidden">
              {(userProfile.avatar_url && userProfile.avatar_url.startsWith('http')) ? (
                <img src={userProfile.avatar_url} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                (userProfile.name || 'U').charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-sm font-bold text-[var(--text-strong)] truncate">{userProfile.name}</span>
              <span className="text-xs text-[var(--text-muted)] truncate">@{userProfile.username}</span>
            </div>
          </div>
        </motion.div>
      )}

      {isCollapsed && userProfile && (
        <div className="flex justify-center mb-6 px-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-sm font-bold text-white shadow-sm overflow-hidden">
            {(userProfile.avatar_url && userProfile.avatar_url.startsWith('http')) ? (
              <img src={userProfile.avatar_url} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              (userProfile.name || 'U').charAt(0).toUpperCase()
            )}
          </div>
        </div>
      )}

      <nav className="flex-1 space-y-1.5 px-3 overflow-y-auto scrollbar-hide pb-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="block"
            >
              <motion.div
                whileHover={{ scale: 0.98, backgroundColor: 'rgba(255,255,255,0.08)' }}
                whileTap={{ scale: 0.95 }}
                className={`group flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} rounded-2xl px-3 py-3 text-sm font-medium transition-colors ${
                  active 
                    ? 'bg-gradient-to-r from-[rgba(109,93,246,0.15)] to-transparent text-[var(--accent-glow)] border-l-2 border-[var(--border-active)] shadow-sm' 
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-center gap-4">
                  <motion.div
                    whileHover={{ rotate: [-5, 5, -5, 0], transition: { duration: 0.3 } }}
                  >
                    <Icon className={`h-5 w-5 ${active ? 'text-[var(--accent-glow)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-main)]'}`} />
                  </motion.div>
                  {!isCollapsed && <span>{item.label}</span>}
                </div>
              </motion.div>
            </Link>
          );
        })}

        <div className={`mt-8 mb-2 px-3 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} group cursor-pointer`} onClick={() => setIsNewMessageOpen(true)}>
          {!isCollapsed && <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors">Direct Messages</span>}
          <button className="text-[var(--text-muted)] hover:text-[var(--text-strong)] hover:bg-[var(--bg-hover)] p-1.5 rounded-full transition-colors"><Plus className="h-4 w-4" /></button>
        </div>

        <button 
          onClick={handleSignOut}
          className={`w-full group flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} gap-4 rounded-2xl px-3 py-3 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-rose-400 transition-all`}
        >
          <LogOut className="h-5 w-5 text-[var(--text-muted)] group-hover:text-rose-400" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
        
        <button 
          onClick={toggleTheme}
          className={`w-full group flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} gap-4 rounded-2xl px-3 py-3 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)] transition-all`}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="h-5 w-5 text-[var(--text-muted)] group-hover:text-[var(--text-main)]" />
              {!isCollapsed && <span>Light Mode</span>}
            </>
          ) : (
            <>
              <Moon className="h-5 w-5 text-[var(--text-muted)] group-hover:text-[var(--text-main)]" />
              {!isCollapsed && <span>Dark Mode</span>}
            </>
          )}
        </button>
      </nav>
    </div>
  );

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-[var(--bg-main)] font-sans text-[var(--text-main)]">
      
      {/* Mobile Top Bar */}
      <div className="md:hidden absolute top-0 left-0 right-0 h-16 border-b border-[var(--border-color)] bg-[var(--bg-sidebar)]/80 backdrop-blur-md z-40 flex items-center justify-between px-4">
        <Logo size={24} />
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 rounded-lg bg-[var(--bg-hover)] text-[var(--text-strong)]"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Drawer (Mobile & Desktop) */}
      <motion.aside 
        initial={false}
        animate={{ width: isCollapsed ? 80 : 260 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[var(--border-color)] bg-[var(--bg-sidebar)] transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0 w-[260px]' : '-translate-x-full md:translate-x-0'}`}
      >
        {SidebarContent}
      </motion.aside>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden pt-16 md:pt-0 flex flex-col bg-[var(--bg-main)]">
        {children}
      </main>

      {/* New Message Modal */}
      <AnimatePresence>
        {isNewMessageOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-[24px] border border-[var(--border-color-strong)] bg-[rgba(17,24,39,0.9)] p-6 shadow-2xl backdrop-blur-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[var(--text-strong)]">New Direct Message</h3>
                <button onClick={() => setIsNewMessageOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-strong)]">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {searchError && (
                <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                  {searchError}
                </div>
              )}

              <form onSubmit={handleNewMessage} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase text-[var(--text-muted)]">User Username</label>
                  <div className="relative mt-2">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-bold">@</span>
                    <input 
                      autoFocus
                      type="text" 
                      value={searchUsername}
                      onChange={(e) => setSearchUsername(e.target.value)}
                      placeholder="sarah123"
                      required
                      className="w-full rounded-2xl border border-[var(--border-color)] bg-[rgba(255,255,255,0.05)] py-3 pl-10 pr-4 text-sm text-[var(--text-strong)] outline-none focus:border-[var(--border-active)] focus:ring-1 focus:ring-[var(--border-active)] transition-colors"
                    />
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={searchLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[var(--border-active)] px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {searchLoading ? 'Starting Chat...' : 'Start Chat'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
      `}} />
    </div>
  );
}
