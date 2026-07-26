import Image from 'next/image';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export default function Logo({ className = "", size = 32, showText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Light Mode Logo (using logo-dark.png as requested) */}
      <Image 
        src="/logo-dark.png" 
        alt="Nexus AI" 
        width={size} 
        height={size} 
        className="rounded-xl object-contain logo-light-mode" 
      />
      {/* Dark Mode Logo (Default, using logo-light.png as requested) */}
      <Image 
        src="/logo-light.png" 
        alt="Nexus AI" 
        width={size} 
        height={size} 
        className="rounded-xl object-contain logo-dark-mode" 
      />
      {showText && (
        <span className="text-lg font-bold text-[var(--text-strong)] tracking-tight">Nexus AI</span>
      )}
    </div>
  );
}
