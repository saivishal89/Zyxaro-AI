import { ReactNode } from 'react';
import './GlassIcons.css';

type GlassIconColor = 'blue' | 'purple' | 'red' | 'green' | 'orange' | 'indigo' | 'cyan' | 'yellow';

type GlassIconItem = {
  icon: ReactNode;
  color?: GlassIconColor;
  label?: string;
  onClick?: () => void;
};

type GlassIconsProps = {
  items: GlassIconItem[];
  className?: string;
};

const COLOR_MAP: Record<GlassIconColor, { bg: string; glow: string; border: string }> = {
  blue:   { bg: 'rgba(59,130,246,0.18)',  glow: '0 0 16px rgba(59,130,246,0.4)',  border: 'rgba(59,130,246,0.35)' },
  purple: { bg: 'rgba(139,92,246,0.18)', glow: '0 0 16px rgba(139,92,246,0.4)', border: 'rgba(139,92,246,0.35)' },
  red:    { bg: 'rgba(239,68,68,0.18)',   glow: '0 0 16px rgba(239,68,68,0.4)',   border: 'rgba(239,68,68,0.35)' },
  green:  { bg: 'rgba(34,197,94,0.18)',   glow: '0 0 16px rgba(34,197,94,0.4)',   border: 'rgba(34,197,94,0.35)' },
  orange: { bg: 'rgba(249,115,22,0.18)',  glow: '0 0 16px rgba(249,115,22,0.4)',  border: 'rgba(249,115,22,0.35)' },
  indigo: { bg: 'rgba(99,102,241,0.18)',  glow: '0 0 16px rgba(99,102,241,0.4)',  border: 'rgba(99,102,241,0.35)' },
  cyan:   { bg: 'rgba(6,182,212,0.18)',   glow: '0 0 16px rgba(6,182,212,0.4)',   border: 'rgba(6,182,212,0.35)' },
  yellow: { bg: 'rgba(234,179,8,0.18)',   glow: '0 0 16px rgba(234,179,8,0.4)',   border: 'rgba(234,179,8,0.35)' },
};

export function GlassIcons({ items, className = '' }: GlassIconsProps) {
  return (
    <div className={`glass-icons-grid ${className}`}>
      {items.map((item, i) => {
        const c = COLOR_MAP[item.color ?? 'blue'];
        return (
          <button
            key={i}
            className="glass-icon-btn"
            onClick={item.onClick}
            style={{ '--gi-bg': c.bg, '--gi-glow': c.glow, '--gi-border': c.border } as React.CSSProperties}
          >
            <span className="glass-icon-inner">
              {item.icon}
            </span>
            {item.label && <span className="glass-icon-label">{item.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
