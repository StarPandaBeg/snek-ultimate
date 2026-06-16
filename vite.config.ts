import { defineConfig } from 'vite';

export default defineConfig({
  // Установка относительного пути позволяет игре корректно работать 
  // в любой подпапке на GitHub Pages (например, username.github.io/repo-name/)
  base: './',
});
