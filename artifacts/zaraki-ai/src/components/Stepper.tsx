import { Children, ReactNode, useState } from 'react';
import './Stepper.css';

type StepperProps = {
  children: ReactNode;
  initialStep?: number;
  onComplete?: () => void;
  backButtonText?: string;
  nextButtonText?: string;
  completeButtonText?: string;
  accentColor?: string;
};

export function Step({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function Stepper({
  children,
  initialStep = 0,
  onComplete,
  backButtonText = 'Back',
  nextButtonText = 'Next',
  completeButtonText = 'Finish',
  accentColor = '#3B82F6',
}: StepperProps) {
  const steps = Children.toArray(children);
  const [current, setCurrent] = useState(initialStep);
  const total = steps.length;

  const goBack = () => setCurrent(c => Math.max(0, c - 1));
  const goNext = () => {
    if (current < total - 1) {
      setCurrent(c => c + 1);
    } else {
      onComplete?.();
    }
  };

  return (
    <div className="stepper-root" style={{ '--stepper-accent': accentColor } as React.CSSProperties}>
      {/* Step indicators */}
      <div className="stepper-indicators">
        {steps.map((_, i) => (
          <div key={i} className="stepper-indicator-wrapper">
            <button
              className={`stepper-dot ${i === current ? 'active' : ''} ${i < current ? 'done' : ''}`}
              onClick={() => setCurrent(i)}
              style={i <= current ? { background: accentColor, borderColor: accentColor, boxShadow: `0 0 8px ${accentColor}88` } : undefined}
            >
              {i < current ? (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: i <= current ? '#fff' : '#475569' }}>{i + 1}</span>
              )}
            </button>
            {i < total - 1 && (
              <div className="stepper-connector">
                <div
                  className="stepper-connector-fill"
                  style={{ width: i < current ? '100%' : '0%', background: accentColor }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="stepper-content">
        <div className="stepper-step-content" key={current}>
          {steps[current]}
        </div>
      </div>

      {/* Navigation */}
      <div className="stepper-nav">
        <button
          className="stepper-btn stepper-btn-back"
          onClick={goBack}
          disabled={current === 0}
        >
          {backButtonText}
        </button>
        <div className="stepper-progress-text">
          {current + 1} / {total}
        </div>
        <button
          className="stepper-btn stepper-btn-next"
          onClick={goNext}
          style={{ background: accentColor, boxShadow: `0 0 12px ${accentColor}55` }}
        >
          {current === total - 1 ? completeButtonText : nextButtonText}
        </button>
      </div>
    </div>
  );
}
