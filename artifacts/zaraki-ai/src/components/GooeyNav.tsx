import { useRef, useState, useEffect } from 'react';
import './GooeyNav.css';

type NavItem = {
  label: string;
  href?: string;
  onClick?: () => void;
};

type GooeyNavProps = {
  items: NavItem[];
  initialActiveIndex?: number;
  onSelect?: (index: number) => void;
  particleCount?: number;
  particleDistances?: [number, number];
  particleR?: number;
  animationTime?: number;
  timeVariance?: number;
  colors?: number[];
  className?: string;
};

export function GooeyNav({
  items,
  initialActiveIndex = 0,
  onSelect,
  particleCount = 15,
  particleDistances = [90, 10],
  particleR = 100,
  animationTime = 600,
  timeVariance = 300,
  colors = [1, 2, 3, 1, 2, 3, 1, 4],
  className = '',
}: GooeyNavProps) {
  const [active, setActive] = useState(initialActiveIndex);
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const isFirstRender = useRef(true);

  // Move indicator to active item
  useEffect(() => {
    const el = itemRefs.current[active];
    const container = containerRef.current;
    if (!el || !container) return;
    const elRect = el.getBoundingClientRect();
    const contRect = container.getBoundingClientRect();
    setIndicatorStyle({
      left: elRect.left - contRect.left,
      width: elRect.width,
    });
  }, [active, items]);

  // Resize canvas
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ro = new ResizeObserver(() => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    });
    ro.observe(container);
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    return () => ro.disconnect();
  }, []);

  // Particle system
  interface Particle {
    x: number; y: number; vx: number; vy: number;
    r: number; alpha: number; color: number;
    life: number; maxLife: number;
  }

  const burstParticles = (fromX: number, fromY: number, toX: number) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = particleDistances[0] * Math.random() + particleDistances[1];
      const life = animationTime + Math.random() * timeVariance;
      newParticles.push({
        x: (fromX + toX) / 2,
        y: fromY,
        vx: Math.cos(angle) * speed * 0.003,
        vy: Math.sin(angle) * speed * 0.003,
        r: Math.random() * particleR * 0.06 + 2,
        alpha: 0.8 + Math.random() * 0.2,
        color: colors[i % colors.length],
        life,
        maxLife: life,
      });
    }
    particlesRef.current.push(...newParticles);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const COLOR_MAP: Record<number, string> = {
      1: '#3B82F6',
      2: '#8B5CF6',
      3: '#06B6D4',
      4: '#F59E0B',
    };

    let lastTime = 0;
    const animate = (ts: number) => {
      const dt = ts - lastTime;
      lastTime = ts;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter(p => p.life > 0);
      for (const p of particlesRef.current) {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 0.00015 * dt; // gravity
        p.alpha = Math.max(0, (p.life / p.maxLife) * 0.8);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = COLOR_MAP[p.color] ?? '#3B82F6';
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  const handleSelect = (index: number) => {
    if (index === active) return;
    const fromEl = itemRefs.current[active];
    const toEl = itemRefs.current[index];
    const container = containerRef.current;
    if (fromEl && toEl && container) {
      const contRect = container.getBoundingClientRect();
      const fromRect = fromEl.getBoundingClientRect();
      const toRect = toEl.getBoundingClientRect();
      const fromCx = fromRect.left - contRect.left + fromRect.width / 2;
      const toCx = toRect.left - contRect.left + toRect.width / 2;
      const cy = fromRect.height / 2;
      burstParticles(fromCx, cy, toCx);
    }
    setActive(index);
    onSelect?.(index);
    items[index].onClick?.();
  };

  return (
    <div className={`gooey-nav ${className}`} ref={containerRef}>
      {/* SVG gooey filter */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="gooey-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix in="blur" mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9"
              result="gooey" />
          </filter>
        </defs>
      </svg>

      {/* Particle canvas (above everything) */}
      <canvas ref={canvasRef} className="gooey-nav-canvas" />

      {/* Gooey indicator layer */}
      <div className="gooey-nav-layer">
        <div
          className="gooey-nav-indicator"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
        />
      </div>

      {/* Items */}
      <div className="gooey-nav-items">
        {items.map((item, i) => (
          <button
            key={i}
            ref={el => { itemRefs.current[i] = el; }}
            className={`gooey-nav-item ${i === active ? 'active' : ''}`}
            onClick={() => handleSelect(i)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
