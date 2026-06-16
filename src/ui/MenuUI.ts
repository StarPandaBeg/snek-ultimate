import { EventBus } from '../engine/EventBus';
import { Settings } from '../game/Settings';
import type { GameSettings } from '../game/Settings';
import { FieldShape, FieldSize, FoodQuantity, GameSpeed, ObstacleQuantity } from '../utils/Constants';

export class MenuUI {
    private container: HTMLElement;

    constructor() {
        this.container = document.getElementById('ui-layer')!;
        this.renderMenu();
        
        EventBus.on('game_over', (data: { score: number, playTime?: number }) => {
            setTimeout(() => this.renderGameOver(data.score, data.playTime), 1000);
        });
        EventBus.on('game_started', () => this.container.innerHTML = '');
        EventBus.on('back_to_menu', () => this.renderMenu());
    }

    private renderMenu() {
        this.container.innerHTML = `
            <div class="glass-panel fade-in">
                <div class="logo-container">
                    <img src="./src/assets/logo.png" alt="Snake Ultimate" class="logo">
                </div>
                
                <div class="menu-sections">
                    <!-- Column 1: Game & World -->
                    <div class="menu-section">
                        <div class="section-title">МИР</div>
                        ${this.renderSettingRow('Имя игрока', 'playerName', 'text')}
                        ${this.renderSettingRow('Размер поля', 'fieldSize', 'choice')}
                        ${this.renderSettingRow('Форма поля', 'fieldShape', 'choice')}
                        ${this.renderSettingRow('Бесконечное поле', 'isInfinite', 'boolean')}
                    </div>

                    <!-- Column 2: Obstacles & Entities -->
                    <div class="menu-section">
                        <div class="section-title">ОБЪЕКТЫ</div>
                        ${this.renderSettingRow('Количество еды', 'foodQuantity', 'choice')}
                        ${this.renderSettingRow('Разные фрукты', 'diverseFruits', 'boolean')}
                        ${this.renderSettingRow('Пеньки', 'woodenBoxes', 'choice')}
                        ${this.renderSettingRow('Камни', 'ironBoxes', 'choice')}
                    </div>

                    <!-- Column 3: Mechanics & Speed -->
                    <div class="menu-section">
                        <div class="section-title">МЕХАНИКА</div>
                        ${this.renderSettingRow('Телепорты', 'teleports', 'choice')}
                        ${this.renderSettingRow('Откусить хвост', 'biteTail', 'boolean')}
                        ${this.renderSettingRow('Режим разрушения', 'destructionMode', 'boolean')}
                        ${this.renderSettingRow('Скорость', 'speed', 'choice')}
                    </div>
                </div>

                <div class="menu-footer">
                    <div class="main-btns">
                        <button id="start-btn" class="primary">ИГРАТЬ</button>
                        <button id="random-btn">РАНДОМ</button>
                        <button id="reset-btn">СБРОС</button>
                    </div>
                </div>
            </div>
        `;

        this.setupListeners();
    }

    private renderSettingRow(label: string, key: keyof GameSettings, type: 'text' | 'choice' | 'boolean') {
        const settings = Settings.get();
        const value = settings[key];

        let control = '';
        if (type === 'text') {
            control = `<input type="text" id="setting-${String(key)}" value="${value}">`;
        } else {
            const displayValue = type === 'boolean' ? (value ? 'Да' : 'Нет') : value;
            control = `
                <div class="choice-control">
                    <button class="arrow-btn" data-key="${String(key)}" data-dir="${type === 'boolean' ? 'toggle' : 'prev'}">&lt;</button>
                    <span id="value-${String(key)}">${displayValue}</span>
                    <button class="arrow-btn" data-key="${String(key)}" data-dir="${type === 'boolean' ? 'toggle' : 'next'}">&gt;</button>
                </div>
            `;
        }

        return `
            <div class="setting-row">
                <label>${label}</label>
                ${control}
            </div>
        `;
    }

    private setupListeners() {
        document.getElementById('start-btn')?.addEventListener('click', () => EventBus.emit('start_game'));
        document.getElementById('random-btn')?.addEventListener('click', () => {
            Settings.randomize();
            this.renderMenu();
        });
        document.getElementById('reset-btn')?.addEventListener('click', () => {
            Settings.reset();
            this.renderMenu();
        });

        const playerInput = document.getElementById('setting-playerName') as HTMLInputElement;
        playerInput?.addEventListener('change', () => Settings.update({ playerName: playerInput.value }));

        this.container.querySelectorAll('.arrow-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLButtonElement;
                const key = target.dataset.key as keyof GameSettings;
                const dir = target.dataset.dir;
                this.handleArrowClick(key, dir!);
            });
        });
    }

    private handleArrowClick(key: keyof GameSettings, dir: string) {
        const settings = Settings.get();
        const value = settings[key];

        if (typeof value === 'boolean') {
            const newValue = !value;
            Settings.update({ [key]: newValue });
            const span = document.getElementById(`value-${String(key)}`);
            if (span) span.innerText = newValue ? 'Да' : 'Нет';
        } else {
            let options: any[] = [];
            switch (key) {
                case 'fieldSize': options = Object.values(FieldSize); break;
                case 'fieldShape': options = Object.values(FieldShape); break;
                case 'foodQuantity': options = Object.values(FoodQuantity); break;
                case 'woodenBoxes': options = Object.values(ObstacleQuantity); break;
                case 'ironBoxes': options = Object.values(ObstacleQuantity); break;
                case 'teleports': options = Object.values(ObstacleQuantity); break;
                case 'speed': options = Object.values(GameSpeed); break;
            }

            const currentIdx = options.indexOf(value as any);
            let nextIdx = currentIdx;
            if (dir === 'next') nextIdx = (currentIdx + 1) % options.length;
            if (dir === 'prev') nextIdx = (currentIdx - 1 + options.length) % options.length;
            
            const newValue = options[nextIdx];
            Settings.update({ [key]: newValue });
            const span = document.getElementById(`value-${String(key)}`);
            if (span) span.innerText = String(newValue);
        }
    }

    private renderGameOver(score: number, playTime?: number) {
        let timeString = '';
        if (playTime !== undefined) {
            const mins = Math.floor(playTime / 60);
            const secs = playTime % 60;
            timeString = `<p style="font-size: 0.5rem; color: #aaa; margin-top: -1rem; margin-bottom: 1.5rem;">ВРЕМЯ: ${mins}:${secs.toString().padStart(2, '0')}</p>`;
        }

        this.container.innerHTML = `
            <div class="glass-panel fade-in game-over">
                <div class="section-title">РЕЗУЛЬТАТ</div>
                <p>ВАШ СЧЕТ</p>
                <span class="score-value">${score}</span>
                ${timeString}
                <div class="menu-footer" style="width: 100%">
                    <button id="restart-btn" class="primary" style="width: 100%">ПОВТОРИТЬ</button>
                    <button id="menu-btn" style="width: 100%; margin-top: 0.5rem">МЕНЮ</button>
                </div>
            </div>
        `;

        document.getElementById('restart-btn')?.addEventListener('click', () => EventBus.emit('restart_game'));
        document.getElementById('menu-btn')?.addEventListener('click', () => EventBus.emit('back_to_menu'));
    }
}
