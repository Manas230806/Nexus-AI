'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useUser } from '../hooks/useSupabase';
import { 
  Bell, CalendarDays, LayoutDashboard, MessageSquareText, 
  Settings, Sparkles, Search, Plus, User, LogOut, Video, 
  FileText, Briefcase, MessageCircle, Menu, X, ArrowRight, Sun, Moon
} from 'lucide-react';
import { useTheme } from './ThemeProvider';
import Logo from './Logo';

const topNavItems = [
  { href: '/workspace', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/workspace/chat', label: 'Messages', icon: MessageSquareText },
  { href: '/workspace/dm', label: 'Direct Messages', icon: MessageCircle },
  { href: '/workspace/ai', label: 'AI Assistant', icon: Sparkles, badge: 'NEW' },
  { href: '/workspace/files', label: 'Workspace', icon: Briefcase },
  { href: '/workspace/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/workspace/notes', label: 'Notes', icon: FileText },
  { href: '/workspace/settings', label: 'Settings', icon: Settings },
];

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { userProfile, updateProfile } = useUser();
  const { theme, toggleTheme } = useTheme();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDpPreviewOpen, setIsDpPreviewOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  const openProfileModal = () => {
    if (userProfile) {
      setEditName(userProfile.name || '');
      setEditUsername(userProfile.username || '');
      setEditAvatarUrl(userProfile.avatar_url || '');
      setIsProfileModalOpen(true);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateProfile) return;
    setProfileSaving(true);
    await updateProfile({ name: editName, username: editUsername, avatar_url: editAvatarUrl });
    setProfileSaving(false);
    setIsProfileModalOpen(false);
  };
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };
  
  // New Message State
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');
  const [searchError, setSearchError] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  const handleVideoCall = () => {
    window.open('https://meet.google.com/new', '_blank');
  };

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
    <>
      <div className="flex items-center justify-between px-6 py-6">
        <Logo size={32} />
        <div className="hidden md:block h-2 w-2 rounded-full bg-emerald-400" />
        <button 
          className="md:hidden text-[var(--text-muted)]" 
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="px-4 mb-6">
        <div className="relative flex items-center rounded-xl bg-[var(--bg-panel)] border border-[var(--border-color)] px-3 py-2 transition-colors focus-within:border-[rgb(var(--accent-main))]/50">
          <Search className="h-4 w-4 text-[var(--text-muted)]" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="ml-2 w-full bg-transparent text-sm text-[var(--text-main)] placeholder-slate-500 outline-none"
          />
        </div>
      </div>

      {userProfile && (
        <div className="px-4 mb-6">
          <div 
            onClick={openProfileModal}
            className="flex items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-3 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
          >
            <div 
              onClick={(e) => { e.stopPropagation(); setIsDpPreviewOpen(true); }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--accent-main))] text-sm font-bold text-[var(--text-strong)] shadow-sm overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
            >
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
        </div>
      )}

      <nav className="flex-1 space-y-1 px-3 overflow-y-auto scrollbar-hide">
        {topNavItems.map((item) => {
          const Icon = item.icon;
          const active = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`group block w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                active 
                  ? 'bg-[var(--bg-active)] text-[var(--text-strong)] border border-[var(--border-active)] shadow-sm' 
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)] border border-transparent'
              }`}
              style={{
                outline: 'none',
                boxShadow: 'none',
                WebkitTapHighlightColor: 'transparent',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                cursor: 'pointer'
              }}
            >
              <div 
                className="flex items-center gap-3 w-full h-full"
                style={{ cursor: 'pointer', pointerEvents: 'none' }}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-[rgb(var(--accent-main))]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-main)]'}`} />
                {item.label}
              </div>
              {item.badge && (
                <span className="rounded bg-[rgb(var(--accent-main))]/20 px-1.5 py-0.5 text-[10px] font-bold text-[rgb(var(--accent-main))] uppercase">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        <div className="mt-8 mb-2 px-3 flex items-center justify-between group cursor-pointer" onClick={() => setIsNewMessageOpen(true)}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors">Direct Messages</span>
          <button className="text-[var(--text-muted)] hover:text-[var(--text-strong)] hover:bg-[var(--bg-hover)] p-1 rounded transition-colors"><Plus className="h-3 w-3" /></button>
        </div>


        <button 
          onClick={handleSignOut}
          className="w-full group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-rose-400 transition-all"
        >
          <LogOut className="h-4 w-4 text-[var(--text-muted)] group-hover:text-rose-400" />
          Sign Out
        </button>
        
        <button 
          onClick={toggleTheme}
          className="w-full group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)] transition-all mt-4"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="h-4 w-4 text-[var(--text-muted)] group-hover:text-[var(--text-main)]" />
              Light Mode
            </>
          ) : (
            <>
              <Moon className="h-4 w-4 text-[var(--text-muted)] group-hover:text-[var(--text-main)]" />
              Dark Mode
            </>
          )}
        </button>
      </nav>
    </>
  );

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-[var(--bg-main)] font-sans text-[var(--text-main)]">
      
      {/* Background Grid Pattern */}
      <div 
        className="pointer-events-none absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: 'linear-gradient(var(--grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--grid-color) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />
      
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
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Drawer (Mobile & Desktop) */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-[var(--border-color)] bg-[var(--bg-sidebar)] transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {SidebarContent}
      </aside>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 overflow-y-auto pt-16 md:pt-0 flex flex-col">
        {children}
      </main>

      {/* DP Full Screen Preview Modal */}
      {isDpPreviewOpen && userProfile && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 cursor-pointer"
          onClick={() => setIsDpPreviewOpen(false)}
        >
          <div className="relative max-w-sm w-full aspect-square md:max-w-md bg-[var(--bg-panel)] rounded-full overflow-hidden shadow-2xl cursor-default" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setIsDpPreviewOpen(false)} 
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            {(userProfile.avatar_url && userProfile.avatar_url.startsWith('http')) ? (
              <img src={userProfile.avatar_url} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-[rgb(var(--accent-main))] text-[120px] font-bold text-white">
                {(userProfile.name || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      )}

      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-color-strong)] bg-[var(--bg-panel)] p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[var(--text-strong)]">Edit Profile</h2>
              <button onClick={() => setIsProfileModalOpen(false)} className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-strong)]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">Display Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-hover)] px-4 py-2.5 text-sm text-[var(--text-main)] outline-none focus:border-[rgb(var(--accent-main))]"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">User ID (Username)</label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-[var(--text-muted)]">@</span>
                  <input 
                    type="text" 
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-hover)] pl-8 pr-4 py-2.5 text-sm text-[var(--text-main)] outline-none focus:border-[rgb(var(--accent-main))]"
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button type="submit" disabled={profileSaving} className="rounded-xl bg-[rgb(var(--accent-main))] px-6 py-2.5 text-sm font-semibold text-[var(--text-strong)] hover:opacity-90 disabled:opacity-50 transition-opacity">
                  {profileSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Message Modal */}
      {isNewMessageOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-[var(--border-color-strong)] bg-[var(--bg-panel)] p-6 shadow-2xl">
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
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] py-3 pl-10 pr-4 text-sm text-[var(--text-strong)] outline-none focus:border-[rgb(var(--accent-main))] focus:ring-1 focus:ring-[rgb(var(--accent-main))]"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={searchLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-violet-500 px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {searchLoading ? 'Starting Chat...' : 'Start Chat'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
      `}} />
    </div>
  );
}
