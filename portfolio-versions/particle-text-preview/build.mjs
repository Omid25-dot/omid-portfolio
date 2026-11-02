import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

const folder = fileURLToPath(new URL('.', import.meta.url));
await build({
  absWorkingDir: folder,
  entryPoints: ['entry.jsx'],
  bundle: true,
  outfile: 'particle-text.js',
  jsx: 'automatic',
  minify: true,
  legalComments: 'linked',
  define: { 'process.env.NODE_ENV': '"production"' },
  target: ['es2020']
});
