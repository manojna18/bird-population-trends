import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/bird-population-trends2/',
  plugins: [svelte()],
  resolve: {
    alias: {
      "$components": path.resolve('./src/components'),
      "$data": path.resolve("./src/data"),
      "$routes": path.resolve("./src/routes"),
    }
  },
  build: {
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
    },
    outDir: 'dist',
  }
})

