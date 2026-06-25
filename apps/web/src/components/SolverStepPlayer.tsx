import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import type { TraceStep } from '@ludus/core';

interface Props {
  steps: TraceStep[];
}

export function SolverStepPlayer({ steps }: Props) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const handlePlayPause = () => {
    setPlaying(p => !p);
  };

  const handleStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const step = steps[currentStep];
  if (!step) return null;

  return (
    <div className="knowledge-card">
      <h3 className="text-sm font-semibold text-logic-indigo-800 mb-3">
        {t('solver.stepCount', { current: currentStep + 1, total: steps.length })}
      </h3>

      {/* Step display */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-btn p-4 border border-logic-indigo-200 mb-3"
      >
        <p className="text-sm text-warm-stone-700">{step.description}</p>
        {step.data != null && (
          <pre className="mt-2 text-xs text-warm-stone-500 font-mono overflow-x-auto">
            {JSON.stringify(step.data, null, 2)}
          </pre>
        )}
      </motion.div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handlePlayPause}
          className="btn-primary text-xs"
        >
          {playing ? t('solver.pause') : t('solver.play')}
        </button>
        <button
          type="button"
          onClick={handleStep}
          disabled={currentStep >= steps.length - 1}
          className="btn-secondary text-xs"
        >
          {t('solver.step')}
        </button>

        {/* Progress bar */}
        <div className="flex-1 h-1.5 bg-warm-stone-200 rounded-full overflow-hidden ml-2">
          <motion.div
            className="h-full bg-logic-indigo-600 rounded-full"
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </div>
  );
}
