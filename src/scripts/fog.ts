/**
 * Fogged glass (home page).
 *
 * A canvas of off-white condensation sits over the photo. The pointer wipes it
 * away, it slowly grows back, and now and then a drip runs down.
 * Ported from handoff/mockups/HomeMosque.dc.html; the numbers are the mockup's.
 *
 * One change in how it is drawn: the mockup erased and re-filled the canvas
 * itself, and 1%-alpha fills on an 8-bit canvas round badly (regrown fog turns
 * white and leaves a bright rim around every wipe). Here the fog is painted
 * once, and a small float "clearness" mask says how much of it is wiped at
 * each point. Wiping, drips and regrowth all edit the mask; each frame is
 * fog × (1 − mask). Same behaviour, no rounding drift.
 *
 * The canvas is decoration only (aria-hidden, pointer-events: none). Everything
 * behind it stays a normal, focusable link.
 */

type Drip = { x: number; y: number; v: number; w: number; life: number };

const TICK_MS = 50;
const REGROW = 0.01; // share of the wiped glass that fogs back every tick
const MAX_AMBIENT_DRIPS = 6;
const ETCH = 'hi ♡';

export function initFog(stage: HTMLElement, canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  const fogLayer = document.createElement('canvas'); // the fog itself, painted once per size
  const maskLayer = document.createElement('canvas'); // the mask as pixels, for compositing
  const fogCtx = fogLayer.getContext('2d');
  const maskCtx = maskLayer.getContext('2d');
  if (!ctx || !fogCtx || !maskCtx) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const keep = stage.querySelector<HTMLElement>('[data-fog-keep]'); // text block to clear for keyboard users

  let W = 0; // pane size, CSS px
  let H = 0;
  let S = 2; // CSS px per mask cell
  let mw = 0; // mask size, cells
  let mh = 0;
  let clear = new Float32Array(0); // 0 = fogged, 1 = wiped clean
  let maskPixels: ImageData | null = null;
  let drips: Drip[] = [];
  let timer = 0;
  let frame = 0;
  let generation = 0;
  let last: { x: number; y: number; t: number } | null = null;
  let keyboardFocus = false;

  const brush = () => (W < 600 ? 60 : 80);

  /** Paint fresh fog at the current size and reset the mask. */
  function fog() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = stage.clientWidth;
    H = stage.clientHeight;
    if (!W || !H) return;
    generation++;

    for (const el of [canvas, fogLayer]) {
      el.width = Math.round(W * dpr);
      el.height = Math.round(H * dpr);
    }
    S = Math.max(2, Math.ceil(Math.sqrt((W * H) / 350_000)));
    mw = Math.ceil(W / S);
    mh = Math.ceil(H / S);
    maskLayer.width = mw;
    maskLayer.height = mh;
    maskPixels = maskCtx!.createImageData(mw, mh);
    // Reduced motion: the glass starts mostly clear and stays that way.
    clear = new Float32Array(mw * mh).fill(reduced.matches ? 0.74 : 0);
    drips = [];

    const c = fogCtx!;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, W, H);
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(222,228,238,.88)');
    g.addColorStop(1, 'rgba(206,214,230,.93)');
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);

    // droplet specks: 1400 on a 1440x900 pane, same density at any size
    const specks = Math.round((1400 * W * H) / (1440 * 900));
    for (let i = 0; i < specks; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const r = Math.random() * 1.8 + 0.3;
      c.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,.45)' : 'rgba(150,160,185,.25)';
      c.beginPath();
      c.arc(x, y, r, 0, 6.3);
      c.fill();
    }

    // "hi ♡", written with a finger before you got here
    const mine = generation;
    const etch = () => {
      if (mine === generation) etchText();
    };
    if (document.fonts?.load) document.fonts.load('86px "Instrument Serif"').then(etch, etch);
    else etch();

    if (keyboardFocus) clearBehind(0.9);
    draw();
  }

  /** Wipe by `amount` (0..1) at mask cell i, compounding like repeated erasing. */
  const wipeCell = (i: number, amount: number) => {
    clear[i] = 1 - (1 - clear[i]) * (1 - amount);
  };

  function etchText() {
    const size = Math.max(54, Math.min(86, W * 0.06));
    const t = document.createElement('canvas');
    t.width = mw;
    t.height = mh;
    const c = t.getContext('2d');
    if (!c) return;
    c.scale(1 / S, 1 / S);
    c.font = `${size}px "Instrument Serif", Georgia, serif`;
    const tw = c.measureText(ETCH).width;
    c.translate(Math.min(W * (1040 / 1440), W - tw - 28), H * (300 / 900));
    c.rotate(-0.06);
    c.fillText(ETCH, 0, 0);
    const a = c.getImageData(0, 0, mw, mh).data;
    for (let i = 0; i < clear.length; i++) {
      if (a[i * 4 + 3]) wipeCell(i, (0.9 * a[i * 4 + 3]) / 255);
    }
    draw();
  }

  /** One soft circular wipe: 0.9 at the centre, 0.55 at 60% of the radius, 0 at the edge. */
  function stamp(x: number, y: number, r: number, strength = 1) {
    const x0 = Math.max(0, Math.floor((x - r) / S));
    const x1 = Math.min(mw - 1, Math.ceil((x + r) / S));
    const y0 = Math.max(0, Math.floor((y - r) / S));
    const y1 = Math.min(mh - 1, Math.ceil((y + r) / S));
    for (let j = y0; j <= y1; j++) {
      const dy = (j + 0.5) * S - y;
      for (let i = x0; i <= x1; i++) {
        const dx = (i + 0.5) * S - x;
        const d = Math.sqrt(dx * dx + dy * dy) / r;
        if (d >= 1) continue;
        const a = d < 0.6 ? 0.9 - (0.35 * d) / 0.6 : (0.55 * (1 - d)) / 0.4;
        wipeCell(j * mw + i, a * strength);
      }
    }
  }

  /** A drip: a small soft ellipse, taller than wide. */
  function dripDot(d: Drip) {
    const rx = d.w;
    const ry = d.w * 1.4;
    const x0 = Math.max(0, Math.floor((d.x - rx) / S) - 1);
    const x1 = Math.min(mw - 1, Math.ceil((d.x + rx) / S) + 1);
    const y0 = Math.max(0, Math.floor((d.y - ry) / S) - 1);
    const y1 = Math.min(mh - 1, Math.ceil((d.y + ry) / S) + 1);
    for (let j = y0; j <= y1; j++) {
      const dy = ((j + 0.5) * S - d.y) / (ry + S / 2);
      for (let i = x0; i <= x1; i++) {
        const dx = ((i + 0.5) * S - d.x) / (rx + S / 2);
        const q = dx * dx + dy * dy;
        if (q < 1) wipeCell(j * mw + i, 0.55 * Math.min(1, (1 - q) * 2.5));
      }
    }
  }

  function wipe(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    const x = ((clientX - rect.left) * W) / rect.width;
    const y = ((clientY - rect.top) * H) / rect.height;
    const r = brush();
    const now = performance.now();

    // Fill the gaps between pointer events so a fast swipe is one clean stroke.
    if (last && now - last.t < 120) {
      const dist = Math.hypot(x - last.x, y - last.y);
      const steps = Math.min(40, Math.floor(dist / (r / 3)));
      for (let i = 1; i < steps; i++) {
        stamp(last.x + ((x - last.x) * i) / steps, last.y + ((y - last.y) * i) / steps, r);
      }
    }
    stamp(x, y, r);
    last = { x, y, t: now };

    // sometimes a drip starts where you wiped
    if (!reduced.matches && Math.random() < 0.08) {
      drips.push({ x: x + (Math.random() - 0.5) * 60, y: y + 40, v: 1.2 + Math.random(), w: 2 + Math.random() * 2, life: 140 });
    }
    draw();
  }

  /** Clear the glass over the name and links (keyboard users can't wipe). */
  function clearBehind(strength: number) {
    if (!keep) return;
    const a = canvas.getBoundingClientRect();
    const b = keep.getBoundingClientRect();
    const r = brush();
    const step = r * 0.7;
    for (let y = b.top - a.top; y <= b.bottom - a.top + step / 2; y += step) {
      for (let x = b.left - a.left; x <= b.right - a.left + step / 2; x += step) {
        stamp(x, y, r, strength);
      }
    }
  }

  function tick() {
    // regrow
    const k = 1 - REGROW;
    for (let i = 0; i < clear.length; i++) clear[i] *= k;

    // an occasional drip from near the top
    if (Math.random() < 0.04 && drips.length < MAX_AMBIENT_DRIPS) {
      drips.push({
        x: Math.random() * W,
        y: Math.random() * (H / 3),
        v: 1 + Math.random() * 1.5,
        w: 2 + Math.random() * 2.5,
        life: 120 + Math.random() * 160,
      });
    }
    for (const d of drips) {
      dripDot(d);
      d.y += d.v;
      d.x += Math.sin(d.y / 30) * 0.3;
      d.life--;
    }
    drips = drips.filter((d) => d.life > 0 && d.y < H + 20);

    // keep the glass clear over the links while one has keyboard focus
    if (keyboardFocus) clearBehind(0.1);
    draw();
  }

  /** Schedule one repaint: fog × (1 − mask). */
  function draw() {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (!maskPixels) return;
      const px = maskPixels.data;
      for (let i = 0; i < clear.length; i++) px[i * 4 + 3] = 255 - clear[i] * 255;
      maskCtx!.putImageData(maskPixels, 0, 0);

      const c = ctx!;
      c.globalCompositeOperation = 'copy';
      c.drawImage(fogLayer, 0, 0);
      c.globalCompositeOperation = 'destination-in';
      c.imageSmoothingEnabled = true;
      c.drawImage(maskLayer, 0, 0, mw, mh, 0, 0, (mw * S * canvas.width) / W, (mh * S * canvas.height) / H);
      c.globalCompositeOperation = 'source-over';
    });
  }

  function run() {
    window.clearInterval(timer);
    timer = 0;
    if (!reduced.matches && !document.hidden) timer = window.setInterval(tick, TICK_MS);
  }

  // --- pointer: mouse wipes on hover, touch and pen wipe on drag ---
  stage.addEventListener('pointermove', (e) => wipe(e.clientX, e.clientY));
  stage.addEventListener('pointerdown', (e) => {
    last = null;
    wipe(e.clientX, e.clientY);
  });
  for (const type of ['pointerup', 'pointercancel', 'pointerleave'] as const) {
    stage.addEventListener(type, () => (last = null));
  }

  // --- keyboard: focusing a link wipes the glass over the text ---
  stage.addEventListener('focusin', (e) => {
    const el = e.target as HTMLElement;
    if (!el.matches?.(':focus-visible')) return;
    keyboardFocus = true;
    clearBehind(0.9);
    draw();
  });
  stage.addEventListener('focusout', () => (keyboardFocus = false));

  // --- lifecycle ---
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      // Phone address bars change the height a little all the time; only re-fog
      // when the pane really changed shape.
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      if (w !== W || Math.abs(h - H) > H * 0.15) fog();
    }, 150);
  });
  document.addEventListener('visibilitychange', run);
  reduced.addEventListener('change', () => {
    fog();
    run();
  });

  fog();
  run();
}
