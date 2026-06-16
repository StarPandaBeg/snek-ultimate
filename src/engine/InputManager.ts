import type { Point } from '../utils/Constants';

export enum Direction {
    UP,
    DOWN,
    LEFT,
    RIGHT
}

export class InputManager {
    private currentDirection: Direction = Direction.RIGHT;
    private inputQueue: Direction[] = [];
    private touchStart: Point | null = null;
    private hasMoved: boolean = false;

    constructor() {
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        window.addEventListener('touchend', this.handleTouchEnd, { passive: false });
        window.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    }

    private handleKeyDown = (e: KeyboardEvent) => {
        let newDir: Direction | null = null;
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W': newDir = Direction.UP; break;
            case 'ArrowDown':
            case 's':
            case 'S': newDir = Direction.DOWN; break;
            case 'ArrowLeft':
            case 'a':
            case 'A': newDir = Direction.LEFT; break;
            case 'ArrowRight':
            case 'd':
            case 'D': newDir = Direction.RIGHT; break;
        }

        if (newDir !== null) {
            this.enqueueDirection(newDir);
        }
    };

    private enqueueDirection(newDir: Direction) {
        const lastDir = this.inputQueue.length > 0 
            ? this.inputQueue[this.inputQueue.length - 1] 
            : this.currentDirection;

        // Prevent 180 degree turns
        if (
            (newDir === Direction.UP && lastDir !== Direction.DOWN) ||
            (newDir === Direction.DOWN && lastDir !== Direction.UP) ||
            (newDir === Direction.LEFT && lastDir !== Direction.RIGHT) ||
            (newDir === Direction.RIGHT && lastDir !== Direction.LEFT)
        ) {
            if (this.inputQueue.length < 2) { // Buffer up to 2 moves
                this.inputQueue.push(newDir);
                this.hasMoved = true;
            }
        }
    }

    private handleTouchStart = (e: TouchEvent) => {
        if (e.touches.length > 0) {
            this.touchStart = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
        }
    };

    private handleTouchEnd = (e: TouchEvent) => {
        if (!this.touchStart || e.changedTouches.length === 0) return;

        const touchEnd = {
            x: e.changedTouches[0].clientX,
            y: e.changedTouches[0].clientY
        };

        const dx = touchEnd.x - this.touchStart.x;
        const dy = touchEnd.y - this.touchStart.y;

        if (Math.abs(dx) > Math.abs(dy)) {
            if (Math.abs(dx) > 30) {
                this.enqueueDirection(dx > 0 ? Direction.RIGHT : Direction.LEFT);
            }
        } else {
            if (Math.abs(dy) > 30) {
                this.enqueueDirection(dy > 0 ? Direction.DOWN : Direction.UP);
            }
        }

        this.touchStart = null;
    };

    getDirection(): Direction {
        if (this.inputQueue.length > 0) {
            this.currentDirection = this.inputQueue.shift()!;
        }
        return this.currentDirection;
    }

    peekDirection(): Direction {
        return this.inputQueue.length > 0 ? this.inputQueue[0] : this.currentDirection;
    }

    isMoving(): boolean {
        return this.hasMoved;
    }

    reset() {
        this.currentDirection = Direction.RIGHT;
        this.inputQueue = [];
        this.hasMoved = false;
    }
}
