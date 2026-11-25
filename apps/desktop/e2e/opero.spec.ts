import { expect, test } from '@playwright/test';

test.describe('OPERO UI Overhaul, Onboarding, Dashboard, 7 Templates & 4-Viewport QA', () => {
  test('full flow: welcome fade-bounce -> blue-ball onboarding -> dashboard -> shortcuts -> 7 templates -> capture/studio -> settings', async ({
    page,
  }) => {
    test.setTimeout(60000);
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    // 1. Welcome Splash + 7-Screen Playful Onboarding (EN -> JA tap voiceover cycle + privacy + confetti)
    const dialog = page.getByRole('dialog', { name: 'OPERO Welcome Onboarding' });
    if (await dialog.isVisible({ timeout: 2500 }).catch(() => false)) {
      await expect(page.getByRole('heading', { name: 'Opero', exact: true })).toBeVisible();
      for (const clip of ['/audio/pero/welcome-opero.mp3', '/audio/pero/step-0-en.mp3', '/audio/pero/step-0-ja.mp3']) {
        const res = await page.request.get(clip);
        expect(res.status()).toBe(200);
        expect((await res.body()).byteLength).toBeGreaterThan(10000);
      }
      await expect(page.getByTestId('pero-click-cue')).toContainText("Ooh, hi there! I'm Pero");
      await page.getByRole('button', { name: /Interact with Pero/i }).click();
      await expect(page.getByTestId('pero-click-cue')).toContainText("Ooh, hi there! I'm Pero");
      await page.getByRole('button', { name: /Interact with Pero/i }).click();
      await expect(page.getByTestId('pero-click-cue')).toContainText('こんにちは、ペロです。');
      await page.getByRole('button', { name: /Get Started/i }).click();
      await expect(page.getByRole('progressbar', { name: 'Onboarding setup progress' })).toBeVisible();
      await page.getByLabel('Your name').fill('Arron');
      await expect(page.getByTestId('pero-click-cue')).toContainText('Ooh, hi Arron! Nice to meet you!');
      await page.getByRole('button', { name: /Interact with Pero/i }).click();
      await page.getByRole('button', { name: /Continue/i }).click();
      await expect(page.getByTestId('pero-click-cue')).toContainText('Ooh, Arron, what kind of work do you do?');
      await page.getByLabel('Your occupation').fill('Software Intern');
      await expect(page.getByTestId('pero-click-cue')).toContainText('Ooh, Arron, Software Intern sounds wonderful!');
      await page.getByRole('button', { name: /Continue/i }).click();
      await expect(page.getByTestId('pero-click-cue')).toContainText('Got it, Arron');
      await page.getByRole('button', { name: /Calm & Concise/i }).click();
      await page.getByRole('button', { name: /Continue/i }).click();
      await expect(page.getByTestId('pero-click-cue')).toContainText("Whenever you're ready, Arron");
      await page.getByRole('button', { name: /English/i }).click();
      await page.getByRole('button', { name: /Continue/i }).click();
      await expect(page.getByTestId('pero-click-cue')).toContainText("Don't worry, Arron");
      await expect(page.getByRole('heading', { name: 'Data Privacy Notice' })).toBeVisible();
      const privacyBox = page.getByRole('textbox', { name: 'Data Privacy Act and Japan APPI Notice' });
      await expect(privacyBox).toBeVisible();
      await expect(privacyBox).toContainText('Data Privacy Act of 2012 (Republic Act No. 10173)');
      await expect(privacyBox).toContainText('個人情報保護法');
      await expect(privacyBox.locator('mark.onboard-privacy-highlight').first()).toBeVisible();
      await expect(page.getByRole('button', { name: /Continue/i })).toBeDisabled();
      await page.getByRole('checkbox', { name: /RA 10173/i }).check();
      await expect(page.getByRole('button', { name: /Continue/i })).toBeEnabled();
      await page.getByRole('button', { name: /Continue/i }).click();
      await expect(page.getByTestId('onboarding-confetti')).toBeVisible();
      await expect(page.getByRole('heading', { name: /You’re all set, Arron/i })).toBeVisible();
      await page.getByRole('button', { name: /Interact with Pero/i }).click();
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

    // Verify smooth icon-only sidebar hide/show toggle & functional Top Navbar controls
    await page.getByRole('button', { name: 'Hide navigation sidebar' }).click();
    await page.getByRole('button', { name: 'Show navigation sidebar' }).click();
    await expect(page.getByRole('button', { name: 'Toggle Glass or Solid surface' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Export menu' }).click();
    await expect(page.getByRole('menu', { name: 'Quick Export Formats' })).toBeVisible();
    await page.getByRole('button', { name: 'Export menu' }).click();

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

    // 5. Settings Hub via shortcut (Meta+,): Minimal Horizontal ID Card, User Description & Pero Outfit Studio
    await page.keyboard.press('Meta+,');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Operator ID Card and Pero Outfit Studio' })).toBeVisible();
    await expect(page.getByRole('article', { name: 'Minimal Operator ID Card' })).toBeVisible();
    await expect(page.getByLabel('User Description')).toBeVisible();
    await expect(page.getByLabel('Pero Cap Color')).toBeVisible();
    await expect(page.getByLabel('Pero Jacket Color')).toBeVisible();
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
    await expect(page.getByText('sample_sop_check.txt').first()).toBeVisible({ timeout: 18000 });
    await page.getByRole('button', { name: 'Crop', exact: true }).click();
    await page.getByTestId('analyzer-block').first().click();
    await expect(page.getByText('Analyzing region with Local AI...')).toBeHidden({ timeout: 15000 });
    await page.getByRole('tab', { name: 'Full Report' }).click();
    await page.getByRole('button', { name: 'Export PDF' }).click();
    await expect(page.locator('.status-pill', { hasText: /Exported PDF/i }).first()).toBeVisible({
      timeout: 12000,
    });

    // 7. Meeting Notes via shortcut (Meta+4): record OS audio -> stop & compile -> bilingual script & summary
    await page.keyboard.press('Meta+4');
    await expect(page.getByRole('heading', { name: 'Meeting Notes' })).toBeVisible();
    await page.getByRole('button', { name: 'Record Meeting' }).click();
    await page.getByRole('button', { name: /Stop & Compile Notes/i }).click();
    await expect(page.getByTestId('pero-compiling-overlay')).toBeVisible({ timeout: 4000 });
    await expect(page.getByTestId('pero-compiling-overlay')).toBeHidden({ timeout: 10000 });
    await expect(page.getByRole('region', { name: 'Bilingual Script' }).getByText(/[ぁ-んァ-ン一-龥]/).first()).toBeVisible({
      timeout: 6000,
    });

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
    await expect(page.getByTestId('agent-reply-body').filter({ hasText: /Tetsuya Sekiguchi|関口/ }).first()).toBeVisible({ timeout: 15000 });
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
