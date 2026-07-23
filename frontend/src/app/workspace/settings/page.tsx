'use client';

import { useState, useEffect, useRef } from 'react';
import { Settings, User, Bell, Shield, Moon, Sun, Monitor, Paintbrush, Save, X, Upload, LogOut } from 'lucide-react';
import Shell from '../../../components/Shell';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

const DEFAULT_AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jude',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo'
];

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance'>('appearance');
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('dark');
  const [accent, setAccent] = useState<'indigo' | 'rose' | 'emerald' | 'amber' | 'cyan'>('indigo');
  
  // Profile State
  const [userId, setUserId] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  
  // Modal State
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accent);
  }, [accent]);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (user) {
        setUserId(user.id);
        setAvatarUrl(user.avatar_url || '');
        setFullName(user.name || '');
        setUsername(user.username || '');
        setEmail(user.email || '');
      }
    };
    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    if (!userId) return;
    await supabase.from('users').update({
      name: fullName,
      username: username,
    }).eq('id', userId);
    alert('Profile saved!');
  };

  const handleSelectDefaultAvatar = async (url: string) => {
    setAvatarUrl(url);
    await supabase.from('users').update({ avatar_url: url }).eq('id', userId);
    setIsAvatarModalOpen(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) return;
      
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}-${Math.random()}.${fileExt}`;

      // Upload to supabase storage (bucket: avatars)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', userId);
      setIsAvatarModalOpen(false);
    } catch (error: any) {
      alert('Error uploading avatar: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Shell>
      <div className="flex h-full w-full flex-col p-8 lg:px-16 overflow-y-auto">
        {/* Header */}
        <div className="mb-10 border-b border-[var(--border-color)] pb-6">
          <h1 className="text-3xl font-bold text-[var(--text-strong)] tracking-tight">Settings</h1>
          <p className="text-sm text-[var(--text-muted)] mt-2">Manage your account settings and preferences.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Settings Nav */}
          <nav className="w-full lg:w-64 space-y-2">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${activeTab === 'profile' ? 'bg-[rgb(var(--accent-main))]/10 text-[rgb(var(--accent-main))] shadow-sm' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-strong)]'}`}
            >
              <User className="h-5 w-5" /> Account Profile
            </button>
            <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-strong)]">
              <Bell className="h-5 w-5" /> Notifications
            </button>
            <button 
              onClick={() => setActiveTab('appearance')}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${activeTab === 'appearance' ? 'bg-[rgb(var(--accent-main))]/10 text-[rgb(var(--accent-main))] shadow-sm' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-strong)]'}`}
            >
              <Paintbrush className="h-5 w-5" /> Appearance
            </button>
            <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-strong)]">
              <Shield className="h-5 w-5" /> Security
            </button>
          </nav>

          {/* Settings Content */}
          <div className="flex-1 max-w-3xl">
            
            {activeTab === 'appearance' && (
              <>
                <h2 className="text-xl font-bold text-[var(--text-strong)] mb-6">Appearance</h2>
                
                <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-6 mb-8">
                  <div className="mb-6">
                    <h3 className="text-base font-semibold text-[var(--text-strong)]">Theme</h3>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Select or customize your UI theme.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button 
                      onClick={() => setTheme('light')}
                      className={`flex flex-col items-center justify-center gap-3 rounded-xl border p-6 transition-all ${
                        theme === 'light' 
                          ? 'border-[rgb(var(--accent-main))] bg-[rgb(var(--accent-main))]/10' 
                          : 'border-[var(--border-color-strong)] bg-[var(--bg-hover)] hover:border-[var(--border-color)]'
                      }`}
                    >
                      <Sun className={`h-8 w-8 ${theme === 'light' ? 'text-[rgb(var(--accent-main))]' : 'text-[var(--text-muted)]'}`} />
                      <span className={`text-sm font-medium ${theme === 'light' ? 'text-[rgb(var(--accent-main))]' : 'text-[var(--text-main)]'}`}>Light Mode</span>
                    </button>

                    <button 
                      onClick={() => setTheme('dark')}
                      className={`flex flex-col items-center justify-center gap-3 rounded-xl border p-6 transition-all ${
                        theme === 'dark' 
                          ? 'border-[rgb(var(--accent-main))] bg-[rgb(var(--accent-main))]/10' 
                          : 'border-[var(--border-color-strong)] bg-[var(--bg-hover)] hover:border-[var(--border-color)]'
                      }`}
                    >
                      <Moon className={`h-8 w-8 ${theme === 'dark' ? 'text-[rgb(var(--accent-main))]' : 'text-[var(--text-muted)]'}`} />
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-[rgb(var(--accent-main))]' : 'text-[var(--text-main)]'}`}>Dark Mode</span>
                    </button>

                    <button 
                      onClick={() => setTheme('system')}
                      className={`flex flex-col items-center justify-center gap-3 rounded-xl border p-6 transition-all ${
                        theme === 'system' 
                          ? 'border-[rgb(var(--accent-main))] bg-[rgb(var(--accent-main))]/10' 
                          : 'border-[var(--border-color-strong)] bg-[var(--bg-hover)] hover:border-[var(--border-color)]'
                      }`}
                    >
                      <Monitor className={`h-8 w-8 ${theme === 'system' ? 'text-[rgb(var(--accent-main))]' : 'text-[var(--text-muted)]'}`} />
                      <span className={`text-sm font-medium ${theme === 'system' ? 'text-[rgb(var(--accent-main))]' : 'text-[var(--text-main)]'}`}>System</span>
                    </button>
                  </div>
                </div>
                
                <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-6">
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-[var(--text-strong)]">Accent Color</h3>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Choose your workspace accent color.</p>
                  </div>
                  <div className="flex gap-4 mt-4">
                    <button onClick={() => setAccent('indigo')} className={`h-10 w-10 rounded-full bg-[#6366f1] transition-transform ${accent === 'indigo' ? 'border-2 border-[var(--bg-main)] ring-2 ring-[#6366f1] scale-110 shadow-lg' : 'hover:scale-110'}`}></button>
                    <button onClick={() => setAccent('rose')} className={`h-10 w-10 rounded-full bg-[#f43f5e] transition-transform ${accent === 'rose' ? 'border-2 border-[var(--bg-main)] ring-2 ring-[#f43f5e] scale-110 shadow-lg' : 'hover:scale-110'}`}></button>
                    <button onClick={() => setAccent('emerald')} className={`h-10 w-10 rounded-full bg-[#10b981] transition-transform ${accent === 'emerald' ? 'border-2 border-[var(--bg-main)] ring-2 ring-[#10b981] scale-110 shadow-lg' : 'hover:scale-110'}`}></button>
                    <button onClick={() => setAccent('amber')} className={`h-10 w-10 rounded-full bg-[#f59e0b] transition-transform ${accent === 'amber' ? 'border-2 border-[var(--bg-main)] ring-2 ring-[#f59e0b] scale-110 shadow-lg' : 'hover:scale-110'}`}></button>
                    <button onClick={() => setAccent('cyan')} className={`h-10 w-10 rounded-full bg-[#06b6d4] transition-transform ${accent === 'cyan' ? 'border-2 border-[var(--bg-main)] ring-2 ring-[#06b6d4] scale-110 shadow-lg' : 'hover:scale-110'}`}></button>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'profile' && (
              <>
                <h2 className="text-xl font-bold text-[var(--text-strong)] mb-6">Account Profile</h2>
                <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-6 relative">
                     <div className="flex items-center gap-6 mb-8">
                       <div className="h-20 w-20 rounded-full bg-[rgb(var(--accent-main))] text-white flex items-center justify-center text-2xl font-bold shadow-lg overflow-hidden shrink-0">
                         {avatarUrl?.startsWith('http') ? (
                           <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                         ) : (
                           avatarUrl || fullName.substring(0,2).toUpperCase() || 'ME'
                         )}
                       </div>
                     <div>
                       <button 
                         onClick={() => setIsAvatarModalOpen(true)}
                         className="px-4 py-2 bg-[var(--bg-hover-strong)] hover:bg-[var(--border-color-strong)] text-[var(--text-strong)] text-sm font-medium rounded-lg transition-colors"
                       >
                         Change Avatar
                       </button>
                     </div>
                   </div>

                     <div className="space-y-4">
                       <div>
                         <label className="block text-sm font-medium text-[var(--text-main)] mb-1">Username</label>
                         <input 
                           type="text" 
                           value={username}
                           onChange={(e) => setUsername(e.target.value)}
                           className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-strong)] rounded-lg px-4 py-2.5 outline-none focus:border-[rgb(var(--accent-main))]" 
                         />
                       </div>
                       <div>
                         <label className="block text-sm font-medium text-[var(--text-main)] mb-1">Full Name</label>
                         <input 
                           type="text" 
                           value={fullName}
                           onChange={(e) => setFullName(e.target.value)}
                           className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-strong)] rounded-lg px-4 py-2.5 outline-none focus:border-[rgb(var(--accent-main))]" 
                         />
                       </div>
                       <div>
                         <label className="block text-sm font-medium text-[var(--text-main)] mb-1">Email Address</label>
                         <input 
                           type="email" 
                           value={email}
                           disabled
                           className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] opacity-50 text-[var(--text-strong)] rounded-lg px-4 py-2.5 outline-none cursor-not-allowed" 
                         />
                       </div>
                     </div>
                   
                     <div className="mt-8 border-t border-[var(--border-color)] pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <button 
                        onClick={handleSignOut}
                        className="flex items-center gap-2 px-6 py-2.5 bg-rose-500/10 text-rose-500 text-sm font-semibold rounded-lg hover:bg-rose-500/20 transition-colors w-full sm:w-auto justify-center"
                      >
                        <LogOut className="h-4 w-4" /> Sign Out
                      </button>
                      <button 
                        onClick={handleSaveProfile}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[rgb(var(--accent-main))] text-white text-sm font-semibold rounded-lg shadow-md hover:opacity-90 transition-opacity w-full sm:w-auto justify-center"
                      >
                        <Save className="h-4 w-4" /> Save Changes
                      </button>
                    </div>
                </div>
              </>
            )}

          </div>
        </div>
      </div>

      {/* Avatar Selection Modal */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[24px] border border-[var(--border-color-strong)] bg-[var(--bg-panel)] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[var(--text-strong)]">Choose an Avatar</h2>
              <button onClick={() => setIsAvatarModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-strong)]">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-sm text-[var(--text-muted)] mb-4">Select a default style:</p>
            <div className="grid grid-cols-5 gap-3 mb-6">
              {DEFAULT_AVATARS.map((url, idx) => (
                <button 
                  key={idx}
                  onClick={() => handleSelectDefaultAvatar(url)}
                  className="rounded-full overflow-hidden border-2 border-transparent hover:border-[rgb(var(--accent-main))] hover:scale-105 transition-all bg-[var(--bg-main)]"
                >
                  <img src={url} alt={`Avatar ${idx}`} className="h-16 w-16" />
                </button>
              ))}
            </div>

            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-[var(--border-color)]"></div>
              <span className="flex-shrink-0 mx-4 text-[var(--text-muted)] text-sm">OR</span>
              <div className="flex-grow border-t border-[var(--border-color)]"></div>
            </div>

            <div className="mt-4">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                className="hidden" 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-[var(--border-color-strong)] bg-[var(--bg-hover)] px-4 py-3 text-sm font-semibold text-[var(--text-strong)] hover:bg-[var(--bg-hover-strong)] transition-all disabled:opacity-50"
              >
                <Upload className="h-4 w-4" /> 
                {uploading ? 'Uploading...' : 'Upload from Gallery'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
