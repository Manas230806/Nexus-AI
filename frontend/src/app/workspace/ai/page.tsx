'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Image as ImageIcon, Mic, StopCircle, RefreshCw, Paperclip, X, File as FileIcon } from 'lucide-react';
import Shell from '../../../components/Shell';
import Logo from '../../../components/Logo';
import { motion, AnimatePresence } from 'framer-motion';

type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
};

const suggestedPrompts = [
  "Summarize the recent chat about Q3 Roadmap",
  "Draft an email to the client about the alpha delay",
  "Brainstorm ideas for the new hero banner",
  "Extract action items from the design review"
];

export default function AIOxerviewPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = async (e?: React.FormEvent, customPrompt?: string) => {
    e?.preventDefault();
    const promptText = customPrompt || input;
    if (!promptText.trim() || isTyping) return;

    const newUserMsg: Message = { id: Date.now().toString(), role: 'user', content: promptText };
    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const formData = new FormData();
      formData.append('prompt', promptText);
      files.forEach(f => formData.append('files', f));
      
      const currentFiles = [...files]; // Save in case of error
      setFiles([]);

      const res = await fetch('/api/ai', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('API Error');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      
      const aiMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: aiMsgId, role: 'ai', content: '' }]);

      if (reader) {
        let aiContent = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          aiContent += decoder.decode(value, { stream: true });
          
          setMessages(prev => prev.map(msg => 
            msg.id === aiMsgId ? { ...msg, content: aiContent } : msg
          ));
        }
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: 'Connection error. Please try again later.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <Shell>
      <div className="h-full w-full p-6 lg:p-8 overflow-hidden">
        <div className="flex h-full flex-col overflow-hidden rounded-[32px] border border-[var(--border-color-strong)] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[var(--bg-main)] via-[var(--bg-panel)] to-[var(--bg-main)] shadow-2xl backdrop-blur-xl">
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center pt-10">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, type: 'spring' }}
                className="mb-8 flex h-32 w-32 items-center justify-center rounded-[40px] bg-gradient-to-br from-sky-400 via-[rgb(var(--accent-main))] to-purple-600 shadow-[0_0_80px_rgba(99,102,241,0.3)]"
              >
                <Logo showText={false} size={100} className="translate-y-3" />
              </motion.div>
              <h1 className="bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 bg-clip-text text-center text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
                How can I help you today?
              </h1>
              
              <div className="mt-12 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {suggestedPrompts.map((prompt, i) => (
                  <motion.button
                    key={prompt}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => handleSubmit(undefined, prompt)}
                    className="flex flex-col items-start rounded-2xl border border-[var(--border-color)] bg-[var(--bg-hover)] p-4 text-left transition hover:bg-[var(--bg-hover-strong)] hover:shadow-lg hover:border-sky-500/30"
                  >
                    <p className="text-sm font-medium text-[var(--text-main)] leading-snug">{prompt}</p>
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 pb-10">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex max-w-[85%] gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      {msg.role === 'ai' && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-violet-600 shadow-md">
                          <Logo showText={false} size={16} />
                        </div>
                      )}
                      <div className={`relative px-5 py-3.5 text-[15px] leading-relaxed shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-[var(--bg-hover)] text-[var(--text-strong)] rounded-3xl rounded-tr-sm' 
                          : 'bg-transparent text-[var(--text-main)]'
                      }`}>
                        {msg.content.split('\n').map((line, i) => (
                          <p key={i} className={line ? 'mb-2' : 'mb-0'}>{line}</p>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex w-full justify-start"
                  >
                    <div className="flex gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-violet-600 shadow-md">
                        <Logo showText={false} size={16} className="animate-pulse" />
                      </div>
                      <div className="flex items-center gap-1.5 px-4 py-3 text-[var(--text-muted)]">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-[var(--text-muted)]" style={{ animationDelay: '0ms' }} />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-[var(--text-muted)]" style={{ animationDelay: '150ms' }} />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-[var(--text-muted)]" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* AI Input Area */}
        <div className="mx-auto w-full max-w-4xl p-4 sm:p-6 flex flex-col gap-2">
          {/* File Attachment Chips */}
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 px-4">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 bg-[var(--bg-hover)] text-sm text-[var(--text-main)] py-1.5 px-3 rounded-full border border-[var(--border-color)]">
                  {f.type.startsWith('image/') ? <ImageIcon className="h-4 w-4 text-sky-400" /> : <FileIcon className="h-4 w-4 text-violet-400" />}
                  <span className="max-w-[120px] truncate">{f.name}</span>
                  <button onClick={() => removeFile(i)} className="hover:text-rose-400">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="relative flex items-end gap-2 rounded-3xl border border-[var(--border-color-strong)] bg-[var(--bg-panel)]/80 p-2 shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all focus-within:border-sky-500/50 focus-within:bg-[var(--bg-panel)]">
            <input 
              type="file" 
              multiple 
              className="hidden" 
              ref={fileInputRef} 
              onChange={(e) => {
                if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                e.target.value = '';
              }} 
            />
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)] hover:text-sky-300 transition"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              rows={1}
              className="max-h-[200px] min-h-[48px] w-full resize-none bg-transparent py-3.5 text-base text-[var(--text-strong)] placeholder-slate-500 outline-none scrollbar-hide"
              placeholder="Ask Nexus AI anything..."
            />
            <div className="flex shrink-0 items-center gap-2 px-2 pb-1">
              {isTyping ? (
                <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-hover-strong)] text-[var(--text-muted)] hover:text-rose-400 transition">
                  <StopCircle className="h-5 w-5" />
                </button>
              ) : (
                <button type="button" className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)] hover:text-emerald-300 transition">
                  <Mic className="h-5 w-5" />
                </button>
              )}
              <motion.button
                type="submit"
                disabled={!input.trim() || isTyping}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                  input.trim() 
                    ? 'bg-[rgb(var(--accent-main))] text-white shadow-lg' 
                    : 'bg-[var(--bg-hover)] text-[var(--text-muted)] cursor-not-allowed'
                }`}
              >
                <Send className="h-4 w-4" />
              </motion.button>
            </div>
          </form>
          <p className="mt-3 text-center text-xs text-[var(--text-muted)]">
            Nexus AI can make mistakes. Consider verifying important information.
          </p>
        </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
      `}} />
    </Shell>
  );
}
