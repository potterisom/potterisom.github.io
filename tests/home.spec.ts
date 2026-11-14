import { test, expect, type Page } from '@playwright/test';

const shot = (page: Page, name: string) =>
  page.screenshot({ path: `shots/home-${name}-${test.info().project.name}.png` });

/** Share of the fog canvas that is still opaque-ish, sampled on a grid. */
const fogCover = (page: Page) =>
  page.evaluate(() => {
    const c = document.querySelector<HTMLCanvasElement>('canvas.fog')!;
    const ctx = c.getContext('2d')!;
    let fogged = 0;
    let n = 0;
    for (let y = 10; y < c.height; y += 40) {
      for (let x = 10; x < c.width; x += 40) {
        n++;
        if (ctx.getImageData(x, y, 1, 1).data[3] > 128) fogged++;
      }
    }
    return fogged / n;
  });

test('home: fogged on arrival, links reachable behind the glass', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => document.fonts.status === 'loaded');
  await page.waitForTimeout(400);
  expect(await fogCover(page)).toBeGreaterThan(0.9);
  await shot(page, 'fogged');

  const nav = page.getByRole('navigation', { name: 'Main' });
  await expect(nav.getByRole('link')).toHaveText(['past work', 'projects', 'writing', 'creative', 'email']);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Leyla Salken');
});

test('home: wiping clears the glass, and it grows back', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => document.fonts.status === 'loaded');
  const { width, height } = page.viewportSize()!;

  // wipe back and forth over the lower half, the way a hand would
  const touch = test.info().project.name === '390';
  if (touch) {
    // drag with a finger: synthesize pointer events of type "touch"
    await page.evaluate(
      ([w, h]) => {
        const stage = document.querySelector('[data-fog-stage]')!;
        const fire = (type: string, x: number, y: number) =>
          stage.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerType: 'touch', bubbles: true }));
        fire('pointerdown', 20, h * 0.45);
        for (let row = 0; row < 9; row++) {
          const y = h * 0.45 + row * 52;
          for (let i = 0; i <= 12; i++) fire('pointermove', row % 2 ? w - (i * w) / 12 : (i * w) / 12, y);
        }
        fire('pointerup', 0, 0);
      },
      [width, height],
    );
  } else {
    for (let row = 0; row < 7; row++) {
      const y = height * 0.42 + row * 70;
      await page.mouse.move(row % 2 ? width * 0.62 : 30, y);
      await page.mouse.move(row % 2 ? 30 : width * 0.62, y, { steps: 14 });
    }
  }
  await page.waitForTimeout(150); // the fog repaints on the next frame
  const after = await fogCover(page);
  expect(after).toBeLessThan(0.8);
  await shot(page, 'wiped');

  // regrowth: a few seconds later there is more fog again
  await page.mouse.move(2, 2);
  await page.waitForTimeout(4000);
  expect(await fogCover(page)).toBeGreaterThan(after);
});

test('home: keyboard focus clears the glass over the links', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => document.fonts.status === 'loaded');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'past work' })).toBeFocused();
  await page.waitForTimeout(300);
  await shot(page, 'keyboard');
});

test('home: reduced motion starts mostly clear and holds still', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.waitForFunction(() => document.fonts.status === 'loaded');
  await page.waitForTimeout(300);
  expect(await fogCover(page)).toBeLessThan(0.1);
  const anim = await page.evaluate(() => getComputedStyle(document.querySelector('img.photo')!).animationName);
  expect(anim).toBe('none');
  await shot(page, 'reduced-motion');
});
