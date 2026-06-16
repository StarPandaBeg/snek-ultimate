import { FoodType } from "../utils/Constants";
import type { Point } from "../utils/Constants";
import { Snake } from "../entities/Snake";
import { ParticleSystem } from "../effects/ParticleSystem";
import { AssetLoader } from "./AssetLoader";

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private cellSize: number = 0;
  private width: number = 0;
  private height: number = 0;
  public particles: ParticleSystem = new ParticleSystem();
  private offscreenPortalCanvases: Map<string, HTMLCanvasElement> = new Map();

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    const parent = this.canvas.parentElement;
    if (parent) {
      this.canvas.width = parent.clientWidth;
      this.canvas.height = parent.clientHeight;
    }
    if (this.width > 0) this.updateCellSize();
  }

  setDimensions(gridWidth: number, gridHeight: number) {
    this.width = gridWidth;
    this.height = gridHeight;
    this.updateCellSize();
  }

  private updateCellSize() {
    const padding = 40;
    const availableWidth = this.canvas.width - padding * 2;
    const availableHeight = this.canvas.height - padding * 2;
    this.cellSize = Math.min(
      availableWidth / this.width,
      availableHeight / this.height,
    );
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  drawGrid(walkableCells: Set<string>) {
    const offsetX = (this.canvas.width - this.width * this.cellSize) / 2;
    const offsetY = (this.canvas.height - this.height * this.cellSize) / 2;

    const tilesImg = AssetLoader.getImage("tiles");
    const grassImg = AssetLoader.getImage("grass");

    if (!grassImg || !tilesImg) {
      this.ctx.fillStyle = "#0a0a0c";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }

    const patternSize = this.cellSize;
    const tileSizeX = grassImg.width / 4;
    const tileSizeY = grassImg.height / 4;

    const startX = offsetX - Math.ceil(offsetX / patternSize) * patternSize;
    const startY = offsetY - Math.ceil(offsetY / patternSize) * patternSize;

    for (
      let screenY = startY;
      screenY < this.canvas.height + patternSize;
      screenY += patternSize
    ) {
      for (
        let screenX = startX;
        screenX < this.canvas.width + patternSize;
        screenX += patternSize
      ) {
        const gridX = Math.round((screenX - offsetX) / patternSize);
        const gridY = Math.round((screenY - offsetY) / patternSize);

        const isWalkable = walkableCells.has(`${gridX},${gridY}`);
        const img = isWalkable ? tilesImg : grassImg;

        const tx = ((gridX % 4) + 4) % 4;
        const ty = ((gridY % 4) + 4) % 4;

        this.ctx.drawImage(
          img,
          tx * tileSizeX,
          ty * tileSizeY,
          tileSizeX,
          tileSizeY,
          screenX,
          screenY,
          patternSize,
          patternSize,
        );

        if (!isWalkable) {
          this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
          this.ctx.fillRect(screenX, screenY, patternSize, patternSize);
        }
      }
    }

    this.ctx.strokeStyle = "rgba(0,0,0,0.3)";
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(
      offsetX,
      offsetY,
      this.width * this.cellSize,
      this.height * this.cellSize,
    );
  }

  drawParticles() {
    const offsetX = (this.canvas.width - this.width * this.cellSize) / 2;
    const offsetY = (this.canvas.height - this.height * this.cellSize) / 2;
    this.particles.draw(this.ctx, offsetX, offsetY, this.cellSize);
  }

  drawSnake(
    snake: Snake,
    interpolation: number,
    walkableCells: Set<string>,
    startIndex: number = 0,
  ) {
    const offsetX = (this.canvas.width - this.width * this.cellSize) / 2;
    const offsetY = (this.canvas.height - this.height * this.cellSize) / 2;
    const body = snake.getBody();
    const prevBody = snake.getPrevBody();

    const headImg = AssetLoader.getImage("snake_head");
    const bodyImg = AssetLoader.getImage("snake_body");

    const t = Math.max(0, Math.min(1, interpolation));

    for (let i = startIndex; i < body.length; i++) {
      const curr = body[i];
      const prev = prevBody[i] || curr;

      // Detect if this segment just teleported/wrapped
      const isTeleport =
        Math.abs(curr.x - prev.x) > 1 || Math.abs(curr.y - prev.y) > 1;

      let visualX,
        visualY,
        scale = 1.0;

      if (isTeleport) {
        // When entering/leaving portal, shrink and vanish
        if (t < 0.5) {
          // Part 1: Shrink into the old position
          visualX = prev.x;
          visualY = prev.y;
          scale = 1.0 - t * 2;
        } else {
          // Part 2: Grow out of the new position
          visualX = curr.x;
          visualY = curr.y;
          scale = (t - 0.5) * 2;
        }
      } else {
        visualX = prev.x + (curr.x - prev.x) * t;
        visualY = prev.y + (curr.y - prev.y) * t;
      }

      // Only draw if within playable area to avoid edge cases
      if (!walkableCells.has(`${Math.round(visualX)},${Math.round(visualY)}`))
        continue;

      const isHead = i === 0;
      const img = isHead ? headImg : bodyImg;
      const baseSize = isHead ? this.cellSize * 1.0 : this.cellSize * 0.85;
      const size = baseSize * scale;
      const margin = (this.cellSize - size) / 2;

      const drawX = offsetX + visualX * this.cellSize + margin;
      const drawY = offsetY + visualY * this.cellSize + margin;

      if (img && scale > 0) {
        if (isHead) {
          const next = body[1] || body[0];
          let angle = 0;
          if (curr.x > next.x) angle = 0;
          else if (curr.x < next.x) angle = Math.PI;
          else if (curr.y > next.y) angle = Math.PI / 2;
          else if (curr.y < next.y) angle = -Math.PI / 2;

          this.ctx.save();
          this.ctx.translate(drawX + size / 2, drawY + size / 2);
          this.ctx.rotate(angle);
          this.ctx.drawImage(img, -size / 2, -size / 2, size, size);
          this.ctx.restore();
        } else {
          this.ctx.drawImage(img, drawX, drawY, size, size);
        }
      } else if (scale > 0) {
        this.ctx.fillStyle = isHead ? "#00ff88" : "#00cc6a";
        this.ctx.beginPath();
        this.ctx.roundRect(
          drawX,
          drawY,
          size,
          size,
          isHead ? size * 0.4 : size * 0.3,
        );
        this.ctx.fill();
      }
    }
  }

  drawFood(foods: { pos: Point; type: FoodType; lifeTime?: number }[]) {
    const offsetX = (this.canvas.width - this.width * this.cellSize) / 2;
    const offsetY = (this.canvas.height - this.height * this.cellSize) / 2;

    foods.forEach((food) => {
      const imgName = this.getFoodImageName(food.type);
      const img = AssetLoader.getImage(imgName);

      const hasProgress =
        food.type === FoodType.WATERMELON ||
        food.type === FoodType.GOLDEN_APPLE;
      const isWatermelon = food.type === FoodType.WATERMELON;

      const size = isWatermelon ? this.cellSize * 1.8 : this.cellSize * 0.8;
      const margin = isWatermelon
        ? this.cellSize * 0.1
        : (this.cellSize - size) / 2;
      const drawX = offsetX + food.pos.x * this.cellSize + margin;
      const drawY = offsetY + food.pos.y * this.cellSize + margin;

      let alpha = 1.0;
      if (hasProgress && food.lifeTime !== undefined) {
        if (food.lifeTime < 3000) {
          alpha = Math.floor(food.lifeTime / 200) % 2 === 0 ? 0.5 : 1.0;
        }
      }

      this.ctx.globalAlpha = alpha;

      if (img) {
        this.ctx.drawImage(img, drawX, drawY, size, size);
      } else {
        const color = this.getFoodColor(food.type);
        this.ctx.fillStyle = color;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = color;
        this.ctx.beginPath();
        if (isWatermelon) {
          this.ctx.roundRect(drawX, drawY, size, size, size * 0.4);
        } else {
          this.ctx.arc(
            drawX + size / 2,
            drawY + size / 2,
            size / 2.5,
            0,
            Math.PI * 2,
          );
        }
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
      }

      this.ctx.globalAlpha = 1.0;

      if (hasProgress && food.lifeTime !== undefined) {
        const maxLife = 8000;
        const progress = Math.max(0, food.lifeTime / maxLife);
        const barWidth = size;
        const barHeight = 4;
        const barX = drawX;
        const barY = drawY - 8;

        this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        this.ctx.fillStyle = progress > 0.3 ? "#00ff88" : "#ff0055";
        this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
      }
    });
  }

  private getFoodImageName(type: FoodType): string {
    switch (type) {
      case FoodType.APPLE:
        return "apple";
      case FoodType.BANANA:
        return "banana";
      case FoodType.CHERRY:
        return "cherry";
      case FoodType.GOLDEN_APPLE:
        return "golden_apple";
      case FoodType.WATERMELON:
        return "watermelon";
      case FoodType.PEAR:
        return "pear";
      case FoodType.POISON_MUSHROOM:
        return "poison";
      default:
        return "apple";
    }
  }

  drawObstacles(obstacles: { pos: Point; type: "wood" | "iron" }[]) {
    const offsetX = (this.canvas.width - this.width * this.cellSize) / 2;
    const offsetY = (this.canvas.height - this.height * this.cellSize) / 2;

    obstacles.forEach((obs) => {
      const img = AssetLoader.getImage(
        obs.type === "iron" ? "crate_metal" : "crate_wood",
      );
      const size = this.cellSize * 0.9;
      const margin = (this.cellSize - size) / 2;
      const drawX = offsetX + obs.pos.x * this.cellSize + margin;
      const drawY = offsetY + obs.pos.y * this.cellSize + margin;

      if (img) {
        this.ctx.drawImage(img, drawX, drawY, size, size);
      } else {
        this.ctx.fillStyle = obs.type === "iron" ? "#7f8c8d" : "#d35400";
        this.ctx.beginPath();
        this.ctx.roundRect(drawX, drawY, size, size, this.cellSize * 0.1);
        this.ctx.fill();
      }
    });
  }

  drawPortals(portals: { pos: Point; color: string }[]) {
    const offsetX = (this.canvas.width - this.width * this.cellSize) / 2;
    const offsetY = (this.canvas.height - this.height * this.cellSize) / 2;

    const baseImg = AssetLoader.getImage("portal_base");
    const glowImg = AssetLoader.getImage("portal_glow");

    portals.forEach((p) => {
      const size = this.cellSize * 1.1;
      const margin = (this.cellSize - size) / 2;
      const drawX = offsetX + p.pos.x * this.cellSize + margin;
      const drawY = offsetY + p.pos.y * this.cellSize + margin;

      if (baseImg && glowImg) {
        const coloredPortal = this.getColoredPortal(glowImg, p.color);
        this.ctx.drawImage(coloredPortal, drawX, drawY, size, size);
        this.ctx.drawImage(baseImg, drawX, drawY, size, size);
      } else {
        this.ctx.strokeStyle = p.color;
        this.ctx.lineWidth = 3;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = p.color;
        this.ctx.beginPath();
        this.ctx.arc(
          drawX + size / 2,
          drawY + size / 2,
          size * 0.4,
          0,
          Math.PI * 2,
        );
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
      }
    });
  }

  private getColoredPortal(
    glowImg: HTMLImageElement,
    color: string,
  ): HTMLCanvasElement {
    const key = `${color}_${glowImg.src}`;
    if (this.offscreenPortalCanvases.has(key)) {
      return this.offscreenPortalCanvases.get(key)!;
    }

    const canvas = document.createElement("canvas");
    canvas.width = glowImg.width;
    canvas.height = glowImg.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(glowImg, 0, 0);
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "source-over";
    this.offscreenPortalCanvases.set(key, canvas);
    return canvas;
  }

  public getFoodColor(type: FoodType): string {
    switch (type) {
      case FoodType.APPLE:
        return "#ff4d4d";
      case FoodType.BANANA:
        return "#ffff4d";
      case FoodType.CHERRY:
        return "#ff1a1a";
      case FoodType.PEAR:
        return "#99ff33";
      case FoodType.WATERMELON:
        return "#ff3385";
      case FoodType.GOLDEN_APPLE:
        return "#ffd700";
      case FoodType.POISON_MUSHROOM:
        return "#9933ff";
      default:
        return "#ffffff";
    }
  }
}
