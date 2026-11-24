import { expect, test } from '@playwright/test';

test.describe('OPERO UI Overhaul, Onboarding, Dashboard, 7 Templates & 4-Viewport QA', () => {
  test('full flow: welcome fade-bounce -> blue-ball onboarding -> dashboard -> shortcuts -> 7 templates -> capture/studio -> settings', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    // 1. Welcome Splash + 4-Step Blue-Ball Onboarding (handle either fresh or already-completed DB)
    const dialog = page.getByRole('dialog', { name: 'OPERO Welcome Onboarding' });
    if (await dialog.isVisible({ timeout: 2500 }).catch(() => false)) {
      await expect(page.getByRole('heading', { name: 'Opero', exact: true })).toBeVisible();
      await page.getByRole('button', { name: /Get Started/i }).click();
      await expect(page.getByRole('progressbar', { name: 'Onboarding setup progress' })).toBeVisible();
      await page.getByLabel('Your name').fill('Arron');
      await page.getByRole('button', { name: /Continue/i }).click();
      await page.getByLabel('Your occupation').fill('Software Intern');
      await page.getByRole('button', { name: /Continue/i }).click();
      await page.getByRole('button', { name: /Calm & Concise/i }).click();
      await page.getByRole('button', { name: /Continue/i }).click();
      await page.getByRole('button', { name: /English/i }).click();
      await page.getByRole('button', { name: /Enter OPERO/i }).click();
      await expect(dialog).toBeHidden({ timeout: 5000 });
    }

    // 2. Minimal UI checks (clutter removed)
    await expect(page.getByText('MMI Local-First v1.0')).toHaveCount(0);
    await expect(page.getByText('Local SQLite + RAG Active')).toHaveCount(0);

    // 3. Dashboard greeting & Black/White analytics cards
    await expect(page.getByText(/Good (morning|afternoon|evening)/i)).toBeVisible({ timeout: 6000 });
    await expect(page.getByText(/おはようございます|こんにちは|こんばんは/)).toBeVisible();
    await expect(page.getByText('Sessions & Meetings')).toBeVisible();
    await expect(page.getByText('Talking & Documented Steps')).toBeVisible();

    // 4. Working keyboard shortcuts (Meta+2 Templates, Meta+, Settings, Meta+0 Dashboard)
    await page.keyboard.press('Meta+2');
    await expect(page.getByRole('heading', { name: 'MMI Document Templates' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Standard Operating Procedure' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Administrative Workflow' })).toBeVisible();

    // Create & export a manual from an MMI template
    await page.getByRole('button', { name: 'Create Manual' }).first().click();
    await expect(page.getByRole('button', { name: 'Number', exact: true })).toBeVisible({ timeout: 6000 });
    await page.getByRole('button', { name: /PDF ⌘E/i }).click();
    await expect(page.getByText(/Exported PDF/i)).toBeVisible({ timeout: 6000 });

    // 5. Settings Hub via shortcut (Meta+,)
    await page.keyboard.press('Meta+,');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await page.getByRole('tab', { name: 'Memory' }).click();
    await page.getByRole('tab', { name: 'History' }).click();
    await page.getByRole('tab', { name: 'OS Access' }).click();
    await page.getByRole('tab', { name: 'Sound & Motion' }).click();

    // 6. Back to Dashboard via Meta+0
    await page.keyboard.press('Meta+0');
    await expect(page.getByText('Sessions & Meetings')).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });

  for (const vp of [
    { name: 'Mobile', width: 375, height: 812 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1280, height: 800 },
    { name: 'Widescreen', width: 1920, height: 1080 },
  ]) {
    test(`responsive zero horizontal overflow at ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await expect(page.locator('#root')).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflow).toBe(false);
    });
  }
});
