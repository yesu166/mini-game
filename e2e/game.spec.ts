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
  await expect(page.locator('.piece-slot').first()).toHaveClass(/used/);
  await page.screenshot({ path: testInfo.outputPath('block-bloom-first-move.png'), fullPage: true });
});



test('undo rolls the board and saved score back together', async ({ page }) => {
  await page.getByRole('button', { name: /PLAY CLASSIC/i }).click();
  const piece = page.locator('.piece-slot:not(.used)').first();
  await piece.click();
  await page.locator('.cell[data-x="0"][data-y="0"]').click();
  await expect(page.locator('#board .filled')).not.toHaveCount(0);
  await expect(page.locator('#score')).not.toHaveText('0');

  await page.locator('button[data-action="undo"]').click();
  await expect(page.locator('#board .filled')).toHaveCount(0);
  await expect(page.locator('#score')).toHaveText('0');
  await page.locator('button[data-action="back"]').click();
  await page.getByRole('button', { name: /STATS/i }).click();
  await expect(page.getByText('TOTAL POINTS')).toBeVisible();
  await expect(page.locator('.stat-grid')).toContainText('0');
});


test('an interrupted round can be continued after a page reload', async ({ page }) => {
  await page.getByRole('button', { name: /PLAY CLASSIC/i }).click();
  const piece = page.locator('.piece-slot:not(.used)').first();
  const pieceCells = await piece.locator('.mini-grid i').count();
  await piece.click();
  await page.locator('.cell[data-x="0"][data-y="0"]').click();
  const score = await page.locator('#score').textContent();
  await expect(page.locator('#board .filled')).toHaveCount(pieceCells);

  await page.reload();
  const resume = page.getByRole('button', { name: /CONTINUE ROUND/i });
  await expect(resume).toBeVisible();
  await resume.click();
  await expect(page.locator('#board .filled')).toHaveCount(pieceCells);
  await expect(page.locator('#score')).toHaveText(score ?? '');
});

test('drag placement preserves the shape offset and lands on the board', async ({ page }) => {
  await page.getByRole('button', { name: /PLAY CLASSIC/i }).click();
  const piece = page.locator('.piece-slot:not(.used)').first();
  const pieceCells = await piece.locator('.mini-grid i').count();
  await piece.dragTo(page.locator('.cell[data-x="4"][data-y="4"]'), { steps: 8 });
  await expect(page.locator('#board .filled')).toHaveCount(pieceCells);
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


test('Bloom Burst previews, cancels and confirms a selected 3×3 region', async ({ page }) => {
  await page.evaluate(() => {
    const board: (number | null)[][] = Array.from({ length: 8 }, () => Array(8).fill(null));
    for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) board[y][x] = 2;
    const tray = Array.from({ length: 3 }, (_, index) => ({
      id: 'burst-piece-' + index,
      shapeId: 'dot',
      cells: [[0, 0]],
      color: 1,
      used: false
    }));
    const session = {
      sessionDate: null, board, tray, rngSeed: 123, score: 0, combo: 0, bloom: 100,
      serial: 0, selected: null, mode: 'classic', level: 1, moves: 0,
      lines: 0, multi: 0, over: false, paused: false
    };
    localStorage.setItem('block-bloom-session-v1', JSON.stringify({ version: 1, session }));
  });
  await page.reload();
  await page.getByRole('button', { name: /CONTINUE ROUND/i }).click();

  await page.locator('button[data-action="burst"]').click();
  await page.locator('.cell[data-x="0"][data-y="0"]').click();
  await expect(page.locator('.burst-confirm-bar')).toBeVisible();
  await expect(page.locator('.cell.burst-target')).toHaveCount(9);
  await page.locator('button[data-action="cancel-burst"]').click();
  await expect(page.locator('#board .filled')).toHaveCount(9);

  await page.locator('button[data-action="burst"]').click();
  await page.locator('.cell[data-x="0"][data-y="0"]').click();
  await page.locator('button[data-action="confirm-burst"]').click();
  await expect(page.locator('#board .filled')).toHaveCount(0);
  await expect(page.locator('#score')).toHaveText('135');
  await expect(page.locator('.bloom-pill b')).toHaveText('0%');
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
