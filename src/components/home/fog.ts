// Fogged glass over the home photo. The canvas is decorative: it never takes
// pointer events, so the links underneath always work.
//
// Three layers:
//   tex  - the fog itself (colour + droplet specks), opaque, offscreen
//   ink  - what has been drawn on the glass with a pressed finger, offscreen
//   main - the visible canvas. It only really owns an alpha channel: wiping
//          lowers it, regrowth raises it, the ink keeps its lines clear, and
//          the colour is re-stamped from tex so edges never discolour.

interface Drip {
  x: number;
  y: number;
  v: number;
  w: number;
  life: number;
}

export function initFog(canvas: HTMLCanvasElement, scene: HTMLElement, refog?: HTMLElement | null) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const c = ctx;
  const tex = document.createElement('canvas');
  const tc = tex.getContext('2d')!;
  const ink = document.createElement('canvas');
  const ic = ink.getContext('2d')!;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  let w = 0;
  let h = 0;
  let dpr = 1;
  let tick = false;
  let drips: Drip[] = [];
  let last: { x: number; y: number } | null = null;
  let pen: { x: number; y: number } | null = null; // set while a finger/button is down
  let timer: number | undefined;

  const radius = () => (coarse ? 62 : 80);

  function erase(draw: () => void) {
    c.globalCompositeOperation = 'destination-out';
    draw();
    c.globalCompositeOperation = 'source-over';
  }

  function recolor() {
    c.globalCompositeOperation = 'source-in';
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(tex, 0, 0);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.globalCompositeOperation = 'source-over';
  }

  // Clear the fog wherever there is ink. Called gently on every regrowth
  // tick, so drawings stay sharp while everything around them fogs over.
  function holdInk(strength: number) {
    erase(() => {
      c.globalAlpha = strength;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.drawImage(ink, 0, 0);
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.globalAlpha = 1;
    });
  }

  // Someone got here first and wrote "hi" on the window.
  function greet() {
    const narrow = w < 700;
    const size = Math.max(54, Math.min(86, w * 0.06));
    ic.save();
    ic.translate(narrow ? w * 0.56 : w * 0.722, narrow ? h * 0.27 : h * 0.333);
    ic.rotate(-0.06);
    ic.fillStyle = '#000';
    ic.font = `${size}px "Instrument Serif", Georgia, serif`;
    ic.fillText('hi', 0, 0);
    // The heart is a finger stroke rather than a glyph, so it looks the same
    // whatever fonts the visitor has.
    const s = size / 86;
    ic.translate(ic.measureText('hi ').width + 30 * s, -24 * s);
    ic.scale(s, s);
    ic.strokeStyle = '#000';
    ic.lineWidth = 5.5;
    ic.lineCap = 'round';
    ic.lineJoin = 'round';
    ic.beginPath();
    ic.moveTo(0, 22);
    ic.bezierCurveTo(-38, -4, -22, -34, 0, -12);
    ic.bezierCurveTo(22, -34, 38, -4, 0, 22);
    ic.stroke();
    ic.restore();
    holdInk(0.9);
  }

  function paint() {
    for (const cv of [tex, ink]) {
      cv.width = canvas.width;
      cv.height = canvas.height;
    }
    tc.setTransform(dpr, 0, 0, dpr, 0, 0);
    ic.setTransform(dpr, 0, 0, dpr, 0, 0);
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
    drips = [];
    document.fonts.load('86px "Instrument Serif"').then(greet, greet);
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

  // Pressing while you move writes on the glass with a fingertip. The line
  // goes into the ink layer, so it stays after the wipe around it closes.
  function draw(x: number, y: number) {
    if (!pen) return;
    ic.strokeStyle = '#000';
    ic.lineWidth = coarse ? 13 : 11;
    ic.lineCap = 'round';
    ic.lineJoin = 'round';
    ic.shadowColor = '#000';
    ic.shadowBlur = 2.5 * dpr;
    ic.beginPath();
    ic.moveTo(pen.x, pen.y);
    ic.lineTo(x, y);
    ic.stroke();
    ic.shadowBlur = 0;
    pen = { x, y };
  }

  function frame() {
    // Regrowth: a whisper of fog over everything. Additive, so it grows all
    // the way back; every other tick, so a wipe takes about twelve seconds
    // to close over.
    if ((tick = !tick)) {
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = 'rgba(255,255,255,.006)';
      c.fillRect(0, 0, w, h);
      recolor();
      holdInk(0.05);
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

  const at = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const onControl = (e: Event) => !!refog && e.target instanceof Node && refog.contains(e.target);

  scene.addEventListener('pointerdown', (e) => {
    if (onControl(e) || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const p = at(e);
    last = null;
    pen = p;
    wipe(p.x, p.y);
  });
  scene.addEventListener('pointermove', (e) => {
    // Browsers fire a synthetic move at the origin on load; that isn't a hand.
    if (e.pointerType === 'mouse' && e.clientX === 0 && e.clientY === 0) return;
    const p = at(e);
    wipe(p.x, p.y);
    if (pen && (e.pointerType !== 'mouse' || e.buttons & 1)) {
      draw(p.x, p.y);
      if (reduce.matches) holdInk(0.9);
    } else pen = null;
  });
  const lift = (e: PointerEvent) => {
    pen = null;
    if (e.pointerType !== 'mouse') last = null;
  };
  window.addEventListener('pointerup', lift);
  window.addEventListener('pointercancel', lift);
  scene.addEventListener('pointerleave', () => (last = null));
  // Drawing across a link shouldn't start dragging the link.
  scene.addEventListener('dragstart', (e) => e.preventDefault());

  // Keyboard: clear the glass over whatever just took focus, so nobody has to
  // tab through fog.
  scene.addEventListener('focusin', (e) => {
    const el = e.target as HTMLElement;
    if (!el.matches(':focus-visible') || onControl(e)) return;
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

  // Fresh glass: fog everything at once and forget the drawings.
  refog?.addEventListener('click', () => {
    last = null;
    pen = null;
    paint();
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
