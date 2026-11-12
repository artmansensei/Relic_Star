/**
 * Procedural Mars atmospheric audio synthesizer using Web Audio API.
 * No external audio files needed; guarantees 100% reliable sound playback.
 */

class MarsAudioSystem {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 0.85;
  private masterGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private breathingGain: GainNode | null = null;
  private isInitialized: boolean = false;
  private lastStepTime: number = 0;
  private activeProximityOsc: OscillatorNode[] = [];
  private activeProximityGains: GainNode[] = [];

  private getDestination(): AudioNode {
    return this.masterGain || this.ctx!.destination;
  }

  public init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.setupWindAmbience();
      this.setupBreathingAmbience();
      this.isInitialized = true;
    } catch {
      // AudioContext not allowed or not supported yet
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private setupWindAmbience() {
    if (!this.ctx) return;
    // Generate pink/brown noise for low-frequency Martian wind howling
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to simulate muffled helmet / thin Martian CO2 air sound
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);
    filter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    // LFO to slowly modulate wind gusts
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(140, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.windGain);
    this.windGain.connect(this.getDestination());
    whiteNoise.start();
  }

  private setupBreathingAmbience() {
    if (!this.ctx) return;
    // Quiet suit life-support oxygen flow & rhythmic breathing cycle
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.025;
    }

    const hiss = this.ctx.createBufferSource();
    hiss.buffer = noiseBuffer;
    hiss.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(750, this.ctx.currentTime);
    filter.Q.setValueAtTime(2.2, this.ctx.currentTime);

    // Cyclic LFO: Astronaut breathing rhythm (~14 breaths per minute)
    const breathLfo = this.ctx.createOscillator();
    breathLfo.type = 'sine';
    breathLfo.frequency.setValueAtTime(0.24, this.ctx.currentTime);
    const breathLfoGain = this.ctx.createGain();
    breathLfoGain.gain.setValueAtTime(220, this.ctx.currentTime);
    breathLfo.connect(breathLfoGain);
    breathLfoGain.connect(filter.frequency);
    breathLfo.start();

    this.breathingGain = this.ctx.createGain();
    this.breathingGain.gain.setValueAtTime(0, this.ctx.currentTime);

    hiss.connect(filter);
    filter.connect(this.breathingGain);
    this.breathingGain.connect(this.getDestination());
    hiss.start();
  }

  public playFootstep(isSprinting: boolean = false) {
    if (!this.ctx || this.isMuted) return;
    const now = performance.now();
    const interval = isSprinting ? 300 : 480;
    if (now - this.lastStepTime < interval) return;
    this.lastStepTime = now;

    // 1. Regolith crunch: soft filtered low impact on Martian soil
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(58 + Math.random() * 15, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(25, this.ctx.currentTime + 0.09);

    gain.gain.setValueAtTime(0.065, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.getDestination());
    osc.start();
    osc.stop(this.ctx.currentTime + 0.11);

    // 2. Faint spacesuit knee/hip joint servo whine (quiet, mechanical)
    const servoOsc = this.ctx.createOscillator();
    const servoGain = this.ctx.createGain();
    servoOsc.type = 'sine';
    servoOsc.frequency.setValueAtTime(320 + Math.random() * 40, this.ctx.currentTime);
    servoOsc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.07);

    servoGain.gain.setValueAtTime(0.015, this.ctx.currentTime);
    servoGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.08);

    servoOsc.connect(servoGain);
    servoGain.connect(this.getDestination());
    servoOsc.start();
    servoOsc.stop(this.ctx.currentTime + 0.09);
  }

  public playJump() {
    if (!this.ctx || this.isMuted) return;
    // Astronaut suit thruster push / low-gravity leap
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(190, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.09, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(this.getDestination());
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  public playLand() {
    if (!this.ctx || this.isMuted) return;
    // Heavy suit landing on Martian regolith
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(95, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(25, this.ctx.currentTime + 0.16);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(this.getDestination());
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  private stopActiveProximitySound() {
    if (this.activeProximityOsc.length > 0) {
      this.activeProximityOsc.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // already stopped
        }
      });
      this.activeProximityOsc = [];
    }
    if (this.activeProximityGains.length > 0) {
      this.activeProximityGains.forEach((gain) => {
        try {
          gain.disconnect();
        } catch {
          // ignore
        }
      });
      this.activeProximityGains = [];
    }
  }

  public playVisualContact() {
    if (!this.ctx || this.isMuted) return;
    this.stopActiveProximitySound();

    // Subtle optical contact acquisition chime (1046.5Hz -> 1318.5Hz)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.5, this.ctx.currentTime); // C6
    osc.frequency.exponentialRampToValueAtTime(1318.5, this.ctx.currentTime + 0.08); // E6

    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.16);

    osc.connect(gain);
    gain.connect(this.getDestination());

    this.activeProximityOsc.push(osc);
    this.activeProximityGains.push(gain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.18);
    osc.onended = () => {
      this.activeProximityOsc = this.activeProximityOsc.filter((o) => o !== osc);
      this.activeProximityGains = this.activeProximityGains.filter((g) => g !== gain);
    };
  }

  public playTargetLock() {
    if (!this.ctx || this.isMuted) return;
    this.stopActiveProximitySound();

    // Avionics confirmation double-beep (880Hz -> 1760Hz)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.setValueAtTime(1760, this.ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(this.getDestination());

    this.activeProximityOsc.push(osc);
    this.activeProximityGains.push(gain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
    osc.onended = () => {
      this.activeProximityOsc = this.activeProximityOsc.filter((o) => o !== osc);
      this.activeProximityGains = this.activeProximityGains.filter((g) => g !== gain);
    };
  }

  public playComponentSelect() {
    if (!this.ctx || this.isMuted) return;
    // High-tech crisp digital chirp for component inspection
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1480, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2200, this.ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(this.getDestination());
    osc.start();
    osc.stop(this.ctx.currentTime + 0.07);
  }

  public playDiscoveryChime() {
    if (!this.ctx || this.isMuted) return;
    // Major chord harmonic chime for major artifact discovery
    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.07);

      gain.gain.setValueAtTime(0.07, this.ctx.currentTime + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + idx * 0.07 + 0.6);

      osc.connect(gain);
      gain.connect(this.getDestination());
      osc.start(this.ctx.currentTime + idx * 0.07);
      osc.stop(this.ctx.currentTime + idx * 0.07 + 0.65);
    });
  }

  public playTransmissionStart() {
    if (!this.ctx || this.isMuted) return;
    // DSN carrier tone engagement: rising dual frequency carrier lock
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(1320, this.ctx.currentTime + 0.25);
    osc2.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(2640, this.ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.getDestination());

    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 0.32);
    osc2.stop(this.ctx.currentTime + 0.32);
  }

  public playPacketChirp() {
    if (!this.ctx || this.isMuted) return;
    // Short high-frequency telemetry packet blip
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800 + Math.random() * 400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.03);

    gain.gain.setValueAtTime(0.035, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.035);

    osc.connect(gain);
    gain.connect(this.getDestination());
    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }

  public playRelayBeep() {
    if (!this.ctx || this.isMuted) return;
    // DSN intermediate station relay chirp
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1046.5, this.ctx.currentTime); // C6
    osc.frequency.setValueAtTime(1318.5, this.ctx.currentTime + 0.06); // E6

    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.16);

    osc.connect(gain);
    gain.connect(this.getDestination());
    osc.start();
    osc.stop(this.ctx.currentTime + 0.18);
  }

  public playArchiveSuccess() {
    if (!this.ctx || this.isMuted) return;
    // NASA Mission Archive celebratory digital fanfare
    const notes = [587.33, 739.99, 880.0, 1174.66, 1479.98]; // D5, F#5, A5, D6, F#6
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.09);

      gain.gain.setValueAtTime(0.09, this.ctx.currentTime + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + idx * 0.09 + 0.8);

      osc.connect(gain);
      gain.connect(this.getDestination());
      osc.start(this.ctx.currentTime + idx * 0.09);
      osc.stop(this.ctx.currentTime + idx * 0.09 + 0.85);
    });
  }

  public playScannerToggle(active: boolean) {
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    if (active) {
      // Ascending radar chirp
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, this.ctx.currentTime + 0.14);
    } else {
      // Descending power down chirp
      osc.frequency.setValueAtTime(980, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.12);
    }
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.getDestination());
    osc.start();
    osc.stop(this.ctx.currentTime + 0.16);
  }

  private lastWarningTime: number = 0;
  public playLowOxygenWarning(critical: boolean = false) {
    if (!this.ctx || this.isMuted) return;
    const now = performance.now();
    const minInterval = critical ? 1200 : 2500;
    if (now - this.lastWarningTime < minInterval) return;
    this.lastWarningTime = now;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = critical ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(critical ? 740 : 520, this.ctx.currentTime);
    osc.frequency.setValueAtTime(critical ? 880 : 440, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(critical ? 0.12 : 0.07, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);

    osc.connect(gain);
    gain.connect(this.getDestination());
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  public setMasterVolume(vol: number): void {
    this.masterVolume = Math.max(0, Math.min(1, vol / 100));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
  }

  public getMasterVolume(): number {
    return Math.round(this.masterVolume * 100);
  }

  public setMuted(muted: boolean): boolean {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
    if (this.windGain && this.ctx) {
      this.windGain.gain.setValueAtTime(this.isMuted ? 0 : 0.18, this.ctx.currentTime);
    }
    if (this.breathingGain && this.ctx) {
      this.breathingGain.gain.setValueAtTime(this.isMuted ? 0 : 0.04, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public toggleMute(): boolean {
    return this.setMuted(!this.isMuted);
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public startAtmosphereAudio(): void {
    try {
      this.init();
      this.resume();
      if (!this.ctx || this.isMuted) return;
      if (this.windGain) {
        this.windGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      }
      if (this.breathingGain) {
        this.breathingGain.gain.setValueAtTime(0.035, this.ctx.currentTime);
      }
    } catch {
      // Audio autoplay policy or device fallback
    }
  }

  public stopAtmosphereAudio(): void {
    try {
      if (!this.ctx) return;
      if (this.windGain) {
        this.windGain.gain.setValueAtTime(0, this.ctx.currentTime);
      }
      if (this.breathingGain) {
        this.breathingGain.gain.setValueAtTime(0, this.ctx.currentTime);
      }
    } catch {
      // AudioContext fallback
    }
  }

  public playMenuClick(): void {
    try {
      this.init();
      this.resume();
      if (!this.ctx || this.isMuted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(560, this.ctx.currentTime + 0.045);
      gain.gain.setValueAtTime(0.09, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.getDestination());
      osc.start();
      osc.stop(this.ctx.currentTime + 0.055);
    } catch {
      // Safe fallback
    }
  }

  public playMenuHover(): void {
    try {
      this.init();
      this.resume();
      if (!this.ctx || this.isMuted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.025, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.035);
      osc.connect(gain);
      gain.connect(this.getDestination());
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {
      // Safe fallback
    }
  }

  public playMenuTransition(): void {
    try {
      this.init();
      this.resume();
      if (!this.ctx || this.isMuted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(520, this.ctx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.07, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.getDestination());
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch {
      // Safe fallback
    }
  }

  private lastAlarmTime = 0;

  public playEmergencyAlarm(): void {
    try {
      this.init();
      this.resume();
      if (!this.ctx || this.isMuted) return;

      const now = performance.now();
      if (now - this.lastAlarmTime < 1400) return; // Rate limit alarm klaxon
      this.lastAlarmTime = now;

      // Urgent two-tone spacesuit alarm beep
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc1.frequency.setValueAtTime(660, this.ctx.currentTime + 0.12);

      osc2.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc2.frequency.setValueAtTime(330, this.ctx.currentTime + 0.12);

      // Low-pass to keep it in-helmet and avoid harshness
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime + 0.22);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.26);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.getDestination());

      osc1.start();
      osc2.start();
      osc1.stop(this.ctx.currentTime + 0.28);
      osc2.stop(this.ctx.currentTime + 0.28);
    } catch {
      // AudioContext fallback
    }
  }

  public playEnergyRecharge(): void {
    try {
      this.init();
      this.resume();
      if (!this.ctx || this.isMuted) return;

      // 1. High-frequency inductive power cell relay surge
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1280, this.ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.42);

      osc.connect(gain);
      gain.connect(this.getDestination());
      osc.start();
      osc.stop(this.ctx.currentTime + 0.45);

      // 2. High-pitched harmonic chime indicating 100% capacity restored
      const chimeOsc = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();
      chimeOsc.type = 'triangle';
      chimeOsc.frequency.setValueAtTime(1046.5, this.ctx.currentTime + 0.2); // C6
      chimeOsc.frequency.setValueAtTime(1318.5, this.ctx.currentTime + 0.3); // E6

      chimeGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      chimeGain.gain.setValueAtTime(0.08, this.ctx.currentTime + 0.2);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.55);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(this.getDestination());
      chimeOsc.start(this.ctx.currentTime + 0.2);
      chimeOsc.stop(this.ctx.currentTime + 0.58);
    } catch {
      // AudioContext fallback
    }
  }

  public playMissionFailure(): void {
    try {
      this.init();
      this.resume();
      if (!this.ctx || this.isMuted) return;

      // Descending life-support telemetry dropout drone
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 1.2);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(120, this.ctx.currentTime + 1.2);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.3);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.getDestination());

      osc.start();
      osc.stop(this.ctx.currentTime + 1.35);
    } catch {
      // AudioContext fallback
    }
  }
}

export const marsAudio = new MarsAudioSystem();
