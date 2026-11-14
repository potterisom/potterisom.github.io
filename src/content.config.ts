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

/**
 * Projects: one Markdown file per project in src/content/projects/.
 * The body is the long post: five "## " sections, one per part, in this order:
 * the problem · for whom · the key decision · built with · what's next.
 * A "> quote" inside a section becomes its red pull quote.
 */
const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      /** Position among the tabs (1 = first). */
      order: z.number().default(99),
      /** Show this project when the page opens. */
      open_first: z.boolean().default(false),
      status: z.string().optional(),
      kicker: z.string(),
      dek: z.string(),
      /** The project card: a photo, or just a colour. */
      cover: image().optional(),
      color: z.string().default('#2E3266'),
      /** Picture at the top of the post. */
      hero: image().optional(),
      heroAlt: z.string().default(''),
      heroCap: z.string().optional(),
      /** One short line per part, shown on the cards of the exploded view. */
      parts: z.object({
        problem: z.string(),
        for_whom: z.string(),
        key_decision: z.string(),
        built_with: z.string(),
        whats_next: z.string(),
      }),
    }),
});

export const collections = { writing, projects };
