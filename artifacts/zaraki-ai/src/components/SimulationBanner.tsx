import { useZyxaro } from '@/lib/context';

export function SimulationBanner() {
  const { activeProviders } = useZyxaro();
  
  // Show if no real provider is active
  const showBanner = activeProviders.length === 0 || (activeProviders.length === 1 && activeProviders[0] === 'simulation');

  if (!showBanner) return null;

  return (
    <div className="w-full bg-primary/20 border-b border-primary/40 text-primary py-2 px-4 text-center text-sm font-medium tracking-wide animate-pulse">
      ✦ SIMULATION MODE — configure a real provider in ⚙ Config to use live AI ✦
    </div>
  );
}
