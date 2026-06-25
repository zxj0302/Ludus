import { useTranslation } from 'react-i18next';

interface Props {
  stepCount: number;
  isSolved: boolean;
  isSolving: boolean;
  optimalSteps: number | null;
  remainingSteps: number | null;
  elapsed: number;
  solvePlayback: boolean;
  solveStepIndex: number;
  totalSolveSteps: number;
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

export function GameStatusBar({
  stepCount, isSolved, isSolving, optimalSteps, remainingSteps,
  elapsed, solvePlayback, solveStepIndex, totalSolveSteps,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="bento-card p-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Stat label={t('game.status.stepsLabel')}>
            {isSolving ? '…'
              : solvePlayback
                ? t('game.status.playback', { current: solveStepIndex + 1, total: totalSolveSteps })
                : stepCount
            }
          </Stat>

          {optimalSteps != null && (
            <>
              <Divider />
              <Stat label={t('game.status.optimalLabel')}>
                <span className="text-clarity-teal-dark font-bold">{optimalSteps}</span>
              </Stat>
            </>
          )}

          {!isSolved && remainingSteps != null && (
            <>
              <Divider />
              <Stat label={t('game.status.remainingLabel')}>
                <span className="text-logic-indigo-700 font-bold">{remainingSteps}</span>
              </Stat>
            </>
          )}

          <Divider />
          <Stat label={t('game.status.timeLabel')}>
            <span className="font-mono tabular-nums">{formatTime(elapsed)}</span>
          </Stat>
        </div>

        <div className="flex items-center gap-2">
          {isSolving && <Badge color="indigo" pulse>{t('game.status.solving')}</Badge>}
          {isSolved && !solvePlayback && (
            <div className="flex items-center gap-2">
              <Badge color="teal">
                {optimalSteps != null
                  ? `${t('game.status.solved', { count: stepCount })} · ${t('game.status.optimal', { optimal: optimalSteps })}`
                  : t('game.status.solved', { count: stepCount })
                }
              </Badge>
              <span className="text-xs text-warm-stone-400 font-mono tabular-nums">
                {formatTime(elapsed)}
              </span>
            </div>
          )}
          {solvePlayback && <Badge color="amber">{t('game.status.demo')}</Badge>}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-medium text-warm-stone-400 uppercase tracking-wider">{label}</span>
      <span className="text-base font-bold text-warm-stone-800 tabular-nums">{children}</span>
    </div>
  );
}

function Divider() {
  return <div className="w-px h-6 bg-warm-stone-200" />;
}

function Badge({ children, color, pulse }: { children: React.ReactNode; color: 'indigo' | 'teal' | 'amber'; pulse?: boolean }) {
  const colors = {
    indigo: 'bg-logic-indigo-100 text-logic-indigo-700',
    teal: 'bg-clarity-teal-light text-clarity-teal-dark',
    amber: 'bg-game-amber-100 text-game-amber-700',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${colors[color]}`}>
      {pulse && <span className="w-2 h-2 rounded-full bg-logic-indigo-500 animate-pulse" />}
      {children}
    </span>
  );
}
