import { getCollection, type CollectionEntry } from 'astro:content';

export type Piece = {
  entry: CollectionEntry<'writing'>;
  slug: string;
  href: string;
  title: string;
  kind: 'math' | 'thoughts';
  lang: string;
  /** "August 4, 2025", or the dateLabel */
  when: string;
  /** reading time in kese (small tea cups): 1 per ~300 words, rounded up; 0 = still brewing */
  kese: number;
  keseLabel: string;
};

export type Tile =
  | { type: 'title'; piece: Piece; focusable: boolean }
  | { type: 'quote'; piece: Piece; text: string };

const WORDS_PER_KESE = 300;

export async function getPieces(): Promise<Piece[]> {
  const entries = await getCollection('writing');
  const pieces = entries.map((entry) => {
    const d = entry.data;
    const words = (entry.body ?? '').trim().split(/\s+/).filter(Boolean).length;
    const kese = d.brewing ? 0 : Math.ceil(words / WORDS_PER_KESE);
    const when = d.date
      ? d.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
      : (d.dateLabel ?? '');
    return {
      entry,
      slug: entry.id,
      href: `/writing/${entry.id}/`,
      title: d.title,
      kind: d.kind,
      lang: d.lang,
      when,
      kese,
      keseLabel: kese ? `${kese} kese` : 'still brewing',
    };
  });
  // newest first; undated pieces last
  return pieces.sort((a, b) => (b.entry.data.date?.getTime() ?? 0) - (a.entry.data.date?.getTime() ?? 0));
}

export const WALL_COLS = 6;
const MIN_ROWS = 4;

/**
 * Lay the wall out: one title tile per piece plus one tile per excerpt, topped
 * up with repeated titles until the grid (6 wide, at least 4 tall) is full.
 * Tiles are then placed so a piece is never its own neighbour — left, above,
 * or across the wrap-around seam — whenever that is possible.
 */
export function buildWall(pieces: Piece[]): Tile[] {
  if (!pieces.length) return [];
  const pool: Tile[] = [];
  for (const piece of pieces) {
    pool.push({ type: 'title', piece, focusable: true });
    for (const text of piece.entry.data.excerpts) pool.push({ type: 'quote', piece, text });
  }
  const rows = Math.max(MIN_ROWS, Math.ceil(pool.length / WALL_COLS));
  const total = rows * WALL_COLS;
  for (let i = 0; pool.length < total; i++) {
    pool.push({ type: 'title', piece: pieces[i % pieces.length], focusable: false });
  }

  // group by piece; always take from the fullest group that fits the spot
  const groups = new Map<string, Tile[]>();
  for (const t of pool) groups.set(t.piece.slug, [...(groups.get(t.piece.slug) ?? []), t]);
  // within a piece, alternate titles and quotes so titles spread out
  for (const [k, g] of groups) {
    const titles = g.filter((t) => t.type === 'title');
    const quotes = g.filter((t) => t.type === 'quote');
    const mixed: Tile[] = [];
    const every = Math.max(1, Math.round(g.length / Math.max(1, titles.length)));
    while (titles.length || quotes.length) {
      if (titles.length && (mixed.length % every === 0 || !quotes.length)) mixed.push(titles.shift()!);
      else mixed.push(quotes.shift()!);
    }
    groups.set(k, mixed);
  }

  const out: (Tile | undefined)[] = new Array(total);
  const at = (c: number, r: number) => out[((r + rows) % rows) * WALL_COLS + ((c + WALL_COLS) % WALL_COLS)];
  for (let i = 0; i < total; i++) {
    const c = i % WALL_COLS;
    const r = Math.floor(i / WALL_COLS);
    const near = [at(c - 1, r), at(c, r - 1), at(c + 1, r), at(c, r + 1)].map((t) => t?.piece.slug);
    const ranked = [...groups.entries()].filter(([, g]) => g.length).sort((a, b) => b[1].length - a[1].length);
    const pick = ranked.find(([slug]) => !near.includes(slug)) ?? ranked[0];
    out[i] = pick[1].shift();
  }
  return out as Tile[];
}
