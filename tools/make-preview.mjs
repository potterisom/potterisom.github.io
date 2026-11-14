// Makes a click-through copy of dist/ that works from any folder (all links
// relative, no address-bar changes). For sharing a preview; not the real build.
// usage: node tools/make-preview.mjs <out-dir>
import { cpSync, readFileSync, writeFileSync, readdirSync, statSync, rmSync, renameSync } from 'node:fs';
import { join, relative, dirname, extname } from 'node:path';

const out = process.argv[2];
if (!out) throw new Error('usage: node tools/make-preview.mjs <out-dir>');
rmSync(out, { recursive: true, force: true });
cpSync('dist', out, { recursive: true });
rmSync(join(out, 'docs'), { recursive: true, force: true }); // PDFs aren't part of the preview
renameSync(join(out, '_astro'), join(out, 'assets')); // some hosts reserve names starting with _

const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
for (const file of walk(out)) {
  const ext = extname(file);
  if (!['.html', '.css', '.js'].includes(ext)) continue;
  const up = relative(dirname(file), out).replaceAll('\\', '/');
  const root = up ? up + '/' : './';
  let s = readFileSync(file, 'utf8');
  if (ext === '.html') {
    s = s.replace('<html ', '<html data-preview ');
    // page links: /writing/ -> <root>writing/index.html, keeping any #hash
    s = s.replace(/(href|content)="\/(?!_astro\/|\/)([^"#?]*)(#[^"]*)?"/g, (m, attr, path, hash = '') => {
      if (attr === 'content') return m;
      if (/\.[a-z0-9]+$/i.test(path)) return `${attr}="${root}${path}${hash}"`;
      return `${attr}="${root}${path}${path && !path.endsWith('/') ? '/' : ''}index.html${hash}"`;
    });
  }
  s = s.replaceAll('/_astro/', root + 'assets/');
  writeFileSync(file, s);
}
console.log('preview written to', out);
