'use client';
import { useEffect, useRef } from 'react';

export default function NeuralNetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: { x: number, y: number, vx: number, vy: number, radius: number }[] = [];
    const numParticles = 80;
    let mouse = { x: -1000, y: -1000 };
    
    const getThemeColor = () => {
      const isLight = document.documentElement.classList.contains('light');
      return isLight ? 'rgba(99, 102, 241, 0.15)' : 'rgba(165, 180, 252, 0.15)'; 
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const init = () => {
      resize();
      particles = [];
      for (let i = 0; i < numParticles; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: Math.random() * 1.5 + 0.5
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const isLight = document.documentElement.classList.contains('light');
      
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = getThemeColor();
        ctx.fill();

        for (let j = i + 1; j < numParticles; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            const opacity = (1 - dist / 150) * 0.5;
            ctx.strokeStyle = isLight ? `rgba(99, 102, 241, ${opacity})` : `rgba(165, 180, 252, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }

        // Mouse connection
        const dxMouse = p.x - mouse.x;
        const dyMouse = p.y - mouse.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        if (distMouse < 200) {
           ctx.beginPath();
           ctx.moveTo(p.x, p.y);
           ctx.lineTo(mouse.x, mouse.y);
           const opacity = (1 - distMouse / 200) * 0.8;
           ctx.strokeStyle = isLight ? `rgba(139, 92, 246, ${opacity})` : `rgba(167, 139, 250, ${opacity})`;
           ctx.lineWidth = 1;
           ctx.stroke();
           
           // Slight attraction
           p.x -= dxMouse * 0.01;
           p.y -= dyMouse * 0.01;
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse = { x: e.clientX, y: e.clientY };
    };
    
    const handleMouseLeave = () => {
      mouse = { x: -1000, y: -1000 };
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    
    init();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 w-full h-full pointer-events-none z-0 transition-opacity duration-1000"
    />
  );
}
