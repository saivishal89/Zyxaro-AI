import { FloatingLines } from '@/components/FloatingLines';
import { Header } from '@/components/Header';
import { SimulationBanner } from '@/components/SimulationBanner';
import { Sidebar } from '@/components/Sidebar';
import { ChatArea } from '@/components/ChatArea';
import { ConfigPanel } from '@/components/ConfigPanel';
import { RagDrawer } from '@/components/RagDrawer';
import { FaqModal } from '@/components/FaqModal';
import { PrivacyPolicyModal } from '@/components/PrivacyPolicyModal';
import { LeadershipModal } from '@/components/LeadershipModal';
import { CaseStudiesModal } from '@/components/CaseStudiesModal';
import { ApiKeyModal } from '@/components/ApiKeyModal';
import { StickyMobileCta } from '@/components/StickyMobileCta';

export default function Home() {
  return (
    <div className="relative w-full h-[100dvh] overflow-hidden flex flex-col text-foreground font-sans">
      {/* FloatingLines background — full-screen, behind all UI */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <FloatingLines
          enabledWaves={['top', 'middle', 'bottom']}
          lineCount={[8, 12, 16]}
          lineDistance={[8, 6, 4]}
          linesGradient={['#1e3a5f', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd']}
          bendRadius={5}
          bendStrength={-0.5}
          animationSpeed={0.6}
          interactive
          parallax
          mixBlendMode="screen"
        />
      </div>
      
      <Header />
      <SimulationBanner />
      
      <div className="flex-1 flex overflow-hidden pb-14 md:pb-0">
        <Sidebar />
        <ChatArea />
      </div>

      <ConfigPanel />
      <RagDrawer />
      <FaqModal />
      <PrivacyPolicyModal />
      <LeadershipModal />
      <CaseStudiesModal />
      <ApiKeyModal />
      <StickyMobileCta />
    </div>
  );
}
