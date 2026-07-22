"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(false);
    }, 1500);

    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--bg-main)]">
      <div className="flex flex-col items-center justify-center gap-6">
        <Image 
          src="/logo-full.png" 
          alt="Nexus AI Loading" 
          width={240} 
          height={80} 
          className="object-contain animate-pulse shadow-lg rounded-xl"
          priority
        />
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-sky-400 to-violet-500 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-sky-400 to-violet-500 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-sky-400 to-violet-500 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
