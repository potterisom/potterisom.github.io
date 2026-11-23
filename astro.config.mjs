import { defineConfig } from 'astro/config';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// The same shortcuts as the papers' LaTeX preamble, so .tex can be pasted in as is.
export const macros = {
  '\\Z': '\\mathbb Z', '\\Q': '\\mathbb Q', '\\N': '\\mathbb N', '\\R': '\\mathbb R', '\\C': '\\mathbb C',
  '\\e': '\\epsilon', '\\z': '\\zeta',
};

export default defineConfig({
  site: 'https://seylalalken.com',
  trailingSlash: 'ignore',
  markdown: {
    remarkPlugins: [remarkMath],
    // strict: any LaTeX that does not compile fails the build instead of shipping broken math.
    rehypePlugins: [[rehypeKatex, { throwOnError: true, strict: 'error', macros }]],
  },
});
