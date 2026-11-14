/**
 * A project post: the contents list highlights the section you're in, and
 * clicking an entry jumps there.
 */
export function initPost(el: HTMLElement, hash = location.hash) {
  const links = Array.from(el.querySelectorAll<HTMLAnchorElement>('[data-toc]'));
  const sections = links
    .map((a) => el.querySelector<HTMLElement>(`#${CSS.escape(a.dataset.toc!)}`))
    .filter((s): s is HTMLElement => !!s);
  let frame = 0;

  const top = (s: HTMLElement) => s.getBoundingClientRect().top - el.getBoundingClientRect().top;

  const spy = () => {
    frame = 0;
    let current = 0;
    sections.forEach((s, i) => {
      if (top(s) < Math.min(360, el.clientHeight * 0.45)) current = i;
    });
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 4) current = sections.length - 1; // at the very end
    links.forEach((a, i) => {
      if (i === current && !a.classList.contains('on')) {
        // on phones the contents are a row of chips: keep the active one in view
        const row = a.closest<HTMLElement>('.post-toc');
        if (row && row.scrollWidth > row.clientWidth) row.scrollTo({ left: a.offsetLeft - row.clientWidth / 2 + a.offsetWidth / 2 });
      }
      a.classList.toggle('on', i === current);
      if (i === current) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  };
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(spy);
  };

  const jump = (id: string, smooth: boolean) => {
    const s = sections.find((x) => x.id === id);
    if (!s) return;
    const pad = parseFloat(getComputedStyle(el).scrollPaddingTop) || 0;
    el.scrollTo({ top: Math.max(0, el.scrollTop + top(s) - pad), behavior: smooth ? 'smooth' : 'instant' });
  };

  const onClick = (e: MouseEvent) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('[data-toc]');
    if (!a) return;
    e.preventDefault();
    jump(a.dataset.toc!, true);
    if (!document.documentElement.hasAttribute('data-preview')) history.replaceState(history.state, '', `#${a.dataset.toc}`);
  };

  el.addEventListener('scroll', onScroll, { passive: true });
  el.addEventListener('click', onClick);
  if (hash.length > 1) jump(decodeURIComponent(hash.slice(1)), false);
  spy();

  return () => {
    el.removeEventListener('scroll', onScroll);
    el.removeEventListener('click', onClick);
    cancelAnimationFrame(frame);
  };
}
