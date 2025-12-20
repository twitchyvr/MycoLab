// ============================================================================
// TIMER SOUNDS UTILITY
// Synthesized audio tones for timer notifications using Web Audio API
// ============================================================================

import type { TimerSoundType } from '../store/types';

// Audio context singleton
let audioContext: AudioContext | null = null;

/**
 * Get or create the AudioContext
 * Must be called after user interaction due to browser autoplay policies
 */
function getAudioContext(): AudioContext | null {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Resume if suspended (happens after page load until user interaction)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    return audioContext;
  } catch {
    console.warn('Web Audio API not supported');
    return null;
  }
}

/**
 * Play a synthesized tone
 */
function playTone(
  frequency: number,
  duration: number,
  volume: number = 0.5,
  type: OscillatorType = 'sine',
  fadeOut: boolean = true
): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;

  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  if (fadeOut) {
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  }

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

/**
 * Play a sequence of tones
 */
function playSequence(
  notes: Array<{ freq: number; duration: number; delay: number }>,
  volume: number = 0.5,
  type: OscillatorType = 'sine'
): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  notes.forEach(({ freq, duration, delay }) => {
    setTimeout(() => {
      playTone(freq, duration, volume, type);
    }, delay * 1000);
  });
}

// ============================================================================
// SOUND DEFINITIONS
// ============================================================================

/**
 * Bell sound - classic timer bell (two high pings)
 */
function playBell(volume: number): void {
  playSequence([
    { freq: 880, duration: 0.3, delay: 0 },      // A5
    { freq: 880, duration: 0.3, delay: 0.4 },    // A5
    { freq: 1100, duration: 0.5, delay: 0.9 },   // C#6
  ], volume, 'sine');
}

/**
 * Chime sound - gentle ascending chime
 */
function playChime(volume: number): void {
  playSequence([
    { freq: 523, duration: 0.4, delay: 0 },      // C5
    { freq: 659, duration: 0.4, delay: 0.2 },    // E5
    { freq: 784, duration: 0.4, delay: 0.4 },    // G5
    { freq: 1047, duration: 0.6, delay: 0.6 },   // C6
  ], volume, 'sine');
}

/**
 * Ding sound - single clear ding
 */
function playDing(volume: number): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Create harmonics for a richer bell sound
  [1, 2.4, 5.6].forEach((harmonic, i) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = 800 * harmonic;

    const harmonicVolume = volume / (1 + i * 1.5);
    gainNode.gain.setValueAtTime(harmonicVolume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 1.5);
  });
}

/**
 * Gong sound - deep resonant gong
 */
function playGong(volume: number): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Deep tone with harmonics
  [1, 1.5, 2, 2.5, 3].forEach((harmonic, i) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = i === 0 ? 'sine' : 'triangle';
    oscillator.frequency.value = 150 * harmonic;

    const harmonicVolume = (volume * 0.8) / (1 + i);
    gainNode.gain.setValueAtTime(harmonicVolume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2.5);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 2.5);
  });
}

/**
 * Alert sound - urgent attention-grabbing beeps
 */
function playAlert(volume: number): void {
  playSequence([
    { freq: 880, duration: 0.15, delay: 0 },
    { freq: 880, duration: 0.15, delay: 0.2 },
    { freq: 880, duration: 0.15, delay: 0.4 },
    { freq: 1100, duration: 0.3, delay: 0.7 },
    { freq: 880, duration: 0.15, delay: 1.1 },
    { freq: 880, duration: 0.15, delay: 1.3 },
    { freq: 880, duration: 0.15, delay: 1.5 },
    { freq: 1100, duration: 0.3, delay: 1.8 },
  ], volume, 'square');
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Play the selected timer sound
 */
export function playTimerSound(soundType: TimerSoundType = 'bell', volume: number = 0.7): void {
  // Clamp volume between 0 and 1
  const safeVolume = Math.max(0, Math.min(1, volume));

  switch (soundType) {
    case 'bell':
      playBell(safeVolume);
      break;
    case 'chime':
      playChime(safeVolume);
      break;
    case 'ding':
      playDing(safeVolume);
      break;
    case 'gong':
      playGong(safeVolume);
      break;
    case 'alert':
      playAlert(safeVolume);
      break;
    case 'none':
      // No sound
      break;
    default:
      playBell(safeVolume);
  }
}

/**
 * Preview a sound (for settings UI)
 */
export function previewSound(soundType: TimerSoundType, volume: number = 0.7): void {
  playTimerSound(soundType, volume);
}

/**
 * Sound display names for UI
 */
export const timerSoundOptions: { value: TimerSoundType; label: string; description: string }[] = [
  { value: 'bell', label: 'Bell', description: 'Classic timer bell (ding-ding-ding)' },
  { value: 'chime', label: 'Chime', description: 'Gentle ascending chime' },
  { value: 'ding', label: 'Ding', description: 'Single clear bell ding' },
  { value: 'gong', label: 'Gong', description: 'Deep resonant gong' },
  { value: 'alert', label: 'Alert', description: 'Urgent attention beeps' },
  { value: 'none', label: 'None', description: 'Silent (browser notification only)' },
];
