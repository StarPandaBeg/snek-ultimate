export enum GameState {
    MENU,
    PLAYING,
    PAUSED,
    GAME_OVER
}

export enum FieldShape {
    RECTANGLE = 'Обычное',
    CIRCLE = 'Круг',
    RHOMBUS = 'Ромб',
    CROSS = 'Крест',
    RANDOM = 'Случайная'
}

export enum FieldSize {
    SMALL = 'Маленькое',
    MEDIUM = 'Среднее',
    LARGE = 'Большое',
    HUGE = 'Огромное'
}

export const FieldSizeMap: Record<FieldSize, number> = {
    [FieldSize.SMALL]: 15,
    [FieldSize.MEDIUM]: 25,
    [FieldSize.LARGE]: 35,
    [FieldSize.HUGE]: 50
};

export enum FoodQuantity {
    VERY_LOW = 'Очень мало',
    LOW = 'Мало',
    MEDIUM = 'Средне',
    HIGH = 'Много',
    VERY_HIGH = 'Очень много'
}

export const FoodQuantityMap: Record<FoodQuantity, number> = {
    [FoodQuantity.VERY_LOW]: 1,
    [FoodQuantity.LOW]: 2,
    [FoodQuantity.MEDIUM]: 3,
    [FoodQuantity.HIGH]: 5,
    [FoodQuantity.VERY_HIGH]: 8
};

export enum GameSpeed {
    SLOW = 'Медленно',
    NORMAL = 'Нормально',
    FAST = 'Быстро',
    INSANE = 'Безумно'
}

export const GameSpeedMap: Record<GameSpeed, number> = {
    [GameSpeed.SLOW]: 300,
    [GameSpeed.NORMAL]: 200,
    [GameSpeed.FAST]: 120,
    [GameSpeed.INSANE]: 70
};

export enum ObstacleQuantity {
    NONE = 'Нет',
    LOW = 'Мало',
    MEDIUM = 'Средне',
    HIGH = 'Много'
}

export const ObstacleQuantityMap: Record<ObstacleQuantity, number> = {
    [ObstacleQuantity.NONE]: 0,
    [ObstacleQuantity.LOW]: 0.005,
    [ObstacleQuantity.MEDIUM]: 0.015,
    [ObstacleQuantity.HIGH]: 0.03
};

export enum FoodType {
    APPLE = 'Apple',
    BANANA = 'Banana',
    CHERRY = 'Cherry',
    PEAR = 'Pear',
    WATERMELON = 'Watermelon',
    GOLDEN_APPLE = 'GoldenApple',
    POISON_MUSHROOM = 'PoisonMushroom'
}

export interface Point {
    x: number;
    y: number;
}
