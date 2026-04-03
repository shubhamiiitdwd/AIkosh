import type { WizardStep } from '../types';

const STEPS = [
  { label: 'Select Dataset', icon: '📋' },
  { label: 'Configure Data', icon: '⚙️' },
  { label: 'Configuration', icon: '🔧' },
  { label: 'Training', icon: '▶️' },
  { label: 'Results', icon: '📊' },
];

interface Props {
  currentStep: WizardStep;
  onStepClick?: (step: WizardStep) => void;
  completedSteps?: number[];
}

export default function WizardStepper({ currentStep, onStepClick, completedSteps = [] }: Props) {
  return (
    <div className="aw-stepper">
      {STEPS.map((step, i) => {
        const isCompleted = completedSteps.includes(i);
        const isActive = i === currentStep;
        const isPending = i > currentStep && !isCompleted;

        let cls = 'aw-step';
        if (isCompleted) cls += ' aw-step--completed';
        else if (isActive) cls += ' aw-step--active';
        else if (isPending) cls += ' aw-step--pending';

        return (
          <div key={i} className="aw-step-wrapper">
            <div
              className={cls}
              onClick={() => {
                if ((isCompleted || i <= currentStep) && onStepClick) onStepClick(i as WizardStep);
              }}
            >
              <div className="aw-step-circle">
                {isCompleted ? '✓' : step.icon}
              </div>
              <span className="aw-step-label">{step.label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`aw-step-connector ${i < currentStep ? 'aw-step-connector--done' : ''}`} />}
          </div>
        );
      })}
    </div>
  );
}
