import { FieldShape } from '../utils/Constants';
import type { Point } from '../utils/Constants';

export class MapManager {
    private width: number = 0;
    private height: number = 0;
    private walkableCells: Set<string> = new Set();
    private randomCells: Set<string> | null = null;
    private shape: FieldShape = FieldShape.RECTANGLE;

    generate(width: number, height: number, shape: FieldShape) {
        this.width = width;
        this.height = height;
        this.shape = shape;
        this.walkableCells.clear();
        this.randomCells = null;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (this.isCellInShape(x, y)) {
                    this.walkableCells.add(`${x},${y}`);
                }
            }
        }
    }

    private isCellInShape(x: number, y: number): boolean {
        const centerX = (this.width - 1) / 2;
        const centerY = (this.height - 1) / 2;
        const dx = x - centerX;
        const dy = y - centerY;

        switch (this.shape) {
            case FieldShape.RECTANGLE:
                return true;
            case FieldShape.CIRCLE:
                const radius = Math.min(this.width, this.height) / 2 - 0.5;
                return (dx * dx + dy * dy) <= (radius * radius);
            case FieldShape.RHOMBUS:
                return (Math.abs(dx) / (this.width / 2) + Math.abs(dy) / (this.height / 2)) <= 1;
            case FieldShape.CROSS:
                const thickness = Math.floor(this.width / 3);
                const inHorizontal = Math.abs(dy) < thickness / 2;
                const inVertical = Math.abs(dx) < thickness / 2;
                return inHorizontal || inVertical;
            case FieldShape.RANDOM:
                // Generate a more interesting random shape
                // We'll use multiple random circles/blobs
                if (!this.randomCells) {
                    this.randomCells = new Set();
                    const numBlobs = 5 + Math.random() * 10;
                    for (let i = 0; i < numBlobs; i++) {
                        const bx = Math.random() * this.width;
                        const by = Math.random() * this.height;
                        const br = 2 + Math.random() * (this.width / 4);
                        for (let ry = 0; ry < this.height; ry++) {
                            for (let rx = 0; rx < this.width; rx++) {
                                const rdx = rx - bx;
                                const rdy = ry - by;
                                if (rdx * rdx + rdy * rdy <= br * br) {
                                    this.randomCells.add(`${rx},${ry}`);
                                }
                            }
                        }
                    }
                    // Always include center
                    const cx = Math.floor(this.width / 2);
                    const cy = Math.floor(this.height / 2);
                    for (let sy = cy - 2; sy <= cy + 2; sy++) {
                        for (let sx = cx - 2; sx <= cx + 2; sx++) {
                            this.randomCells.add(`${sx},${sy}`);
                        }
                    }
                }
                return this.randomCells.has(`${x},${y}`);
            default:
                return true;
        }
    }

    isWalkable(x: number, y: number): boolean {
        return this.walkableCells.has(`${x},${y}`);
    }

    getRandomWalkableCell(): Point {
        const cells = Array.from(this.walkableCells);
        if (cells.length === 0) return { x: 0, y: 0 };
        const randomCell = cells[Math.floor(Math.random() * cells.length)];
        const [x, y] = randomCell.split(',').map(Number);
        return { x, y };
    }

    getWalkableCells(): Set<string> {
        return this.walkableCells;
    }

    getDimensions(): { width: number, height: number } {
        return { width: this.width, height: this.height };
    }
}
