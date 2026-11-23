import { defineConfig } from 'astro/config';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  site: 'https://seylalalken.com',
  trailingSlash: 'ignore',
  markdown: {
    remarkPlugins: [remarkMath],
    // strict: any LaTeX that does not compile fails the build instead of shipping broken math.
    rehypePlugins: [[rehypeKatex, { throwOnError: true, strict: 'error' }]],
  },
});
