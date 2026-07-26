'use client';

import { useRef, useEffect, useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const categories = [
  'For You', 'World', 'Technology', 'Business', 'India', 'Artificial Intelligence', 
  'Markets', 'Science', 'Sports', 'Gaming', 'Entertainment'
];

interface CategoryBarProps {
  activeCategory: string;
  onSelect: (category: string) => void;
}

export default function CategoryBar({ activeCategory, onSelect }: CategoryBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftBlur, setShowLeftBlur] = useState(false);
  const [showRightBlur, setShowRightBlur] = useState(true);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftBlur(scrollLeft > 10);
    setShowRightBlur(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, []);

  const scrollBy = (amount: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative border-t border-[var(--border-color)] bg-[var(--bg-main)]/95">
      {/* Left Blur Indicator */}
      {showLeftBlur && (
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[var(--bg-main)] to-transparent z-10 pointer-events-none flex items-center">
           <button onClick={() => scrollBy(-200)} className="pointer-events-auto w-8 h-8 rounded-full bg-[var(--bg-hover)] shadow flex items-center justify-center ml-2 border border-[var(--border-color)] text-[var(--text-strong)] hover:scale-105 transition">
             <ChevronLeft className="w-4 h-4" />
           </button>
        </div>
      )}
      
      {/* Scrollable Area */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-3 px-4 lg:px-8 whitespace-nowrap scroll-smooth"
      >
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onSelect(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                isActive 
                  ? 'bg-[var(--text-strong)] text-[var(--bg-main)] shadow-md' 
                  : 'bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-strong)] hover:bg-[var(--border-color-strong)] border border-[var(--border-color)]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Right Blur Indicator */}
      {showRightBlur && (
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[var(--bg-main)] to-transparent z-10 pointer-events-none flex items-center justify-end">
           <button onClick={() => scrollBy(200)} className="pointer-events-auto w-8 h-8 rounded-full bg-[var(--bg-hover)] shadow flex items-center justify-center mr-2 border border-[var(--border-color)] text-[var(--text-strong)] hover:scale-105 transition">
             <ChevronRight className="w-4 h-4" />
           </button>
        </div>
      )}
    </div>
  );
}
