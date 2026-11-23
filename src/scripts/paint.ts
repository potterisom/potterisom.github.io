// Sidebar links: on hover, paint spills from where the cursor came in and
// spreads in uneven lobes (see .imp in global.css). Each time, the lobes land
// in different random directions.
export function wirePaint() {
  document.querySelectorAll<HTMLElement>('.imp').forEach((el) => {
    el.addEventListener('pointerenter', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--x', (((e.clientX - r.left) / r.width) * 100).toFixed(1) + '%');
      el.style.setProperty('--y', (((e.clientY - r.top) / r.height) * 100).toFixed(1) + '%');
      for (let i = 1; i < 6; i++) {
        const a = Math.random() * 6.283, d = 25 + Math.random() * 70;
        el.style.setProperty('--dx' + i, (Math.cos(a) * d * 1.6).toFixed(0) + 'px');
        el.style.setProperty('--dy' + i, (Math.sin(a) * d * 0.5).toFixed(0) + 'px');
      }
    });
  });
}
