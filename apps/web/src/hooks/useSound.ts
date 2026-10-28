import { useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume();
  }
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'square', volume = 0.1) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not available
  }
}

export function useSound() {
  // 从 store 读取音效开关状态
  const soundEnabled = useGameStore(s => s.soundEnabled);

  const playToggle = useCallback(() => {
    if (!soundEnabled) return;
    playTone(440, 0.08, 'square', 0.08);
  }, [soundEnabled]);

  const playWin = useCallback(() => {
    if (!soundEnabled) return;
    playTone(523, 0.12, 'square', 0.1);
    setTimeout(() => playTone(659, 0.12, 'square', 0.1), 100);
    setTimeout(() => playTone(784, 0.2, 'square', 0.12), 200);
  }, [soundEnabled]);

  const playSolve = useCallback(() => {
    if (!soundEnabled) return;
    playTone(330, 0.15, 'triangle', 0.08);
    setTimeout(() => playTone(440, 0.15, 'triangle', 0.08), 120);
  }, [soundEnabled]);

  const playError = useCallback(() => {
    if (!soundEnabled) return;
    playTone(200, 0.2, 'sawtooth', 0.06);
  }, [soundEnabled]);

  const playStep = useCallback(() => {
    if (!soundEnabled) return;
    playTone(600, 0.05, 'sine', 0.05);
  }, [soundEnabled]);

  const vibrate = useCallback((duration = 10) => {
    if (navigator.vibrate) {
      navigator.vibrate(duration);
    }
  }, []);

  return { playToggle, playWin, playSolve, playError, playStep, vibrate };
}
