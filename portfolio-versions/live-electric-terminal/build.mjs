import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { mkdir, copyFile, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

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

// Change the asset URL after rebuilding so returning visitors receive the update.
const version = createHash('sha256').update(await readFile(new URL('electric-border.js', assets))).digest('hex').slice(0, 10);
const homepage = new URL('../../index.html', import.meta.url);
const html = await readFile(homepage, 'utf8');
await writeFile(homepage, html.replace(
  /(src="\.\/portfolio-assets\/electric-border\/electric-border\.js)(?:\?v=[a-z0-9]+)?"/g,
  `$1?v=${version}"`
));
