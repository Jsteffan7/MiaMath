/* ============================================
   MiaMath - Audio Manager
   Uses Web Audio API to synthesize all sounds
   No external audio files required!
   ============================================ */

const AudioManager = (() => {
  let ctx = null;
  let masterGain = null;
  let enabled = true;
  let musicEnabled = false;
  let musicOscillators = [];

  function init() {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.6;
      masterGain.connect(ctx.destination);
    } catch (e) {
      console.warn('Web Audio not available', e);
      ctx = null;
    }
  }

  function resume() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function setEnabled(val) { enabled = val; }
  function setMusicEnabled(val) {
    musicEnabled = val;
    if (!val) stopMusic();
  }

  // ---- Core synth helpers ----

  function createOsc(type, freq, start, duration, gainVal, dest) {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(gainVal, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.connect(g);
    g.connect(dest || masterGain);
    osc.start(start);
    osc.stop(start + duration);
    return osc;
  }

  function createNote(freq, start, dur, gain, type='sine') {
    return createOsc(type, freq, start, dur, gain);
  }

  // ---- Sound effects ----

  function playCorrect() {
    if (!ctx || !enabled) return;
    resume();
    const t = ctx.currentTime;
    // Happy ascending arpeggio C-E-G-C
    const notes = [523.25, 659.25, 784, 1046.5];
    notes.forEach((f, i) => {
      createNote(f, t + i * 0.08, 0.25, 0.3, 'sine');
      createNote(f * 2, t + i * 0.08, 0.12, 0.08, 'sine');
    });
    // Sparkle
    createNote(2093, t + 0.32, 0.3, 0.1, 'sine');
  }

  function playWrong() {
    if (!ctx || !enabled) return;
    resume();
    const t = ctx.currentTime;
    // Descending sad tones
    createNote(300, t,        0.15, 0.3, 'sawtooth');
    createNote(250, t + 0.12, 0.15, 0.25, 'sawtooth');
    createNote(200, t + 0.24, 0.25, 0.2, 'sawtooth');
    // Wobble LFO effect
    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const g   = ctx.createGain();
    const lfoGain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 180;
    lfo.type = 'sine';
    lfo.frequency.value = 8;
    lfoGain.gain.value = 30;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    g.gain.setValueAtTime(0.15, t + 0.24);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc.connect(g);
    g.connect(masterGain);
    lfo.start(t + 0.24);
    osc.start(t + 0.24);
    lfo.stop(t + 0.6);
    osc.stop(t + 0.6);
  }

  function playLevelUp() {
    if (!ctx || !enabled) return;
    resume();
    const t = ctx.currentTime;
    // Triumphant fanfare
    const seq = [392, 494, 587, 784, 988, 1175, 1568];
    seq.forEach((f, i) => {
      createNote(f, t + i * 0.1, 0.35, 0.25, 'sine');
      if (i < 3) createNote(f * 1.5, t + i * 0.1, 0.15, 0.1, 'triangle');
    });
    createNote(1568, t + 0.7, 0.8, 0.3, 'sine');
  }

  function playVictory() {
    if (!ctx || !enabled) return;
    resume();
    const t = ctx.currentTime;
    // Victory jingle (K-pop feel)
    const melody = [
      [523, 0.0], [659, 0.1], [784, 0.2], [1047, 0.3],
      [784, 0.4], [880, 0.5], [1047, 0.6], [1319, 0.75]
    ];
    melody.forEach(([f, delay]) => {
      createNote(f, t + delay, 0.3, 0.25, 'sine');
      createNote(f * 0.5, t + delay, 0.2, 0.1, 'triangle');
    });
    createNote(1047, t + 1.1, 1.0, 0.3, 'sine');
    createNote(1319, t + 1.1, 1.0, 0.2, 'sine');
  }

  function playDefeat() {
    if (!ctx || !enabled) return;
    resume();
    const t = ctx.currentTime;
    const seq = [400, 350, 300, 250, 200];
    seq.forEach((f, i) => {
      createNote(f, t + i * 0.15, 0.3, 0.2, 'sawtooth');
    });
  }

  function playHit() {
    if (!ctx || !enabled) return;
    resume();
    const t = ctx.currentTime;
    // Sharp punch sound
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.2);
    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.2);
    // White noise burst
    const bufSize = ctx.sampleRate * 0.08;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.15;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.3, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    noise.connect(ng);
    ng.connect(masterGain);
    noise.start(t);
    noise.stop(t + 0.08);
  }

  function playDemonEntrance() {
    if (!ctx || !enabled) return;
    resume();
    const t = ctx.currentTime;
    // Deep ominous growl
    const notes = [100, 90, 80, 150, 200];
    notes.forEach((f, i) => {
      createNote(f, t + i * 0.08, 0.25, 0.3, 'sawtooth');
    });
    createNote(220, t + 0.4, 0.6, 0.2, 'square');
    createNote(165, t + 0.4, 0.6, 0.2, 'square');
  }

  function playCombo() {
    if (!ctx || !enabled) return;
    resume();
    const t = ctx.currentTime;
    // Ascending combo sound
    const freqs = [523, 659, 784, 1047, 1319];
    freqs.forEach((f, i) => {
      createNote(f, t + i * 0.06, 0.15, 0.2, 'sine');
    });
  }

  function playBadgeUnlock() {
    if (!ctx || !enabled) return;
    resume();
    const t = ctx.currentTime;
    // Magical sparkle sequence
    const seq = [1047, 1319, 1568, 2093, 1568, 1319, 1047, 1319, 2093];
    seq.forEach((f, i) => {
      createNote(f, t + i * 0.07, 0.2, 0.18, 'sine');
    });
    createNote(2093, t + 0.63, 0.5, 0.2, 'sine');
  }

  function playClick() {
    if (!ctx || !enabled) return;
    resume();
    const t = ctx.currentTime;
    createNote(880, t, 0.05, 0.15, 'sine');
  }

  function playStreak() {
    if (!ctx || !enabled) return;
    resume();
    const t = ctx.currentTime;
    createNote(1320, t,       0.1, 0.2, 'triangle');
    createNote(1568, t + 0.1, 0.1, 0.2, 'triangle');
    createNote(1760, t + 0.2, 0.2, 0.25, 'triangle');
  }

  // ---- Battle music (simple synthesized loop) ----

  function startBattleMusic() {
    if (!ctx || !musicEnabled) return;
    resume();
    stopMusic();
    playBattleLoop();
  }

  function playBattleLoop() {
    if (!ctx || !musicEnabled) return;
    const t = ctx.currentTime;
    const bpm = 140;
    const beat = 60 / bpm;

    // Simple K-pop beat pattern: bass + chord
    const bass = [98, 98, 110, 98, 130, 110, 98, 130];
    const chord = [392, 494];

    bass.forEach((f, i) => {
      const osc = createOsc('sine', f, t + i * beat, beat * 0.6, 0.12);
      if (osc) musicOscillators.push(osc);
    });

    chord.forEach(f => {
      const osc = createOsc('triangle', f, t, beat * 8 * 0.9, 0.04);
      if (osc) musicOscillators.push(osc);
    });

    // Schedule next loop
    const loopId = setTimeout(() => {
      if (musicEnabled) playBattleLoop();
    }, beat * 8 * 1000);
    musicOscillators.push({ loopId });
  }

  function stopMusic() {
    musicOscillators.forEach(o => {
      if (o && o.stop) {
        try { o.stop(); } catch (e) {}
      }
      if (o && o.loopId) clearTimeout(o.loopId);
    });
    musicOscillators = [];
  }

  // ---- Public API ----
  return {
    init,
    setEnabled,
    setMusicEnabled,
    playCorrect,
    playWrong,
    playLevelUp,
    playVictory,
    playDefeat,
    playHit,
    playDemonEntrance,
    playCombo,
    playBadgeUnlock,
    playClick,
    playStreak,
    startBattleMusic,
    stopMusic
  };
})();
