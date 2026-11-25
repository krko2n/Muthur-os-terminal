import { defineConfig } from 'vite';

// Builds the terminal-only CLI (src/cli/main.ts) into a single Node script.
// No React, no Tauri: Node built-ins stay external, everything else is bundled.
export default defineConfig({
  clearScreen: false,
  publicDir: false,
  build: {
    ssr: 'src/cli/main.ts',
    outDir: 'dist-cli',
    emptyOutDir: true,
    target: 'node18',
    minify: false,
    sourcemap: false,
    rollupOptions: {
      output: {
        format: 'es',
        entryFileNames: 'muthur.mjs',
        banner: '#!/usr/bin/env node',
      },
    },
  },
});
