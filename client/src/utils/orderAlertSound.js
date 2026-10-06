// Real-time Order Alert Audio & Voice Generator for Bếp Việt Admin
let audioCtx = null;
let alertInterval = null;

export function getAudioContext() {
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Unlock audio on first user click anywhere
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };
  window.addEventListener('click', unlockAudio);
  window.addEventListener('touchstart', unlockAudio);
}

/**
 * Plays an unmistakable pleasant, high-clarity restaurant chime
 */
export function playNewOrderChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const playBeep = (freq, startTime, duration, type = 'sine', peakGain = 0.25) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(peakGain, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    // Ascending bright celebratory restaurant chime: E5 -> G#5 -> B5 -> E6
    playBeep(659.25, now, 0.2, 'sine', 0.25);
    playBeep(830.61, now + 0.12, 0.2, 'sine', 0.25);
    playBeep(987.77, now + 0.24, 0.25, 'triangle', 0.3);
    playBeep(1318.51, now + 0.38, 0.45, 'sine', 0.35);
  } catch (e) {
    console.warn('Audio alert error:', e);
  }
}

/**
 * Speaks an automated announcement in Vietnamese using Web Speech API
 */
export function speakNewOrder(orderCode) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel(); // Stop any pending speech
      const codeEnd = orderCode ? orderCode.slice(-4) : '';
      const text = codeEnd
        ? `Bếp Việt có đơn hàng mới, đuôi số ${codeEnd}. Vui lòng kiểm tra!`
        : 'Bếp Việt có đơn hàng mới. Vui lòng nhận đơn!';
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 1.05;
      utterance.pitch = 1.1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
    }
  }
}

/**
 * Starts continuous alarm (chime + voice) until acknowledged
 */
export function startOrderAlarm(orderCode) {
  stopOrderAlarm();
  playNewOrderChime();
  setTimeout(() => speakNewOrder(orderCode), 400);

  alertInterval = setInterval(() => {
    playNewOrderChime();
  }, 4000);
}

/**
 * Stops continuous alarm
 */
export function stopOrderAlarm() {
  if (alertInterval) {
    clearInterval(alertInterval);
    alertInterval = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
}
