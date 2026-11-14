/** Helpers for the reader and post overlays, which load another page's markup. */

/** False in the click-through preview copy, where the address bar can't change. */
export const canPush = !document.documentElement.hasAttribute('data-preview');

/** Point every link and image in a fetched document at the right place. */
export function absolutize(doc: Document, base: string) {
  const abs = (u: string) => new URL(u, base).href;
  doc.querySelectorAll<HTMLElement>('[src], [href], [srcset]').forEach((el) => {
    for (const attr of ['src', 'href'] as const) {
      const v = el.getAttribute(attr);
      if (v && !v.startsWith('#') && !/^[a-z]+:/i.test(v)) el.setAttribute(attr, abs(v));
    }
    const set = el.getAttribute('srcset');
    if (set) {
      el.setAttribute(
        'srcset',
        set
          .split(',')
          .map((part) => {
            const [u, ...rest] = part.trim().split(/\s+/);
            return [abs(u), ...rest].join(' ');
          })
          .join(', '),
      );
    }
  });
}
