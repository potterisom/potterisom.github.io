import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Writing: one Markdown file per piece in src/content/writing/.
 * The file name is the URL (/writing/<file-name>/), so pick it once.
 */
const writing = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    /** Publication date. Leave out for undated pieces and use dateLabel. */
    date: z.coerce.date().optional(),
    /** Shown instead of a date, e.g. "expository" or "in progress". */
    dateLabel: z.string().optional(),
    kind: z.enum(['math', 'thoughts']),
    /** Language of the text, e.g. "ru". */
    lang: z.string().default('en'),
    /** Short quotes from the piece; each becomes a tile on the wall. */
    excerpts: z.array(z.string()).default([]),
    /** Link to a PDF version, e.g. /docs/euler_product.pdf */
    pdf: z.string().optional(),
    /** true = not finished: shows "still brewing" instead of a reading time. */
    brewing: z.boolean().default(false),
  }),
});

export const collections = { writing };
