import { expect, test } from '@playwright/test';

test.describe('OPERO Full End-to-End & 4-Viewport QA', () => {
  test('complete workflow: capture -> studio 7 overlays -> RAG -> export -> OS permissions -> 20-motion Pero', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await expect(page.getByText('Local SQLite + RAG Active')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('OPERO Workspace', { exact: true })).toBeVisible();

    // 1. Live Capture flow
    await page.getByRole('button', { name: /Start Capture/i }).first().click();
    await expect(page.getByText(/REC/i).first()).toBeVisible();
    await page.getByRole('button', { name: /Snap Frame/i }).click();
    await expect(page.getByText(/1 CAPTURED SIGNALS/i)).toBeVisible();
    await page.getByRole('button', { name: /Snap Frame/i }).click();
    await expect(page.getByText(/2 CAPTURED SIGNALS/i)).toBeVisible();
    await page.getByRole('button', { name: /Stop/i }).click();
    await expect(page.getByText(/EVENT & FRAME IMPULSE TIMELINE/i)).toBeVisible();

    // 2. Quick Prompt against Dual-Core RAG
    await page.getByRole('button', { name: /Check Glossary/i }).click();
    await expect(page.getByText(/Dual-Core RAG Response/i)).toBeVisible();

    // 3. Open 3-Pane OPERO Studio & place all 7 annotation tools
    await page.getByRole('button', { name: /Open in 3-Pane OPERO Studio/i }).click();
    for (const tool of ['Number', 'Arrow', 'Box', 'Redact', 'Crop', 'Label', 'Spotlight']) {
      await page.getByRole('button', { name: tool, exact: true }).click();
      await page.getByRole('button', { name: /Add Overlay/i }).click();
    }
    await expect(page.getByText(/8 overlays/i)).toBeVisible();

    // 4. Export PDF & verify local SHA-256 notice
    await page.getByRole('button', { name: /Export PDF Manual/i }).click();
    await expect(page.getByText(/Exported PDF/i)).toBeVisible();

    // 5. OS Permissions & Dual-Core Vector RAG panel
    await page.getByRole('button', { name: /Memory & OS Access/i }).click();
    await expect(page.getByText(/Device Permission Matrix/i)).toBeVisible();
    await expect(page.getByText(/com\.mmi\.opero/i)).toBeVisible();

    // 6. Manual Library & 20-Motion Pero Showcase (no boxy mascot cards)
    await page.getByRole('button', { name: /Manual Library/i }).click();
    await expect(page.getByText(/All 20 Built-In Vector Motions/i)).toBeVisible();
    await page.getByRole('button', { name: /13 · Verified Draft/i }).click();

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
      await expect(page.getByText('OPERO Workspace', { exact: true })).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflow).toBe(false);
    });
  }
});
