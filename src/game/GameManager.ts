import { GameState, FieldSizeMap, FoodQuantityMap, GameSpeedMap, ObstacleQuantityMap, FoodType, ObstacleQuantity } from '../utils/Constants';
import type { Point } from '../utils/Constants';
import { EventBus } from '../engine/EventBus';
import { InputManager, Direction } from '../engine/InputManager';
import { MapManager } from './MapManager';
import { Snake } from '../entities/Snake';
import { Settings } from './Settings';
import { Renderer } from '../engine/Renderer';
import { GameLoop } from '../engine/GameLoop';
import { AudioManager } from '../engine/AudioManager';

export class GameManager {
    private state: GameState = GameState.MENU;
    private inputManager: InputManager;
    private mapManager: MapManager;
    private snake!: Snake;
    private foods: { pos: Point, type: FoodType, lifeTime?: number }[] = [];
    private obstacles: { pos: Point, type: 'wood' | 'iron' }[] = [];
    private portals: { pos: Point, color: string, partnerIdx: number }[] = [];
    private score: number = 0;
    private highscore: number = 0;
    private playTime: number = 0;
    private gameLoop: GameLoop;
    private moveTimer: number = 0;

    constructor(private renderer: Renderer) {
        this.inputManager = new InputManager();
        this.mapManager = new MapManager();
        this.gameLoop = new GameLoop(this.update, this.render);
        
        this.highscore = parseInt(localStorage.getItem('snake_highscore') || '0');
        
        EventBus.on('start_game', () => this.start());
        EventBus.on('pause_game', () => this.togglePause());
        EventBus.on('resume_game', () => this.togglePause());
        EventBus.on('restart_game', () => this.start());
        EventBus.on('back_to_menu', () => this.state = GameState.MENU);
    }

    start() {
        const settings = Settings.get();
        const size = FieldSizeMap[settings.fieldSize];
        this.mapManager.generate(size, size, settings.fieldShape);
        
        const startPos = this.mapManager.getRandomWalkableCell();
        this.snake = new Snake(startPos);
        this.inputManager.reset();
        
        this.foods = [];
        this.obstacles = [];
        this.portals = [];
        this.score = 0;
        this.playTime = 0;
        this.moveTimer = 0;
        
        this.generateEntities();
        
        this.state = GameState.PLAYING;
        this.gameLoop.start();
        AudioManager.playLevelStart();
        EventBus.emit('game_started');
    }

    private generateEntities() {
        const settings = Settings.get();
        const walkable = Array.from(this.mapManager.getWalkableCells());
        const totalCells = walkable.length;

        const head = this.snake.getHead();
        const safetyZone = new Set<string>();
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                safetyZone.add(`${head.x + dx},${head.y + dy}`);
            }
        }

        const woodenCount = Math.floor(totalCells * ObstacleQuantityMap[settings.woodenBoxes]);
        const ironCount = Math.floor(totalCells * ObstacleQuantityMap[settings.ironBoxes]);
        
        for (let i = 0; i < woodenCount + ironCount; i++) {
            const pos = this.mapManager.getRandomWalkableCell();
            if (this.isCellEmpty(pos) && !safetyZone.has(`${pos.x},${pos.y}`)) {
                this.obstacles.push({ pos, type: i < woodenCount ? 'wood' : 'iron' });
            }
        }

        const portalPairs = settings.teleports === ObstacleQuantity.NONE ? 0 : 1;
        for (let i = 0; i < portalPairs; i++) {
            const pos1 = this.mapManager.getRandomWalkableCell();
            const pos2 = this.mapManager.getRandomWalkableCell();
            if (this.isCellEmpty(pos1) && this.isCellEmpty(pos2) && 
                !safetyZone.has(`${pos1.x},${pos1.y}`) && !safetyZone.has(`${pos2.x},${pos2.y}`)) {
                const color = `hsl(${Math.random() * 360}, 70%, 60%)`;
                this.portals.push({ pos: pos1, color, partnerIdx: this.portals.length + 1 });
                this.portals.push({ pos: pos2, color, partnerIdx: this.portals.length - 1 });
            }
        }

        this.spawnFood();
    }

    private spawnFood() {
        const settings = Settings.get();
        const maxFood = FoodQuantityMap[settings.foodQuantity];
        while (this.foods.length < maxFood) {
            let type = this.getRandomFoodType();
            
            // Only 1 watermelon allowed at a time
            if (type === FoodType.WATERMELON && this.foods.some(f => f.type === FoodType.WATERMELON)) {
                type = FoodType.APPLE; // Fallback to apple
            }
            
            let pos = this.mapManager.getRandomWalkableCell();
            
            // For watermelon (2x2), we need 4 empty cells
            if (type === FoodType.WATERMELON) {
                let found = false;
                for (let attempts = 0; attempts < 50; attempts++) {
                    pos = this.mapManager.getRandomWalkableCell();
                    if (this.isCellEmpty(pos) &&
                        this.isCellEmpty({ x: pos.x + 1, y: pos.y }) &&
                        this.isCellEmpty({ x: pos.x, y: pos.y + 1 }) &&
                        this.isCellEmpty({ x: pos.x + 1, y: pos.y + 1 })) {
                        found = true;
                        break;
                    }
                }
                if (!found) continue; // skip spawning watermelon if no space
                this.foods.push({ pos, type, lifeTime: 8000 }); // 8 seconds lifetime
            } else {
                if (this.isCellEmpty(pos)) {
                    this.foods.push({ pos, type });
                }
            }
        }
    }

    private getRandomFoodType(): FoodType {
        const settings = Settings.get();
        if (!settings.diverseFruits) return FoodType.APPLE;
        
        const r = Math.random();
        if (r < 0.05) return FoodType.GOLDEN_APPLE;
        if (r < 0.15) return FoodType.POISON_MUSHROOM;
        if (r < 0.3) return FoodType.WATERMELON;
        if (r < 0.5) return FoodType.BANANA;
        if (r < 0.7) return FoodType.CHERRY;
        if (r < 0.85) return FoodType.PEAR;
        return FoodType.APPLE;
    }

    private isCellEmpty(pos: Point): boolean {
        if (this.snake.checkCollision(pos) !== -1) return false;
        if (this.foods.some(f => f.pos.x === pos.x && f.pos.y === pos.y)) return false;
        if (this.obstacles.some(o => o.pos.x === pos.x && o.pos.y === pos.y)) return false;
        if (this.portals.some(p => p.pos.x === pos.x && p.pos.y === pos.y)) return false;
        return true;
    }

    private togglePause() {
        if (this.state === GameState.PLAYING) {
            this.state = GameState.PAUSED;
        } else if (this.state === GameState.PAUSED) {
            this.state = GameState.PLAYING;
        }
    }

    update = (dt: number) => {
        if (this.state === GameState.MENU) return;
        this.renderer.particles.update(dt);
        
        if (this.state === GameState.PLAYING) {
            if (!this.inputManager.isMoving()) return;

            this.playTime += dt;

            // Update food lifetimes
            for (let i = this.foods.length - 1; i >= 0; i--) {
                if (this.foods[i].lifeTime !== undefined) {
                    this.foods[i].lifeTime! -= dt;
                    if (this.foods[i].lifeTime! <= 0) {
                        this.foods.splice(i, 1);
                        this.spawnFood(); // Spawn a new one to replace it
                    }
                }
            }

            const settings = Settings.get();
            const speed = GameSpeedMap[settings.speed];
            this.moveTimer += dt;

            if (this.moveTimer >= speed) {
                this.moveTimer = 0;
                this.tick();
            }
            
            // Emit UI update every frame while playing for smooth time
            EventBus.emit('ui_update', { 
                score: this.score, 
                highscore: this.highscore, 
                length: this.snake.getBody().length,
                playTime: Math.floor(this.playTime / 1000)
            });
        }
    };

    private tick() {
        const dir = this.inputManager.getDirection();
        const head = this.snake.getHead();
        let nextHead = { ...head };

        switch (dir) {
            case Direction.UP: nextHead.y--; break;
            case Direction.DOWN: nextHead.y++; break;
            case Direction.LEFT: nextHead.x--; break;
            case Direction.RIGHT: nextHead.x++; break;
        }

        const settings = Settings.get();
        const { width, height } = this.mapManager.getDimensions();

        if (settings.isInfinite) {
            nextHead.x = (nextHead.x + width) % width;
            nextHead.y = (nextHead.y + height) % height;
            if (!this.mapManager.isWalkable(nextHead.x, nextHead.y)) {
                this.gameOver();
                return;
            }
        } else {
            if (nextHead.x < 0 || nextHead.x >= width || nextHead.y < 0 || nextHead.y >= height || !this.mapManager.isWalkable(nextHead.x, nextHead.y)) {
                this.gameOver();
                return;
            }
        }

        const portal = this.portals.find(p => p.pos.x === nextHead.x && p.pos.y === nextHead.y);
        if (portal) {
            AudioManager.playPortal();
            const partner = this.portals[portal.partnerIdx];
            if (partner) {
                nextHead = { ...partner.pos };
                switch (dir) {
                    case Direction.UP: nextHead.y--; break;
                    case Direction.DOWN: nextHead.y++; break;
                    case Direction.LEFT: nextHead.x--; break;
                    case Direction.RIGHT: nextHead.x++; break;
                }
                if (settings.isInfinite) {
                    nextHead.x = (nextHead.x + width) % width;
                    nextHead.y = (nextHead.y + height) % height;
                }
                if (!this.mapManager.isWalkable(nextHead.x, nextHead.y)) {
                    this.gameOver();
                    return;
                }
            }
        }

        const obstacleIdx = this.obstacles.findIndex(o => o.pos.x === nextHead.x && o.pos.y === nextHead.y);
        if (obstacleIdx !== -1) {
            const obs = this.obstacles[obstacleIdx];
            if (obs.type === 'wood') {
                this.screenShake();
                if (settings.destructionMode && this.snake.getBody().length > 5) {
                    this.obstacles.splice(obstacleIdx, 1);
                    this.score += 50;
                    this.renderer.particles.emit(nextHead, '#d35400', 15);
                    AudioManager.playHit();
                } else {
                    if (this.snake.getBody().length > 2) {
                        this.snake.shrink(1);
                        this.obstacles.splice(obstacleIdx, 1);
                        this.renderer.particles.emit(nextHead, '#d35400', 10);
                        this.score -= 20;
                        AudioManager.playHit();
                    } else {
                        this.gameOver();
                        return;
                    }
                }
            } else {
                this.gameOver();
                return;
            }
        }

        const selfIdx = this.snake.checkCollision(nextHead);
        if (selfIdx !== -1) {
            if (settings.biteTail) {
                AudioManager.playHit();
                this.snake.cutTail(selfIdx);
                this.screenShake();
            } else {
                this.gameOver();
                return;
            }
        }

        const foodIdx = this.foods.findIndex(f => {
            if (f.type === FoodType.WATERMELON) {
                return (nextHead.x === f.pos.x || nextHead.x === f.pos.x + 1) && 
                       (nextHead.y === f.pos.y || nextHead.y === f.pos.y + 1);
            }
            return f.pos.x === nextHead.x && f.pos.y === nextHead.y;
        });
        
        if (foodIdx !== -1) {
            const food = this.foods[foodIdx];
            this.applyFoodEffect(food.type);
            this.renderer.particles.emit(food.pos, this.renderer.getFoodColor(food.type), 15);
            
            if (food.type === FoodType.POISON_MUSHROOM) {
                AudioManager.playPoison();
            } else if (food.type === FoodType.WATERMELON) {
                AudioManager.playWatermelon();
            } else {
                AudioManager.playEat();
            }
            
            this.foods.splice(foodIdx, 1);
            this.spawnFood();
            this.score += 10;
            EventBus.emit('food_eaten', { type: food.type, score: this.score });
        }

        this.snake.move(nextHead);
        this.score += 1;
        if (this.score > this.highscore) {
            this.highscore = this.score;
            localStorage.setItem('snake_highscore', this.highscore.toString());
        }
    }

    private applyFoodEffect(type: FoodType) {
        switch (type) {
            case FoodType.APPLE: this.snake.grow(1); break;
            case FoodType.CHERRY: this.snake.grow(2); break;
            case FoodType.BANANA: this.snake.grow(3); break;
            case FoodType.PEAR: this.snake.grow(1); break;
            case FoodType.WATERMELON: this.snake.grow(5); break;
            case FoodType.GOLDEN_APPLE: 
                this.snake.grow(10);
                this.score += 100;
                break;
            case FoodType.POISON_MUSHROOM: 
                if (this.snake.getBody().length > 3) {
                    this.snake.shrink(2);
                }
                this.score -= 50;
                break;
        }
    }

    private screenShake() {
        const canvas = this.renderer.getCanvas();
        canvas.classList.remove('shake');
        void canvas.offsetWidth; // trigger reflow
        canvas.classList.add('shake');
    }

    private gameOver() {
        if (this.state === GameState.GAME_OVER) return;
        this.state = GameState.GAME_OVER;
        
        this.snake.getBody().forEach(part => {
            this.renderer.particles.emit(part, '#ff0055', 15); // Red explosion
            this.renderer.particles.emit(part, '#ffaa00', 8);  // Orange/yellow sparks
        });
        
        AudioManager.playHit();
        this.screenShake();
        EventBus.emit('game_over', { score: this.score, playTime: Math.floor(this.playTime / 1000) });
    }

    render = (_interpolation: number) => {
        this.renderer.clear();
        this.renderer.setDimensions(this.mapManager.getDimensions().width, this.mapManager.getDimensions().height);
        this.renderer.drawGrid(this.mapManager.getWalkableCells());
        
        if (this.state !== GameState.MENU) {
            this.renderer.drawPortals(this.portals);
            this.renderer.drawObstacles(this.obstacles);
            this.renderer.drawFood(this.foods);
            
            if (this.snake && this.state === GameState.PLAYING) {
                const settings = Settings.get();
                const speed = GameSpeedMap[settings.speed];
                const snakeInterpolation = this.inputManager.isMoving() ? this.moveTimer / speed : 0;
                this.renderer.drawSnake(this.snake, snakeInterpolation, this.mapManager.getWalkableCells());
            }
        }
        
        this.renderer.drawParticles();
    };
}
