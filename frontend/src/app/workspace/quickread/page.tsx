'use client';

import { useState } from 'react';
import Shell from '../../../components/Shell';
import CategoryBar from '../../../components/news/CategoryBar';
import NewsCard from '../../../components/news/NewsCard';
import { Newspaper, Search, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

// Mock Data for Premium Look
const mockNews = [
  {
    id: '1',
    category: 'Technology',
    headline: 'OpenAI Announces GPT-5 Architectures Integrating Real-time World Models',
    summary: 'OpenAI has revealed details about its upcoming GPT-5 architecture, moving beyond static text prediction to incorporate real-time, multi-modal world modeling. The new system processes live visual and audio streams simultaneously, allowing the AI to understand environmental context instantly. Early tests show a 400% increase in spatial reasoning accuracy.',
    publisher: 'TechCrunch',
    publishedTime: '10 mins ago',
    readTime: '3 min read',
    imageUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1200&auto=format&fit=crop',
    publisherLogo: 'TC'
  },
  {
    id: '2',
    category: 'Markets',
    headline: 'Nvidia Surpasses $4 Trillion Market Cap as AI Demand Surges Unabated',
    summary: 'Driven by unprecedented demand for its next-generation Blackwell GPUs, Nvidia has become the first company to cross the $4 trillion market capitalization threshold. Tech giants are expanding data centers at a record pace, securing Nvidia chips years in advance. Analysts predict sustained growth through 2027.',
    publisher: 'Bloomberg',
    publishedTime: '45 mins ago',
    readTime: '4 min read',
    imageUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1200&auto=format&fit=crop',
    publisherLogo: 'B'
  },
  {
    id: '3',
    category: 'Science',
    headline: 'NASA’s Artemis III Mission Uncovers Subsurface Water Ice Near Lunar South Pole',
    summary: 'Ground-penetrating radar from advanced lunar rovers has confirmed massive deposits of water ice just meters below the surface at the Moon\'s south pole. This discovery is a critical milestone for long-term lunar habitation, providing potential sources for drinking water, oxygen, and rocket fuel for future Mars missions.',
    publisher: 'Reuters',
    publishedTime: '2 hours ago',
    readTime: '2 min read',
    imageUrl: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=1200&auto=format&fit=crop',
    publisherLogo: 'R'
  }
];

export default function QuickReadPage() {
  const [activeCategory, setActiveCategory] = useState('For You');
  
  return (
    <Shell>
      <div className="flex flex-col h-full w-full">
        {/* Sticky Header */}
        <div className="sticky top-0 z-40 bg-[var(--bg-main)]/80 backdrop-blur-xl border-b border-[var(--border-color-strong)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
                <Newspaper className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-[var(--text-strong)] flex items-center gap-2">
                  QuickRead <Sparkles className="w-4 h-4 text-blue-400" />
                </h1>
                <p className="text-xs font-medium text-[var(--text-muted)]">AI-curated news in under 30 seconds</p>
              </div>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
              <input 
                type="text" 
                placeholder="Search topics, companies..." 
                className="w-full md:w-64 rounded-full border border-[var(--border-color-strong)] bg-[var(--bg-hover)] py-2 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>
          
          <CategoryBar activeCategory={activeCategory} onSelect={(cat) => setActiveCategory(cat)} />
        </div>

        {/* News Feed Container */}
        <div className="flex-1 overflow-y-auto bg-[var(--bg-panel)] p-4 lg:p-8 scrollbar-hide relative">
           
           <div className="max-w-3xl mx-auto space-y-8 pb-20">
             {mockNews.map((article, index) => (
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
                 key={article.id}
               >
                 <NewsCard article={article} />
               </motion.div>
             ))}
             
             <div className="text-center pt-8 pb-4">
               <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
               <p className="mt-2 text-xs font-medium text-[var(--text-muted)] tracking-wider uppercase">Loading more stories...</p>
             </div>
           </div>
           
        </div>
      </div>
    </Shell>
  );
}
