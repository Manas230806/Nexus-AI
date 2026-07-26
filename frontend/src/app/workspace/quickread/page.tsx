'use client';

import { useState } from 'react';
import Shell from '@/components/Shell';
import CategoryBar from '@/components/news/CategoryBar';
import NewsCard from '@/components/news/NewsCard';
import { Newspaper, Search, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';

const queryClient = new QueryClient();

function NewsFeed({ activeCategory }: { activeCategory: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['news', activeCategory],
    queryFn: async () => {
      const res = await fetch(`/api/news?category=${encodeURIComponent(activeCategory)}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch news');
      }
      return res.json();
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center pt-20 pb-20 space-y-4">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <p className="text-sm font-medium text-[var(--text-muted)] animate-pulse tracking-wider uppercase">Fetching latest stories...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center pt-20 text-center">
        <div className="bg-red-500/10 p-4 rounded-full mb-4">
          <Newspaper className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-[var(--text-strong)] mb-2">Failed to load news</h3>
        <p className="text-sm text-[var(--text-muted)] max-w-md">
          {error instanceof Error ? error.message : 'An unknown error occurred. Please check your API key and connection.'}
        </p>
      </div>
    );
  }

  const articles = data?.articles || [];

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center pt-20 text-center">
        <div className="bg-[var(--bg-hover)] p-4 rounded-full mb-4">
          <Search className="h-8 w-8 text-[var(--text-muted)]" />
        </div>
        <h3 className="text-lg font-bold text-[var(--text-strong)] mb-2">No stories found</h3>
        <p className="text-sm text-[var(--text-muted)] max-w-md">
          We couldn't find any news for "{activeCategory}". Try exploring another topic.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      {articles.map((article: any, index: number) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(index * 0.1, 1), duration: 0.5, ease: "easeOut" }}
          key={article.id}
        >
          <NewsCard article={article} />
        </motion.div>
      ))}
    </div>
  );
}

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
           <QueryClientProvider client={queryClient}>
             <NewsFeed activeCategory={activeCategory} />
           </QueryClientProvider>
        </div>
      </div>
    </Shell>
  );
}
