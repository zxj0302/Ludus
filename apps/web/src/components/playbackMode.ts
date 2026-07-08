interface PlaybackMode {
  solvePlayback: boolean;
  adversarialPlayback: boolean;
}

export function shouldRunGenericPlayback(mode: PlaybackMode): boolean {
  return mode.solvePlayback && !mode.adversarialPlayback;
}
