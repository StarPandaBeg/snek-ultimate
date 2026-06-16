import { EventBus } from '../engine/EventBus';
import { AudioManager } from '../engine/AudioManager';

export class HudUI {
    private container: HTMLElement;
    private hudElement: HTMLElement | null = null;
    private pauseMenu: HTMLElement | null = null;
    private fps: number = 0;
    private lastFpsUpdate: number = 0;
    private frameCount: number = 0;

    constructor() {
        this.container = document.getElementById('ui-layer')!;
        EventBus.on('game_started', () => this.renderHud());
        EventBus.on('ui_update', (data: any) => this.updateValues(data));
        EventBus.on('pause_game', () => this.togglePauseMenu());
        EventBus.on('resume_game', () => this.togglePauseMenu());
        EventBus.on('game_over', () => {
            if (this.hudElement) {
                this.hudElement.remove();
                this.hudElement = null;
            }
            if (this.pauseMenu) {
                this.pauseMenu.remove();
                this.pauseMenu = null;
            }
        });
        
        requestAnimationFrame(this.updateFps);
    }

    private renderHud() {
        if (this.hudElement) this.hudElement.remove();

        this.hudElement = document.createElement('div');
        this.hudElement.className = 'hud-container-new';
        this.hudElement.innerHTML = `
            <div id="status-vignette" class="vignette"></div>
            <div class="hud-left">
                <div id="hud-lives" class="hud-lives"></div>
                <div id="hud-status" class="status-container"></div>
            </div>
            <div class="hud-center">
                <div class="hud-score-label">СЧЕТ</div>
                <div id="hud-score" class="hud-score-value">0</div>
            </div>
            <div class="hud-right">
                <div class="hud-info-item">ВРЕМЯ: <span id="hud-time">0:00</span></div>
                <div class="hud-info-item">РЕКОРД: <span id="hud-highscore">0</span></div>
                <div class="hud-info-item">ДЛИНА: <span id="hud-length">3</span></div>
                <div class="hud-info-item">FPS: <span id="hud-fps">60</span></div>
                <button id="sound-btn" class="pause-btn-new">${AudioManager.isEnabled() ? '🔊' : '🔇'}</button>
                <button id="pause-btn" class="pause-btn-new">II</button>
            </div>
        `;
        this.container.appendChild(this.hudElement);
        
        document.getElementById('pause-btn')?.addEventListener('click', () => EventBus.emit('pause_game'));
        document.getElementById('sound-btn')?.addEventListener('click', (e) => {
            const btn = e.target as HTMLButtonElement;
            const enabled = !AudioManager.isEnabled();
            AudioManager.setEnabled(enabled);
            btn.innerText = enabled ? '🔊' : '🔇';
        });
    }

    private togglePauseMenu() {
        if (this.pauseMenu) {
            this.pauseMenu.remove();
            this.pauseMenu = null;
        } else {
            this.pauseMenu = document.createElement('div');
            this.pauseMenu.className = 'glass-panel fade-in game-over';
            this.pauseMenu.innerHTML = `
                <div class="section-title">ПАУЗА</div>
                <div class="menu-footer" style="width: 100%">
                    <button id="resume-btn" class="primary" style="width: 100%">ПРОДОЛЖИТЬ</button>
                    <button id="quit-btn" style="width: 100%; margin-top: 0.5rem">ВЫЙТИ В МЕНЮ</button>
                </div>
            `;
            this.container.appendChild(this.pauseMenu);
            
            document.getElementById('resume-btn')?.addEventListener('click', () => EventBus.emit('resume_game'));
            document.getElementById('quit-btn')?.addEventListener('click', () => {
                EventBus.emit('back_to_menu');
                if (this.hudElement) this.hudElement.remove();
                if (this.pauseMenu) this.pauseMenu.remove();
            });
        }
    }

    private updateValues(data: any) {
        if (!this.hudElement) return;
        const scoreEl = document.getElementById('hud-score');
        const highscoreEl = document.getElementById('hud-highscore');
        const lengthEl = document.getElementById('hud-length');
        const timeEl = document.getElementById('hud-time');
        const statusEl = document.getElementById('hud-status');
        const vignetteEl = document.getElementById('status-vignette');
        const livesEl = document.getElementById('hud-lives');
        
        if (scoreEl) {
            const oldScore = parseInt(scoreEl.innerText);
            const newScore = Math.floor(data.score);
            if (newScore !== oldScore && !isNaN(oldScore)) {
                this.showScorePopup(newScore - oldScore);
            }
            scoreEl.innerText = newScore.toString();
        }
        if (highscoreEl) highscoreEl.innerText = data.highscore.toString();
        if (lengthEl) lengthEl.innerText = data.length.toString();
        
        if (timeEl && data.playTime !== undefined) {
            const mins = Math.floor(data.playTime / 60);
            const secs = data.playTime % 60;
            timeEl.innerText = `${mins}:${secs.toString().padStart(2, '0')}`;
        }

        if (statusEl) {
            const statuses = [];
            if (data.isSprinting) statuses.push('<div class="status-badge sprint">СПРИНТ</div>');
            if (data.isSpedUp) statuses.push('<div class="status-badge speed">УСКОРЕНИЕ</div>');
            if (data.isSlowedDown) statuses.push('<div class="status-badge slow">ЗАМЕДЛЕНИЕ</div>');
            
            statusEl.innerHTML = statuses.join('');
            statusEl.style.display = statuses.length > 0 ? 'flex' : 'none';
        }

        if (vignetteEl) {
            vignetteEl.className = 'vignette';
            if (data.isSprinting) vignetteEl.classList.add('vignette-sprint');
            else if (data.isSpedUp) vignetteEl.classList.add('vignette-speed');
            else if (data.isSlowedDown) vignetteEl.classList.add('vignette-slow');
        }

        if (livesEl && data.lives !== undefined) {
            let livesHtml = '';
            for (let i = 0; i < data.lives; i++) {
                livesHtml += '<div class="life-circle"></div>';
            }
            livesEl.innerHTML = livesHtml;
        }
    }

    private showScorePopup(delta: number) {
        if (Math.abs(delta) <= 1) return; // Skip small continuous changes (+1/-1 from float math)

        const center = document.querySelector('.hud-center');
        if (!center) return;

        const popup = document.createElement('div');
        popup.className = `score-popup ${delta > 0 ? 'plus' : 'minus'}`;
        popup.innerText = `${delta > 0 ? '+' : ''}${delta}`;
        
        center.appendChild(popup);
        
        // Remove after animation
        setTimeout(() => popup.remove(), 800);
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
