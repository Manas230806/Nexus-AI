'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Briefcase, Users, ArrowRight, Bot, Send } from 'lucide-react';
import Shell from '../../components/Shell';
import { useUser } from '../../hooks/useSupabase';
import { useWorkspace } from '../../hooks/useWorkspace';
import NeuralNetworkBackground from '../../components/NeuralNetworkBackground';
import NexusCore from '../../components/NexusCore';

export default function WorkspacePage() {
  const { userProfile } = useUser();
  const { groups, projects, loading } = useWorkspace();
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <Shell>
      <NeuralNetworkBackground />

      <div className="relative z-10 p-6 lg:p-10 h-full overflow-y-auto scrollbar-hide">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="max-w-6xl mx-auto space-y-16 pb-24"
        >
          {/* Nexus Core Centerpiece */}
          <motion.section variants={itemVariants} className="flex flex-col items-center justify-center pt-12 md:pt-20">
            <NexusCore />
          </motion.section>

          {/* Bottom Grid: Intelligence & Timeline */}
          {loading ? (
            <motion.div variants={itemVariants} className="text-center text-[var(--text-muted)] py-10">
              Loading workspace data...
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* System Intelligence */}
              <motion.section variants={itemVariants} className="lg:col-span-2">
                <div className="bg-[var(--bg-panel)] border border-[var(--border-color-strong)] rounded-[24px] p-6 md:p-8 backdrop-blur-md h-full">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-[var(--text-strong)] flex items-center gap-3">
                      <Sparkles className="h-6 w-6 text-purple-400" />
                      System Intelligence
                    </h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--bg-hover)] border border-[var(--border-color)] hover:bg-[var(--bg-hover-strong)] transition-colors cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-xl bg-sky-400/10 flex items-center justify-center text-sky-400">
                        <Briefcase className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-[var(--text-muted)] mb-1">Active Projects</p>
                        <p className="text-lg font-semibold text-[var(--text-strong)]">{projects.length} Total</p>
                      </div>
                      <div className="w-8 h-8 rounded-full border border-[var(--border-color-strong)] flex items-center justify-center">
                        <ArrowRight className="h-4 w-4 text-[var(--text-muted)]" />
                      </div>
                    </motion.div>

                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--bg-hover)] border border-[var(--border-color)] hover:bg-[var(--bg-hover-strong)] transition-colors cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-xl bg-emerald-400/10 flex items-center justify-center text-emerald-400">
                        <Users className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-[var(--text-muted)] mb-1">Your Groups</p>
                        <p className="text-lg font-semibold text-[var(--text-strong)]">{groups.length} Total</p>
                      </div>
                      <div className="w-8 h-8 rounded-full border border-[var(--border-color-strong)] flex items-center justify-center">
                        <ArrowRight className="h-4 w-4 text-[var(--text-muted)]" />
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.section>

              {/* Recent Activity Timeline */}
              <motion.section variants={itemVariants} className="lg:col-span-1">
                <div className="bg-[var(--bg-panel)] border border-[var(--border-color-strong)] rounded-[24px] p-6 md:p-8 backdrop-blur-md h-full">
                  <h2 className="text-xl font-bold text-[var(--text-strong)] mb-6">Recent Activity</h2>
                  
                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[1.2rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[var(--border-color-strong)] before:to-transparent">
                    {projects.slice(0, 3).map((project, i) => (
                      <motion.div 
                        key={`proj-${project._id || i}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[var(--bg-panel)] bg-[var(--bg-active)] text-[var(--text-muted)] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors group-hover:bg-[var(--bg-hover-strong)]">
                          <div className={`w-6 h-6 rounded-full bg-sky-400/20 flex items-center justify-center`}>
                            <Briefcase className="h-3 w-3 text-sky-400" />
                          </div>
                        </div>
                        
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-[var(--bg-hover)] border border-[var(--border-color)] group-hover:bg-[var(--bg-hover-strong)] transition-colors">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-[var(--text-strong)] text-sm truncate block">{project.name}</span>
                          </div>
                          <span className="text-xs text-[var(--text-muted)] font-mono">Project</span>
                        </div>
                      </motion.div>
                    ))}
                    {groups.slice(0, 2).map((group, i) => (
                      <motion.div 
                        key={`grp-${group._id || i}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + (projects.length + i) * 0.1 }}
                        className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[var(--bg-panel)] bg-[var(--bg-active)] text-[var(--text-muted)] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors group-hover:bg-[var(--bg-hover-strong)]">
                          <div className={`w-6 h-6 rounded-full bg-emerald-400/20 flex items-center justify-center`}>
                            <Users className="h-3 w-3 text-emerald-400" />
                          </div>
                        </div>
                        
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-[var(--bg-hover)] border border-[var(--border-color)] group-hover:bg-[var(--bg-hover-strong)] transition-colors">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-[var(--text-strong)] text-sm truncate block">{group.name}</span>
                          </div>
                          <span className="text-xs text-[var(--text-muted)] font-mono">Group</span>
                        </div>
                      </motion.div>
                    ))}
                    {projects.length === 0 && groups.length === 0 && (
                      <div className="text-[var(--text-muted)] text-sm ml-8 md:ml-0 md:text-center mt-4">
                        No recent activity yet.
                      </div>
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
              <div className="p-4 border-b border-[var(--border-color)] bg-gradient-to-r from-indigo-500/10 to-purple-500/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-[var(--text-strong)]" />
                  </div>
                  <span className="font-bold text-[var(--text-strong)]">Nexus Assistant</span>
                </div>
              </div>
              <div className="p-4 h-64 overflow-y-auto flex flex-col gap-4">
                <div className="bg-[var(--bg-hover)] rounded-2xl rounded-tl-sm p-3 text-sm text-[var(--text-main)] w-[85%]">
                  Hi {userProfile?.name?.split(' ')[0] || 'there'}! I'm here to help you navigate your workspace and automate tasks. What can I do for you?
                </div>
              </div>
              <div className="p-3 border-t border-[var(--border-color)]">
                <div className="flex items-center bg-[var(--bg-hover-strong)] rounded-xl px-3 py-2">
                  <input type="text" placeholder="Message assistant..." className="flex-1 bg-transparent text-sm text-[var(--text-strong)] outline-none" />
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
