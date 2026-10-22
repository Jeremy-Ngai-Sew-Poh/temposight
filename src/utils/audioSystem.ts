// Lightweight procedurally generated audio engine using Web Audio API.
// Eliminates external resource dependency and delivers pristine offline-ready sound.

class AudioSystem {
  private ctx: AudioContext | null = null;
  private pianoInterval: number | null = null;
  private masterGain: GainNode | null = null;
  private bgmPlaying: boolean = false;
  private chordIndex: number = 0;
  
  // Retro, warm chord progressions (Cmaj9, Am9, Fmaj7, G6/9)
  private chords = [
    [130.81, 196.00, 246.94, 293.66, 329.63], // C3, G3, B3, D4, E4 (Cmaj9)
    [110.00, 164.81, 196.00, 261.63, 493.88], // A2, E3, G3, C4, B4 (Am9)
    [87.31,  130.81, 164.81, 220.00, 392.00], // F2, C3, E3, A3, G4 (Fmaj9)
    [98.00,  146.83, 185.00, 246.94, 440.00]  // G2, D3, F#3, B3, A4 (G6/9)
  ];

  constructor() {
    // Context is initialized lazily upon first interaction to comply with browser autoplay policies.
  }

  private init() {
    if (this.ctx) return;
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    try {
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.06, this.ctx.currentTime); // Low background volume
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.error("Failed to initialize Web Audio System:", e);
    }
  }

  // Plays a highly satisfying, crisp tactile click sound
  public playClick() {
    this.init();
    if (!this.ctx) return;

    // Resume if suspended (browser behavior)
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    
    // Tactile Click Synthesis:
    // Uses a low, solid oscillator combined with a crisp bandpass filtered noise chirp
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = "sine";
    // Rapid pitch sweep for a woodblock/bamboo click texture
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.04);

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1500, now);
    filter.Q.setValueAtTime(2.0, now);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(filter);
    filter.connect(gain);
    // Connect to target (bypass main bgm gain to avoid background music mute muting click)
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  // Plays a subtle rising pop sound when user sends a chat message
  public playMessageSent() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(820, now + 0.08);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Plays an elegant 2-note glass chime when AI responds
  public playMessageReceived() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;

    // First Chime Note (E5)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.07, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    // Second Chime Note (B5)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(987.77, now + 0.07);
    gain2.gain.setValueAtTime(0.08, now + 0.07);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now + 0.07);
    osc2.stop(now + 0.35);
  }

  // Plays an individual interactive piano key with realistic percussive acoustic resonance
  public playPianoKey(freq: number, velocity: number = 0.75) {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    const duration = 2.2;

    // 1. Fundamental Oscillator (Warm triangle/sine blend for piano body)
    const oscFundamental = this.ctx.createOscillator();
    const fundamentalGain = this.ctx.createGain();

    oscFundamental.type = "triangle";
    oscFundamental.frequency.setValueAtTime(freq, now);

    // 2. Harmonic Overtone (Second harmonic for acoustic string sparkle)
    const oscHarmonic = this.ctx.createOscillator();
    const harmonicGain = this.ctx.createGain();

    oscHarmonic.type = "sine";
    oscHarmonic.frequency.setValueAtTime(freq * 2, now);

    // 3. Hammer Strike Transient (Subtle wooden percussive knock)
    const oscHammer = this.ctx.createOscillator();
    const hammerGain = this.ctx.createGain();
    const hammerFilter = this.ctx.createBiquadFilter();

    oscHammer.type = "sine";
    oscHammer.frequency.setValueAtTime(freq * 3.5, now);
    oscHammer.frequency.exponentialRampToValueAtTime(80, now + 0.04);

    hammerFilter.type = "bandpass";
    hammerFilter.frequency.setValueAtTime(1200, now);
    hammerFilter.Q.setValueAtTime(1.5, now);

    hammerGain.gain.setValueAtTime(0.08 * velocity, now);
    hammerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    oscHammer.connect(hammerFilter);
    hammerFilter.connect(hammerGain);

    // 4. Master Tone Filter (Acoustic lowpass that closes over decay time)
    const toneFilter = this.ctx.createBiquadFilter();
    toneFilter.type = "lowpass";
    const initialCutoff = Math.min(6000, Math.max(800, freq * 5.5));
    toneFilter.frequency.setValueAtTime(initialCutoff, now);
    toneFilter.frequency.exponentialRampToValueAtTime(Math.max(160, freq * 1.2), now + duration);

    // Envelopes
    const targetGain = Math.min(0.35, 0.22 * velocity);
    fundamentalGain.gain.setValueAtTime(0.0, now);
    fundamentalGain.gain.linearRampToValueAtTime(targetGain, now + 0.012);
    fundamentalGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    harmonicGain.gain.setValueAtTime(0.0, now);
    harmonicGain.gain.linearRampToValueAtTime(targetGain * 0.35, now + 0.015);
    harmonicGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.7);

    // Connections
    oscFundamental.connect(fundamentalGain);
    oscHarmonic.connect(harmonicGain);

    fundamentalGain.connect(toneFilter);
    harmonicGain.connect(toneFilter);
    hammerGain.connect(this.ctx.destination);
    toneFilter.connect(this.ctx.destination);

    // Start / Stop
    oscFundamental.start(now);
    oscHarmonic.start(now);
    oscHammer.start(now);

    oscFundamental.stop(now + duration + 0.1);
    oscHarmonic.stop(now + duration + 0.1);
    oscHammer.stop(now + 0.06);
  }

  // Plays a single dreamy felt-piano chord note
  private playFeltPianoNote(freq: number, delay: number) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime + delay;

    // Dual oscillator synthesizer structure (warm triangle + subtle sine) to simulate organic felt hammers
    const osc1 = this.ctx.createOscillator();
    const osc1Gain = this.ctx.createGain();
    
    const filter = this.ctx.createBiquadFilter();

    // Round, mellow signature: standard triangle
    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(freq, now);

    // Filter to suppress high harsh frequencies, rendering a cozy, dark 'felt piano' aesthetic
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(550, now);
    filter.frequency.exponentialRampToValueAtTime(180, now + 2.8);

    // Expressive envelope with short attack, slow long decay
    osc1Gain.gain.setValueAtTime(0.0, now);
    osc1Gain.gain.linearRampToValueAtTime(0.24, now + 0.08);
    osc1Gain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);

    osc1.connect(filter);
    filter.connect(osc1Gain);
    osc1Gain.connect(this.masterGain);

    osc1.start(now);
    osc1.stop(now + 3.5);
  }

  // Plays the next progression chord arpeggiated over time
  private playNextAmbientChord() {
    if (!this.ctx || !this.bgmPlaying) return;

    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    const chord = this.chords[this.chordIndex];
    
    // Slow, gorgeous roll arpeggio mimicking a live pianist playing soft keys
    chord.forEach((freq, idx) => {
      const delay = idx * 0.18 + Math.random() * 0.05;
      this.playFeltPianoNote(freq, delay);
    });

    // Advance chord progression
    this.chordIndex = (this.chordIndex + 1) % this.chords.length;
  }

  // Starts infinite background ambient loops
  public startBGM() {
    this.init();
    if (this.bgmPlaying || !this.ctx) return;

    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    this.bgmPlaying = true;
    
    // Play immediately
    this.playNextAmbientChord();

    // Loop chord every 4.5 seconds
    this.pianoInterval = window.setInterval(() => {
      this.playNextAmbientChord();
    }, 4500);
  }

  // Safely stops bgm loop
  public stopBGM() {
    this.bgmPlaying = false;
    if (this.pianoInterval) {
      clearInterval(this.pianoInterval);
      this.pianoInterval = null;
    }
  }

  // Controls background volume (0.0 to 1.0)
  public setBGMVolume(volume: number) {
    this.init();
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.linearRampToValueAtTime(volume * 0.15, this.ctx.currentTime + 0.1);
    }
  }

  // Is music active?
  public isBGMPlaying(): boolean {
    return this.bgmPlaying;
  }

  // Checks context and plays music if it was running
  public resumeIfNeeded() {
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }
}

export const audioSystem = new AudioSystem();
