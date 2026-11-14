// The quotebook is a standalone page that a scheduled job keeps fresh in
// /quotebook at the repo root. It is not part of the Astro site, so the build
// just carries it across to dist/ so it stays live at /quotebook/.
import { cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';

if (existsSync('quotebook')) {
  await cp('quotebook', 'dist/quotebook', { recursive: true });
  console.log('copied quotebook/ -> dist/quotebook/');
}
