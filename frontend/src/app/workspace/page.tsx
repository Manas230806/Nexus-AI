'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Bot, Send } from 'lucide-react';
import Shell from '../../components/Shell';
import { useUser } from '../../hooks/useSupabase';
import NeuralNetworkBackground from '../../components/NeuralNetworkBackground';
import NexusCore from '../../components/NexusCore';

export default function WorkspacePage() {
  const { userProfile } = useUser();
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

      <div className="relative z-10 p-6 lg:p-10 h-[calc(100vh-100px)] overflow-y-auto scrollbar-hide flex items-center justify-center">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="w-full max-w-6xl mx-auto pb-20 md:pb-0"
        >
          {/* Nexus Core Centerpiece */}
          <motion.section variants={itemVariants} className="flex flex-col items-center justify-center">
            <NexusCore />
          </motion.section>
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
