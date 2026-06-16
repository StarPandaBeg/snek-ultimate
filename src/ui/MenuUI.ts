import { EventBus } from "../engine/EventBus";
import { Settings } from "../game/Settings";
import type { GameSettings } from "../game/Settings";
import {
  FieldShape,
  FieldSize,
  FoodQuantity,
  GameSpeed,
  ObstacleQuantity,
} from "../utils/Constants";

export class MenuUI {
  private container: HTMLElement;
  private menuKeys: (keyof GameSettings)[] = [
    "fieldSize",
    "fieldShape",
    "isInfinite",
    "foodQuantity",
    "diverseFruits",
    "woodenBoxes",
    "ironBoxes",
    "teleports",
    "biteTail",
    "speed",
  ];
  private selectedMenuIdx: number = -1;

  constructor() {
    this.container = document.getElementById("ui-layer")!;
    this.renderMenu();

    EventBus.on("game_over", (data: { score: number; playTime?: number }) => {
      this.renderGameOver(data.score, data.playTime);
    });
    EventBus.on("game_started", () => {
      this.container.innerHTML = "";
      this.selectedMenuIdx = -1;
    });
    EventBus.on("back_to_menu", () => {
      this.renderMenu();
    });

    window.addEventListener("keydown", this.handleKeyDown);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (document.querySelector(".game-over")) return; // Skip if game over
    const isMenu = document.querySelector(".glass-panel:not(.game-over)");
    if (!isMenu) return;

    if (e.target instanceof HTMLInputElement) return;

    if (e.key === "ArrowDown") {
      this.selectedMenuIdx = Math.min(
        this.menuKeys.length - 1,
        this.selectedMenuIdx + 1,
      );
      this.highlightRow();
    } else if (e.key === "ArrowUp") {
      this.selectedMenuIdx = Math.max(0, this.selectedMenuIdx - 1);
      this.highlightRow();
    } else if (e.key === "ArrowLeft" && this.selectedMenuIdx >= 0) {
      this.handleArrowClick(this.menuKeys[this.selectedMenuIdx], "prev");
    } else if (e.key === "ArrowRight" && this.selectedMenuIdx >= 0) {
      this.handleArrowClick(this.menuKeys[this.selectedMenuIdx], "next");
    } else if (e.key === "Enter") {
      EventBus.emit("start_game");
    }
  };

  private highlightRow() {
    this.container
      .querySelectorAll(".setting-row")
      .forEach((row) => row.classList.remove("selected"));
    if (this.selectedMenuIdx >= 0) {
      const key = this.menuKeys[this.selectedMenuIdx];
      const row = document.getElementById(`row-${String(key)}`);
      if (row) {
        row.classList.add("selected");
        row.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }

  private renderMenu() {
    this.container.innerHTML = `
          <div class="glass-panel fade-in">
              <div class="logo-container">
                  <img src="./assets/logo.png" alt="Snake Ultimate" class="logo">
              </div>
                
                <div class="menu-sections">
                    <!-- Column 1: Game & World -->
                    <div class="menu-section">
                        <div class="section-title">МИР</div>
                        ${this.renderSettingRow("Имя игрока", "playerName", "text")}
                        ${this.renderSettingRow("Размер поля", "fieldSize", "choice")}
                        ${this.renderSettingRow("Форма поля", "fieldShape", "choice")}
                        ${this.renderSettingRow("Бесконечное поле", "isInfinite", "boolean")}
                    </div>

                    <!-- Column 2: Obstacles & Entities -->
                    <div class="menu-section">
                        <div class="section-title">ОБЪЕКТЫ</div>
                        ${this.renderSettingRow("Количество еды", "foodQuantity", "choice")}
                        ${this.renderSettingRow("Разные фрукты", "diverseFruits", "boolean")}
                        ${this.renderSettingRow("Пеньки", "woodenBoxes", "choice")}
                        ${this.renderSettingRow("Камни", "ironBoxes", "choice")}
                    </div>

                    <!-- Column 3: Mechanics & Speed -->
                    <div class="menu-section">
                        <div class="section-title">МЕХАНИКА</div>
                        ${this.renderSettingRow("Телепорты", "teleports", "choice")}
                        ${this.renderSettingRow("Откусить хвост", "biteTail", "boolean")}
                        ${this.renderSettingRow("Скорость", "speed", "choice")}
                    </div>
                </div>

                <div class="menu-footer">
                    <div class="main-btns">
                        <button id="start-btn" class="primary">ИГРАТЬ</button>
                        <button id="random-btn">РАНДОМ</button>
                        <button id="tutorial-btn">КАК ИГРАТЬ</button>
                    </div>
                </div>
            </div>
        `;

    this.setupListeners();
  }

  private renderTutorial() {
    this.container.innerHTML = `
            <div class="glass-panel fade-in tutorial-panel">
                <div class="section-title" style="text-align: center; font-size: 0.8rem; margin-bottom: 1rem;">КАК ИГРАТЬ</div>
                
                <div class="tutorial-grid">
                    <!-- Rules -->
                    <div class="tutorial-section">
                        <div class="section-title">ПРАВИЛА</div>
                        <p class="tutorial-text">Управляйте змейкой с помощью стрелок или WASD.</p>
                        <p class="tutorial-text">Зажмите Shift для спринта (тратит очки!).</p>
                        <p class="tutorial-text">Собирайте фрукты, чтобы расти и получать очки.</p>
                        <p class="tutorial-text">Избегайте столкновений с камнями и своим хвостом (если не включено откусывание).</p>
                        <p class="tutorial-text">Используйте P для паузы и R для рестарта.</p>
                    </div>

                    <!-- Fruits -->
                    <div class="tutorial-section">
                        <div class="section-title">ФРУКТЫ</div>
                        <div class="tutorial-item"><img src="./assets/food_apple.png"> <span>Яблоко: +1 длина, +10 очков</span></div>
                        <div class="tutorial-item"><img src="./assets/food_cherry.png"> <span>Вишня: +2 длина, +10 очков</span></div>
                        <div class="tutorial-item"><img src="./assets/food_banana.png"> <span>Банан: +3 длина, +10 очков</span></div>
                        <div class="tutorial-item"><img src="./assets/food_golden_apple.png"> <span>Золотое яблоко: +10 длина, +100 очков (появляется на 8 секунд)</span></div>
                        <div class="tutorial-item"><img src="./assets/food_watermelon.png"> <span>Арбуз: Ускорение на 10 сек, +50 очков (появляется на 8 секунд)</span></div>
                        <div class="tutorial-item"><img src="./assets/food_grape.png"> <span>Виноград: +1 жизнь (макс 3), 0 очков (появляется на 8 секунд)</span></div>
                        <div class="tutorial-item"><img src="./assets/food_poison.png"> <span>Баклажан: -2 длина, -50 очков</span></div>
                    </div>

                    <!-- Objects -->
                    <div class="tutorial-section">
                        <div class="section-title">ОБЪЕКТЫ</div>
                        <div class="tutorial-item"><img src="./assets/crate_wood.png"> <span>Пеньки: -1 длина хвоста, -20 очков, пенек ломается</span></div>
                        <div class="tutorial-item"><img src="./assets/crate_metal.png"> <span>Камни: Смертельное столкновение</span></div>
                        <div class="tutorial-item"><img src="./assets/portal_base.png"> <span>Порталы: Перемещают змейку в парный портал того же цвета</span></div>
                    </div>
                </div>

                <div class="menu-footer">
                    <button id="back-btn" class="primary" style="width: 100%;">НАЗАД</button>
                </div>
            </div>
        `;

    document
      .getElementById("back-btn")
      ?.addEventListener("click", () => this.renderMenu());
  }

  private renderSettingRow(
    label: string,
    key: keyof GameSettings,
    type: "text" | "choice" | "boolean",
  ) {
    const settings = Settings.get();
    const value = settings[key];

    let control = "";
    if (type === "text") {
      control = `<input type="text" id="setting-${String(key)}" value="${value}">`;
    } else {
      const displayValue = type === "boolean" ? (value ? "Да" : "Нет") : value;
      control = `
                <div class="choice-control">
                    <button class="arrow-btn" data-key="${String(key)}" data-dir="${type === "boolean" ? "toggle" : "prev"}">&lt;</button>
                    <span id="value-${String(key)}">${displayValue}</span>
                    <button class="arrow-btn" data-key="${String(key)}" data-dir="${type === "boolean" ? "toggle" : "next"}">&gt;</button>
                </div>
            `;
    }

    return `
            <div class="setting-row" id="row-${String(key)}">
                <label>${label}</label>
                ${control}
            </div>
        `;
  }

  private setupListeners() {
    document
      .getElementById("start-btn")
      ?.addEventListener("click", () => EventBus.emit("start_game"));
    document.getElementById("random-btn")?.addEventListener("click", () => {
      Settings.randomize();
      this.renderMenu();
    });
    document.getElementById("tutorial-btn")?.addEventListener("click", () => {
      this.renderTutorial();
    });

    const playerInput = document.getElementById(
      "setting-playerName",
    ) as HTMLInputElement;
    playerInput?.addEventListener("change", () =>
      Settings.update({ playerName: playerInput.value }),
    );

    this.container.querySelectorAll(".arrow-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
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

    if (typeof value === "boolean") {
      const newValue = !value;
      Settings.update({ [key]: newValue });
      const span = document.getElementById(`value-${String(key)}`);
      if (span) span.innerText = newValue ? "Да" : "Нет";
    } else {
      let options: any[] = [];
      switch (key) {
        case "fieldSize":
          options = Object.values(FieldSize);
          break;
        case "fieldShape":
          options = Object.values(FieldShape);
          break;
        case "foodQuantity":
          options = Object.values(FoodQuantity);
          break;
        case "woodenBoxes":
          options = Object.values(ObstacleQuantity);
          break;
        case "ironBoxes":
          options = Object.values(ObstacleQuantity);
          break;
        case "teleports":
          options = Object.values(ObstacleQuantity);
          break;
        case "speed":
          options = Object.values(GameSpeed);
          break;
      }

      const currentIdx = options.indexOf(value as any);
      let nextIdx = currentIdx;
      if (dir === "next") nextIdx = (currentIdx + 1) % options.length;
      if (dir === "prev")
        nextIdx = (currentIdx - 1 + options.length) % options.length;

      const newValue = options[nextIdx];
      Settings.update({ [key]: newValue });
      const span = document.getElementById(`value-${String(key)}`);
      if (span) span.innerText = String(newValue);
    }
  }

  private renderGameOver(score: number, playTime?: number) {
    let timeString = "";
    if (playTime !== undefined) {
      const mins = Math.floor(playTime / 60);
      const secs = playTime % 60;
      timeString = `<p style="font-size: 0.5rem; color: #aaa; margin-top: -1rem; margin-bottom: 1.5rem;">ВРЕМЯ: ${mins}:${secs.toString().padStart(2, "0")}</p>`;
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

    document
      .getElementById("restart-btn")
      ?.addEventListener("click", () => EventBus.emit("restart_game"));
    document
      .getElementById("menu-btn")
      ?.addEventListener("click", () => EventBus.emit("back_to_menu"));
  }
}
