'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Mic, Video, Bot, Zap, Folder, BrainCircuit, Briefcase, MessageSquareText, Newspaper } from 'lucide-react';
import { useRouter } from 'next/navigation';

const thoughts = [
  "Ready to build something amazing?",
  "Continue yesterday's work?",
  "Your AI agents are standing by.",
  "Everything is synchronized.",
  "What shall we create today?"
];

const modules = [
  { id: 'chat', label: 'Chat', icon: MessageCircle, color: 'text-sky-400', bg: 'bg-sky-400/10' },
  { id: 'public_chat', label: 'Messages', icon: MessageSquareText, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  { id: 'meetings', label: 'Meetings', icon: Video, color: 'text-green-400', bg: 'bg-green-400/10' },
  { id: 'agents', label: 'Agents', icon: Bot, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { id: 'workspace', label: 'Workspace', icon: Briefcase, color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { id: 'quickread', label: 'QuickRead', icon: Newspaper, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { id: 'memory', label: 'Memory', icon: BrainCircuit, color: 'text-purple-400', bg: 'bg-purple-400/10' },
];

export default function NexusCore() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [warpingTo, setWarpingTo] = useState<string | null>(null);
  const [coreState, setCoreState] = useState<'idle' | 'thinking' | 'voice' | 'automation' | 'meeting' | 'error'>('idle');
  const [thoughtIndex, setThoughtIndex] = useState(0);
  const [idleColorIndex, setIdleColorIndex] = useState(0);
  const [radius, setRadius] = useState(160);
  const router = useRouter();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setRadius(120);
      else if (window.innerWidth < 1024) setRadius(140);
      else setRadius(160);
    };
    handleResize(); // Set initial radius
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setThoughtIndex((prev) => (prev + 1) % thoughts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIdleColorIndex((prev) => (prev + 1) % 5);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const getCoreGlow = () => {
    switch (coreState) {
      case 'thinking': return 'shadow-[0_0_60px_rgba(168,85,247,0.6)] border-purple-500/50 bg-purple-500/10'; // Purple
      case 'voice': return 'shadow-[0_0_60px_rgba(56,189,248,0.6)] border-sky-500/50 bg-sky-500/10'; // Blue
      case 'automation': return 'shadow-[0_0_60px_rgba(249,115,22,0.6)] border-orange-500/50 bg-orange-500/10'; // Orange
      case 'meeting': return 'shadow-[0_0_60px_rgba(74,222,128,0.6)] border-green-500/50 bg-green-500/10'; // Green
      case 'error': return 'shadow-[0_0_60px_rgba(239,68,68,0.6)] border-red-500/50 bg-red-500/10'; // Red
      // For idle, we check if it's light mode for appropriate shadow.
      default:
        const idleColors = [
          'shadow-[0_0_70px_rgba(249,115,22,0.4)] border-orange-500/40 bg-orange-500/10 dark:shadow-[0_0_60px_rgba(249,115,22,0.35)] dark:border-orange-500/40 dark:bg-[var(--bg-hover)]', // orange
          'shadow-[0_0_70px_rgba(168,85,247,0.4)] border-purple-500/40 bg-purple-500/10 dark:shadow-[0_0_60px_rgba(168,85,247,0.35)] dark:border-purple-500/40 dark:bg-[var(--bg-hover)]', // purple
          'shadow-[0_0_70px_rgba(74,222,128,0.4)] border-green-500/40 bg-green-500/10 dark:shadow-[0_0_60px_rgba(74,222,128,0.35)] dark:border-green-500/40 dark:bg-[var(--bg-hover)]', // green
          'shadow-[0_0_70px_rgba(34,211,238,0.4)] border-cyan-500/40 bg-cyan-500/10 dark:shadow-[0_0_60px_rgba(34,211,238,0.35)] dark:border-cyan-500/40 dark:bg-[var(--bg-hover)]', // cyan
          'shadow-[0_0_70px_rgba(59,130,246,0.4)] border-blue-500/40 bg-blue-500/10 dark:shadow-[0_0_60px_rgba(59,130,246,0.35)] dark:border-blue-500/40 dark:bg-[var(--bg-hover)]' // blue
        ];
        return idleColors[idleColorIndex];
    }
  };

  const handleModuleClick = (id: string) => {
    if (warpingTo) return; // Prevent multiple clicks
    setWarpingTo(id);
    
    if (id === 'public_chat') setCoreState('voice');
    else if (id === 'workspace') setCoreState('automation');
    else if (id === 'meetings') setCoreState('meeting');
    else if (id === 'agents') setCoreState('thinking');
    else if (id === 'quickread') setCoreState('automation');
    else setCoreState('idle');

    setTimeout(() => {
      if (id === 'public_chat') router.push('/workspace/chat');
      else if (id === 'workspace') router.push('/workspace/files');
      else if (id === 'meetings') router.push('/workspace/calendar?tab=meetings');
      else if (id === 'agents') router.push('/workspace/ai');
      else if (id === 'chat') router.push('/workspace/dm');
      else if (id === 'memory') router.push('/workspace/memory');
      else if (id === 'quickread') router.push('/workspace/quickread');
    }, 500);
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[400px] md:min-h-[500px] w-full">
      {/* Orbiting Modules */}
      <AnimatePresence>
        {isExpanded && modules.map((mod, index) => {
          const angle = (index * (360 / modules.length) - 90) * (Math.PI / 180);
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
              animate={
                warpingTo === mod.id 
                  ? { opacity: 0, scale: 15, x: 0, y: 0, zIndex: 50 } 
                  : warpingTo 
                    ? { opacity: 0, scale: 0, x: 0, y: 0 } 
                    : { opacity: 1, x, y, scale: 1 }
              }
              exit={{ opacity: 0, x: 0, y: 0, scale: 0 }}
              transition={warpingTo ? { duration: 0.6, ease: [0.22, 1, 0.36, 1] } : { type: "spring", stiffness: 300, damping: 25, delay: index * 0.04 }}
              className="absolute z-20 flex flex-col items-center cursor-pointer group will-change-transform"
              onClick={(e) => {
                e.stopPropagation();
                handleModuleClick(mod.id);
              }}
            >
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center backdrop-blur-md border border-[var(--border-color-strong)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] bg-[var(--bg-panel)]`}>
                <mod.icon className={`w-5 h-5 md:w-6 md:h-6 ${mod.color}`} />
              </div>
              <span className="absolute top-14 md:top-16 text-[10px] md:text-xs font-semibold text-[var(--text-strong)] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {mod.label}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* The Core */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={warpingTo ? { scale: 0, opacity: 0 } : {
          scale: coreState === 'idle' ? [1, 1.03, 1] :
            coreState === 'thinking' ? [1, 1.08, 1, 1.04, 1] : 1,
        }}
        transition={warpingTo ? { duration: 0.5, ease: [0.22, 1, 0.36, 1] } : {
          duration: coreState === 'idle' ? 4 : 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        onClick={() => setIsExpanded(!isExpanded)}
        className={`relative z-30 flex items-center justify-center w-36 h-36 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-full cursor-pointer backdrop-blur-3xl border transition-all duration-300 will-change-transform ${getCoreGlow()}`}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent pointer-events-none mix-blend-overlay" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-tl from-black/20 to-transparent pointer-events-none mix-blend-overlay" />

        {/* Inner glow effect */}
        <div className="absolute inset-4 rounded-full blur-xl bg-gradient-to-r from-indigo-600/10 to-purple-600/10 dark:from-white/5 dark:to-transparent pointer-events-none transition-all duration-700" />

        <div className="flex flex-col items-center text-center relative z-10">
          <span className="text-xl md:text-2xl font-bold tracking-widest text-[var(--text-strong)] font-mono">
            NEXUS
          </span>
          <span className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)] mt-1">
            Core
          </span>
        </div>
      </motion.div>

      {/* Contextual Thoughts */}
      <div className="absolute -bottom-16 w-full text-center h-8 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {!isExpanded && (
            <motion.p
              key={thoughtIndex}
              initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
              transition={{ duration: 0.8 }}
              className="text-sm text-indigo-900/80 dark:text-[var(--text-muted)] font-semibold dark:font-medium tracking-wide"
            >
              {thoughts[thoughtIndex]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
