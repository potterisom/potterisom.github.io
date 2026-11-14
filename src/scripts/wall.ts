/**
 * The endless tiled wall (writing page).
 *
 * A grid of tiles that wraps in both directions, drawn as if on the inside of
 * a curved surface: tiles tilt, shrink and fade away from the centre. It
 * drifts slowly on its own and can be thrown around with inertia.
 * Ported from handoff/mockups/WritingWall.dc.html; the numbers are the mockup's.
 */

const CW = 300; // column pitch at 1440×900
const RH = 270; // row pitch
const FRICTION = 0.94; // velocity kept per frame
const DRIFT_X = -0.15; // ambient drift, px per frame
const DRIFT_Y = -0.04;
const CLICK_SLOP = 6; // px of movement that still counts as a click

const mod = (a: number, n: number) => ((a % n) + n) % n;

export function initWall(stage: HTMLElement, cols: number, onOpen: (link: HTMLAnchorElement) => void) {
  const originals = Array.from(stage.querySelectorAll<HTMLAnchorElement>('[data-tile]'));
  const baseCols = cols;
  const baseRows = Math.ceil(originals.length / baseCols);
  // The grid as drawn: the originals, repeated when the screen is bigger than one copy of the wall.
  let tiles: HTMLAnchorElement[] = originals;
  let rows = baseRows;
  let reps = '1x1';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  let vw = 0;
  let vh = 0;
  let k = 1; // size of the wall relative to the 1440×900 design
  let ox = 0;
  let oy = 0;
  let vx = 0;
  let vy = 0;
  let goal: { ox: number; oy: number } | null = null; // keyboard: glide a tile to the centre
  let dragging = false;
  let paused = false;
  let moved = 0;
  let suppressClick = false;
  let lastPt = { x: 0, y: 0, t: 0 };
  let lastFrame = 0;
  let raf = 0;

  function measure() {
    vw = stage.clientWidth;
    vh = stage.clientHeight;
    k = vw < 700 ? 0.9 : Math.max(0.85, Math.min(1.4, vw / 1440));

    // Repeat the grid until one lap of the wall is bigger than the screen, so
    // the wrap-around seam is always off screen and the wall really is endless.
    const repX = Math.max(1, Math.ceil((vw + CW * k) / (baseCols * CW * k)));
    const repY = Math.max(1, Math.ceil((vh + RH * k) / (baseRows * RH * k)));
    if (`${repX}x${repY}` !== reps) {
      reps = `${repX}x${repY}`;
      stage.querySelectorAll('[data-tile-copy]').forEach((el) => el.remove());
      cols = baseCols * repX;
      rows = baseRows * repY;
      tiles = new Array(cols * rows);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const source = originals[(r % baseRows) * baseCols + (c % baseCols)];
          let el = source;
          if (r >= baseRows || c >= baseCols) {
            el = source.cloneNode(true) as HTMLAnchorElement;
            el.setAttribute('data-tile-copy', '');
            el.setAttribute('aria-hidden', 'true');
            el.tabIndex = -1;
            stage.appendChild(el);
          }
          tiles[r * cols + c] = el;
        }
      }
    }
  }

  /** Start with a tile in the middle on phones, where only one fits across. */
  function centre() {
    if (vw < 700) {
      ox = (-CW * k) / 2;
      oy = (-RH * k) / 2;
    }
  }

  function render() {
    const cw = CW * k;
    const rh = RH * k;
    const W = cols * cw;
    const H = rows * rh;
    // how fast the wall curves away: a full "radius" is about half the screen
    const nx = Math.max(vw / 2, 380);
    const ny = Math.max(vh / 2, 380);

    for (let i = 0; i < tiles.length; i++) {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const u = mod(c * cw + ox + cw / 2, W); // position along the wall, 0..W
      const v = mod(r * rh + oy + rh / 2, H);
      const x = u - (W - vw) / 2;
      const y = v - (H - vh) / 2;
      const dx = (x - vw / 2) / nx;
      const dy = (y - vh / 2) / ny;
      const d = Math.min(1.6, Math.hypot(dx, dy));
      // fade to nothing right at the seam, so wrapping tiles never pop
      const seam = Math.min(1, Math.min(u, W - u) / (cw * 0.5)) * Math.min(1, Math.min(v, H - v) / (rh * 0.5));
      const opacity = Math.max(0.2, 1 - d * 0.42) * seam;
      const s = (1 - (0.3 * d * d) / 2.56) * k;
      const el = tiles[i];
      el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotateY(${(dx * 34).toFixed(1)}deg) rotateX(${(-dy * 26).toFixed(1)}deg) scale(${s.toFixed(3)})`;
      el.style.opacity = opacity.toFixed(2);
      el.style.zIndex = String(Math.round(100 - d * 50));
    }
  }

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    const f = Math.min(3, (now - (lastFrame || now)) / 16.67) || 1; // frames elapsed
    lastFrame = now;
    if (paused) return;
    if (goal) {
      ox += (goal.ox - ox) * Math.min(1, 0.14 * f);
      oy += (goal.oy - oy) * Math.min(1, 0.14 * f);
      if (Math.abs(goal.ox - ox) + Math.abs(goal.oy - oy) < 0.5) goal = null;
    } else if (!dragging) {
      const still = reduced.matches; // reduced motion: no drift, no coasting
      vx *= Math.pow(FRICTION, f);
      vy *= Math.pow(FRICTION, f);
      ox += still ? 0 : (vx + DRIFT_X) * f;
      oy += still ? 0 : (vy + DRIFT_Y) * f;
    }
    render();
  }

  // --- drag with inertia ---
  function onMove(e: PointerEvent) {
    if (!dragging) return;
    const dx = e.clientX - lastPt.x;
    const dy = e.clientY - lastPt.y;
    const frames = Math.max(0.5, (e.timeStamp - lastPt.t) / 16.67);
    lastPt = { x: e.clientX, y: e.clientY, t: e.timeStamp };
    moved += Math.hypot(dx, dy);
    ox += dx;
    oy += dy;
    const cap = (n: number) => Math.max(-70, Math.min(70, n));
    vx = cap(dx / frames);
    vy = cap(dy / frames);
  }
  function onUp() {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove('is-dragging');
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    if (moved >= CLICK_SLOP) {
      suppressClick = true;
      window.setTimeout(() => (suppressClick = false), 0);
    }
  }
  stage.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || paused) return;
    dragging = true;
    goal = null;
    moved = 0;
    vx = vy = 0;
    lastPt = { x: e.clientX, y: e.clientY, t: e.timeStamp };
    stage.classList.add('is-dragging');
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  });
  stage.addEventListener('dragstart', (e) => e.preventDefault());

  // a click that wasn't a drag opens the piece
  stage.addEventListener('click', (e) => {
    const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-tile]');
    if (!link) return;
    if (suppressClick) return e.preventDefault();
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // new tab etc.: leave it to the browser
    e.preventDefault();
    onOpen(link);
  });

  // trackpads and mouse wheels pan the wall
  stage.addEventListener(
    'wheel',
    (e) => {
      if (paused) return;
      e.preventDefault();
      goal = null;
      ox -= e.deltaX;
      oy -= e.deltaY;
    },
    { passive: false },
  );

  // --- keyboard: Tab walks the pieces and brings each to the centre; arrows pan ---
  stage.addEventListener('focusin', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-tile]');
    if (!el || !el.matches(':focus-visible')) return;
    const i = tiles.indexOf(el);
    const W = cols * CW * k;
    const H = rows * RH * k;
    const nearest = (target: number, current: number, span: number) => current + (mod(target - current + span / 2, span) - span / 2);
    goal = {
      ox: nearest(W / 2 - (i % cols) * CW * k - (CW * k) / 2, ox, W),
      oy: nearest(H / 2 - Math.floor(i / cols) * RH * k - (RH * k) / 2, oy, H),
    };
    if (reduced.matches) {
      ox = goal.ox;
      oy = goal.oy;
      goal = null;
    }
  });
  stage.addEventListener('keydown', (e) => {
    const step: Record<string, [number, number]> = {
      ArrowLeft: [1, 0],
      ArrowRight: [-1, 0],
      ArrowUp: [0, 1],
      ArrowDown: [0, -1],
    };
    const dir = step[e.key];
    if (!dir) return;
    e.preventDefault();
    goal = null;
    if (reduced.matches) {
      ox += dir[0] * 120;
      oy += dir[1] * 120;
    } else {
      vx += dir[0] * 14;
      vy += dir[1] * 14;
    }
  });

  window.addEventListener('resize', measure);
  measure();
  centre();
  render();
  raf = requestAnimationFrame(frame);

  return {
    pause() {
      paused = true;
      vx = vy = 0;
    },
    resume() {
      paused = false;
      lastFrame = 0;
    },
    destroy() {
      cancelAnimationFrame(raf);
    },
  };
}
