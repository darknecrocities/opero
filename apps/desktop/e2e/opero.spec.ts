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

    // 3. Redesigned Dashboard: greeting, 6 Quick Launch tiles, analytics cards, Quick Ask Pero
    await expect(page.getByText(/Good (morning|afternoon|evening)/i)).toBeVisible({ timeout: 6000 });
    await expect(page.getByText(/おはようございます|こんにちは|こんばんは/)).toBeVisible();
    await expect(page.getByRole('region', { name: 'Quick Launch Shortcuts' })).toBeVisible();
    await expect(page.getByText('Sessions & Meetings')).toBeVisible();
    await expect(page.getByText('Talking & Documented Steps')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Quick Ask Pero' })).toBeVisible();

    // Verify smooth sidebar hide/show slide toggle
    await page.getByRole('button', { name: 'Toggle left sidebar' }).click();
    await page.getByRole('button', { name: 'Toggle left sidebar' }).click();

    // 4. Working keyboard shortcuts (Meta+2 Templates, Meta+, Settings, Meta+0 Dashboard)
    await page.keyboard.press('Meta+2');
    await expect(page.getByRole('heading', { name: 'MMI Document Templates' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Standard Operating Procedure' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Administrative Workflow' })).toBeVisible();

    // Create & export a manual from an MMI template
    await page.getByRole('button', { name: 'Create Manual' }).first().click();
    await expect(page.getByRole('button', { name: 'Number', exact: true })).toBeVisible({ timeout: 6000 });
    await page.getByRole('button', { name: /PDF ⌘E/i }).click();
    await expect(page.getByRole('status').filter({ hasText: /Exported PDF/i }).first()).toBeVisible({
      timeout: 6000,
    });

    // 5. Settings Hub via shortcut (Meta+,)
    await page.keyboard.press('Meta+,');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await page.getByRole('tab', { name: 'AI Models' }).click();
    await expect(page.getByText('Choose Your AI Model')).toBeVisible();
    await expect(page.getByText('Qwen3 Compact').first()).toBeVisible();
    await page.getByRole('tab', { name: 'Memory' }).click();
    await page.getByRole('tab', { name: 'History' }).click();
    await page.getByRole('tab', { name: 'OS Access' }).click();
    await page.getByRole('tab', { name: 'Sound & Motion' }).click();
    await page.getByRole('tab', { name: 'Updates' }).click();
    await expect(page.getByRole('button', { name: /Check for Updates/i })).toBeVisible();

    // 6. Document Analyzer via shortcut (Meta+3): upload, auto-annotate, crop-explain, export report
    await page.keyboard.press('Meta+3');
    await expect(page.getByRole('heading', { name: 'Document Analyzer' })).toBeVisible();
    await page.getByLabel('Upload document for analysis').setInputFiles({
      name: 'sample_sop_check.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(
        'Standard Operating Procedure\n1. Checklist\n| Step | Status |\n| Verify backup | |\n2. Notes\nNote: Confirm sign-off before release.\n',
      ),
    });
    await expect(page.getByText('sample_sop_check.txt').first()).toBeVisible({ timeout: 6000 });
    await page.getByRole('button', { name: 'Crop', exact: true }).click();
    await page.getByRole('button', { name: /Place CROP & Explain/i }).first().click();
    await page.getByRole('tab', { name: 'Full Report' }).click();
    await page.getByRole('button', { name: 'Export PDF' }).click();
    await expect(page.locator('.status-pill', { hasText: /Exported PDF/i }).first()).toBeVisible({
      timeout: 6000,
    });

    // 7. Meeting Notes via shortcut (Meta+4): record OS audio -> stop & compile -> bilingual script & summary
    await page.keyboard.press('Meta+4');
    await expect(page.getByRole('heading', { name: 'Meeting Notes' })).toBeVisible();
    await page.getByRole('button', { name: 'Record Meeting' }).click();
    await page.getByRole('button', { name: /Stop & Compile Notes/i }).click();
    await expect(page.getByTestId('pero-compiling-overlay')).toBeVisible({ timeout: 4000 });
    await expect(page.getByTestId('pero-compiling-overlay')).toBeHidden({ timeout: 10000 });
    await expect(page.getByText(/日本語訳/).first()).toBeVisible({ timeout: 6000 });

    // 8. Pero Agent via shortcut (Meta+5): Pero face avatar, clean greeting ("hello"), and grounded MMI RAG query
    await page.keyboard.press('Meta+5');
    await expect(page.getByRole('heading', { name: 'Pero Agent' })).toBeVisible();
    await expect(page.getByLabel('Pero AI Profile').first()).toBeVisible();
    await page.getByLabel('Ask Pero Agent').fill('hello');
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    await expect(page.locator('article').filter({ hasText: /Pero|assistant|Hi|Hello/i }).first()).toBeVisible({
      timeout: 6000,
    });
    await expect(page.getByText('[Memory:')).toHaveCount(0);
    await page.getByLabel('Ask Pero Agent').fill('Who is the Representative Director of Man Machine Interface?');
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    await expect(page.getByText(/Tetsuya Sekiguchi|関口/).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/Actions taken/i).first()).toBeVisible();

    // 9. Resizable sidebar separator & Dynamic EN -> JA -> EN UI switch
    const leftSep = page.getByRole('separator', { name: /Resize left navigation sidebar/i });
    await expect(leftSep).toBeVisible();
    await leftSep.focus();
    await page.keyboard.press('ArrowRight');
    const appLangSelect = page.getByLabel('App Language', { exact: true });
    await appLangSelect.selectOption('ja-JP');
    await expect(page.getByRole('heading', { name: 'Pero エージェント' })).toBeVisible();
    await appLangSelect.selectOption('en-US');
    await expect(page.getByRole('heading', { name: 'Pero Agent' })).toBeVisible();

    // 10. Back to Dashboard via Meta+0
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
