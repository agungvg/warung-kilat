// Procedural sound only: every effect is synthesised with WebAudio, no audio files.
// The context starts on the first user gesture, so the page stays silent until play.
let context = null;
let sizzleNodes = null;

function ensureContext() {
  if (context) {
    if (context.state === 'suspended') void context.resume();
    return context;
  }
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  context = new AudioContextClass();
  return context;
}

function tone(freq, seconds, type, gainValue, delay = 0) {
  const ctx = ensureContext();
  if (!ctx) return;
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(gainValue, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + seconds + 0.05);
}

function noiseBurst(seconds, filterFreq, gainValue) {
  const ctx = ensureContext();
  if (!ctx) return;
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  const gain = ctx.createGain();
  gain.gain.value = gainValue;
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start();
}

export const sfx = {
  unlock() {
    ensureContext();
  },
  pop() {
    tone(520, 0.08, 'sine', 0.15);
    tone(780, 0.06, 'sine', 0.1, 0.04);
  },
  chop() {
    noiseBurst(0.07, 1800, 0.25);
    tone(180, 0.06, 'triangle', 0.2);
  },
  cookDone() {
    tone(660, 0.12, 'sine', 0.18);
    tone(880, 0.16, 'sine', 0.18, 0.1);
  },
  plateDone() {
    tone(523, 0.1, 'triangle', 0.2);
    tone(659, 0.1, 'triangle', 0.2, 0.08);
    tone(784, 0.18, 'triangle', 0.2, 0.16);
  },
  serve() {
    tone(880, 0.12, 'sine', 0.2);
    tone(1174, 0.2, 'sine', 0.2, 0.09);
  },
  wrong() {
    tone(220, 0.15, 'square', 0.08);
    tone(185, 0.2, 'square', 0.08, 0.12);
  },
  expire() {
    tone(160, 0.35, 'sawtooth', 0.12);
    tone(110, 0.4, 'sawtooth', 0.12, 0.15);
  },
  burn() {
    noiseBurst(0.25, 500, 0.2);
    tone(90, 0.3, 'sawtooth', 0.1);
  },
  tick() {
    tone(1200, 0.04, 'square', 0.06);
  },
  win() {
    [523, 659, 784, 1046].forEach((freq, index) => tone(freq, 0.22, 'triangle', 0.2, index * 0.12));
  },
  lose() {
    [392, 330, 262, 196].forEach((freq, index) => tone(freq, 0.25, 'triangle', 0.15, index * 0.14));
  },
  /** A looping pan-sizzle while something is in the wok. Call again to keep it alive. */
  sizzle(on) {
    const ctx = ensureContext();
    if (!ctx) return;
    if (on && !sizzleNodes) {
      const length = ctx.sampleRate;
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 4000;
      const gain = ctx.createGain();
      gain.gain.value = 0.05;
      source.connect(filter).connect(gain).connect(ctx.destination);
      source.start();
      sizzleNodes = { source, gain };
    } else if (!on && sizzleNodes) {
      const nodes = sizzleNodes;
      sizzleNodes = null;
      nodes.gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
      nodes.source.stop(ctx.currentTime + 0.25);
    }
  },
};
