import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * One Markdown file per post in src/content/posts/.
 * The file name is the URL: sizes-of-z.md -> /sizes-of-z/
 * To add a post: add a file here, plus a handwritten title image in public/hand/.
 * Math: write LaTeX between $...$ (inline) or $$...$$ (display); it is compiled at build time.
 */
const posts = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/posts' }),
  schema: z.object({
    /** The title as text: used in the sidebar, on the home page and for screen readers. */
    title: z.string(),
    /** Handwritten title image shown at the top of the post, e.g. /hand/z.svg (vector) */
    hand: z.string().optional(),
    /** Position in the list (1 = first). The home page shows the first four. */
    order: z.number(),
    date: z.coerce.date().optional(),
    /** Link to a PDF version, e.g. /docs/euler_product.pdf */
    pdf: z.string().optional(),
    /** Math papers: typeset like the amsart PDF. Title may contain LaTeX, e.g. "Assigning sizes to subsets of $\\Z$". */
    paperTitle: z.string().optional(),
    author: z.string().optional(),
    /** The \\thanks{} line, shown as a footnote. */
    thanks: z.string().optional(),
  }),
});

export const collections = { posts };
