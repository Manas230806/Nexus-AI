'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Search, Mic, Send, BrainCircuit, 
  MessageSquare, Bot, Zap, Video, Mail, 
  Bell, CheckCircle2, Lightbulb, FileText,
  CalendarDays, ArrowRight
} from 'lucide-react';
import Shell from '../../components/Shell';

export default function WorkspacePage() {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

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
              <Sparkles className="h-4 w-4 text-[var(--accent-glow)]" />
              <span>Good Evening, Abhi 👋</span>
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-10">
              What are we building today?
            </h1>

            {/* AI Search Bar */}
            <div className="max-w-2xl mx-auto relative group">
              <div className={`absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500 rounded-2xl blur opacity-25 transition duration-500 ${isSearchFocused ? 'opacity-70 duration-200' : 'group-hover:opacity-50'}`} />
              <div className="relative flex items-center bg-[var(--bg-panel)] border border-[var(--border-color-strong)] rounded-2xl p-2 backdrop-blur-xl transition-all">
                <div className="flex-1 flex items-center px-4">
                  <Sparkles className="h-5 w-5 text-[var(--accent-glow)] mr-3" />
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
                  <button className="p-2.5 bg-[var(--border-active)] hover:opacity-90 text-white rounded-xl transition-all shadow-[0_0_15px_rgba(109,93,246,0.5)]">
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Today's Intelligence */}
            <motion.section variants={itemVariants} className="lg:col-span-2">
              <div className="bg-[var(--bg-panel)] border border-[var(--border-color-strong)] rounded-[24px] p-6 md:p-8 backdrop-blur-md h-full">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Sparkles className="h-6 w-6 text-[var(--accent-secondary)]" />
                    Today's Intelligence
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Meetings Today', value: '3 Scheduled', icon: Video, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                    { label: 'Messages Received', value: '12 Unread', icon: Mail, color: 'text-sky-400', bg: 'bg-sky-400/10' },
                    { label: 'Active Reminders', value: '5 Pending', icon: Bell, color: 'text-orange-400', bg: 'bg-orange-400/10' },
                    { label: 'Pending Tasks', value: '8 Open', icon: CheckCircle2, color: 'text-purple-400', bg: 'bg-purple-400/10' },
                  ].map((stat, i) => (
                    <motion.div 
                      key={stat.label}
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors cursor-pointer"
                    >
                      <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                        <stat.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-[var(--text-muted)] mb-1">{stat.label}</p>
                        <p className="text-lg font-semibold text-white">{stat.value}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center">
                        <ArrowRight className="h-4 w-4 text-[var(--text-muted)]" />
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* AI Suggestion Full Width */}
                  <motion.div 
                    whileHover={{ scale: 1.01 }}
                    className="md:col-span-2 mt-2 flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 mt-1">
                      <Lightbulb className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-indigo-300 mb-1">AI Suggestion</p>
                      <p className="text-sm text-[var(--text-main)] leading-relaxed">
                        You have a meeting with the Design Team in 2 hours. Should I prepare a summary of the "Project Proposal.pdf" for you?
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button className="px-3 py-1.5 rounded-lg bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600 transition-colors">Yes, prepare it</button>
                        <button className="px-3 py-1.5 rounded-lg bg-white/5 text-[var(--text-muted)] text-xs font-semibold hover:bg-white/10 transition-colors">Dismiss</button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.section>

            {/* Recent Activity Timeline */}
            <motion.section variants={itemVariants} className="lg:col-span-1">
              <div className="bg-[var(--bg-panel)] border border-[var(--border-color-strong)] rounded-[24px] p-6 md:p-8 backdrop-blur-md h-full">
                <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
                
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[1.2rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-white/10 before:to-transparent">
                  {[
                    { time: '1:00 PM', title: 'New AI Agent created', icon: Bot, color: 'text-emerald-400', bg: 'bg-emerald-400/20' },
                    { time: '12:15 PM', title: 'Automation executed successfully', icon: Zap, color: 'text-orange-400', bg: 'bg-orange-400/20' },
                    { time: '11:00 AM', title: 'Voice conversation completed', icon: Mic, color: 'text-sky-400', bg: 'bg-sky-400/20' },
                    { time: '10:10 AM', title: 'Meeting scheduled with Design Team', icon: CalendarDays, color: 'text-indigo-400', bg: 'bg-indigo-400/20' },
                    { time: '09:30 AM', title: 'AI summarized Project Proposal.pdf', icon: FileText, color: 'text-purple-400', bg: 'bg-purple-400/20' },
                  ].map((activity, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[var(--bg-panel)] bg-slate-800 text-[var(--text-muted)] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors group-hover:bg-slate-700">
                        <div className={`w-6 h-6 rounded-full ${activity.bg} flex items-center justify-center`}>
                          <activity.icon className={`h-3 w-3 ${activity.color}`} />
                        </div>
                      </div>
                      
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-white/[0.02] border border-white/5 group-hover:bg-white/[0.04] transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-white text-sm">{activity.title}</span>
                        </div>
                        <span className="text-xs text-[var(--text-muted)] font-mono">{activity.time}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.section>

          </div>
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
                  Hi Abhi! I'm here to help you navigate your workspace and automate tasks. What can I do for you?
                </div>
              </div>
              <div className="p-3 border-t border-white/5">
                <div className="flex items-center bg-black/20 rounded-xl px-3 py-2">
                  <input type="text" placeholder="Message assistant..." className="flex-1 bg-transparent text-sm text-white outline-none" />
                  <button className="text-[var(--accent-glow)]"><Send className="h-4 w-4" /></button>
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
