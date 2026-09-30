// Real-time Order Alert Audio Generator for Admin
let audioCtx = null;
let alertInterval = null;

function getAudioContext() {
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Plays an unmistakable pleasant, repeating chime for a new order
 */
export function playNewOrderChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const playBeep = (freq, startTime, duration, type = 'sine') => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    // Ascending celebratory double chime (C6 -> E6 -> G6)
    playBeep(1046.5, now, 0.15, 'sine');
    playBeep(1318.5, now + 0.12, 0.18, 'triangle');
    playBeep(1567.98, now + 0.25, 0.35, 'sine');
  } catch (e) {
    console.error('Audio alert error:', e);
  }
}

/**
 * Starts continuous alarm until stopped
 */
export function startOrderAlarm() {
  stopOrderAlarm();
  playNewOrderChime();
  alertInterval = setInterval(() => {
    playNewOrderChime();
  }, 3500);
}

/**
 * Stops continuous alarm
 */
export function stopOrderAlarm() {
  if (alertInterval) {
    clearInterval(alertInterval);
    alertInterval = null;
  }
}
