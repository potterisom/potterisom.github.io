/**
 * The reader: its sky moves from morning to night as you scroll.
 * Ported from handoff/mockups/WritingWall.dc.html (hour = 7 + progress × 15).
 */
import { READER_SKY, skyAt } from './sky';

const DARK_AFTER = 18.1; // hour at which the ink flips to light

export function initReader(el: HTMLElement) {
  let frame = 0;
  const paint = () => {
    frame = 0;
    const p = Math.min(1, el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight));
    const hour = 7 + p * 15;
    const { top, bottom } = skyAt(hour, READER_SKY);
    el.style.setProperty('--sky-top', top);
    el.style.setProperty('--sky-bottom', bottom);
    el.classList.toggle('is-night', hour > DARK_AFTER);
  };
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(paint);
  };
  el.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  paint();
  return () => {
    el.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    cancelAnimationFrame(frame);
  };
}
