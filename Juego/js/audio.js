// La distancia afecta el volumen de pasos, no el ruido que detecta la IA.
const MAX_AUDIBLE_DISTANCE = 900;

export class AudioSystem {
  constructor() {
    this.context = null;
    this.masterGain = null;
    this.ambientStarted = false;
    this.heartbeatElapsed = 0;
    this.initializationPromise = null;
  }

  initialize() {
    if (!this.initializationPromise) {
      this.initializationPromise = this.initializeContext().catch((error) => {
        this.initializationPromise = null;
        throw error;
      });
    }

    return this.initializationPromise;
  }

  async initializeContext() {
    if (!this.context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error("Este navegador no admite Web Audio API.");
      }

      this.context = new AudioContextClass();
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = 0.7;
      this.masterGain.connect(this.context.destination);
    }

    if (this.context.state === "suspended") {
      await this.context.resume();
    }

    if (!this.ambientStarted) {
      this.startAmbientHum();
      this.ambientStarted = true;
    }
  }

  playPlayerFootstep(isRunning, pan = 0) {
    if (!this.context || this.context.state !== "running") return;

    const volume = isRunning ? 0.2 : 0.065;
    const duration = isRunning ? 0.19 : 0.13;
    const now = this.context.currentTime;
    const gain = this.createPanner(pan);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    const oscillator = this.context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(isRunning ? 75 : 105, now);
    oscillator.frequency.exponentialRampToValueAtTime(38, now + duration);
    oscillator.connect(gain);
    oscillator.start(now);
    oscillator.stop(now + duration);

    this.playFilteredNoise(isRunning ? 0.11 : 0.035, duration, 360, pan);
  }

  playDinosaurFootstep(distance, pan = 0) {
    if (
      !this.context ||
      this.context.state !== "running" ||
      distance >= MAX_AUDIBLE_DISTANCE
    ) {
      return;
    }

    const proximity = 1 - distance / MAX_AUDIBLE_DISTANCE;
    const volume = 0.015 + proximity * proximity * 0.26;
    const duration = 0.32;
    const now = this.context.currentTime;
    const gain = this.createPanner(pan);
    gain.gain.setValueAtTime(Math.max(0.0001, volume), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    const oscillator = this.context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(66, now);
    oscillator.frequency.exponentialRampToValueAtTime(28, now + duration);
    oscillator.connect(gain);
    oscillator.start(now);
    oscillator.stop(now + duration);
    this.playFilteredNoise(volume * 0.72, duration, 190, pan);
  }

  playDinosaurRoar(distance = 0, pan = 0) {
    if (!this.context || this.context.state !== "running") return;

    const proximity = Math.max(0.18, 1 - distance / 900);
    const now = this.context.currentTime;
    const duration = 1.05;
    const gain = this.createPanner(pan);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.3 * proximity, now + 0.09);
    gain.gain.setValueAtTime(0.22 * proximity, now + 0.34);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    const oscillator = this.context.createOscillator();
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(95, now);
    oscillator.frequency.exponentialRampToValueAtTime(42, now + duration);
    oscillator.connect(gain);
    oscillator.start(now);
    oscillator.stop(now + duration);

    const filter = this.context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 320;
    const noise = this.createNoiseSource(duration);
    noise.connect(filter);
    filter.connect(gain);
    noise.start(now);
  }

  updateHeartbeat(deltaTime, danger) {
    if (!this.context || this.context.state !== "running" || danger <= 0.08) {
      this.heartbeatElapsed = 0;
      return;
    }

    const interval = 0.9 - Math.min(0.55, danger * 0.55);
    this.heartbeatElapsed += deltaTime;

    if (this.heartbeatElapsed >= interval) {
      this.heartbeatElapsed -= interval;
      this.playHeartbeat(danger);
    }
  }

  playDoorCreak(pan = 0) {
    if (!this.context || this.context.state !== "running") return;

    const now = this.context.currentTime;
    const duration = 0.85;
    const gain = this.createPanner(pan);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.16, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    const oscillator = this.context.createOscillator();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(420, now);
    oscillator.frequency.exponentialRampToValueAtTime(115, now + duration);
    oscillator.connect(gain);
    oscillator.start(now);
    oscillator.stop(now + duration);
    this.playFilteredNoise(0.045, duration, 1200, pan);
  }

  playObjectThrow(pan = 0) {
    if (!this.context || this.context.state !== "running") return;
    this.playFilteredNoise(0.11, 0.24, 850, pan);
  }

  playObjectImpact(pan = 0) {
    if (!this.context || this.context.state !== "running") return;

    const now = this.context.currentTime;
    const duration = 0.42;
    const gain = this.createPanner(pan);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    const oscillator = this.context.createOscillator();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(160, now);
    oscillator.frequency.exponentialRampToValueAtTime(48, now + duration);
    oscillator.connect(gain);
    oscillator.start(now);
    oscillator.stop(now + duration);
    this.playFilteredNoise(0.09, 0.2, 520, pan);
  }

  updateAmbientSpatial(pan, volume = 1) {
    if (!this.ambientGain || !this.context) return;

    const now = this.context.currentTime;
    this.ambientPanner.pan.setTargetAtTime(pan, now, 0.18);
    this.ambientGain.gain.setTargetAtTime(0.045 * volume, now, 0.25);
  }

  startAmbientHum() {
    const now = this.context.currentTime;
    const buffer = this.createNoiseBuffer(2);
    const noise = this.context.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 190;
    filter.Q.value = 0.8;

    this.ambientGain = this.context.createGain();
    this.ambientGain.gain.value = 0.045;
    this.ambientPanner = this.context.createStereoPanner();
    noise.connect(filter);
    filter.connect(this.ambientPanner);
    this.ambientPanner.connect(this.ambientGain);
    this.ambientGain.connect(this.masterGain);
    noise.start(now);

    for (const frequency of [48, 50.4]) {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.value = 0.012;
      oscillator.connect(gain);
      gain.connect(this.masterGain);
      oscillator.start(now);
    }
  }

  playHeartbeat(danger) {
    const now = this.context.currentTime;
    const volume = 0.06 + danger * 0.12;

    for (const [offset, frequency, amplitude] of [
      [0, 58, 1],
      [0.14, 48, 0.7],
    ]) {
      const gain = this.context.createGain();
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(
        volume * amplitude,
        now + offset + 0.025,
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.18);

      const oscillator = this.context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      gain.connect(this.masterGain);
      oscillator.start(now + offset);
      oscillator.stop(now + offset + 0.19);
    }
  }

  playFilteredNoise(volume, duration, cutoff, pan = 0) {
    const now = this.context.currentTime;
    const source = this.createNoiseSource(duration);
    const filter = this.context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = cutoff;

    const gain = this.createPanner(pan);
    gain.gain.setValueAtTime(Math.max(0.0001, volume), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter);
    filter.connect(gain);
    source.start(now);
  }

  createPanner(pan) {
    const panner = this.context.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    const gain = this.context.createGain();
    panner.connect(gain);
    gain.connect(this.masterGain);
    return gain;
  }

  createNoiseSource(duration) {
    const source = this.context.createBufferSource();
    source.buffer = this.createNoiseBuffer(duration);
    return source;
  }

  createNoiseBuffer(duration) {
    const frameCount = Math.max(
      1,
      Math.ceil(this.context.sampleRate * duration),
    );
    const buffer = this.context.createBuffer(
      1,
      frameCount,
      this.context.sampleRate,
    );
    const samples = buffer.getChannelData(0);

    for (let index = 0; index < frameCount; index += 1) {
      samples[index] = Math.random() * 2 - 1;
    }

    return buffer;
  }
}
