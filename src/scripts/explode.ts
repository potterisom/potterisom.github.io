/**
 * Exploded view (projects page).
 *
 * Hover a project and it comes apart into its five parts on dashed leader
 * lines; click to hold it open. Ported from handoff/mockups/ProjExplode.dc.html.
 * On phones there is no room to fly outwards, so the parts drop out below the
 * project in a stack instead (CSS does the layout; this file only holds state).
 */
import { pop } from './sound';

// where each part lands, in px from the project's centre, on a 1440×900 stage
const POS: [number, number][] = [
  [-420, -200],
  [400, -210],
  [-470, 110],
  [450, 120],
  [0, 300],
];
const CY = 0.522; // the project sits a little below the middle

export function initExplode(stage: HTMLElement) {
  const tabs = Array.from(stage.querySelectorAll<HTMLButtonElement>('[data-tab]'));
  const rigs = Array.from(stage.querySelectorAll<HTMLElement>('[data-rig]'));
  const hint = stage.querySelector<HTMLElement>('[data-hint]');
  const phone = window.matchMedia('(max-width: 760px)');

  let current = rigs.find((r) => !r.hidden) ?? rigs[0];
  let hover = false;
  let locked = false;
  let fx = 1;
  let fy = 1;

  const isOpen = () => hover || locked;

  function measure() {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    const cy = h * CY;
    // squeeze the landing spots so every part stays on screen
    fx = Math.max(0.3, Math.min(1, (w / 2 - 150) / 595));
    fy = Math.max(0.3, Math.min(1, (cy - 118) / 270, (h - 56 - cy) / 360));
    stage.style.setProperty('--fx', fx.toFixed(3));
    stage.style.setProperty('--fy', fy.toFixed(3));
    for (const rig of rigs) {
      rig.querySelectorAll<SVGLineElement>('line').forEach((line, i) => {
        line.setAttribute('x1', String(w / 2));
        line.setAttribute('y1', String(cy));
        line.setAttribute('x2', String(w / 2 + (isOpen() ? POS[i][0] * fx : 0)));
        line.setAttribute('y2', String(cy + (isOpen() ? POS[i][1] * fy : 0)));
      });
    }
  }

  function paint() {
    const open = isOpen();
    for (const rig of rigs) {
      const on = rig === current && open;
      rig.classList.toggle('is-open', on);
      const core = rig.querySelector<HTMLButtonElement>('[data-core]')!;
      core.setAttribute('aria-expanded', String(on));
      rig.querySelectorAll<HTMLAnchorElement>('[data-part], [data-read]').forEach((a) => (a.tabIndex = on ? 0 : -1));
    }
    if (hint) {
      const touch = window.matchMedia('(hover: none)').matches;
      hint.textContent = locked
        ? `held open · ${touch ? 'tap' : 'click'} the project to put it back together`
        : touch
          ? 'tap the project'
          : 'hover the project';
    }
    measure();
  }

  function setOpen(nextHover: boolean, nextLocked: boolean) {
    const was = isOpen();
    hover = nextHover;
    locked = nextLocked;
    if (was !== isOpen()) pop(isOpen());
    paint();
  }

  function select(slug: string, keepOpen = false) {
    const rig = rigs.find((r) => r.dataset.rig === slug);
    if (!rig) return;
    current = rig;
    for (const r of rigs) r.hidden = r !== rig;
    for (const t of tabs) {
      const sel = t.dataset.tab === slug;
      t.classList.toggle('sel', sel);
      t.setAttribute('aria-pressed', String(sel));
    }
    hover = false;
    locked = keepOpen;
    void rig.offsetWidth; // let it render closed first, so it springs open
    paint();
  }

  for (const t of tabs) {
    t.addEventListener('click', () => {
      select(t.dataset.tab!);
      if (!document.documentElement.hasAttribute('data-preview')) history.replaceState(history.state, '', `#${t.dataset.tab}`);
    });
  }

  for (const rig of rigs) {
    const core = rig.querySelector<HTMLButtonElement>('[data-core]')!;
    // hover is a mouse thing; touch and keyboard use the click below
    core.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'mouse' && !phone.matches) setOpen(true, locked);
    });
    core.addEventListener('click', () => setOpen(hover, !locked));
  }
  stage.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse') setOpen(false, locked);
  });

  window.addEventListener('resize', measure);
  phone.addEventListener('change', paint);

  const fromHash = location.hash.slice(1);
  if (fromHash && rigs.some((r) => r.dataset.rig === fromHash)) select(fromHash);
  else paint();

  return {
    /** Come back from a post with the project held open (as in the mockup). */
    holdOpen(slug: string) {
      select(slug, true);
    },
    current: () => current.dataset.rig!,
  };
}
