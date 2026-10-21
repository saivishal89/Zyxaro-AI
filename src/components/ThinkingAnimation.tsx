import { FiZap } from 'react-icons/fi';

export function AtomicOrbitIcon({ size = 32 }: { size?: number }) {
  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
        <defs>
          <radialGradient id="nucleusGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#93c5fd" stopOpacity="1" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#1e40af" stopOpacity="0.2" />
          </radialGradient>

          <radialGradient id="electronAura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="1" />
            <stop offset="40%" stopColor="#3b82f6" stopOpacity="0.9" />
            <stop offset="85%" stopColor="#c084fc" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
          </radialGradient>

          <filter id="atomicGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Central Nucleus */}
        <circle cx="50" cy="50" r="12" fill="url(#nucleusGradient)" filter="url(#atomicGlow)" />
        <circle cx="50" cy="50" r="6" fill="#bfdbfe" />

        {/* Primary Tilted Ellipse Orbit (Horizontal 3D Tilt) */}
        <g transform="rotate(-25 50 50)">
          <ellipse
            cx="50"
            cy="50"
            rx="40"
            ry="18"
            fill="none"
            stroke="rgba(96, 165, 250, 0.45)"
            strokeWidth="1.75"
          />
          {/* Orbiting Glowing Electron 1 with Pink/Purple Aura (matching Image 2) */}
          <g className="animate-spin origin-[50px_50px]" style={{ animationDuration: '2.2s', animationTimingFunction: 'linear' }}>
            <circle cx="90" cy="50" r="10" fill="url(#electronAura)" filter="url(#atomicGlow)" />
            <circle cx="90" cy="50" r="4.5" fill="#ffffff" />
          </g>
        </g>

        {/* Secondary Intersecting Orbit */}
        <g transform="rotate(35 50 50)">
          <ellipse
            cx="50"
            cy="50"
            rx="40"
            ry="18"
            fill="none"
            stroke="rgba(147, 197, 253, 0.3)"
            strokeWidth="1.25"
            strokeDasharray="4 3"
          />
          {/* Orbiting Electron 2 */}
          <g className="animate-spin origin-[50px_50px]" style={{ animationDuration: '3.4s', animationDirection: 'reverse', animationTimingFunction: 'linear' }}>
            <circle cx="10" cy="50" r="4" fill="#38bdf8" filter="url(#atomicGlow)" />
          </g>
        </g>
      </svg>
    </div>
  );
}

export function ThinkingAnimation() {
  return (
    <div className="flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-slate-900/60 border border-blue-400/30 backdrop-blur-xl text-slate-200 text-xs font-mono w-max shadow-2xl shadow-blue-500/10 animate-fade-in relative overflow-hidden group my-2">
      {/* Background ambient subtle glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 opacity-70 animate-pulse pointer-events-none" />

      {/* 3D Atomic Orbit Icon matching Image 2 */}
      <AtomicOrbitIcon size={32} />

      {/* Text with animated dots */}
      <div className="flex items-center gap-2 relative z-10">
        <span className="font-bold text-blue-300 tracking-wider text-xs glow-text flex items-center gap-1">
          <FiZap className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          ZYXARO
        </span>
        <span className="text-slate-300 font-medium">Atomic Core Thinking</span>
        <div className="flex items-center gap-1 ml-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
