You're rebuilding my personal website, potterisom.github.io (this repo), from scratch.

Read `handoff/SPEC.md` first: it is the source of truth for every page, interaction, token and rule. The `handoff/mockups/` folder holds the chosen designs as self-contained HTML components exported from Claude's design canvas. Treat their markup, CSS and the logic in each `<script type="text/x-dc">` block as the reference for look and behavior. `{{name}}` holes are values computed in that block's `renderVals()`, and `/_blob/<id>` images map to files in `pics/` (table at the end of the spec).

How I want you to work:
1. Propose the project structure (Astro + content collections + GitHub Pages deploy) and wait for my OK.
2. Build page by page in this order: home → writing → projects → creative → timeline. After each page, run it locally, take Playwright screenshots at 1440px and 390px wide, and show me before moving on.
3. Port the interactions faithfully: fog wiping and regrowth, the curved endless tile wall with inertia, the day→night reader, the exploded project view with long-form posts, the springy clothesline and the composer. They are the point of the site, so don't simplify them away. Everything also needs touch and reduced-motion fallbacks.
4. Put content in files (spec §3) so I can add an essay, project or photo by adding one file.
5. Work on a branch and open a PR. Never push to main without asking me. Don't touch the quotebook workflow until I decide (spec §8).
6. If anything you build starts to look generic or templated, stop and tell me. The goal is to show product taste.
