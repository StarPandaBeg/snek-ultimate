import { Renderer } from './engine/Renderer';
import { GameManager } from './game/GameManager';
import { MenuUI } from './ui/MenuUI';
import { HudUI } from './ui/HudUI';
import { Settings } from './game/Settings';
import { AssetLoader } from './engine/AssetLoader';

async function init() {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    const renderer = new Renderer(canvas);

    Settings.load();

    // Show loading state if needed, but for now just wait
    try {
        await AssetLoader.loadAll();
    } catch (e) {
        console.error('Failed to load assets:', e);
    }

    new MenuUI();
    new HudUI();

    new GameManager(renderer);

    renderer.resize();

    console.log('Snake Ultimate initialized with assets');
}

window.addEventListener('load', init);

