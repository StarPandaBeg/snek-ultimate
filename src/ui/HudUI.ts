import { EventBus } from '../engine/EventBus';

export class HudUI {
    private container: HTMLElement;
    private hudElement: HTMLElement | null = null;
    private fps: number = 0;
    private lastFpsUpdate: number = 0;
    private frameCount: number = 0;

    constructor() {
        this.container = document.getElementById('ui-layer')!;
        EventBus.on('game_started', () => this.renderHud());
        EventBus.on('ui_update', (data: any) => this.updateValues(data));
        EventBus.on('game_over', () => {
            if (this.hudElement) {
                this.hudElement.remove();
                this.hudElement = null;
            }
        });
        
        requestAnimationFrame(this.updateFps);
    }

    private renderHud() {
        if (this.hudElement) this.hudElement.remove();

        this.hudElement = document.createElement('div');
        this.hudElement.className = 'hud-container-new';
        this.hudElement.innerHTML = `
            <div class="hud-center">
                <div class="hud-score-label">СЧЕТ</div>
                <div id="hud-score" class="hud-score-value">0</div>
            </div>
            <div class="hud-right">
                <div class="hud-info-item">РЕКОРД: <span id="hud-highscore">0</span></div>
                <div class="hud-info-item">ДЛИНА: <span id="hud-length">3</span></div>
                <div class="hud-info-item">FPS: <span id="hud-fps">60</span></div>
                <button id="pause-btn" class="pause-btn-new">II</button>
            </div>
        `;
        this.container.appendChild(this.hudElement);
        
        document.getElementById('pause-btn')?.addEventListener('click', () => EventBus.emit('pause_game'));
    }

    private updateValues(data: any) {
        if (!this.hudElement) return;
        const scoreEl = document.getElementById('hud-score');
        const highscoreEl = document.getElementById('hud-highscore');
        const lengthEl = document.getElementById('hud-length');
        
        if (scoreEl) scoreEl.innerText = data.score.toString();
        if (highscoreEl) highscoreEl.innerText = data.highscore.toString();
        if (lengthEl) lengthEl.innerText = data.length.toString();
    }

    private updateFps = (time: number) => {
        this.frameCount++;
        if (time - this.lastFpsUpdate > 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (time - this.lastFpsUpdate));
            this.lastFpsUpdate = time;
            this.frameCount = 0;
            
            const fpsEl = document.getElementById('hud-fps');
            if (fpsEl) fpsEl.innerText = this.fps.toString();
        }
        requestAnimationFrame(this.updateFps);
    };
}
