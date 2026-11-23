# Leyla Salken
this is my personal website. i write random things on here.

## how it works

Built with [Astro](https://astro.build) and published to GitHub Pages by `.github/workflows/deploy.yml` on every push to `main`.

- **Add a post:** add a Markdown file to `src/content/posts/` (the file name becomes the URL) and its handwritten title image to `public/hand/`. Set `order` in the frontmatter: the home page shows the first four.
- **Math:** write LaTeX between `$...$` or on its own lines between `$$` and `$$`. It is compiled at build time, and any formula that doesn't compile stops the build.
- **PDFs** live in `public/docs/` (same URLs as before).
- The old site is kept in `archive/old-site/` (not published). Old URLs redirect to the new pages.

```
npm install
npm run dev      # local preview at http://localhost:4321
npm run build    # writes dist/
```
