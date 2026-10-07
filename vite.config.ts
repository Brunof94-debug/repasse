import { defineConfig } from 'vite';
export default defineConfig({ base: './', css: { postcss: { plugins: [] } }, build: { target: 'es2022' } });
