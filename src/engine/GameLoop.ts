export class GameLoop {
    private lastTime: number = 0;
    private accumulator: number = 0;
    private step: number = 1000 / 60; // 60 FPS update
    private isRunning: boolean = false;
    private rafId: number | null = null;

    constructor(
        private update: (dt: number) => void,
        private render: (interpolation: number) => void
    ) {}

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.rafId = requestAnimationFrame(this.loop);
    }

    stop() {
        this.isRunning = false;
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    private loop = (currentTime: number) => {
        if (!this.isRunning) return;

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.accumulator += deltaTime;

        while (this.accumulator >= this.step) {
            this.update(this.step);
            this.accumulator -= this.step;
        }

        this.render(this.accumulator / this.step);
        this.rafId = requestAnimationFrame(this.loop);
    };

    setStep(ms: number) {
        this.step = ms;
    }
}
