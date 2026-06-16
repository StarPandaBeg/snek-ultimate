import { FieldShape, FieldSize, FoodQuantity, GameSpeed, ObstacleQuantity } from '../utils/Constants';

export interface GameSettings {
    playerName: string;
    fieldSize: FieldSize;
    fieldShape: FieldShape;
    isInfinite: boolean;
    foodQuantity: FoodQuantity;
    diverseFruits: boolean;
    woodenBoxes: ObstacleQuantity;
    ironBoxes: ObstacleQuantity;
    teleports: ObstacleQuantity;
    biteTail: boolean;
    destructionMode: boolean;
    speed: GameSpeed;
}

export class Settings {
    private static current: GameSettings = this.getDefaults();

    static getDefaults(): GameSettings {
        return {
            playerName: 'Player 1',
            fieldSize: FieldSize.MEDIUM,
            fieldShape: FieldShape.RECTANGLE,
            isInfinite: false,
            foodQuantity: FoodQuantity.MEDIUM,
            diverseFruits: true,
            woodenBoxes: ObstacleQuantity.LOW,
            ironBoxes: ObstacleQuantity.LOW,
            teleports: ObstacleQuantity.LOW,
            biteTail: true,
            destructionMode: true,
            speed: GameSpeed.NORMAL
        };
    }

    static get(): GameSettings {
        return { ...this.current };
    }

    static update(updates: Partial<GameSettings>) {
        this.current = { ...this.current, ...updates };
        this.save();
    }

    static load() {
        const saved = localStorage.getItem('snake_settings');
        if (saved) {
            try {
                this.current = { ...this.getDefaults(), ...JSON.parse(saved) };
            } catch (e) {
                this.current = this.getDefaults();
            }
        }
    }

    static save() {
        localStorage.setItem('snake_settings', JSON.stringify(this.current));
    }

    static randomize() {
        const shapes = Object.values(FieldShape);
        const sizes = Object.values(FieldSize);
        const quantities = Object.values(FoodQuantity);
        const speeds = Object.values(GameSpeed);
        const obsQuantities = Object.values(ObstacleQuantity);

        this.update({
            fieldSize: sizes[Math.floor(Math.random() * sizes.length)],
            fieldShape: shapes[Math.floor(Math.random() * shapes.length)],
            isInfinite: Math.random() > 0.5,
            foodQuantity: quantities[Math.floor(Math.random() * quantities.length)],
            diverseFruits: Math.random() > 0.3,
            woodenBoxes: obsQuantities[Math.floor(Math.random() * obsQuantities.length)],
            ironBoxes: obsQuantities[Math.floor(Math.random() * obsQuantities.length)],
            teleports: obsQuantities[Math.floor(Math.random() * obsQuantities.length)],
            biteTail: Math.random() > 0.5,
            destructionMode: Math.random() > 0.5,
            speed: speeds[Math.floor(Math.random() * speeds.length)]
        });
    }

    static reset() {
        this.current = this.getDefaults();
        this.save();
    }
}
