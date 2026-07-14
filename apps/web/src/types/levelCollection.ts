/** Shared catalog collection shape for Sokoban / Peg Solitaire toolbars. */
export interface Collection<T = unknown> {
  name: string;
  label: string;
  /** Optional short label for the collapsed LevelSelector button. */
  shortLabel?: string;
  levels: T[];
}
