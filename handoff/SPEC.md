# potterisom.github.io — build spec (v1, Nov 2026)

Leyla Salken's personal site, rebuilt from scratch. Designed over five rounds of sketches on a Claude Design canvas: https://claude.ai/artifact/Q4BD2E2SwK5GsMDGY9Xi4P (the "Final" page holds the chosen designs, linked together). The `mockups/` folder has the source of every chosen board.

## 1. The point of the site

**Show product taste.** Visitors spend a few seconds deciding what they think. Every page has one strong, physical interaction done well; everything else is quiet and readable.

- Should feel: **cohesive, original, creative, intuitive.**
- Must not feel: **boring, complicated, disconnected.**
- Anti-references: paulgraham.com (great writing, plain site), blackbirde71.github.io (nice but generic).
- References: felixrieseberg.com (process), iansilber.com (one physical toy), s23h.com (inline definitions, sound, reading measure).
- Personal details (Kazakh culture, tea, music, games) appear **subtly**, never as a theme.
- If anything starts to look generic, flag it rather than ship it.

## 2. Pages

| Route | Status | Mockup |
|---|---|---|
| `/` home | **final** | `mockups/HomeMosque.dc.html` |
| `/writing` (+ reader) | **final** | `mockups/WritingWall.dc.html` |
| `/projects` (+ posts) | **final direction** | `mockups/ProjExplode.dc.html` |
| `/creative` | **okay — polish** | `mockups/CreativeV2.dc.html` |
| `/past-work` (was "timeline") | **final (T2)** | `mockups/Timeline.dc.html` |

The **quotebook is removed** from the site. See §8 for the scheduled job.

### Home (`/`)
- Full-bleed photo `pics/mosque.jpeg` (minarets at blue hour) with a slow 40s zoom.
- Behind the glass: name in Instrument Serif ~132px, one line ("I study mathematics, sprinkled with some computer science, at Williams. Oxford last year; Jane Street this summer."), links, in this order: past work · projects · writing · creative · email.
- Over everything: a `<canvas>` of **fog**. It's an off-white gradient with ~1400 droplet specks. The cursor wipes it (`destination-out` radial gradient, r≈80px). Fog regrows slowly (alpha ~0.01 every 50ms). Condensation **drips** run down occasionally, and sometimes from where you wiped. "hi ♡" is pre-etched in the corner. Small pill: "it's cold outside — wipe the glass".
- Touch: drag to wipe. `prefers-reduced-motion`: no zoom, no drips, the fog starts mostly clear.
- Links must stay reachable with the keyboard and screen readers even when fogged: the fog is decorative, `pointer-events:none`, `aria-hidden`.

### Writing (`/writing`)
- An **endless tiled wall** on a curved surface. A 6×4 tile grid wraps modulo in both directions. Tiles tilt (`rotateY/rotateX` by distance from center), scale down and fade toward the edges like a torus. Ambient slow drift; drag with inertia (velocity × 0.94 per frame).
- Tiles are only Leyla's writing: **title tiles** (math = deep purple, thoughts = cream) and **excerpt tiles** (italic quotes from the piece, labeled "from <title>").
- Click (not drag: movement < 6px) a tile to open the **reader**: a full-screen column (~640px, EB Garamond 23px/1.6) whose background moves from **morning to night** as you scroll (sky palette in §4). Header: kind · date · reading time in **kese** (one small cup icon per ~300 words). Ends with a red ♥. "← back to the wall".
- The Russian winter-study diary renders in Cyrillic, so the body font must support it (EB Garamond does).

### Projects (`/projects`)
- **Exploded view.** Project tabs (Free Food at Williams · This website · [next]). Hover the project card and it comes apart into 5 parts on dashed leader lines: *the problem · for whom · the key decision · built with · what's next*. Springy transforms, a bubble pop on open and close. Click to hold it open.
- Clicking a part opens the **post** scrolled to that section. "Read the whole story →" opens it from the top.
- **Post** (Felix-style long-form): kicker, big title, italic dek, hero image with caption, then one section per part (h2 + paragraphs + optional pull quote in red Instrument Serif). Left margin: sticky table of contents made of the 5 parts. The active part highlights on scroll; click to jump.

### Creative (`/creative`)
- **Clothesline** of photographs (polaroid style, wooden pins, handwritten captions in Nothing You Could Do). The string is an SVG quadratic path through each pin. Drag a photo, release, and it **springs back** (k=0.11, damping 0.07) with a plucked triangle-wave note whose pitch follows its position.
- Idle: photos **sway** gently (sin, ±3px / ±1.6°).
- **Composer** underneath: 16 steps × 8 pentatonic pitches, notes colored red → pink → purple → blue by pitch. Presets: blank, twinkle, waves (default). Play/stop at 240ms per step, plus "save mine" (localStorage; later a shareable URL hash). **On each beat, a note bounces a photo on the line and floats a ♪ glyph up from it.**
- Side panel: links to Leyla's three MuseScore arrangements (Aiymai, Sulu Kyz, Hit the Road, Jack) and a handwritten note.
- Leyla says this page is "o-kay": polish it, don't redesign it.

### Past work (`/past-work`, called "timeline" in the mockups): T2, one sentence that rewrites itself
- A sticky full-screen scene over the **day→night sky** (palette §4), driven by scroll (~4200px of scroll for 8 chapters).
- Left-aligned stack at a fixed left margin (120px on desktop): small red uppercase **date** · **place** huge in italic Instrument Serif (~128px) · **what I was doing** (~50px) · a one-line detail (~17px, max 560px wide).
- Chapters are stacked in one grid cell. On change, the outgoing lines blur out and the new ones blur in, **staggered line by line** (0 / 60 / 120 / 180ms). No width-reserving slots, so nothing jumps or leaves gaps.
- Right side: a vertical list of chapter dates; the active one is full opacity with a longer tick.
- Link to the CV PDF bottom-left. Text colors flip to light once the sky gets dark.

Chapters, facts only:
- before: [where Leyla grew up]
- **2023–24 first year at Williams** (winter study diary dated Jan 10, 2024)
- **summer 2024** New York, first corporate job
- **Aug 2024** international orientation leader
- **summer 2025** Dartmouth, causality research with Prof. Bijan Mazaheri
- **2025–26** Exeter College, Oxford
- **summer 2026** Jane Street, strategy & product
- **now** Williams; building Free Food at Williams

The chapter copy is in the mockup; Leyla should rewrite anything that isn't in her voice.

`docs/cv.pdf` exists, so link it from the timeline.

## 3. Content model: adding things = adding one file

Use **Astro** (static, content collections, deploys to GitHub Pages via Actions).

```
src/content/
  writing/   *.md   title, date, kind (math|thoughts), lang, excerpts[]   # kese computed from word count
  projects/  *.md   title, status, kicker, dek, hero, parts{problem,for_whom,key_decision,built_with,whats_next}
                    body: one "## " section per part, in that order
  creative/  photos.yml (src, caption, alt)  scores.yml (title, sub, musescore_url)
  timeline/  events.yml (when, where, text, photo?)
```

- Math papers become web pages (KaTeX), with the PDF linked.
- Reading time: 1 kese ≈ 300 words, rounded up; 0 = "still brewing".

## 4. Design tokens

- **Type:** Instrument Serif (display), EB Garamond (reading, Cyrillic), Inter (UI), Nothing You Could Do (handwritten notes, sparingly).
- **Color:** ink `#1D1B1A`; paper `#FFFDF9` / `#FBF6EE`; red `#C8323C`; pink `#B4436F`; purple `#5B3A86`/`#7A4BA6`; night `#141A36`.
- **Sky palette** (hour → top, bottom), interpolated linearly in RGB:
  `6:[#4A5C9E,#F2A88A] 7.6:[#7FA8DD,#F7DCC2] 12:[#69A1DE,#D6E8F6] 16:[#7B9FD5,#F3D5B6] 17.4:[#465092,#F28A60] 18.6:[#232859,#6A4977] 20:[#0D1230,#1F2649] 22:[#070B1E,#141A36]`
- **Sound:** WebAudio only, no files. Every sound is a soft **bubble pop**: a sine whose frequency ramps up exponentially (e.g. 420→1250Hz over ~50ms), gain 0.1–0.2, ~90ms. Never noise or static (Leyla vetoed it). Add a small global sound toggle and remember the choice.
- **Motion:** springy cubic-bezier(.2,1.3,.3,1) for UI; real spring physics only where noted.

## 5. Quality bar

- Responsive down to 375px. Every interaction has a touch equivalent and a `prefers-reduced-motion` fallback.
- Lighthouse ≥ 90 on performance and accessibility. Images converted to AVIF/WebP, each under ~300KB.
- Keyboard: every clickable thing is a real `<a>`/`<button>` with a visible focus ring.
- Check with Playwright screenshots at 1440 and 390 wide before calling a page done.

## 6. Old URLs → redirects

`index.html`, `thoughts.html`, `math.html`, `misc.html`, `quotes.html`, `quotebook/`, `essays/ioleader.html`, `essays/joy-roommates.html`, `essays/ws2024.html`, `docs/*.pdf`. Keep the PDFs at the same paths, and redirect the old essay pages to their new reader URLs.

## 7. Placeholders Leyla still owes

Where she grew up · photos for timeline chapters · Free Food problem/stack/screenshot · "this website" post in her voice (a draft exists in the mockup) · the third project · a note about her music · captions and back-of-photo notes · the full Euler paper as a web page · causality write-up.

## 8. Decisions for Leyla before deploying

1. **The quotebook job.** `.github/workflows/refresh-quotebook.yml` commits to `main` daily. With the quotebook gone, either delete the workflow, script and data, or keep the data but unlink it. Don't decide silently.
2. **Instagram / LinkedIn / CV links** in the footer: yes or no.

## 8b. Decided 14 Nov 2026

- Nav order and names: **past work · projects · writing · creative · email**. "Timeline" is now "past work" (`/past-work`).
- The old site is kept in `archive/old-site/` (in the repo, not published).
- `mosque.jpeg` was upscaled 2× (1280 → 2560 wide); the original is in the archive.

## 9. Working rules

- Work on a branch; open a PR. **Never push to `main` without Leyla's explicit OK.**
- Build page by page in this order: home → writing → projects → creative → timeline. Share a preview after each.

## Appendix: photo asset map (mockup `/_blob/...` IDs → repo files)

| blob id | file |
|---|---|
| 6401f1080f38a1f2e961790b6bd5676d | pics/mosque.jpeg |
| fa6b21e46355d63cf607116a71658af4 | pics/merey.jpeg |
| 712fb9e22c02564d9aab67f167e1b6fd | pics/dana.jpeg |
| 705b9e817e903227d439bb40783950d0 | pics/swings.jpg |
| 8d4be80f53c163bf439f0900fc455692 | pics/aubergine.jpeg |
| 632acd1ae3420b3df98bb1e402bac9ca | pics/poker.jpeg |
| a1c297dd3de23aca677660750f80412d | pics/lying.jpeg |

`pics/money.jpeg` looks like another artist's character, so don't use it.
