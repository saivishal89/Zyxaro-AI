import { useState, useRef } from 'react';
import './LineSidebar.css';

type LineSidebarItem = {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
};

type LineSidebarProps = {
  items: LineSidebarItem[];
  activeIndex?: number;
  onSelect?: (index: number) => void;
  accentColor?: string;
  className?: string;
};

export function LineSidebar({
  items,
  activeIndex = 0,
  onSelect,
  accentColor = '#3B82F6',
  className = '',
}: LineSidebarProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  const highlight = hovered ?? activeIndex;

  return (
    <nav className={`line-sidebar ${className}`} style={{ '--ls-accent': accentColor } as React.CSSProperties}>
      <div
        className="line-sidebar-indicator"
        style={{
          transform: `translateY(${highlight * 44}px)`,
          background: accentColor,
          boxShadow: `0 0 10px ${accentColor}99`,
        }}
        ref={lineRef}
      />
      {items.map((item, i) => (
        <button
          key={i}
          className={`line-sidebar-item ${i === activeIndex ? 'active' : ''}`}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => { onSelect?.(i); item.onClick?.(); }}
          style={i === activeIndex || i === hovered ? { color: accentColor } : undefined}
        >
          {item.icon && <span className="line-sidebar-icon">{item.icon}</span>}
          <span className="line-sidebar-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
