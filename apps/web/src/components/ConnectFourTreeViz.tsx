import type { SolverTrace, Solution } from '@ludus/core';
import { ConnectFourTraceViz } from '@ludus/games/src/connect-four/education-ui';

interface Props {
  trace?: SolverTrace;
  solution: Solution | null;
}

/** Lazy-loaded sidebar trace — uses shared GameCard styling from games package. */
export function ConnectFourTreeViz({ trace, solution }: Props) {
  return <ConnectFourTraceViz trace={trace} solution={solution} />;
}
