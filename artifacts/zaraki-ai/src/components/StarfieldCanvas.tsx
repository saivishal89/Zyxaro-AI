import { useEffect, useRef } from 'react';

export function StarfieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    const stars: { x: number; y: number; size: number; alpha: number; speed: number }[] = [];
    for (let i = 0; i < 280; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random(),
        speed: (Math.random() * 0.02 + 0.005) * (Math.random() > 0.5 ? 1 : -1)
      });
    }

    const nebulae = [
      { x: width * 0.2, y: height * 0.3, radius: 400, color: 'rgba(96, 165, 250, 0.03)', vx: 0.1, vy: 0.05 },
      { x: width * 0.8, y: height * 0.7, radius: 500, color: 'rgba(124, 58, 237, 0.03)', vx: -0.05, vy: -0.1 },
      { x: width * 0.5, y: height * 0.5, radius: 600, color: 'rgba(3, 8, 26, 0.05)', vx: 0.08, vy: -0.08 },
      { x: width * 0.1, y: height * 0.8, radius: 350, color: 'rgba(96, 165, 250, 0.02)', vx: 0.12, vy: -0.05 },
      { x: width * 0.9, y: height * 0.2, radius: 450, color: 'rgba(124, 58, 237, 0.02)', vx: -0.1, vy: 0.1 }
    ];

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw Nebulae
      nebulae.forEach(n => {
        n.x += n.vx;
        n.y += n.vy;
        
        if (n.x < -n.radius || n.x > width + n.radius) n.vx *= -1;
        if (n.y < -n.radius || n.y > height + n.radius) n.vy *= -1;

        const gradient = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius);
        gradient.addColorStop(0, n.color);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Stars
      stars.forEach(s => {
        s.alpha += s.speed;
        if (s.alpha > 1) {
          s.alpha = 1;
          s.speed *= -1;
        } else if (s.alpha < 0.3) {
          s.alpha = 0.3;
          s.speed *= -1;
        }

        ctx.fillStyle = `rgba(226, 232, 240, ${s.alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 w-full h-full -z-10 pointer-events-none"
    />
  );
}
