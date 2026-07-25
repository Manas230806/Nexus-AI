'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Search, Mic, Send, BrainCircuit, 
  MessageSquare, Bot, Zap, Folder, Users, 
  Briefcase, Plus, ArrowRight
} from 'lucide-react';
import Shell from '../../components/Shell';
import { useUser } from '../../hooks/useSupabase';
import { useWorkspace } from '../../hooks/useWorkspace';

export default function WorkspacePage() {
  const { userProfile } = useUser();
  const { groups, projects, loading } = useWorkspace();
  
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [greeting, setGreeting] = useState('Good Evening');

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <Shell>
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div 
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(139, 92, 246, 0.05), transparent 40%)`
          }}
        />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-sky-500/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Subtle Grid */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(var(--border-color) 1px, transparent 1px), linear-gradient(90deg, var(--border-color) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
        
        {/* Floating Particles */}
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
            }}
            animate={{
              y: [null, Math.random() * -100 - 50],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 p-6 lg:p-10 h-full overflow-y-auto scrollbar-hide">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="max-w-6xl mx-auto space-y-12 pb-24"
        >
          {/* Hero Section */}
          <motion.section variants={itemVariants} className="text-center pt-8 md:pt-16">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-[var(--text-muted)] mb-6"
            >
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span>{greeting}, {userProfile?.name || 'User'} 👋</span>
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-10">
              What are we building today?
            </h1>

            {/* AI Search Bar */}
            <div className="max-w-2xl mx-auto relative group">
              <div className={`absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500 rounded-2xl blur opacity-25 transition duration-500 ${isSearchFocused ? 'opacity-70 duration-200' : 'group-hover:opacity-50'}`} />
              <div className="relative flex items-center bg-[var(--bg-panel)] border border-[var(--border-color-strong)] rounded-2xl p-2 backdrop-blur-xl transition-all">
                <div className="flex-1 flex items-center px-4">
                  <Sparkles className="h-5 w-5 text-purple-400 mr-3" />
                  <input 
                    type="text" 
                    placeholder="Ask Nexus anything..."
                    className="w-full bg-transparent text-white placeholder-[var(--text-muted)] outline-none text-lg py-3"
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                  />
                </div>
                <div className="flex items-center gap-2 pr-2">
                  <button className="p-2.5 text-[var(--text-muted)] hover:text-white rounded-xl hover:bg-white/5 transition-colors">
                    <Mic className="h-5 w-5" />
                  </button>
                  <button className="p-2.5 bg-indigo-500 hover:opacity-90 text-white rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.section>

          {/* AI Quick Actions */}
          <motion.section variants={itemVariants}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'Think', desc: 'Deep reasoning, brainstorming and analysis.', icon: BrainCircuit, color: 'from-purple-500 to-indigo-500' },
                { title: 'Chat', desc: 'Start a new AI conversation.', icon: MessageSquare, color: 'from-sky-400 to-blue-500' },
                { title: 'Agents', desc: 'Create or manage AI agents.', icon: Bot, color: 'from-emerald-400 to-teal-500' },
                { title: 'Automations', desc: 'Build workflows and automate tasks.', icon: Zap, color: 'from-orange-400 to-red-500' },
              ].map((action, i) => (
                <motion.div
                  key={action.title}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="relative group cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300 pointer-events-none" />
                  <div className="h-full bg-[var(--bg-panel)] border border-[var(--border-color-strong)] rounded-2xl p-6 backdrop-blur-md overflow-hidden relative">
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br opacity-20 blur-3xl rounded-full transition-all duration-500 group-hover:opacity-40 group-hover:scale-150" />
                    
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white mb-4 shadow-lg`}>
                      <action.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{action.title}</h3>
                    <p className="text-sm text-[var(--text-muted)] leading-relaxed">{action.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Bottom Grid: Intelligence & Timeline */}
          {loading ? (
            <motion.div variants={itemVariants} className="text-center text-[var(--text-muted)] py-10">
              Loading workspace data...
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Projects Overview */}
              <motion.section variants={itemVariants} className="h-full">
                <div className="bg-[var(--bg-panel)] border border-[var(--border-color-strong)] rounded-[24px] p-6 md:p-8 backdrop-blur-md h-full">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <Folder className="h-6 w-6 text-sky-400" />
                      Active Projects
                    </h2>
                    <span className="bg-sky-400/20 text-sky-300 text-xs font-bold px-3 py-1 rounded-full">{projects.length} Total</span>
                  </div>
                  
                  <div className="space-y-4">
                    {projects.length > 0 ? projects.map((project) => (
                      <motion.div 
                        key={project._id}
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-xl bg-sky-400/10 flex items-center justify-center text-sky-400">
                          <Briefcase className="h-6 w-6" />
                        </div>
                        <div className="flex-1 truncate">
                          <p className="text-lg font-semibold text-white truncate">{project.name}</p>
                          <p className="text-sm text-[var(--text-muted)] mb-1 truncate">{project.description || 'No description provided.'}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center shrink-0">
                          <ArrowRight className="h-4 w-4 text-[var(--text-muted)]" />
                        </div>
                      </motion.div>
                    )) : (
                      <div className="text-[var(--text-muted)] text-sm">No active projects right now. Start building something new!</div>
                    )}
                  </div>
                </div>
              </motion.section>

              {/* Groups Overview */}
              <motion.section variants={itemVariants} className="h-full">
                <div className="bg-[var(--bg-panel)] border border-[var(--border-color-strong)] rounded-[24px] p-6 md:p-8 backdrop-blur-md h-full">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <Users className="h-6 w-6 text-emerald-400" />
                      Your Groups
                    </h2>
                    <span className="bg-emerald-400/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full">{groups.length} Total</span>
                  </div>
                  
                  <div className="space-y-4">
                    {groups.length > 0 ? groups.map((group) => (
                      <motion.div 
                        key={group._id}
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-xl bg-emerald-400/10 flex items-center justify-center text-emerald-400">
                          <Users className="h-6 w-6" />
                        </div>
                        <div className="flex-1 truncate">
                          <p className="text-lg font-semibold text-white truncate">{group.name}</p>
                          <p className="text-sm text-[var(--text-muted)] mb-1 truncate">{group.description || 'No description provided.'}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center shrink-0">
                          <ArrowRight className="h-4 w-4 text-[var(--text-muted)]" />
                        </div>
                      </motion.div>
                    )) : (
                      <div className="text-[var(--text-muted)] text-sm">You are not part of any groups yet.</div>
                    )}
                  </div>
                </div>
              </motion.section>

            </div>
          )}
        </motion.div>
      </div>

      {/* Floating AI Assistant */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {isAssistantOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="absolute bottom-20 right-0 w-80 bg-[var(--bg-panel)] border border-[var(--border-color-strong)] rounded-[24px] shadow-2xl backdrop-blur-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-white/5 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-bold text-white">Nexus Assistant</span>
                </div>
              </div>
              <div className="p-4 h-64 overflow-y-auto flex flex-col gap-4">
                <div className="bg-white/5 rounded-2xl rounded-tl-sm p-3 text-sm text-[var(--text-main)] w-[85%]">
                  Hi {userProfile?.name?.split(' ')[0] || 'there'}! I'm here to help you navigate your workspace and automate tasks. What can I do for you?
                </div>
              </div>
              <div className="p-3 border-t border-white/5">
                <div className="flex items-center bg-black/20 rounded-xl px-3 py-2">
                  <input type="text" placeholder="Message assistant..." className="flex-1 bg-transparent text-sm text-white outline-none" />
                  <button className="text-purple-400"><Send className="h-4 w-4" /></button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setIsAssistantOpen(!isAssistantOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative group flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 shadow-xl"
        >
          <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300 animate-pulse" />
          {isAssistantOpen ? <Bot className="h-6 w-6 text-white relative z-10" /> : <Sparkles className="h-6 w-6 text-white relative z-10" />}
        </motion.button>
      </div>
      
    </Shell>
  );
}
