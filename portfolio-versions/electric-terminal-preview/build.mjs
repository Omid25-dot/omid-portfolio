import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { mkdir, copyFile } from 'node:fs/promises';

const folder = fileURLToPath(new URL('.', import.meta.url));
await build({
  absWorkingDir: folder,
  entryPoints: ['entry.jsx'],
  bundle: true,
  outfile: 'electric-border.js',
  jsx: 'automatic',
  minify: true,
  legalComments: 'linked',
  define: { 'process.env.NODE_ENV': '"production"' },
  target: ['es2020']
});

// The static personal homepage uses the same compiled component as the preview.
const assets = new URL('../../portfolio-assets/electric-border/', import.meta.url);
await mkdir(assets, { recursive: true });
for (const name of ['electric-border.js', 'electric-border.css', 'electric-border.js.LEGAL.txt']) {
  await copyFile(new URL(name, import.meta.url), new URL(name, assets));
}
