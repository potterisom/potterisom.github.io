// Fogged glass over the home photo. The canvas is decorative: it never takes
// pointer events, so the links underneath always work.

interface Drip {
  x: number;
  y: number;
  v: number;
  w: number;
  life: number;
}

export function initFog(canvas: HTMLCanvasElement, scene: HTMLElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const c = ctx;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  let w = 0;
  let h = 0;
  let dpr = 1;
  let tick = false;
  let drips: Drip[] = [];
  let last: { x: number; y: number } | null = null;
  let timer: number | undefined;

  const radius = () => (coarse ? 62 : 80);

  function erase(draw: () => void) {
    c.globalCompositeOperation = 'destination-out';
    draw();
    c.globalCompositeOperation = 'source-over';
  }

  function etch(strength = 0.9) {
    const narrow = w < 700;
    const size = Math.max(54, Math.min(86, w * 0.06));
    const x = narrow ? w * 0.56 : w * 0.722;
    const y = narrow ? h * 0.27 : h * 0.333;
    erase(() => {
      c.save();
      c.translate(x, y);
      c.rotate(-0.06);
      c.fillStyle = `rgba(0,0,0,${strength})`;
      c.font = `${size}px "Instrument Serif", Georgia, serif`;
      c.fillText('hi', 0, 0);
      // The heart is drawn as a finger stroke rather than a glyph, so it looks
      // the same whatever fonts the visitor has.
      const s = size / 86;
      const hx = c.measureText('hi ').width + 30 * s;
      c.translate(hx, -24 * s);
      c.scale(s, s);
      c.strokeStyle = `rgba(0,0,0,${strength})`;
      c.lineWidth = 5.5;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      c.beginPath();
      c.moveTo(0, 22);
      c.bezierCurveTo(-38, -4, -22, -34, 0, -12);
      c.bezierCurveTo(22, -34, 38, -4, 0, 22);
      c.stroke();
      c.restore();
    });
  }

  // The fog itself (colour + droplet specks) lives in an opaque offscreen
  // texture. The visible canvas only really owns an alpha channel: wiping
  // lowers it, regrowth raises it, and the colour is re-stamped from the
  // texture every frame so edges never discolour.
  const tex = document.createElement('canvas');
  const tc = tex.getContext('2d')!;

  function recolor() {
    c.globalCompositeOperation = 'source-in';
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(tex, 0, 0);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.globalCompositeOperation = 'source-over';
  }

  function paint() {
    tex.width = canvas.width;
    tex.height = canvas.height;
    tc.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = tc.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgb(222,228,238)');
    g.addColorStop(1, 'rgb(206,214,230)');
    tc.fillStyle = g;
    tc.fillRect(0, 0, w, h);
    const specks = Math.round(((w * h) / (1440 * 900)) * 1400);
    for (let i = 0; i < specks; i++) {
      const r = Math.random() * 1.8 + 0.3;
      tc.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,.5)' : 'rgba(150,160,185,.28)';
      tc.beginPath();
      tc.arc(Math.random() * w, Math.random() * h, r, 0, 6.3);
      tc.fill();
    }
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = '#fff';
    c.fillRect(0, 0, w, h);
    recolor();
    document.fonts.load('86px "Instrument Serif"').then(() => etch(), () => etch());
  }

  function resize() {
    const nw = scene.clientWidth;
    const nh = scene.clientHeight;
    // Mobile browsers change the height as the address bar hides; don't
    // re-fog the glass for that.
    if (nw === w && Math.abs(nh - h) < 150 && nh <= h) return;
    w = nw;
    h = nh;
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    drips = [];
    paint();
  }

  function stamp(x: number, y: number, r: number) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(0,0,0,.9)');
    g.addColorStop(0.6, 'rgba(0,0,0,.55)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, r, 0, 6.3);
    c.fill();
  }

  function wipe(x: number, y: number) {
    const r = radius();
    erase(() => {
      // Fill in between pointer samples so a fast swipe leaves a streak, not dots.
      if (last) {
        const d = Math.hypot(x - last.x, y - last.y);
        const n = Math.min(24, Math.floor(d / (r * 0.45)));
        for (let i = 1; i < n; i++) {
          stamp(last.x + ((x - last.x) * i) / n, last.y + ((y - last.y) * i) / n, r);
        }
      }
      stamp(x, y, r);
    });
    last = { x, y };
    if (!reduce.matches && Math.random() < 0.08 && drips.length < 10) {
      drips.push({ x: x + (Math.random() - 0.5) * 60, y: y + 40, v: 1.2 + Math.random(), w: 2 + Math.random() * 2, life: 140 });
    }
  }

  function frame() {
    // Regrowth: a whisper of fog over everything, 20 times a second.
    // Additive, so it keeps growing all the way back instead of stalling.
    // Every other tick, so a wipe takes about twelve seconds to close over.
    if ((tick = !tick)) {
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = 'rgba(255,255,255,.006)';
      c.fillRect(0, 0, w, h);
      recolor();
      // Whoever wrote "hi" pressed hard: it never quite fogs over.
      etch(0.02);
    }
    if (Math.random() < 0.04 && drips.length < 6) {
      drips.push({
        x: Math.random() * w,
        y: Math.random() * h * 0.33,
        v: 1 + Math.random() * 1.5,
        w: 2 + Math.random() * 2.5,
        life: 120 + Math.random() * 160,
      });
    }
    erase(() => {
      c.fillStyle = 'rgba(0,0,0,.55)';
      for (const d of drips) {
        c.beginPath();
        c.ellipse(d.x, d.y, d.w, d.w * 1.4, 0, 0, 6.3);
        c.fill();
        d.y += d.v;
        d.x += Math.sin(d.y / 30) * 0.3;
        d.life--;
      }
    });
    drips = drips.filter((d) => d.life > 0 && d.y < h + 20);
  }

  function run() {
    window.clearInterval(timer);
    timer = undefined;
    if (!reduce.matches && !document.hidden) timer = window.setInterval(frame, 50);
  }

  const point = (e: PointerEvent) => {
    // Browsers fire a synthetic move at the origin on load; that isn't a hand.
    if (e.pointerType === 'mouse' && e.clientX === 0 && e.clientY === 0) return;
    const r = canvas.getBoundingClientRect();
    wipe(e.clientX - r.left, e.clientY - r.top);
  };
  scene.addEventListener('pointerdown', (e) => {
    last = null;
    point(e);
  });
  scene.addEventListener('pointermove', point);
  scene.addEventListener('pointerleave', () => (last = null));
  scene.addEventListener('pointerup', (e) => {
    if (e.pointerType !== 'mouse') last = null;
  });

  // Keyboard: clear the glass over whatever just took focus, so nobody has to
  // tab through fog.
  scene.addEventListener('focusin', (e) => {
    const el = e.target as HTMLElement;
    if (!el.matches(':focus-visible')) return;
    const block = (el.closest('[data-behind-glass]') as HTMLElement) ?? el;
    const a = block.getBoundingClientRect();
    const b = canvas.getBoundingClientRect();
    const r = 90;
    erase(() => {
      for (let y = a.top; y <= a.bottom + r / 2; y += r / 2) {
        for (let x = a.left; x <= a.right + r / 2; x += r / 2) stamp(x - b.left, y - b.top, r);
      }
    });
  });

  new ResizeObserver(resize).observe(scene);
  reduce.addEventListener('change', () => {
    w = 0;
    resize();
    run();
  });
  document.addEventListener('visibilitychange', run);
  resize();
  run();
}
