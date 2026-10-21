import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  Cpu,
  Database,
  Zap,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '../lib/auth-context'

interface TourStep {
  title: string
  subtitle: string
  description: string
  icon: React.ReactNode
  accentColor: string
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Welcome to Zaraki AI',
    subtitle: 'Unified Multi-Model Intelligence Terminal',
    description:
      'Zaraki AI orchestrates OpenAI, Anthropic, Gemini, Groq, Mistral, and local Ollama nodes into a synchronized spatial workspace.',
    icon: <Sparkles className="w-7 h-7 text-cyan-400" />,
    accentColor: 'from-blue-600 to-cyan-500',
  },
  {
    title: 'Multi-Model Matrix',
    subtitle: 'Simultaneous Routing & Consensus',
    description:
      'Activate multiple providers simultaneously to cross-validate reasoning, benchmark latency, and synthesize unified code outputs in real time.',
    icon: <Cpu className="w-7 h-7 text-purple-400" />,
    accentColor: 'from-purple-600 to-indigo-500',
  },
  {
    title: 'Grounded RAG Vault',
    subtitle: 'Vector Document Retrieval',
    description:
      'Upload markdown, source code, research PDFs, and architectural specs into your private vector vault. AI prompts automatically ground against your files.',
    icon: <Database className="w-7 h-7 text-emerald-400" />,
    accentColor: 'from-emerald-600 to-teal-500',
  },
  {
    title: 'High-Velocity Execution',
    subtitle: 'Sub-500ms Guarantee & Offline Fallback',
    description:
      'Equipped with instant keyboard shortcuts, self-custody data export, and complete offline capability via local state persistence.',
    icon: <Zap className="w-7 h-7 text-amber-400" />,
    accentColor: 'from-amber-600 to-orange-500',
  },
]

export function OnboardingTour() {
  const { user, profile, setOnboardingCompleted } = useAuth()
  const [isVisible, setIsVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    // Check if onboarding is needed
    const localFlag = localStorage.getItem('zrk_onboarding_completed') === 'true'
    const profileFlag = profile?.onboarding_completed === true

    if (!localFlag && !profileFlag) {
      // Delay slightly for smooth entrance
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 1200)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [profile])

  if (!isVisible) return null

  const handleComplete = async () => {
    setIsVisible(false)
    localStorage.setItem('zrk_onboarding_completed', 'true')
    try {
      await setOnboardingCompleted()
    } catch {
      // ignore
    }
  }

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const step = TOUR_STEPS[currentStep]

  return (
    <div
      id="onboarding-tour-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
    >
      <div
        id="onboarding-tour-card"
        className="relative w-full max-w-lg bg-[#070D21]/95 border border-cyan-500/30 rounded-2xl p-6 sm:p-8 shadow-[0_0_60px_rgba(34,211,238,0.2)] text-zinc-200 overflow-hidden"
      >
        {/* Glow corners */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close / Skip button */}
        <button
          id="onboarding-skip-btn"
          onClick={handleComplete}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-1 text-xs font-mono"
          aria-label="Skip Tour"
        >
          <span className="hidden sm:inline">Skip</span>
          <X className="w-4 h-4" />
        </button>

        {/* Tour Progress Bar */}
        <div className="flex gap-1.5 mb-6">
          {TOUR_STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                idx <= currentStep ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'bg-zinc-800'
              }`}
            />
          ))}
        </div>

        {/* Step Icon */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center shadow-lg shrink-0">
            {step.icon}
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-400">
              Step {currentStep + 1} of {TOUR_STEPS.length}
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">{step.title}</h2>
          </div>
        </div>

        {/* Subtitle & Description */}
        <div className="space-y-2 mb-8">
          <h3 className="text-xs font-mono font-medium text-zinc-300 uppercase tracking-wide">
            {step.subtitle}
          </h3>
          <p className="text-sm text-zinc-400 leading-relaxed">{step.description}</p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800/80">
          <button
            id="onboarding-prev-btn"
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`px-3 py-2 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
              currentStep === 0
                ? 'opacity-0 pointer-events-none'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Previous
          </button>

          <button
            id="onboarding-next-btn"
            onClick={handleNext}
            className={`px-5 py-2.5 rounded-xl text-xs font-mono font-semibold uppercase tracking-wider bg-gradient-to-r ${step.accentColor} text-white hover:brightness-110 shadow-lg transition-all flex items-center gap-2 cursor-pointer`}
          >
            {currentStep === TOUR_STEPS.length - 1 ? (
              <>
                <span>Get Started</span>
                <CheckCircle2 className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
