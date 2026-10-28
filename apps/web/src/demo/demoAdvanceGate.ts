/** Pure gate for CHI Demo "Next" — keeps DemoPage thin and unit-testable. */

export type DemoBeatType = 'speak' | 'play' | 'hint' | 'solve' | 'reveal';

export interface DemoAdvanceGateInput {
  beatType: DemoBeatType;
  /** True on the final beat of the playlist (Next becomes "Finished"). */
  isLast: boolean;
  /** play: user moved at least once since the beat started, or skipped. */
  playSatisfied: boolean;
  /**
   * hint/solve: true after this beat's side effect was fired
   * (prevents a one-frame unlock before requestHint/requestSolve runs).
   */
  sideEffectArmed: boolean;
  solverStatus: 'idle' | 'running' | 'done';
  solvePlayback: boolean;
}

/**
 * Whether the primary Next control may advance.
 * - speak / reveal: always (until last)
 * - play: after one move or explicit skip
 * - hint: after hint request armed and solver leaves `running`
 * - solve: after solve request armed, solver idle/done, and board playback ended
 */
export function canAdvanceDemo(input: DemoAdvanceGateInput): boolean {
  if (input.isLast) return false;

  switch (input.beatType) {
    case 'speak':
    case 'reveal':
      return true;
    case 'play':
      return input.playSatisfied;
    case 'hint':
      return input.sideEffectArmed && input.solverStatus !== 'running';
    case 'solve':
      return (
        input.sideEffectArmed
        && input.solverStatus !== 'running'
        && !input.solvePlayback
      );
    default: {
      const _exhaustive: never = input.beatType;
      return _exhaustive;
    }
  }
}

/** Why Next is disabled — for a short status line under the controls. */
export function demoAdvanceBlockReason(
  input: DemoAdvanceGateInput,
): 'last' | 'play' | 'hint' | 'solve' | null {
  if (input.isLast) return 'last';
  if (canAdvanceDemo(input)) return null;
  switch (input.beatType) {
    case 'play':
      return 'play';
    case 'hint':
      return 'hint';
    case 'solve':
      return 'solve';
    default:
      return null;
  }
}
