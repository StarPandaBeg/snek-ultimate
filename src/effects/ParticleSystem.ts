import type { Point } from '../utils/Constants';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
    size: number;
}

export class ParticleSystem {
    private particles: Particle[] = [];

    emit(pos: Point, color: string, count: number = 10) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: pos.x,
                y: pos.y,
                vx: (Math.random() - 0.5) * 0.1,
                vy: (Math.random() - 0.5) * 0.1,
                life: 1.0,
                color,
                size: Math.random() * 5 + 2
            });
        }
    }

    update(dt: number) {
        this.particles = this.particles.filter(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= 0.002 * dt;
            return p.life > 0;
        });
    }

    draw(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number, cellSize: number) {
        this.particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(
                offsetX + p.x * cellSize + cellSize / 2,
                offsetY + p.y * cellSize + cellSize / 2,
                p.size,
                0,
                Math.PI * 2
            );
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;
    }
}
