import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import ts from 'typescript';

function inlineNodeEnv() {
  const importMetaEnv =
    '({ BASE_URL: "/", MODE: "production", DEV: false, PROD: true, SSR: false })';

  return {
    name: 'muthur:inline-build-env',
    enforce: 'pre',
    transform(code, id) {
      const [filePath] = id.split('?');
      if (!/\.[cm]?[jt]sx?$/.test(filePath)) return null;
      if (
        !code.includes('process.env.NODE_ENV') &&
        !code.includes('global.process.env.NODE_ENV') &&
        !code.includes('globalThis.process.env.NODE_ENV') &&
        !code.includes('import.meta.env') &&
        !code.includes('import.meta.hot')
      ) {
        return null;
      }

      return {
        code: code
          .replaceAll('globalThis.process.env.NODE_ENV', '"production"')
          .replaceAll('global.process.env.NODE_ENV', '"production"')
          .replaceAll('process.env.NODE_ENV', '"production"')
          .replaceAll('import.meta.env.BASE_URL', '"/"')
          .replaceAll('import.meta.env.MODE', '"production"')
          .replaceAll('import.meta.env.DEV', 'false')
          .replaceAll('import.meta.env.PROD', 'true')
          .replaceAll('import.meta.env.SSR', 'false')
          .replaceAll('import.meta.hot', 'undefined')
          .replaceAll('import.meta.env', importMetaEnv),
        map: null,
      };
    },
  };
}

function transpileTypeScriptInProcess() {
  return {
    name: 'muthur:typescript-transpile',
    enforce: 'pre',
    transform(code, id) {
      const [filePath] = id.split('?');
      if (filePath.includes('/node_modules/') || filePath.includes('\\node_modules\\')) return null;
      if (!/\.[cm]?[tj]sx?$/.test(filePath)) return null;

      const result = ts.transpileModule(code, {
        fileName: filePath,
        compilerOptions: {
          target: ts.ScriptTarget.ES2020,
          module: ts.ModuleKind.ESNext,
          jsx: ts.JsxEmit.ReactJSX,
          jsxImportSource: 'react',
          useDefineForClassFields: true,
          sourceMap: true,
          importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
        },
      });

      return {
        code: result.outputText,
        map: result.sourceMapText ? JSON.parse(result.sourceMapText) : null,
      };
    },
  };
}

function disableEsbuildForSandbox() {
  return {
    name: 'muthur:disable-esbuild-in-sandbox',
    config() {
      return {
        esbuild: false,
        build: {
          minify: false,
          cssMinify: false,
        },
      };
    },
  };
}

export default defineConfig({
  plugins: [inlineNodeEnv(), transpileTypeScriptInProcess(), react(), disableEsbuildForSandbox()],
  clearScreen: false,
  esbuild: false,
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
  build: {
    outDir: process.env.MUTHUR_VITE_OUT_DIR || 'dist',
    target: 'esnext',
    minify: false,
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
});
