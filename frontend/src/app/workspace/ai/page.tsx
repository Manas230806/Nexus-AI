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
  "Analyze the system architecture",
  "Optimize this neural network",
  "Generate a quantum physics summary",
  "Initiate deep space scan"
];

export default function AIOxerviewPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: 'Neural connection lost. Please attempt transmission again.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <Shell>
      <div className="relative h-[100dvh] md:h-full w-full overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-black text-white">
        
        {/* Animated Background Particles / Grid */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)] pointer-events-none"></div>

        {/* The Sentient Core (Background / Top Layer depending on state) */}
        <motion.div 
          initial={false}
          animate={{ 
            y: messages.length > 0 ? -150 : 0,
            scale: messages.length > 0 ? 0.4 : 1,
            opacity: messages.length > 0 ? 0.3 : 1
          }}
          transition={{ type: "spring", damping: 25, stiffness: 120 }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0 flex flex-col items-center justify-center pointer-events-none"
        >
          <motion.div 
            animate={{
              rotate: isTyping ? 360 : 0,
              scale: isTyping ? [1, 1.2, 1] : [1, 1.05, 1],
            }}
            transition={{
              rotate: { duration: 4, repeat: Infinity, ease: "linear" },
              scale: { duration: isTyping ? 1.5 : 5, repeat: Infinity, ease: "easeInOut" }
            }}
            className="relative flex h-64 w-64 items-center justify-center rounded-full bg-gradient-to-tr from-sky-400 via-indigo-500 to-purple-600 shadow-[0_0_120px_rgba(99,102,241,0.6)] blur-[2px]"
          >
            <div className="absolute inset-[3px] rounded-full bg-black/60 backdrop-blur-xl flex items-center justify-center overflow-hidden">
               {/* Inner Core Rings */}
               <motion.div 
                 animate={{ rotate: -360 }} 
                 transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                 className="absolute inset-0 border-[4px] border-dashed border-sky-400/30 rounded-full"
               />
               <Logo showText={false} size={80} className="opacity-90" />
            </div>
          </motion.div>

          <AnimatePresence>
            {messages.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mt-16 text-center"
              >
                <h1 className="text-5xl font-light tracking-widest text-white/90 uppercase mb-4 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                  Nexus <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-purple-500">Mind</span>
                </h1>
                <div className="flex items-center justify-center gap-3 text-sky-200/50 tracking-widest uppercase text-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                  </span>
                  Awaiting neural link
                </div>
                
                <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-4 pointer-events-auto">
                  {suggestedPrompts.map((prompt, i) => (
                    <motion.button
                      key={prompt}
                      whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(56,189,248,0.5)' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSubmit(undefined, prompt)}
                      className="px-6 py-4 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md text-sm font-medium text-slate-300 text-left transition-colors shadow-lg"
                    >
                      {prompt}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* 3D Glassmorphic Messages Layer */}
        <div className="absolute inset-0 z-10 flex flex-col pb-[120px] pt-32 px-4 sm:px-8 overflow-y-auto scrollbar-hide" ref={scrollContainerRef}>
          <div className="mx-auto w-full max-w-3xl flex flex-col gap-8">
            <AnimatePresence>
              {messages.map((msg, i) => (
                 <motion.div 
                   key={msg.id}
                   initial={{ opacity: 0, y: 60, scale: 0.9, rotateX: 20 }}
                   animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                   transition={{ type: "spring", damping: 25, stiffness: 200, mass: 0.8 }}
                   className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                   style={{ perspective: 1000 }}
                 >
                    {msg.role === 'user' ? (
                      <div className="max-w-[75%] rounded-[32px] rounded-tr-sm bg-gradient-to-br from-sky-500/10 to-indigo-600/10 backdrop-blur-xl border border-white/10 px-6 py-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                        <p className="text-[15px] leading-relaxed text-white/90">{msg.content}</p>
                      </div>
                    ) : (
                      <div className="max-w-[85%] rounded-[32px] rounded-tl-sm bg-black/50 backdrop-blur-2xl border border-white/5 px-6 py-5 shadow-[0_10px_50px_rgba(0,0,0,0.8)] relative overflow-hidden group">
                         {/* Subtle shine effect on AI messages */}
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[100%] group-hover:animate-[shimmer_2s_infinite]" />
                         
                         {msg.content.split('\n').map((line, idx) => (
                            <p key={idx} className={`text-[15px] leading-relaxed text-slate-300 ${line ? 'mb-3' : 'mb-0'}`}>
                              {line}
                            </p>
                         ))}
                      </div>
                    )}
                 </motion.div>
              ))}
              {isTyping && (
                 <motion.div
                   initial={{ opacity: 0, y: 30, scale: 0.9 }}
                   animate={{ opacity: 1, y: 0, scale: 1 }}
                   className="flex w-full justify-start"
                 >
                   <div className="max-w-[85%] rounded-[32px] rounded-tl-sm bg-black/50 backdrop-blur-2xl border border-white/5 px-6 py-5 shadow-[0_10px_50px_rgba(0,0,0,0.8)] flex items-center gap-3">
                     <Logo showText={false} size={20} className="animate-pulse opacity-50" />
                     <div className="flex gap-1.5">
                       <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-400" style={{ animationDelay: '0ms' }} />
                       <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: '150ms' }} />
                       <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-400" style={{ animationDelay: '300ms' }} />
                     </div>
                   </div>
                 </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} className="h-10 shrink-0" />
          </div>
        </div>

        {/* Floating Command Bar (HUD style) */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-4 pointer-events-none">
          <div className="pointer-events-auto">
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {files.map((f, i) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={i} 
                    className="flex items-center gap-2 bg-black/60 backdrop-blur-md text-xs text-slate-200 py-1.5 px-3 rounded-full border border-white/10"
                  >
                    {f.type.startsWith('image/') ? <ImageIcon className="h-3 w-3 text-sky-400" /> : <FileIcon className="h-3 w-3 text-purple-400" />}
                    <span className="max-w-[100px] truncate">{f.name}</span>
                    <button onClick={() => removeFile(i)} className="hover:text-rose-400 ml-1 transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="relative flex w-full items-end gap-2 rounded-full border border-white/10 bg-black/50 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl transition-all focus-within:border-sky-500/50 focus-within:bg-black/70 focus-within:shadow-[0_20px_80px_rgba(56,189,248,0.2)]">
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
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white/40 hover:bg-white/10 hover:text-sky-300 transition-all"
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
                className="max-h-[150px] min-h-[48px] w-full resize-none bg-transparent py-3.5 text-[15px] text-white placeholder-white/30 outline-none scrollbar-hide"
                placeholder="Transmit thought to Nexus..."
              />
              
              <div className="flex shrink-0 items-center gap-2 px-2 pb-1">
                {isTyping ? (
                  <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-rose-400 hover:bg-white/10 transition-all">
                    <StopCircle className="h-5 w-5" />
                  </button>
                ) : (
                  <button type="button" className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full text-white/40 hover:bg-white/10 hover:text-emerald-300 transition-all">
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
                      ? 'bg-gradient-to-r from-sky-400 to-indigo-500 text-white shadow-[0_0_20px_rgba(56,189,248,0.4)]' 
                      : 'bg-white/5 text-white/20 cursor-not-allowed'
                  }`}
                >
                  <Send className="h-4 w-4 translate-x-[1px] translate-y-[1px]" />
                </motion.button>
              </div>
            </form>
            <p className="mt-3 text-center text-[10px] font-medium tracking-wide text-white/30 uppercase">
              Neural Network Online • Nexus AI Core v2.0
            </p>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}} />
    </Shell>
  );
}
