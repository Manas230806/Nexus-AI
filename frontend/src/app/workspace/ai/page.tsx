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
  attachments?: { name: string; url: string; type: string }[];
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
  const [isListening, setIsListening] = useState(false);
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

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      setInput(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    
    recognition.start();
  };

  const handleStop = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsTyping(false);
  };

  const handleSubmit = async (e?: React.FormEvent, customPrompt?: string) => {
    e?.preventDefault();
    const promptText = customPrompt || input;
    if (!promptText.trim() || isTyping) return;

    const currentFiles = [...files]; // Save files before clearing
    setFiles([]);

    const attachments = currentFiles.map(f => ({
      name: f.name,
      url: URL.createObjectURL(f),
      type: f.type
    }));

    const newUserMsg: Message = { id: Date.now().toString(), role: 'user', content: promptText, attachments };
    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setIsTyping(true);
    
    if (window.speechSynthesis) window.speechSynthesis.cancel(); // Stop any ongoing speech

    try {
      const formData = new FormData();
      formData.append('prompt', promptText);
      currentFiles.forEach(f => formData.append('files', f));

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
        
        if (window.speechSynthesis) {
           const utterance = new SpeechSynthesisUtterance(aiContent);
           window.speechSynthesis.speak(utterance);
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
      <div className="relative flex-1 flex flex-col h-full w-full overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-black text-white">
        
        {/* Animated Background Particles / Grid */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)] pointer-events-none"></div>

        {/* Clean Centered Header */}
        <div className="absolute top-0 left-0 right-0 z-0 flex flex-col items-center justify-start pt-16 sm:pt-24 pointer-events-none">
          <AnimatePresence>
            {messages.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="text-center w-full max-w-4xl mx-auto px-4"
              >
                <h1 className="text-4xl sm:text-6xl font-light tracking-widest text-white/90 uppercase mb-4 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                  Nexus <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-purple-500">Mind</span>
                </h1>
                <div className="flex items-center justify-center gap-3 text-sky-200/50 tracking-widest uppercase text-xs sm:text-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                  </span>
                  Awaiting neural link
                </div>
                
                <div className="mt-16 sm:mt-24 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pointer-events-auto max-w-2xl mx-auto">
                  {suggestedPrompts.map((prompt, i) => (
                    <motion.button
                      key={prompt}
                      whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(56,189,248,0.5)' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSubmit(undefined, prompt)}
                      className="px-6 py-4 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md text-sm font-medium text-slate-300 text-left transition-colors shadow-lg hover:shadow-sky-500/10"
                    >
                      {prompt}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3D Glassmorphic Messages Layer */}
        <div className="absolute inset-0 z-10 flex flex-col pb-[160px] sm:pb-[120px] pt-24 sm:pt-32 px-4 sm:px-8 overflow-y-auto scrollbar-hide" ref={scrollContainerRef}>
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
                      <div className="flex flex-col items-end gap-2 max-w-[85%] sm:max-w-[75%]">
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="flex flex-wrap justify-end gap-2 w-full">
                            {msg.attachments.map((att, idx) => (
                              <div key={idx} className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-1 shadow-lg group">
                                {att.type.startsWith('image/') ? (
                                  <img src={att.url} alt={att.name} className="h-24 w-auto max-w-[200px] object-cover rounded-xl cursor-pointer hover:scale-105 transition-transform" onClick={() => window.open(att.url, '_blank')} />
                                ) : (
                                  <div className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/5 rounded-xl transition-colors" onClick={() => window.open(att.url, '_blank')}>
                                    <FileIcon className="h-5 w-5 text-purple-400" />
                                    <span className="text-sm font-medium text-slate-200 max-w-[120px] truncate">{att.name}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="rounded-[32px] rounded-tr-sm bg-gradient-to-br from-sky-500/10 to-indigo-600/10 backdrop-blur-xl border border-white/10 px-5 sm:px-6 py-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                          <p className="text-[14px] sm:text-[15px] leading-relaxed text-white/90">{msg.content}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="max-w-[95%] sm:max-w-[85%] rounded-[32px] rounded-tl-sm bg-black/50 backdrop-blur-2xl border border-white/5 px-5 sm:px-6 py-4 sm:py-5 shadow-[0_10px_50px_rgba(0,0,0,0.8)] relative overflow-hidden group">
                         {/* Subtle shine effect on AI messages */}
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[100%] group-hover:animate-[shimmer_2s_infinite]" />
                         
                         {msg.content.split('\n').map((line, idx) => (
                            <p key={idx} className={`text-[14px] sm:text-[15px] leading-relaxed text-slate-300 ${line ? 'mb-3' : 'mb-0'}`}>
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
                   <div className="max-w-[95%] sm:max-w-[85%] rounded-[32px] rounded-tl-sm bg-black/50 backdrop-blur-2xl border border-white/5 px-5 sm:px-6 py-4 sm:py-5 shadow-[0_10px_50px_rgba(0,0,0,0.8)] flex items-center gap-3">
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
                  <button type="button" onClick={handleStop} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-rose-400 hover:bg-white/10 transition-all">
                    <StopCircle className="h-5 w-5" />
                  </button>
                ) : (
                  <button type="button" onClick={toggleListening} className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${isListening ? 'bg-emerald-500/20 text-emerald-400 animate-pulse' : 'text-white/40 hover:bg-white/10 hover:text-emerald-300'}`}>
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
