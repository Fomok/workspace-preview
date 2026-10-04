import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
export default defineConfig({plugins:[svelte()],base:'/zonebench-preview/',publicDir:'.preview-static',build:{outDir:'dist'}});
