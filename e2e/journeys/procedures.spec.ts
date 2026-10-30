import { expect, test, type Page } from '@playwright/test';
import { attachLibraryHarness, seedLibrary } from '../fixtures/library';
import { expectNoBleeding, setScale } from '../fixtures/ui';

async function setup(page: Page) {
  await seedLibrary(page); await attachLibraryHarness(page); await page.evaluate(() => window.NurseFlowF03.setupProcedureStates());
}
async function records(page: Page) { await attachLibraryHarness(page); return page.evaluate(() => window.NurseFlowF03.inspectProcedureRecords()); }
async function details(page: Page, id: string) { await page.goto(`./#/procedure/${id}`); await expect(page.getByRole('region', { name: 'Dettagli procedura', exact: true })).toBeVisible(); }

test('Ready-only: Mappa ed Edit puntano alla Ready, aprire e uscire non crea una Draft', async ({ page }) => {
  await setup(page); const before = await records(page); await details(page, 'fixture-3');
  await expect(page.getByRole('button', { name: 'Avvia', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Avvia Ready', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Vedi mappa', exact: true }).click();
  await expect(page.locator('[data-revision-id="fixture-3-ready"]')).toBeVisible();
  await page.getByRole('link', { name: 'Indietro', exact: true }).click();
  await page.getByRole('button', { name: 'Modifica grafo', exact: true }).click();
  await expect(page).toHaveURL(/copy=ready/); await expect(page.getByText('Copia di lavoro · Ready · v1', { exact: true })).toBeVisible();
  await page.reload(); await expect(page.locator('[data-revision-id="fixture-3-ready"]')).toBeVisible();
  await page.getByRole('link', { name: 'Torna alla libreria', exact: true }).click();
  const after = await records(page);
  expect(after.procedures.find((procedure) => procedure.id === 'fixture-3')?.workingDraftId).toBeUndefined();
  expect(after.revisions).toEqual(before.revisions); expect(after.runSessions).toEqual([]);
});

test('Ready+Draft: Start Ready crea una sessione pinned e Resume la conserva', async ({ page }) => {
  await setup(page); const before = await records(page); await details(page, 'fixture-0');
  await expect(page.getByText('Bozza in lavorazione', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continua modifica', exact: true }).click();
  await expect(page.locator('[data-revision-id="fixture-0-draft"]')).toBeVisible();
  await details(page, 'fixture-0'); await page.getByRole('button', { name: 'Avvia Ready', exact: true }).click();
  await expect(page).toHaveURL(/#\/run\//); const started = await records(page); const run = started.runSessions[0]!;
  expect(run).toMatchObject({ pinnedRevisionId: 'fixture-0-ready', currentNodeId: 'start', visited: [] });
  expect(started.revisions).toEqual(before.revisions);
  await details(page, 'fixture-0'); await page.getByRole('button', { name: 'Riprendi', exact: true }).click();
  expect((await records(page)).runSessions).toEqual([run]);
});

test('Draft-only non offre Start: Preview e Mappa usano la Draft e non salvano run', async ({ page }) => {
  await setup(page); await details(page, 'fixture-1');
  await expect(page.getByRole('button', { name: /^Avvia/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Anteprima bozza', exact: true }).click();
  await expect(page.getByText('ANTEPRIMA BOZZA', { exact: true })).toBeVisible();
  await expect(page.locator('[data-revision-id="fixture-1-draft"]')).toBeVisible();
  await page.getByRole('link', { name: 'Indietro', exact: true }).click();
  await page.getByRole('button', { name: 'Vedi mappa', exact: true }).click();
  await expect(page.locator('[data-revision-id="fixture-1-draft"]')).toBeVisible();
  const snapshot = await records(page); expect(snapshot.runSessions).toEqual([]);
  expect(snapshot.procedures.find((procedure) => procedure.id === 'fixture-1')?.readyRevisionId).toBeUndefined();
});

test('Resume riapre anche una sessione su End senza sostituirla con una nuova run', async ({ page }) => {
  await setup(page); await page.evaluate(() => window.NurseFlowF03.prepareProcedureEdgeCase('terminal'));
  const before = await records(page); const run = before.runSessions[0]!;
  await details(page, 'fixture-3'); await page.getByRole('button', { name: 'Riprendi', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/#/run/${run.id}$`));
  expect((await records(page)).runSessions).toEqual(before.runSessions);
});

test('Start con Ready incompleta non salva run e mostra recupero specifico anche al Retry', async ({ page }) => {
  await setup(page); await page.evaluate(() => window.NurseFlowF03.prepareProcedureEdgeCase('unassigned'));
  await details(page, 'fixture-3'); await page.getByRole('button', { name: 'Avvia', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('La versione Ready non può essere aperta');
  await page.getByRole('button', { name: 'Riprova', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('La versione Ready non può essere aperta');
  await expect(page.getByRole('button', { name: 'Modifica grafo', exact: true })).toBeVisible();
  expect((await records(page)).runSessions).toEqual([]);
});

test('metadati autosalvati, gruppo singolo, tag/alias normalizzati e ribbon persistente; lingua solo chrome', async ({ page }) => {
  await setup(page); await details(page, 'fixture-0'); const before = await records(page);
  await page.getByRole('button', { name: '+2', exact: true }).click(); await expect(page.getByRole('button', { name: '#Quinto', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Meno', exact: true }).click();
  await page.getByRole('button', { name: 'Espandi', exact: true }).click(); await page.getByRole('button', { name: 'Meno', exact: true }).click();
  await page.getByRole('button', { name: 'Azioni procedura', exact: true }).click(); await page.getByRole('button', { name: 'Modifica dettagli', exact: true }).click();
  const sheet = page.getByRole('dialog', { name: 'Modifica dettagli', exact: true });
  await sheet.getByRole('textbox', { name: 'Nome procedura *', exact: true }).fill('Titolo scritto dall’autore');
  await sheet.getByRole('button', { name: 'Scegli gruppo', exact: true }).click();
  await page.getByRole('dialog', { name: 'Scegli gruppo', exact: true }).getByRole('button', { name: 'Esercizi', exact: true }).click();
  await sheet.getByLabel('Etichette', { exact: true }).fill('BLU'); await sheet.getByLabel('Etichette', { exact: true }).press('Enter');
  await sheet.getByLabel('Alias di ricerca', { exact: true }).fill('  ABC  '); await sheet.getByLabel('Alias di ricerca', { exact: true }).press('Enter');
  await sheet.getByRole('radio', { name: 'Priorità 2', exact: true }).check(); await sheet.getByRole('radio', { name: 'Ambra', exact: true }).check();
  await sheet.getByRole('radio', { name: 'Informazioni', exact: true }).check();
  await sheet.getByLabel('Descrizione', { exact: true }).fill('<script>window.authoredExecuted = true</script> Testo autore');
  await sheet.getByRole('button', { name: 'Fine', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Titolo scritto dall’autore', exact: true })).toBeVisible();
  const after = await records(page); const procedure = after.procedures.find((procedure) => procedure.id === 'fixture-0')!;
  expect(procedure).toMatchObject({ groupId: 'exercises', aliases: ['sinonimo speciale', 'ABC'], priority: 2, ribbon: { colorKey: 'amber', iconKey: 'info' } });
  expect(procedure.tags).toEqual(['Blu', 'Esempio', 'Terzo', 'Quarto', 'Quinto']); expect(after.revisions).toEqual(before.revisions);
  expect(procedure.lastOpenedAt).toBe(before.procedures.find((procedure) => procedure.id === 'fixture-0')?.lastOpenedAt);
  expect(await page.evaluate(() => Reflect.get(window, 'authoredExecuted'))).toBeUndefined();
  await page.goto('./#/settings'); await page.getByRole('button', { name: 'Lingua Italiano', exact: true }).click();
  await page.getByRole('radio', { name: 'English', exact: true }).check(); await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.goto('./#/procedure/fixture-0'); await expect(page.getByRole('button', { name: 'Start Ready', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Titolo scritto dall’autore', exact: true })).toBeVisible();
  await expect(page.getByText('ABC', { exact: true })).toHaveCount(0);
});

test('gruppo e tag di Details aprono i facet della Library; preferito persistente senza cambiare recenza', async ({ page }) => {
  await setup(page); await details(page, 'fixture-0'); const opened = await records(page);
  await page.getByRole('button', { name: 'Rimuovi Cartoncini àlfa dalle preferite', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Aggiungi Cartoncini àlfa alle preferite', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: '#Blu', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Procedure', exact: true })).toBeVisible();
  const afterTag = await records(page); expect(afterTag.procedures.find((procedure) => procedure.id === 'fixture-0')?.lastOpenedAt)
    .toBe(opened.procedures.find((procedure) => procedure.id === 'fixture-0')?.lastOpenedAt);
  await page.goBack(); await expect(page.getByRole('heading', { name: 'Cartoncini àlfa', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Materiali', exact: true }).click();
  await page.getByRole('button', { name: 'Filtri', exact: true }).click();
  const filter = page.getByRole('dialog', { name: 'Filtri', exact: true });
  await expect(filter.getByRole('checkbox', { name: 'Materiali', exact: true })).toBeChecked();
  await expect(filter.getByRole('checkbox', { name: 'blu', exact: true })).toBeChecked();
});

test('autosave quota conserva il modulo; Retry e browser Back chiudono solo lo sheet dopo il commit', async ({ page }) => {
  await setup(page); await page.goto('./#/library');
  await page.getByTestId('library-scroll').getByRole('button', { name: 'Cartoncini àlfa', exact: true }).click();
  await page.getByRole('button', { name: 'Azioni procedura', exact: true }).click(); await page.getByRole('button', { name: 'Modifica dettagli', exact: true }).click();
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args: Parameters<IDBObjectStore['put']>) {
      if (this.name === 'procedures') { IDBObjectStore.prototype.put = original; throw new DOMException('Quota fixture', 'QuotaExceededError'); }
      return original.apply(this, args);
    };
  });
  const sheet = page.getByRole('dialog', { name: 'Modifica dettagli', exact: true });
  await sheet.getByRole('textbox', { name: 'Nome procedura *', exact: true }).fill('Nome autore dopo Retry');
  await expect(sheet.getByRole('alert')).toContainText('Modifiche non salvate');
  await sheet.getByRole('button', { name: 'Fine', exact: true }).click(); await expect(sheet).toBeVisible();
  await expect(sheet.getByRole('textbox', { name: 'Nome procedura *', exact: true })).toHaveValue('Nome autore dopo Retry');
  await sheet.getByRole('button', { name: 'Riprova', exact: true }).click(); await expect(sheet.getByRole('alert')).toHaveCount(0);
  await page.goBack(); await expect(sheet).not.toBeVisible();
  await expect(page.getByRole('heading', { name: 'Nome autore dopo Retry', exact: true })).toBeVisible();
  expect((await records(page)).procedures.find((procedure) => procedure.id === 'fixture-0')?.title).toBe('Nome autore dopo Retry');
});

test('New salva una Draft con solo Start; creare un gruppo non crea prematuramente la procedura e conserva input', async ({ page }) => {
  await setup(page); const before = await records(page); await page.goto('./#/new');
  await expect(page.getByRole('button', { name: 'Crea bozza', exact: true })).toBeDisabled();
  await page.getByRole('textbox', { name: 'Nome procedura *', exact: true }).fill('Nuova procedura fittizia');
  await page.getByLabel('Etichette', { exact: true }).fill('Cartoncini'); await page.getByLabel('Etichette', { exact: true }).press('Enter');
  await page.getByRole('button', { name: 'Altri dettagli ▸', exact: true }).click();
  await page.getByRole('radio', { name: 'Priorità 2', exact: true }).check();
  await page.getByLabel('Alias di ricerca', { exact: true }).fill('Firma autore'); await page.getByLabel('Alias di ricerca', { exact: true }).press('Enter');
  await page.getByRole('button', { name: 'Scegli gruppo', exact: true }).click();
  await page.getByRole('dialog', { name: 'Scegli gruppo', exact: true }).getByRole('button', { name: 'Nuovo gruppo', exact: true }).click();
  const group = page.getByRole('dialog', { name: 'Nuovo gruppo', exact: true });
  await group.getByRole('textbox', { name: 'Nome gruppo', exact: true }).fill('Gruppo nuova bozza');
  await group.getByRole('textbox').press('Enter'); await expect(group).not.toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Nome procedura *', exact: true })).toHaveValue('Nuova procedura fittizia');
  await expect(page.getByRole('button', { name: 'Scegli gruppo', exact: true })).toContainText('Gruppo nuova bozza');
  expect((await records(page)).procedures).toHaveLength(before.procedures.length);
  await page.getByRole('button', { name: 'Crea bozza', exact: true }).click(); await expect(page).toHaveURL(/#\/build\//);
  const created = await records(page); const procedure = created.procedures.find((procedure) => procedure.title === 'Nuova procedura fittizia')!;
  expect(procedure).toMatchObject({ tags: ['Cartoncini'], aliases: ['Firma autore'], priority: 2 }); expect(procedure.readyRevisionId).toBeUndefined();
  const draft = created.revisions.find((revision) => revision.id === procedure.workingDraftId)!;
  expect(draft.graph.nodes).toEqual([{ id: expect.any(String), kind: 'start', next: { kind: 'unassigned' } }]);
  await page.reload(); await expect(page.locator(`[data-revision-id="${draft.id}"]`)).toHaveText('Bozza');
  await page.getByRole('link', { name: 'Torna alla libreria', exact: true }).click();
  await expect(page.getByTestId('library-scroll').getByRole('button', { name: procedure.title, exact: true })).toBeVisible();
});

test('New Back e browser Back confermano scarto senza perdere input con Continua a compilare', async ({ page }) => {
  await setup(page); await page.goto('./#/library'); await page.getByRole('link', { name: '+ Nuova', exact: true }).click();
  await page.getByRole('textbox', { name: 'Nome procedura *', exact: true }).fill('Bozza non ancora creata');
  await page.goBack(); const confirm = page.getByRole('dialog', { name: 'Scartare i dettagli della bozza?', exact: true });
  await expect(confirm).toBeVisible(); await confirm.getByRole('button', { name: 'Continua a compilare', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Nome procedura *', exact: true })).toHaveValue('Bozza non ancora creata');
  await page.getByRole('button', { name: 'Indietro', exact: true }).click(); await confirm.getByRole('button', { name: 'Scarta', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Procedure', exact: true })).toBeVisible();
  expect((await records(page)).procedures.some((procedure) => procedure.title === 'Bozza non ancora creata')).toBe(false);
});

test('New quota: rollback totale, input conservati e Retry crea una sola procedura', async ({ page }) => {
  await setup(page); const before = await records(page); await page.goto('./#/new');
  await page.getByRole('textbox', { name: 'Nome procedura *', exact: true }).fill('Errore quota fittizio');
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function (...args: Parameters<IDBObjectStore['add']>) {
      if (this.name === 'procedures') { IDBObjectStore.prototype.add = original; throw new DOMException('Simulated quota', 'QuotaExceededError'); }
      return original.apply(this, args);
    };
  });
  await page.getByRole('button', { name: 'Crea bozza', exact: true }).click(); await expect(page.getByRole('alert')).toContainText('Modifiche non salvate');
  await expect(page.getByRole('textbox', { name: 'Nome procedura *', exact: true })).toHaveValue('Errore quota fittizio');
  const failed = await records(page); expect(failed.revisions).toEqual(before.revisions); expect(failed.procedures).toEqual(before.procedures);
  await page.getByRole('button', { name: 'Riprova', exact: true }).click(); await expect(page).toHaveURL(/#\/build\//);
  expect((await records(page)).procedures).toHaveLength(before.procedures.length + 1);
});

test('More duplica come Draft; archive/restore e delete esplicito conservano dati e sessioni pinned', async ({ page }) => {
  await setup(page); await details(page, 'fixture-0');
  await page.getByRole('button', { name: 'Azioni procedura', exact: true }).click();
  const menu = page.getByRole('dialog', { name: 'Azioni procedura', exact: true });
  expect(await menu.locator('button, a').allTextContents()).toEqual(['Chiudi', 'Modifica dettagli', 'Duplica', 'Esporta', 'Archivia', 'Elimina']);
  await menu.getByRole('button', { name: 'Duplica', exact: true }).click(); await expect(page).toHaveURL(/#\/build\//);
  const copy = (await records(page)).procedures.find((procedure) => procedure.title === 'Cartoncini àlfa (copia)')!;
  expect(copy.readyRevisionId).toBeUndefined(); expect(copy.workingDraftId).toBeTruthy();
  await details(page, 'fixture-0'); await page.getByRole('button', { name: 'Avvia Ready', exact: true }).click();
  const pinned = (await records(page)).runSessions;
  await details(page, 'fixture-0'); await page.getByRole('button', { name: 'Azioni procedura', exact: true }).click();
  await page.getByRole('button', { name: 'Elimina', exact: true }).click();
  await page.getByRole('dialog', { name: 'Elimina', exact: true }).getByRole('button', { name: 'Elimina', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('sessioni salvate');
  await page.getByRole('dialog').getByRole('button', { name: 'Annulla', exact: true }).click();
  await page.getByRole('button', { name: 'Azioni procedura', exact: true }).click(); await page.getByRole('button', { name: 'Archivia', exact: true }).click();
  await page.getByRole('dialog', { name: 'Archivia', exact: true }).getByRole('button', { name: 'Archivia', exact: true }).click();
  await page.getByRole('button', { name: 'Menu app', exact: true }).click(); await page.getByRole('button', { name: 'Archiviate', exact: true }).click();
  await page.getByRole('dialog', { name: 'Archiviate', exact: true }).getByRole('button', { name: 'Cartoncini àlfa', exact: true }).click();
  await page.getByRole('button', { name: 'Ripristina', exact: true }).click(); await expect(page.getByRole('button', { name: 'Riprendi', exact: true })).toBeVisible();
  expect((await records(page)).runSessions).toEqual(pinned);
  await details(page, 'fixture-1'); await page.getByRole('button', { name: 'Azioni procedura', exact: true }).click(); await page.getByRole('button', { name: 'Elimina', exact: true }).click();
  const deletion = page.getByRole('dialog', { name: 'Elimina', exact: true }); await expect(deletion.getByRole('link', { name: 'Esporta prima', exact: true })).toHaveAttribute('href', '#/data/procedures?procedure=fixture-1');
  await deletion.getByRole('button', { name: 'Elimina', exact: true }).click(); await expect(page.getByRole('heading', { name: 'Procedure', exact: true })).toBeVisible();
  const deleted = await records(page); expect(deleted.procedures.some((procedure) => procedure.id === 'fixture-1')).toBe(false);
  expect(deleted.revisions.some((revision) => revision.procedureId === 'fixture-1')).toBe(false); expect(deleted.runSessions).toEqual(pinned);
});

test('riferimento Ready di altra procedura blocca le azioni invece di aprire una revisione diversa', async ({ page }) => {
  await setup(page); await attachLibraryHarness(page); await page.evaluate(() => window.NurseFlowF03.corruptProcedureReference());
  await details(page, 'fixture-0'); await expect(page.getByRole('alert')).toContainText('Procedura o revisione non disponibile');
  await expect(page.getByRole('button', { name: /^Avvia|Anteprima bozza/ })).toHaveCount(0);
});

test('metadati e creazione funzionano offline nella shell già caricata, senza richieste di rete', async ({ page, context }) => {
  await setup(page); await details(page, 'fixture-1'); const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url())); await context.setOffline(true);
  await page.getByRole('button', { name: 'Azioni procedura', exact: true }).click(); await page.getByRole('button', { name: 'Modifica dettagli', exact: true }).click();
  const sheet = page.getByRole('dialog', { name: 'Modifica dettagli', exact: true });
  await sheet.getByRole('textbox', { name: 'Nome procedura *', exact: true }).fill('Titolo authored offline'); await sheet.getByRole('button', { name: 'Fine', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Titolo authored offline', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Torna alla libreria', exact: true }).click(); await page.getByRole('link', { name: '+ Nuova', exact: true }).click();
  await page.getByRole('textbox', { name: 'Nome procedura *', exact: true }).fill('Creazione offline'); await page.getByRole('button', { name: 'Crea bozza', exact: true }).click();
  await expect(page).toHaveURL(/#\/build\//); const stored = await records(page);
  expect(stored.procedures.some((procedure) => procedure.title === 'Creazione offline' && procedure.workingDraftId && !procedure.readyRevisionId)).toBe(true);
  expect(requests).toEqual([]);
});

for (const scale of [4, 13, 30, 48]) test(`Details e New a 320px/${scale}pt senza overflow`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 844 }); await setup(page); await page.goto('./#/settings'); await setScale(page, scale);
  await page.getByRole('button', { name: 'Chiudi', exact: true }).click(); await details(page, 'fixture-0'); await expectNoBleeding(page);
  if (scale <= 13) {
    const header = await page.locator('.nf-procedure-header').evaluate((element) => [...element.children].map((child) => {
      const box = child.getBoundingClientRect(); return { top: box.top, width: box.width, height: box.height };
    }));
    expect(header).toHaveLength(3);
    expect(Math.max(...header.map((box) => box.top)) - Math.min(...header.map((box) => box.top))).toBeLessThan(1);
    expect(header.every((box) => box.width >= 48 && box.height >= 48)).toBe(true);
  }
  const identity = await page.locator('.nf-procedure-identity').evaluate((element) => {
    const title = element.querySelector('h1')!;
    const boxes = [...element.children].map((child) => child.getBoundingClientRect());
    return { clipped: title.scrollWidth > title.clientWidth + 2, overlaps: boxes.some((a, index) => boxes.slice(index + 1).some((b) =>
      a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1)) };
  });
  expect(identity).toEqual({ clipped: false, overlaps: false });
  if (scale === 13) await testInfo.attach('details-320px-13pt', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  await page.getByRole('button', { name: 'Azioni procedura', exact: true }).click(); await page.getByRole('button', { name: 'Modifica dettagli', exact: true }).click();
  await expectNoBleeding(page); const metadata = page.getByRole('dialog', { name: 'Modifica dettagli', exact: true });
  await metadata.getByRole('button', { name: 'Fine', exact: true }).click(); await expect(metadata).not.toBeVisible();
  await page.goto('./#/new'); await page.getByRole('button', { name: 'Altri dettagli ▸', exact: true }).click(); await expectNoBleeding(page);
  if (scale === 13) await testInfo.attach('new-320px-13pt', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
});
