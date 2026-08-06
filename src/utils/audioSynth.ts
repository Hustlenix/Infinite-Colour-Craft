// Web Audio API Sound Synthesizer for Infinite Colour Craft
// Organic Multi-Tool Brush & 2D Tactical Paint Game Sound Engine

export type StrokeTool =
  | 'brush'
  | 'pen'
  | 'marker'
  | 'spray'
  | 'calligraphy'
  | 'rainbow'
  | 'stamp'
  | 'bucket'
  | 'eyedropper'
  | 'eraser'
  | 'smudge';

export interface PaintStrokeOptions {
  rgb: { r: number; g: number; b: number };
  speed: number;
  tool?: StrokeTool;
  brushSize?: number;
  brushOpacity?: number;
  stencilMode?: 'free' | 'mirror' | 'quad' | 'mandala' | 'kaleidoscope';
}

class AudioSynth {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private isUnlocked: boolean = false;
  private pinkNoiseBuffer: AudioBuffer | null = null;

  // Active stroke noise nodes (for 2D tactile tools)
  private paintNoiseSource: AudioBufferSourceNode | null = null;
  private paintBandpassFilter: BiquadFilterNode | null = null;
  private paintLowpassFilter: BiquadFilterNode | null = null;
  private paintGain: GainNode | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const unlockHandler = () => {
        this.unlockAudio();
        if (this.ctx && this.ctx.state === 'running') {
          window.removeEventListener('pointerdown', unlockHandler);
          window.removeEventListener('touchstart', unlockHandler);
          window.removeEventListener('keydown', unlockHandler);
          window.removeEventListener('click', unlockHandler);
        }
      };

      window.addEventListener('pointerdown', unlockHandler, { passive: true });
      window.addEventListener('touchstart', unlockHandler, { passive: true });
      window.addEventListener('keydown', unlockHandler, { passive: true });
      window.addEventListener('click', unlockHandler, { passive: true });
    }
  }

  public unlockAudio() {
    this.initCtx();
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        this.isUnlocked = true;
      }).catch(() => {});
    }
  }

  // Generates 2-second pink noise for organic canvas & bristle textures
  private getPinkNoiseBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    if (!this.pinkNoiseBuffer) {
      const sampleRate = this.ctx.sampleRate;
      const bufferSize = sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
      const data = buffer.getChannelData(0);

      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;

        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
      this.pinkNoiseBuffer = buffer;
    }
    return this.pinkNoiseBuffer;
  }

  public toggleSound(enable?: boolean): boolean {
    this.enabled = enable !== undefined ? enable : !this.enabled;
    return this.enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  // UI Pop for UI interactions
  public playPop() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(350, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(700, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {
      // Ignore
    }
  }

  // Musical chime when fusing colors
  public playFuse(hue: number) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const freq = 220 + (hue / 360) * 660;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.15);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // Ignore
    }
  }

  // Arpeggio for discovering new pigment or completing artwork
  public playUnlock() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      const now = this.ctx.currentTime;

      notes.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const startTime = now + i * 0.08;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });
    } catch {
      // Ignore
    }
  }

  // Paint Bucket Splash Sound
  public playBucketFill() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(650, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.25);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.28);
    } catch {
      // Ignore
    }
  }

  // Eyedropper Sample Sound
  public playEyedropper() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.08);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // Ignore
    }
  }

  // Stamp Place Sound
  public playStamp() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // Ignore
    }
  }

  private normalizeOptions(
    optionsOrRgb: PaintStrokeOptions | { r: number; g: number; b: number },
    speedInput?: number
  ): PaintStrokeOptions {
    if ('rgb' in optionsOrRgb) {
      return {
        rgb: optionsOrRgb.rgb,
        speed: optionsOrRgb.speed ?? (speedInput || 5),
        tool: optionsOrRgb.tool || 'brush',
        brushSize: optionsOrRgb.brushSize ?? 12,
        brushOpacity: optionsOrRgb.brushOpacity ?? 1,
        stencilMode: optionsOrRgb.stencilMode || 'free',
      };
    }
    return {
      rgb: optionsOrRgb,
      speed: speedInput || 5,
      tool: 'brush',
      brushSize: 12,
      brushOpacity: 1,
      stencilMode: 'free',
    };
  }

  // Calculate realistic acoustic friction parameters for 2D tools
  private calculate2DAcoustics(opts: PaintStrokeOptions) {
    const tool = opts.tool || 'brush';
    const brushSize = opts.brushSize || 12;
    const speed = Math.max(1, Math.min(60, opts.speed));
    const opacity = opts.brushOpacity ?? 1;

    if (tool === 'eraser' || tool === 'smudge') {
      const bandpassFreq = Math.max(350, Math.min(1200, 550 - brushSize * 2 + speed * 12));
      const lowpassFreq = 1800;
      const qFactor = 1.6;
      const targetGain = Math.min(0.2, 0.04 + (speed / 35) * 0.14);
      return { bandpassFreq, lowpassFreq, qFactor, targetGain, filterType: 'bandpass' as BiquadFilterType };
    }

    if (tool === 'pen') {
      const bandpassFreq = Math.max(2200, Math.min(4800, 2800 + speed * 25));
      const lowpassFreq = 6000;
      const qFactor = 2.4;
      const targetGain = Math.min(0.15, 0.03 + (speed / 30) * 0.1);
      return { bandpassFreq, lowpassFreq, qFactor, targetGain, filterType: 'bandpass' as BiquadFilterType };
    }

    if (tool === 'marker') {
      const bandpassFreq = Math.max(800, Math.min(2200, 1100 + speed * 15));
      const lowpassFreq = 2600;
      const qFactor = 1.3;
      const targetGain = Math.min(0.18, (0.04 + (speed / 30) * 0.12) * opacity);
      return { bandpassFreq, lowpassFreq, qFactor, targetGain, filterType: 'bandpass' as BiquadFilterType };
    }

    if (tool === 'spray') {
      const bandpassFreq = Math.max(3200, Math.min(7500, 4200 + speed * 30));
      const lowpassFreq = 8500;
      const qFactor = 0.6;
      const targetGain = Math.min(0.16, (0.05 + (speed / 30) * 0.1) * opacity);
      return { bandpassFreq, lowpassFreq, qFactor, targetGain, filterType: 'highpass' as BiquadFilterType };
    }

    if (tool === 'rainbow' || tool === 'stamp') {
      const bandpassFreq = Math.max(1200, Math.min(3800, 1800 + speed * 20));
      const lowpassFreq = 5000;
      const qFactor = 1.5;
      const targetGain = Math.min(0.15, (0.04 + (speed / 30) * 0.1) * opacity);
      return { bandpassFreq, lowpassFreq, qFactor, targetGain, filterType: 'bandpass' as BiquadFilterType };
    }

    // Default 'brush' & 'calligraphy': Organic wet bristle rustle
    const sizeScale = Math.max(0.4, 1.4 - (brushSize / 65));
    const bristleCenterFreq = (1000 + (opts.rgb.r / 255) * 200) * sizeScale + speed * 12;
    const bandpassFreq = Math.max(600, Math.min(3000, bristleCenterFreq));
    const lowpassFreq = Math.max(2000, Math.min(4800, 3000 + speed * 18));
    const qFactor = 1.1;
    const targetGain = Math.min(0.19, (0.03 + (speed / 30) * 0.13) * opacity);

    return { bandpassFreq, lowpassFreq, qFactor, targetGain, filterType: 'bandpass' as BiquadFilterType };
  }

  public startPaintSound(
    optionsOrRgb: PaintStrokeOptions | { r: number; g: number; b: number },
    speedInput?: number
  ) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const opts = this.normalizeOptions(optionsOrRgb, speedInput);

    try {
      this.stopPaintSound(); // Reset active sound nodes

      const now = this.ctx.currentTime;
      const noiseBuf = this.getPinkNoiseBuffer();
      if (!noiseBuf) return;

      const acoustics = this.calculate2DAcoustics(opts);

      this.paintNoiseSource = this.ctx.createBufferSource();
      this.paintNoiseSource.buffer = noiseBuf;
      this.paintNoiseSource.loop = true;

      this.paintBandpassFilter = this.ctx.createBiquadFilter();
      this.paintBandpassFilter.type = acoustics.filterType;
      this.paintBandpassFilter.frequency.setValueAtTime(acoustics.bandpassFreq, now);
      this.paintBandpassFilter.Q.setValueAtTime(acoustics.qFactor, now);

      this.paintLowpassFilter = this.ctx.createBiquadFilter();
      this.paintLowpassFilter.type = 'lowpass';
      this.paintLowpassFilter.frequency.setValueAtTime(acoustics.lowpassFreq, now);

      this.paintGain = this.ctx.createGain();
      this.paintGain.gain.setValueAtTime(0, now);
      this.paintGain.gain.linearRampToValueAtTime(acoustics.targetGain, now + 0.03);

      this.paintNoiseSource.connect(this.paintBandpassFilter);
      this.paintBandpassFilter.connect(this.paintLowpassFilter);
      this.paintLowpassFilter.connect(this.paintGain);
      this.paintGain.connect(this.ctx.destination);

      this.paintNoiseSource.start(now);
    } catch {
      // Ignore
    }
  }

  public updatePaintSound(
    optionsOrRgb: PaintStrokeOptions | { r: number; g: number; b: number },
    speedInput?: number
  ) {
    if (!this.enabled || !this.ctx) return;

    const opts = this.normalizeOptions(optionsOrRgb, speedInput);

    try {
      const now = this.ctx.currentTime;
      if (!this.paintGain || !this.paintBandpassFilter || !this.paintLowpassFilter) return;

      const acoustics = this.calculate2DAcoustics(opts);

      this.paintBandpassFilter.frequency.setTargetAtTime(acoustics.bandpassFreq, now, 0.03);
      this.paintLowpassFilter.frequency.setTargetAtTime(acoustics.lowpassFreq, now, 0.03);
      this.paintGain.gain.setTargetAtTime(acoustics.targetGain, now, 0.03);
    } catch {
      // Ignore
    }
  }

  public stopPaintSound() {
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Stop 2D noise brush sound
      if (this.paintGain) {
        this.paintGain.gain.linearRampToValueAtTime(0.001, now + 0.06);

        const noiseSrc = this.paintNoiseSource;
        const bpFilter = this.paintBandpassFilter;
        const lpFilter = this.paintLowpassFilter;
        const gainNode = this.paintGain;

        setTimeout(() => {
          try {
            noiseSrc?.stop();
            noiseSrc?.disconnect();
            bpFilter?.disconnect();
            lpFilter?.disconnect();
            gainNode?.disconnect();
          } catch {
            // Ignore
          }
        }, 70);

        this.paintNoiseSource = null;
        this.paintBandpassFilter = null;
        this.paintLowpassFilter = null;
        this.paintGain = null;
      }
    } catch {
      // Ignore
    }
  }

  // Trash bin drop sound effect
  public playTrash() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.09);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // Ignore
    }
  }
}

export const audioSynth = new AudioSynth();

