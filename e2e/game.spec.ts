import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('home screen renders the BLOCK BLOOM identity', async ({ page }, testInfo) => {
  await expect(page).toHaveTitle(/BLOCK BLOOM/i);
  await expect(page.locator('.wordmark')).toContainText('BLOCK');
  await expect(page.getByRole('button', { name: /PLAY CLASSIC/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /LEVEL JOURNEY/i })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('block-bloom-home.png'), fullPage: true });
});

test('a real piece can be selected and placed on the 8×8 board', async ({ page }, testInfo) => {
  await page.getByRole('button', { name: /PLAY CLASSIC/i }).click();
  await expect(page.locator('#board .cell')).toHaveCount(64);

  const firstPiece = page.locator('.piece-slot:not(.used)').first();
  const pieceCells = await firstPiece.locator('.mini-grid i').count();
  await firstPiece.click();
  await page.locator('.cell[data-x="0"][data-y="0"]').click();

  await expect(page.locator('#board .filled')).toHaveCount(pieceCells);
  await expect(page.locator('#score')).not.toHaveText('0');
  await expect(page.locator('.piece-slot').first()).toHaveClass(/used|selected|piece-slot/);
  await page.screenshot({ path: testInfo.outputPath('block-bloom-first-move.png'), fullPage: true });
});

test('campaign shows 30 levels in three named chapters', async ({ page }, testInfo) => {
  await page.getByRole('button', { name: /LEVEL JOURNEY/i }).click();
  await expect(page.locator('.level-card')).toHaveCount(30);
  await expect(page.getByText('First Light')).toBeVisible();
  await expect(page.getByText('Wild Grove')).toBeVisible();
  await expect(page.getByText('Moon Garden')).toBeVisible();
  await expect(page.locator('.level-card').first()).toContainText('SCORE');
  await page.screenshot({ path: testInfo.outputPath('block-bloom-campaign.png'), fullPage: true });

  await page.locator('.level-card[data-level="1"]').click();
  await expect(page.locator('.game-head')).toContainText('LEVEL 1 / 30');
  await expect(page.locator('.game-head')).toContainText('TARGET');
});

test('settings and privacy screens are navigable', async ({ page }) => {
  await page.locator('button[data-action="settings"]').click();
  await expect(page.getByText('Sound effects')).toBeVisible();
  await page.locator('input[data-setting="sound"]').uncheck();
  await expect(page.locator('input[data-setting="sound"]')).not.toBeChecked();
  await page.getByRole('button', { name: /BACK TO GARDEN/i }).click();
  await page.getByRole('button', { name: /PRIVACY/i }).click();
  await expect(page.getByText('Local game data')).toBeVisible();
});
