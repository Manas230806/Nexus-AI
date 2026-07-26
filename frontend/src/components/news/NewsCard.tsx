'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, Share2, Volume2, Sparkles, Languages, Save, ChevronDown, List, BookOpen, Fingerprint, Loader2, X } from 'lucide-react';

interface Article {
  id: string;
  category: string;
  headline: string;
  summary: string;
  publisher: string;
  publishedTime: string;
  readTime: string;
  imageUrl: string;
  publisherLogo: string;
  url?: string;
}

interface NewsCardProps {
  article: Article;
}

export default function NewsCard({ article }: NewsCardProps) {
  const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Load bookmark state
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('saved_articles') || '[]');
    if (saved.includes(article.id)) {
      setIsBookmarked(true);
    }
  }, [article.id]);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  const handleBookmark = () => {
    const saved = JSON.parse(localStorage.getItem('saved_articles') || '[]');
    if (isBookmarked) {
      const updated = saved.filter((id: string) => id !== article.id);
      localStorage.setItem('saved_articles', JSON.stringify(updated));
      setIsBookmarked(false);
    } else {
      saved.push(article.id);
      localStorage.setItem('saved_articles', JSON.stringify(saved));
      setIsBookmarked(true);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: article.headline,
      text: article.summary,
      url: article.url || window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(shareData.url);
      alert('Article link copied to clipboard!');
    }
  };

  const handleVoice = () => {
    if (!window.speechSynthesis) {
      alert('Your browser does not support text-to-speech.');
      return;
    }
    
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      // Clear any stuck speech
      window.speechSynthesis.cancel();
      
      const textToSpeak = `${article.headline}. ${article.summary}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (e) => {
        console.error('Speech synthesis error:', e);
        setIsSpeaking(false);
      };
      
      // Let the browser automatically use the default OS voice.
      // Fetching getVoices() synchronously on desktop Chrome often returns empty or breaks.
      
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleAskAi = async (actionType: string) => {
    setIsAiMenuOpen(false);
    setIsAiLoading(true);
    setAiResponse('');
    
    try {
      const res = await fetch('/api/news-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleText: `${article.headline}\n\n${article.summary}`,
          actionType
        })
      });
      
      if (!res.ok) throw new Error('Failed to fetch AI response');
      const data = await res.json();
      setAiResponse(data.text);
    } catch (error) {
      setAiResponse('Sorry, I encountered an error while analyzing this article.');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col rounded-[32px] border border-[var(--border-color-strong)] bg-[var(--bg-main)] shadow-xl transition-all duration-300 hover:shadow-blue-500/10">
      
      {/* Image Section */}
      <div className="relative h-64 sm:h-80 w-full overflow-hidden rounded-t-[32px] bg-slate-800">
        <img 
          src={article.imageUrl} 
          alt={article.headline}
          className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-main)] via-[var(--bg-main)]/20 to-transparent" />
        
        <div className="absolute top-4 left-4">
          <span className="rounded-full bg-black/40 backdrop-blur-md border border-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm">
            {article.category}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="relative -mt-12 flex flex-col p-6 sm:p-8">
        
        {/* Publisher Info */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--bg-panel)] shadow-md border border-[var(--border-color)]">
            <span className="text-sm font-black text-[var(--text-strong)]">{article.publisherLogo}</span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--text-strong)]">{article.publisher}</h4>
            <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
              <span>{article.publishedTime}</span>
              <span className="h-1 w-1 rounded-full bg-[var(--border-color-strong)]" />
              <span>{article.readTime}</span>
            </div>
          </div>
        </div>

        {/* Headline & Summary */}
        <h2 className="mb-4 text-2xl sm:text-3xl font-extrabold leading-tight text-[var(--text-strong)] tracking-tight">
          {article.headline}
        </h2>
        
        <div className="relative rounded-2xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 p-5 border border-blue-500/10 mb-6">
          <div className="absolute top-4 right-4 text-blue-500/30">
            <Sparkles className="h-8 w-8" />
          </div>
          <p className="relative z-10 text-base sm:text-lg leading-relaxed text-[var(--text-main)] font-medium">
            {article.summary}
          </p>
        </div>

        {/* Action Tray */}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border-color)] pt-6">
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleBookmark}
              className={`flex h-12 w-12 items-center justify-center rounded-full border transition-all ${
                isBookmarked 
                  ? 'border-blue-500 bg-blue-500/10 text-blue-500' 
                  : 'border-[var(--border-color-strong)] bg-[var(--bg-panel)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-strong)]'
              }`}
            >
              <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
            <button 
              onClick={handleShare}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border-color-strong)] bg-[var(--bg-panel)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-strong)] transition-all"
            >
              <Share2 className="h-5 w-5" />
            </button>
            <button 
              onClick={handleVoice}
              className={`flex h-12 w-12 items-center justify-center rounded-full border transition-all ${
                isSpeaking 
                  ? 'border-green-500 bg-green-500/10 text-green-500 animate-pulse' 
                  : 'border-[var(--border-color-strong)] bg-[var(--bg-panel)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-strong)]'
              }`}
            >
              <Volume2 className="h-5 w-5" />
            </button>
          </div>

          <div className="relative">
            <button 
              onClick={() => setIsAiMenuOpen(!isAiMenuOpen)}
              className="group flex h-12 items-center gap-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-6 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/40 hover:opacity-90"
            >
              <Sparkles className="h-4 w-4" />
              Ask AI
              <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isAiMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isAiMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full right-0 mb-3 w-56 rounded-2xl border border-[var(--border-color-strong)] bg-[var(--bg-panel)] p-2 shadow-2xl backdrop-blur-xl z-10"
                >
                  <div className="flex flex-col gap-1">
                    <button onClick={() => handleAskAi('takeaways')} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--text-main)] hover:bg-blue-500/10 hover:text-blue-500 transition-colors">
                      <List className="h-4 w-4" /> Key Takeaways
                    </button>
                    <button onClick={() => handleAskAi('eli5')} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--text-main)] hover:bg-purple-500/10 hover:text-purple-500 transition-colors">
                      <BookOpen className="h-4 w-4" /> Explain Like I'm 10
                    </button>
                    <button onClick={() => handleAskAi('bias')} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--text-main)] hover:bg-orange-500/10 hover:text-orange-500 transition-colors">
                      <Fingerprint className="h-4 w-4" /> Bias & Fact Check
                    </button>
                    <button onClick={() => handleAskAi('translate')} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--text-main)] hover:bg-green-500/10 hover:text-green-500 transition-colors">
                      <Languages className="h-4 w-4" /> Translate Summary
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
        </div>

        {/* AI Response Area */}
        <AnimatePresence>
          {(isAiLoading || aiResponse) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border border-indigo-500/20"
            >
              <div className="p-5 sm:p-6 relative">
                <button 
                  onClick={() => { setAiResponse(''); setIsAiLoading(false); }}
                  className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-black/10 transition-colors text-[var(--text-muted)]"
                >
                  <X className="h-4 w-4" />
                </button>
                <h4 className="flex items-center gap-2 font-bold text-indigo-400 mb-3">
                  <Sparkles className="h-4 w-4" /> Nexus AI Insight
                </h4>
                
                {isAiLoading ? (
                  <div className="flex items-center gap-3 text-[var(--text-muted)] py-2">
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                    <span className="text-sm font-medium animate-pulse">Analyzing article...</span>
                  </div>
                ) : (
                  <div className="prose prose-sm prose-invert max-w-none text-[var(--text-main)] leading-relaxed">
                    {/* Render newlines simply */}
                    {aiResponse.split('\n').map((line, i) => (
                      <span key={i}>
                        {line}
                        <br />
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
