import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

/**
 * Library build for the <swap-widget> custom element. Produces a single
 * self-contained IIFE bundle at dist/embed/swap.iife.js:
 *  - all CSS inlined (Tailwind output is imported via `?inline` and injected
 *    into the shadow root at element-define time)
 *  - React and every dep bundled in (no peer deps — host page imports nothing)
 *
 *   <script src="https://cdn/swap.iife.js"></script>
 *   <swap-widget></swap-widget>
 */
const formatjsBabel: [string, Record<string, unknown>] = [
  'formatjs',
  {
    idInterpolationPattern: '[sha512:contenthash:base64:6]',
    ast: true,
    removeDefaultMessage: true,
  },
];

export default defineConfig({
  plugins: [react({ babel: { plugins: [formatjsBabel] } })],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    outDir: 'dist/embed',
    emptyOutDir: true,
    target: 'es2020',
    cssCodeSplit: false,
    lib: {
      entry: path.resolve(__dirname, 'src/embed.tsx'),
      name: 'SwapWidget',
      formats: ['iife'],
      fileName: () => 'swap.iife.js',
    },
    rollupOptions: {
      // Bundle everything — no externals. Host page gets a drop-in.
      output: {
        // Don't expose a named global — the side-effect of defining the
        // custom element is all we need.
        extend: false,
      },
    },
  },
});
