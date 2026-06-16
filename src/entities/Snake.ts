import type { Point } from '../utils/Constants';
import { Direction } from '../engine/InputManager';
import { EventBus } from '../engine/EventBus';

export class Snake {
    private body: Point[] = [];
    private prevBody: Point[] = [];
    private direction: Direction = Direction.RIGHT;
    private growing: number = 0;
    private isInvulnerable: boolean = false;

    constructor(startPos: Point, initialLength: number = 3) {
        for (let i = 0; i < initialLength; i++) {
            this.body.push({ x: startPos.x - i, y: startPos.y });
        }
        this.prevBody = JSON.parse(JSON.stringify(this.body));
    }

    move(newHead: Point) {
        this.prevBody = JSON.parse(JSON.stringify(this.body));
        this.body.unshift(newHead);
        if (this.growing > 0) {
            this.growing--;
        } else {
            this.body.pop();
        }
    }

    grow(amount: number) {
        this.growing += amount;
    }

    shrink(amount: number) {
        this.prevBody = JSON.parse(JSON.stringify(this.body));
        for (let i = 0; i < amount && this.body.length > 2; i++) {
            this.body.pop();
        }
    }

    cutTail(atIndex: number) {
        if (atIndex > 0 && atIndex < this.body.length) {
            this.prevBody = JSON.parse(JSON.stringify(this.body));
            this.body = this.body.slice(0, atIndex);
            EventBus.emit('tail_cut', { length: this.body.length });
        }
    }

    getHead(): Point {
        return this.body[0];
    }

    getBody(): Point[] {
        return this.body;
    }

    getPrevBody(): Point[] {
        return this.prevBody;
    }

    setDirection(dir: Direction) {
        this.direction = dir;
    }

    getDirection(): Direction {
        return this.direction;
    }

    checkCollision(pos: Point, includeHead: boolean = true): number {
        for (let i = includeHead ? 0 : 1; i < this.body.length; i++) {
            if (this.body[i].x === pos.x && this.body[i].y === pos.y) {
                return i;
            }
        }
        return -1;
    }

    setInvulnerability(value: boolean) {
        this.isInvulnerable = value;
    }

    getInvulnerability(): boolean {
        return this.isInvulnerable;
    }
}
