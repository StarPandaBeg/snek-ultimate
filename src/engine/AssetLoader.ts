export class AssetLoader {
    private static images: Map<string, HTMLImageElement> = new Map();
    private static totalAssets = 0;
    private static loadedAssets = 0;

    static async loadAll(): Promise<void> {
        const assets = [
            { name: 'apple', url: './src/assets/food_apple.png' },
            { name: 'banana', url: './src/assets/food_banana.png' },
            { name: 'cherry', url: './src/assets/food_cherry.png' },
            { name: 'pear', url: './src/assets/food_pear.png' },
            { name: 'golden_apple', url: './src/assets/food_golden_apple.png' },
            { name: 'watermelon', url: './src/assets/food_watermelon.png' },
            { name: 'poison', url: './src/assets/food_poison.png' },
            { name: 'crate_wood', url: './src/assets/crate_wood.png' },
            { name: 'crate_metal', url: './src/assets/crate_metal.png' },
            { name: 'snake_head', url: './src/assets/snake_head.png' },
            { name: 'snake_body', url: './src/assets/snake_block.png' },
            { name: 'portal_base', url: './src/assets/portal_base.png' },
            { name: 'portal_glow', url: './src/assets/portal_glow.png' },
            { name: 'tiles', url: './src/assets/tiles.png' },
            { name: 'grass', url: './src/assets/grass.png' }
        ];

        this.totalAssets = assets.length;
        const promises = assets.map(asset => this.loadImage(asset.name, asset.url));
        await Promise.all(promises);
    }

    private static loadImage(name: string, url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.images.set(name, img);
                this.loadedAssets++;
                resolve();
            };
            img.onerror = () => reject(`Failed to load asset: ${url}`);
            img.src = url;
        });
    }

    static getImage(name: string): HTMLImageElement | undefined {
        return this.images.get(name);
    }

    static getProgress(): number {
        return this.totalAssets === 0 ? 1 : this.loadedAssets / this.totalAssets;
    }
}
