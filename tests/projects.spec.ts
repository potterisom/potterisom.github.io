import { test, expect, type Page } from '@playwright/test';

const shot = (page: Page, name: string) =>
  page.screenshot({ path: `shots/projects-${name}-${test.info().project.name}.png` });
const ready = (page: Page) => page.waitForFunction(() => document.fonts.status === 'loaded');
const phone = () => test.info().project.name === '390';

test('exploded view: comes apart, holds open, switches project', async ({ page }) => {
  await page.goto('/projects/');
  await ready(page);
  const rig = page.locator('[data-rig="this-website"]');
  const core = rig.locator('[data-core]');
  await expect(rig).toBeVisible();
  await expect(core).toHaveAttribute('aria-expanded', 'false');
  await page.waitForTimeout(300);
  await shot(page, 'closed');

  if (phone()) await core.tap();
  else {
    await core.hover();
    await expect(core).toHaveAttribute('aria-expanded', 'true'); // hover alone opens it
    await core.click(); // click holds it
    await page.mouse.move(5, 5);
  }
  await expect(core).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('[data-hint]')).toContainText('held open');
  await expect(rig.locator('[data-part]')).toHaveCount(5);
  await page.waitForTimeout(900);
  await shot(page, 'open');
  // every part is fully on screen (desktop) / laid out in the page (phone)
  const { width } = page.viewportSize()!;
  for (const box of await rig.locator('[data-part]').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()))) {
    expect(box.left).toBeGreaterThanOrEqual(0);
    expect(box.right).toBeLessThanOrEqual(width);
  }

  await page.getByRole('button', { name: 'Free Food at Williams' }).click();
  await expect(page.locator('[data-rig="free-food-at-williams"]')).toBeVisible();
  await expect(rig).toBeHidden();
});

test('post: a part opens the post at its section; contents follow the scroll; back returns held open', async ({ page }) => {
  await page.goto('/projects/');
  await ready(page);
  const rig = page.locator('[data-rig="this-website"]');
  await rig.locator('[data-core]').click();
  await rig.locator('[data-part]').nth(2).click();

  const post = page.locator('[data-post]');
  await expect(post).toBeVisible();
  await expect(page).toHaveURL(/\/projects\/this-website\/#how-i-got-to-the-fog$/);
  await page.waitForTimeout(700);
  await expect(post.locator('.toc.on')).toContainText('the key decision');
  await shot(page, 'post-section');

  await post.evaluate((el) => el.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(400);
  await expect(post.locator('.toc.on')).toContainText('the problem');
  await shot(page, 'post-top');

  await post.locator('.toc').nth(4).click();
  await page.waitForTimeout(1200);
  await expect(post.locator('.toc.on')).toContainText('what’s next');

  await page.getByRole('link', { name: '← back to the parts' }).click();
  await expect(post).toHaveCount(0);
  await expect(page).toHaveURL(/\/projects\/$/);
  await expect(rig.locator('[data-core]')).toHaveAttribute('aria-expanded', 'true');
});

test('post: has its own page', async ({ page }) => {
  await page.goto('/projects/free-food-at-williams/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Free Food at Williams');
  await expect(page.locator('.toc')).toHaveCount(5);
});
