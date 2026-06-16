export class AudioManager {
    private static ctx: AudioContext | null = null;
    private static enabled: boolean = true;

    private static init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    }

    static setEnabled(value: boolean) {
        this.enabled = value;
    }

    static isEnabled(): boolean {
        return this.enabled;
    }

    private static playTone(freq: number, type: OscillatorType, duration: number, volume: number = 0.1) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    static playEat() {
        this.playTone(600, 'sine', 0.1, 0.1);
        setTimeout(() => this.playTone(900, 'sine', 0.1, 0.08), 50);
    }

    static playPoison() {
        this.playTone(300, 'sawtooth', 0.2, 0.15);
        setTimeout(() => this.playTone(200, 'sawtooth', 0.3, 0.2), 100);
        setTimeout(() => this.playTone(150, 'sawtooth', 0.4, 0.2), 200);
    }

    static playWatermelon() {
        this.playTone(400, 'square', 0.1, 0.1);
        setTimeout(() => this.playTone(600, 'square', 0.1, 0.1), 100);
        setTimeout(() => this.playTone(800, 'sine', 0.2, 0.15), 200);
        setTimeout(() => this.playTone(1200, 'sine', 0.4, 0.1), 300);
    }

    static playHit() {
        this.playTone(150, 'sawtooth', 0.3, 0.2);
        this.playTone(100, 'square', 0.2, 0.15);
    }

    static playLevelStart() {
        this.playTone(400, 'square', 0.1, 0.05);
        setTimeout(() => this.playTone(500, 'square', 0.1, 0.05), 100);
        setTimeout(() => this.playTone(600, 'square', 0.2, 0.05), 200);
    }

    static playPortal() {
        this.playTone(800, 'sine', 0.4, 0.1);
        const now = this.ctx?.currentTime || 0;
        if (this.ctx) {
             // Create a slide effect
             const osc = this.ctx.createOscillator();
             const gain = this.ctx.createGain();
             osc.frequency.setValueAtTime(400, now);
             osc.frequency.exponentialRampToValueAtTime(1200, now + 0.4);
             gain.gain.setValueAtTime(0.1, now);
             gain.gain.linearRampToValueAtTime(0, now + 0.4);
             osc.connect(gain);
             gain.connect(this.ctx.destination);
             osc.start();
             osc.stop(now + 0.4);
        }
    }
}
