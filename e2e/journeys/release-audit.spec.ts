import { expect } from '@playwright/test';
import { portableFile, portableState, portableTest as test, setupPortable } from '../fixtures/portability';

test('F16 production CSP blocks inline and third-party scripts while real Settings remain durable', async ({ page }, info) => {
  await page.goto('./#/settings');
  const policy = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
  expect(policy).toContain("script-src 'self'"); expect(policy).toContain("object-src 'none'");
  let thirdPartyRequests = 0;
  await page.route('https://tracker.example.net/forbidden.js', async (route) => { thirdPartyRequests++; await route.fulfill({ contentType: 'text/javascript', body: 'window.F16Foreign=true' }); });
  await page.evaluate(() => {
    const violations: string[] = []; Reflect.set(window, 'F16CspViolations', violations);
    document.addEventListener('securitypolicyviolation', (event) => { if (event.effectiveDirective.startsWith('script-src')) violations.push(event.blockedURI); });
    const inline = document.createElement('script'); inline.textContent = 'window.F16Inline=true'; document.head.append(inline);
    const foreign = document.createElement('script'); foreign.src = 'https://tracker.example.net/forbidden.js'; document.head.append(foreign);
  });
  await expect.poll(() => page.evaluate(() => Reflect.get(window, 'F16CspViolations') as string[])).toContain('inline');
  await expect.poll(() => page.evaluate(() => (Reflect.get(window, 'F16CspViolations') as string[]).some((value) => value.startsWith('https://tracker.example.net')))).toBe(true);
  expect(await page.evaluate(() => [Reflect.get(window, 'F16Inline'), Reflect.get(window, 'F16Foreign')])).toEqual([undefined, undefined]);
  expect(thirdPartyRequests).toBe(0);
  await info.attach('production-csp.txt', { body: policy ?? '', contentType: 'text/plain' });
  await page.getByRole('button', { name: 'Tema Sistema', exact: true }).click();
  await page.getByRole('radio', { name: 'Scuro', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Chiudi', exact: true }).click(); await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('F16 I02 ten-procedure library: group exclusion ignores search, selection survives filters, only five copies commit', async ({ page }) => {
  await setupPortable(page); const before = await portableState(page);
  await page.getByRole('button', { name: 'Importa', exact: true }).click();
  await page.getByLabel('Carica uno o più file').setInputFiles(await portableFile(page, 'library-ten'));
  await expect(page.getByText('10 selezionate / 10 visibili', { exact: true })).toBeVisible();
  const search = page.getByRole('searchbox', { name: 'Cerca procedure e contenuti' });
  await search.fill('sinonimo 0');
  await page.getByRole('button', { name: 'Deseleziona tutto il gruppo: Materiali', exact: true }).click();
  await expect(page.getByText('5 selezionate / 1 visibili', { exact: true })).toBeVisible();
  await search.fill(''); await expect(page.getByText('5 selezionate / 10 visibili', { exact: true })).toBeVisible();
  expect(await portableState(page)).toEqual(before);
  await page.getByRole('button', { name: 'Importa le procedure selezionate', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Aggiungi come copie', exact: true }).click();
  await expect(page.getByRole('heading', { name: '5 procedure aggiunte', exact: true })).toBeVisible();
  const after = await portableState(page);
  const added = after.procedures.filter((item) => !before.procedures.some((original) => original.id === item.id));
  expect(added.map((item) => item.title).sort()).toEqual([5, 6, 7, 8, 9].map((index) => 'Cartoncino ' + index));
  expect(after.runs).toEqual(before.runs); expect(after.settings).toEqual(before.settings);
  for (const original of before.revisions) expect(after.revisions).toContainEqual(original);
  await page.reload(); expect((await portableState(page)).procedures).toHaveLength(15);
});

test('F16 11A keyboard preview at 320px/48pt: named accessibility tree, Escape and focus restore without mutation', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 844 }); await setupPortable(page, 48, 'dark', 'en');
  const before = await portableState(page);
  const preview = page.getByRole('button', { name: 'Preview: Cartoncino 0', exact: true });
  await preview.focus(); await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog'); await expect(dialog).toBeVisible();
  const tree = await dialog.ariaSnapshot(); expect(tree).toContain('Cartoncino 0'); expect(tree).toContain('Step list');
  await info.attach('11A-accessibility-tree.txt', { body: tree, contentType: 'text/plain' });
  for (let index = 0; index < 12; index++) {
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0); await expect(preview).toBeFocused();
  expect(await portableState(page)).toEqual(before);
});
