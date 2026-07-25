'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Bot, Send } from 'lucide-react';
import Shell from '../../components/Shell';
import { useUser } from '../../hooks/useSupabase';
import NeuralNetworkBackground from '../../components/NeuralNetworkBackground';
import NexusCore from '../../components/NexusCore';

export default function WorkspacePage() {
  const { userProfile } = useUser();
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAssistantOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('prompt', userMessage);
      
      const response = await fetch('/api/ai', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          assistantMessage += chunk;
          
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].content = assistantMessage;
            return newMessages;
          });
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

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
              <div className="p-4 h-64 overflow-y-auto flex flex-col gap-4 scrollbar-hide">
                <div className="bg-[var(--bg-hover)] rounded-2xl rounded-tl-sm p-3 text-sm text-[var(--text-main)] w-[85%]">
                  Hi {userProfile?.name?.split(' ')[0] || 'there'}! I'm here to help you navigate your workspace and automate tasks. What can I do for you?
                </div>
                {messages.map((msg, idx) => (
                  <div key={idx} className={`rounded-2xl p-3 text-sm max-w-[85%] break-words whitespace-pre-wrap ${msg.role === 'user' ? 'bg-indigo-500/20 text-indigo-400 dark:text-indigo-100 rounded-tr-sm self-end' : 'bg-[var(--bg-hover)] text-[var(--text-main)] rounded-tl-sm self-start'}`}>
                    {msg.content}
                  </div>
                ))}
                {isLoading && (
                  <div className="bg-[var(--bg-hover)] rounded-2xl rounded-tl-sm p-3 text-sm text-[var(--text-muted)] w-[85%] flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-3 border-t border-[var(--border-color)]">
                <div className="flex items-center bg-[var(--bg-hover-strong)] rounded-xl px-3 py-2">
                  <input 
                    type="text" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Message assistant..." 
                    className="flex-1 bg-transparent text-sm text-[var(--text-strong)] outline-none" 
                  />
                  <button onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()} className="text-purple-400 disabled:opacity-50"><Send className="h-4 w-4" /></button>
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
