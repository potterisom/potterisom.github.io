// Fog on the glass over the home photo. Moving the cursor (or a finger) wipes it;
// it slowly fogs over again.

export function startFog(cv: HTMLCanvasElement) {
  const c = cv.getContext('2d');
  if (!c) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, dpr = 1;

  function fill() {
    c!.globalCompositeOperation = 'source-over';
    c!.clearRect(0, 0, W, H);
    const g = c!.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(224,230,240,.9)'); g.addColorStop(1, 'rgba(208,216,232,.94)');
    c!.fillStyle = g; c!.fillRect(0, 0, W, H);
    if (reduce) { // start mostly clear
      c!.globalCompositeOperation = 'destination-out';
      c!.fillStyle = 'rgba(0,0,0,.7)'; c!.fillRect(0, 0, W, H);
      c!.globalCompositeOperation = 'source-over';
    }
  }

  function size() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = cv.width = Math.round(cv.clientWidth * dpr);
    H = cv.height = Math.round(cv.clientHeight * dpr);
    fill();
  }
  size();
  let rt: number | undefined;
  addEventListener('resize', () => { clearTimeout(rt); rt = window.setTimeout(size, 150); });

  let lx: number | null = null, ly = 0, lt = 0;
  function wipe(clientX: number, clientY: number) {
    const r = cv.getBoundingClientRect();
    const x = (clientX - r.left) * dpr, y = (clientY - r.top) * dpr;
    const now = performance.now(), dt = Math.max(16, now - (lt || now - 16));
    const sp = lx == null ? 0 : Math.hypot(x - lx, y - ly) / dpr / dt;
    lx = x; ly = y; lt = now;
    const R = (120 + Math.min(110, sp * 90)) * dpr;
    c!.globalCompositeOperation = 'destination-out';
    const g = c!.createRadialGradient(x, y, 0, x, y, R);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.55, 'rgba(0,0,0,.8)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c!.fillStyle = g; c!.beginPath(); c!.arc(x, y, R, 0, 6.3); c!.fill();
    c!.globalCompositeOperation = 'source-over';
  }
  addEventListener('pointermove', (e) => wipe(e.clientX, e.clientY), { passive: true });
  addEventListener('touchmove', (e) => { for (const t of Array.from(e.touches)) wipe(t.clientX, t.clientY); }, { passive: true });

  setInterval(() => {
    c!.globalCompositeOperation = 'source-over';
    c!.fillStyle = 'rgba(216,223,236,.012)'; c!.fillRect(0, 0, W, H); // fog slowly returns
  }, 50);
}
