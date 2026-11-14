import { test, expect, type Page } from '@playwright/test';

const shot = (page: Page, name: string) =>
  page.screenshot({ path: `shots/writing-${name}-${test.info().project.name}.png` });
const ready = (page: Page) => page.waitForFunction(() => document.fonts.status === 'loaded');
const firstTile = (page: Page) =>
  page.evaluate(() => (document.querySelector('[data-tile]') as HTMLElement).style.transform);

test('wall: drifts, drags with inertia, and a drag does not open a piece', async ({ page }) => {
  await page.goto('/writing/');
  await ready(page);
  await page.waitForTimeout(300);
  await shot(page, 'wall');

  const a = await firstTile(page);
  await page.waitForTimeout(400);
  expect(await firstTile(page)).not.toBe(a); // ambient drift

  const { width, height } = page.viewportSize()!;
  await page.mouse.move(width / 2, height / 2);
  await page.mouse.down();
  await page.mouse.move(width / 2 - 180, height / 2 - 60, { steps: 6 });
  await page.mouse.up();
  await expect(page.locator('[data-reader]')).toHaveCount(0);
  await expect(page).toHaveURL(/\/writing\/$/);
  const b = await firstTile(page);
  await page.waitForTimeout(250);
  expect(await firstTile(page)).not.toBe(b); // still coasting
});

test('reader: opens from a tile, sky goes from morning to night, back returns to the wall', async ({ page }) => {
  await page.goto('/writing/');
  await ready(page);
  // Tab to the first piece: the wall brings it to the centre, Enter opens it
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.waitForTimeout(900);
  await shot(page, 'wall-keyboard');
  await page.keyboard.press('Enter');

  const reader = page.locator('[data-reader]');
  await expect(reader).toBeVisible();
  await expect(page).toHaveURL(/\/writing\/the-joy-of-living-with-roommates\/$/);
  await expect(reader.getByRole('heading', { level: 1 })).toHaveText('the joy of living with roommates');
  await expect(reader.locator('.cup')).toHaveCount(2);
  await page.waitForTimeout(600);
  await shot(page, 'reader-morning');
  const morning = await reader.evaluate((el) => getComputedStyle(el).getPropertyValue('--sky-top'));

  for (const [p, name] of [
    [0.72, 'reader-dusk'],
    [1, 'reader-night'],
  ] as const) {
    await reader.evaluate((el, p) => el.scrollTo(0, (el.scrollHeight - el.clientHeight) * p), p);
    await page.waitForTimeout(800);
    await shot(page, name);
  }
  const night = await reader.evaluate((el) => getComputedStyle(el).getPropertyValue('--sky-top'));
  expect(night).not.toBe(morning);
  await expect(reader).toHaveClass(/is-night/);

  await page.keyboard.press('Escape');
  await expect(reader).toHaveCount(0);
  await expect(page).toHaveURL(/\/writing\/$/);
});

test('reader: a piece has its own page (Cyrillic renders), and old URLs redirect to it', async ({ page }) => {
  await page.goto('/essays/ws2024.html');
  await expect(page).toHaveURL(/\/writing\/freshman-year-winter-study\/$/);
  await ready(page);
  await expect(page.locator('.reader-body')).toHaveAttribute('lang', 'ru');
  const font = await page.evaluate(() => document.fonts.check('23px "EB Garamond"', 'убрала'));
  expect(font).toBe(true);
  await shot(page, 'reader-russian');
  await page.getByRole('link', { name: '← back to the wall' }).click();
  await expect(page).toHaveURL(/\/writing\/$/);
});

test('wall: a click or tap on a tile opens it', async ({ page }) => {
  await page.goto('/writing/');
  await ready(page);
  await page.waitForTimeout(200);
  // click the middle of whichever tile faces us most squarely
  const target = await page.evaluate(() => {
    const tiles = [...document.querySelectorAll<HTMLElement>('[data-tile]')];
    const best = tiles.sort((a, b) => Number(b.style.opacity) - Number(a.style.opacity))[0];
    const r = best.getBoundingClientRect();
    return { href: best.getAttribute('href'), x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  const href = target.href;
  await page.mouse.click(target.x, target.y);
  await expect(page.locator('[data-reader]')).toBeVisible();
  expect(new URL(page.url()).pathname).toBe(href);
  await page.goBack();
  await expect(page.locator('[data-reader]')).toHaveCount(0);
});
