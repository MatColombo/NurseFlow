import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { setupBuilder, readBuilder } from '../fixtures/builder';
import { expectNoBleeding, setScale } from '../fixtures/ui';
import { cancelGraphTarget, graphSurface, locateGraphNode, pickGraphNode } from '../fixtures/graph';

const row = (page: Page, id: string) => page.locator('[data-outline-node="' + id + '"]');
const dialog = (page: Page) => page.getByRole('dialog');
async function capture(page: Page, info: TestInfo, name: string) {
  const path = info.outputPath(name + '.png'); await page.screenshot({ path }); await info.attach(name, { path, contentType: 'image/png' });
}
const apply = async (page: Page) => {
  const preview = page.getByRole('dialog', { name: 'Anteprima della modifica', exact: true });
  await preview.getByRole('button', { name: 'Applica modifica', exact: true }).click();
  await expect(preview).not.toBeVisible();
};
async function chooseNode(page: Page, id: string, title: string) { await row(page, id).getByRole('button', { name: title, exact: true }).click(); }
async function changeA(page: Page) {
  await row(page, 'decision').getByRole('button', { name: 'A · Percorso A', exact: true }).click();
  await dialog(page).getByRole('button', { name: 'Cambia collegamento', exact: true }).click();
  await pickGraphNode(page, 'Esempio terminato');
}

test('Start vuoto: picker esatto, creazione+collegamento persistiti prima di Page08; outcome singolo', async ({ page }) => {
  const { blankId } = await setupBuilder(page); await page.goto('./#/build/' + blankId);
  await page.getByRole('button', { name: 'Primo passo · +', exact: true }).click();
  for (const name of ['Crea il prossimo passo', 'Termina qui la procedura', 'Vai a un passo esistente']) await expect(dialog(page).getByRole('button', { name, exact: true })).toBeVisible();
  await dialog(page).getByRole('button', { name: 'Crea il prossimo passo', exact: true }).click();
  await expect(dialog(page).getByRole('button', { name: 'Attività multitasking', exact: true })).toBeVisible();
  await dialog(page).getByRole('button', { name: 'Prendi una decisione', exact: true }).click();
  await expect(page).toHaveURL(/\/step\//); const saved = await readBuilder(page, blankId);
  const decision = saved.revision.graph.nodes.find((node) => node.kind === 'decision')!;
  expect(decision).toMatchObject({ question: '', outcomes: [{ label: '', destination: { kind: 'unassigned' } }, { label: '', destination: { kind: 'unassigned' } }] });
  expect(saved.revision.graph.nodes[0]).toMatchObject({ next: { kind: 'node', nodeId: decision.id } });
  expect(saved.history.past).toHaveLength(1); expect(saved.ready).toBeUndefined();
  await page.reload(); await expect(page.locator('[data-node-id]')).toHaveAttribute('data-node-id', decision.id);
  await page.getByRole('link', { name: 'Torna al Builder', exact: true }).click();
  await row(page, decision.id).getByRole('button', { name: 'Esito senza nome · +', exact: true }).first().click();
  await dialog(page).getByRole('button', { name: 'Crea il prossimo passo', exact: true }).click();
  await dialog(page).getByRole('button', { name: 'Istruzione', exact: true }).click(); await expect(page).toHaveURL(/\/step\//);
  const next = await readBuilder(page, blankId); const changed = next.revision.graph.nodes.find((node) => node.id === decision.id);
  expect(changed).toMatchObject({ outcomes: [{ destination: { kind: 'node', nodeId: expect.any(String) } }, { destination: { kind: 'unassigned' } }] });
  expect(next.revision.graph.nodes.find((node) => node.kind === 'instruction')).toMatchObject({ text: '', media: [], next: { kind: 'unassigned' } });
});

for (const [label, endKind] of [['Completata', 'completed'], ['Interrotta', 'stopped'], ['Escalation', 'escalation'], ['Neutra', 'neutral']] as const) {
  test('End intenzionale ' + endKind + ' persistito senza testo precompilato', async ({ page }) => {
    const { blankId } = await setupBuilder(page); await page.goto('./#/build/' + blankId);
    await page.getByRole('button', { name: 'Primo passo · +', exact: true }).click();
    await dialog(page).getByRole('button', { name: 'Termina qui la procedura', exact: true }).click();
    await dialog(page).getByRole('button', { name: label, exact: true }).click(); await expect(page).toHaveURL(/\/step\//);
    const saved = await readBuilder(page, blankId); expect(saved.revision.graph.nodes.find((node) => node.kind === 'end')).toMatchObject({ endKind, heading: '', message: '' });
    expect(saved.runs).toEqual([]);
  });
}

test('rewiring per singolo edge: preview orfani, Cancel, Undo/Redo persistenti, Ready intatta', async ({ page }) => {
  await setupBuilder(page); const before = await readBuilder(page); await changeA(page);
  const preview = dialog(page); await expect(preview).toContainText('Prima: Percorso A'); await expect(preview).toContainText('Dopo: Esempio terminato');
  await expect(preview).toContainText('Passo non raggiungibile: Percorso A');
  await preview.getByRole('button', { name: 'Annulla', exact: true }).click();
  expect((await readBuilder(page)).revision).toEqual(before.revision);
  await cancelGraphTarget(page);
  await dialog(page).getByRole('button', { name: 'Annulla', exact: true }).click();
  await changeA(page); await apply(page); const changed = await readBuilder(page);
  expect(changed.revision.graph.nodes.find((node) => node.id === 'decision')).toMatchObject({ outcomes: [
    { id: 'a', destination: { kind: 'node', nodeId: 'end' } }, { id: 'b', destination: { kind: 'node', nodeId: 'b-step' } },
  ] });
  expect(changed.ready).toEqual(before.ready); expect(changed.revision.graph.nodes).toHaveLength(before.revision.graph.nodes.length);
  await page.reload(); await page.getByRole('button', { name: 'Annulla modifica', exact: true }).click();
  await expect.poll(async () => (await readBuilder(page)).revision.graph).toEqual(before.revision.graph);
  await page.getByRole('button', { name: 'Ripeti modifica', exact: true }).click();
  await expect.poll(async () => (await readBuilder(page)).revision.graph).toEqual(changed.revision.graph);
});

test('Copy con nuovi ID e fase, Cut pending cancellabile, move atomico e Undo dei due edge', async ({ page }) => {
  await setupBuilder(page); const before = await readBuilder(page);
  await chooseNode(page, 'a-step', 'Percorso A'); await dialog(page).getByRole('button', { name: 'Copia', exact: true }).click();
  await row(page, 'b-step').getByRole('button', { name: 'Passo successivo · Revisione comune', exact: true }).click();
  await dialog(page).getByRole('button', { name: 'Incolla qui', exact: true }).click(); await expect(dialog(page)).toContainText('Nuove fasi: Fase esempio');
  await apply(page); const copied = await readBuilder(page);
  const clone = copied.revision.graph.nodes.find((node) => node.id !== 'a-step' && 'title' in node && node.title === 'Percorso A')!;
  expect(clone.id).not.toBe('a-step'); expect(clone).toMatchObject({ next: { kind: 'node', nodeId: 'shared' } });
  expect(copied.revision.graph.nodes.find((node) => node.id === 'a-step')).toEqual(before.revision.graph.nodes.find((node) => node.id === 'a-step'));
  await page.getByRole('button', { name: 'Annulla modifica', exact: true }).click();
  await expect.poll(async () => (await readBuilder(page)).revision.graph).toEqual(before.revision.graph);
  await chooseNode(page, 'a-step', 'Percorso A'); await dialog(page).getByRole('button', { name: 'Taglia', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Spostamento in sospeso'); expect((await readBuilder(page)).revision.graph).toEqual(before.revision.graph);
  await page.getByRole('button', { name: 'Annulla spostamento', exact: true }).click();
  await chooseNode(page, 'a-step', 'Percorso A'); await dialog(page).getByRole('button', { name: 'Taglia', exact: true }).click();
  await page.reload(); await expect(page.getByText('Spostamento in sospeso', { exact: true })).toHaveCount(0);
  await chooseNode(page, 'a-step', 'Percorso A'); await dialog(page).getByRole('button', { name: 'Taglia', exact: true }).click();
  await row(page, 'b-step').getByRole('button', { name: 'Passo successivo · Revisione comune', exact: true }).click();
  await dialog(page).getByRole('button', { name: 'Incolla qui', exact: true }).click(); await apply(page);
  const moved = await readBuilder(page); expect(moved.history.past).toHaveLength(1);
  expect(moved.revision.graph.nodes.find((node) => node.id === 'decision')).toMatchObject({ outcomes: [{ destination: { kind: 'node', nodeId: 'shared' } }, { destination: { kind: 'node', nodeId: 'b-step' } }] });
  expect(moved.revision.graph.nodes.find((node) => node.id === 'b-step')).toMatchObject({ next: { kind: 'node', nodeId: 'a-step' } });
  await page.getByRole('button', { name: 'Annulla modifica', exact: true }).click();
  await expect.poll(async () => (await readBuilder(page)).revision.graph).toEqual(before.revision.graph);
});

test('shared canonico, riferimenti focus, Cut sicuro e cancellazione W08 su ogni ingresso', async ({ page }) => {
  await setupBuilder(page); const before = await readBuilder(page); await expect(row(page, 'shared')).toHaveCount(1);
  await row(page, 'b-step').getByRole('button', { name: 'Vai al passo: Revisione comune', exact: true }).click();
  await expect(row(page, 'shared').getByRole('button', { name: 'Revisione comune', exact: true })).toBeFocused();
  await chooseNode(page, 'shared', 'Revisione comune'); await expect(dialog(page)).toContainText('più percorsi');
  await dialog(page).getByRole('button', { name: 'Taglia', exact: true }).click(); await expect(dialog(page).getByRole('alert')).toContainText('Spostamento non sicuro');
  expect((await readBuilder(page)).revision.graph).toEqual(before.revision.graph);
  await dialog(page).getByRole('button', { name: 'Elimina passo', exact: true }).click(); await apply(page);
  const deleted = await readBuilder(page); for (const id of ['a-step', 'b-step']) expect(deleted.revision.graph.nodes.find((node) => node.id === id)).toMatchObject({ next: { kind: 'broken', formerNodeId: 'shared', formerTitle: 'Revisione comune' } });
  await expect(page.getByText(/^W08/)).toHaveCount(2); await expect(page.getByRole('button', { name: 'B · +', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Annulla modifica', exact: true }).click(); await expect.poll(async () => (await readBuilder(page)).revision.graph).toEqual(before.revision.graph);
});

test('AND: Finish attività, After all, Stop entire con tipo e consenso espliciti; no cross-arm', async ({ page }) => {
  await setupBuilder(page, 'multi'); const before = await readBuilder(page, 'multi');
  await row(page, 'task-1').getByRole('button', { name: 'Passo successivo · Attività terminata', exact: true }).click();
  await dialog(page).getByRole('button', { name: 'Cambia collegamento', exact: true }).click();
  await locateGraphNode(page, 'Operazione 2'); await expect(graphSurface(page).getByRole('button', { name: 'Scegli destinazione: Operazione 2', exact: true })).toBeDisabled();
  await locateGraphNode(page, 'Fine esempio'); await expect(graphSurface(page).getByRole('button', { name: 'Scegli destinazione: Fine esempio', exact: true })).toBeDisabled();
  await cancelGraphTarget(page);
  await dialog(page).getByRole('button', { name: 'Annulla', exact: true }).click();
  await row(page, 'task-1').getByRole('button', { name: 'Passo successivo · Attività terminata', exact: true }).click();
  await dialog(page).getByRole('button', { name: 'Scollega', exact: true }).click(); await apply(page);
  await row(page, 'task-1').getByRole('button', { name: 'Passo successivo · +', exact: true }).click();
  await expect(dialog(page).getByRole('button', { name: 'Termina qui la procedura', exact: true })).toHaveCount(0);
  await dialog(page).getByRole('button', { name: 'Termina questa attività', exact: true }).click(); await expect(dialog(page)).not.toBeVisible();
  expect((await readBuilder(page, 'multi')).revision.graph).toEqual(before.revision.graph);
  await expect(row(page, 'tasks').getByRole('button', { name: 'Dopo tutte le attività · Fine esempio', exact: true })).toBeVisible();
  await row(page, 'task-1').getByRole('button', { name: 'Passo successivo · Attività terminata', exact: true }).click();
  await dialog(page).getByRole('button', { name: 'Interrompi intera procedura', exact: true }).click();
  const stop = dialog(page).getByRole('button', { name: 'Interrompi intera procedura', exact: true }); await expect(stop).toBeDisabled();
  await expect(dialog(page).getByRole('radio')).toHaveCount(2); await dialog(page).getByRole('radio', { name: 'Escalation', exact: true }).check();
  await expect(stop).toBeDisabled(); await dialog(page).getByRole('checkbox').check(); await stop.click(); await apply(page);
  await expect(page).toHaveURL(/\/step\//); const saved = await readBuilder(page, 'multi');
  const end = saved.revision.graph.nodes.find((node) => node.kind === 'end' && node.endKind === 'escalation')!;
  expect(saved.revision.graph.nodes.find((node) => node.id === 'task-1')).toMatchObject({ next: { kind: 'node', nodeId: end.id, terminateProcedure: true } });
  expect(saved.revision.graph.nodes.find((node) => node.id === 'task-2')).toEqual(before.revision.graph.nodes.find((node) => node.id === 'task-2'));
  expect(saved.revision.graph.nodes.find((node) => node.id === 'tasks')).toEqual(before.revision.graph.nodes.find((node) => node.id === 'tasks')); expect(saved.runs).toEqual([]);
});

test('32 attività ricercabili e riordinabili con ID stabili; undo testo non modifica il DAG', async ({ page }) => {
  await setupBuilder(page, 'many'); const before = await readBuilder(page, 'many');
  await page.getByRole('button', { name: 'Sfoglia attività (32)', exact: true }).click();
  await expect(dialog(page).getByRole('button', { name: '+ Attività', exact: true })).toBeDisabled();
  await dialog(page).getByRole('searchbox', { name: 'Cerca', exact: true }).fill('Attività 27');
  await expect(dialog(page).getByRole('button', { name: 'Attività 1', exact: true })).toHaveCount(0);
  await dialog(page).getByRole('button', { name: 'Attività 27', exact: true }).click();
  const input = dialog(page).getByRole('textbox', { name: 'Nome', exact: true }); await input.fill('Nome autore'); await input.press('Control+z');
  expect((await readBuilder(page, 'many')).revision.graph).toEqual(before.revision.graph);
  await input.fill('Attività autore 27'); await dialog(page).getByRole('button', { name: 'Fine', exact: true }).click();
  await page.getByRole('button', { name: 'Azioni attività: Attività autore 27', exact: true }).click();
  await dialog(page).getByRole('button', { name: 'Sposta su', exact: true }).click();
  const saved = await readBuilder(page, 'many'); expect(saved.revision.graph.nodes.find((node) => node.id === 'tasks')).toMatchObject({ activities: expect.arrayContaining([
    expect.objectContaining({ id: 'activity-27', name: 'Attività autore 27', order: 25, first: { kind: 'node', nodeId: 'task-27' } }),
  ]) });
  await page.getByRole('list', { name: 'Outline', exact: true }).focus(); await page.keyboard.press('Control+z');
  await expect.poll(async () => (await readBuilder(page, 'many')).history.future.length).toBe(1);
});

test('quota in cronologia: rollback completo e Retry crea una sola volta', async ({ page }) => {
  const { blankId } = await setupBuilder(page); await page.goto('./#/build/' + blankId);
  await page.getByRole('button', { name: 'Primo passo · +', exact: true }).click();
  await dialog(page).getByRole('button', { name: 'Crea il prossimo passo', exact: true }).click();
  const create = dialog(page).getByRole('button', { name: 'Istruzione', exact: true }); await expect(create).toBeEnabled();
  const before = await readBuilder(page, blankId);
  await page.evaluate((version) => { const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args: Parameters<IDBObjectStore['put']>) {
      if (this.name === 'builderStates' && (args[0] as { editVersion?: number }).editVersion === version) {
        IDBObjectStore.prototype.put = original; throw new DOMException('Quota fixture', 'QuotaExceededError');
      }
      return original.apply(this, args);
    };
  }, before.revision.editVersion + 1);
  await create.click(); await expect(dialog(page).getByRole('alert')).toContainText('Modifica non salvata');
  const failed = await readBuilder(page, blankId); expect(failed.revision).toEqual(before.revision); expect(failed.history.past).toEqual([]);
  await dialog(page).getByRole('button', { name: 'Riprova', exact: true }).click(); await expect(page).toHaveURL(/\/step\//);
  const saved = await readBuilder(page, blankId); expect(saved.revision.graph.nodes).toHaveLength(2); expect(saved.history.past).toHaveLength(1);
});

test('outcome 19 di 32: selezione esatta, cap e collegamento canonico senza copia', async ({ page }) => {
  const { decisionsId } = await setupBuilder(page); await page.goto('./#/build/' + decisionsId); const before = await readBuilder(page, decisionsId);
  await chooseNode(page, 'decision', 'Scelta dimostrativa'); await expect(dialog(page).getByRole('button', { name: '+ Esito', exact: true })).toBeDisabled();
  await dialog(page).getByRole('searchbox', { name: 'Cerca', exact: true }).fill('Esito 19');
  await dialog(page).getByRole('button', { name: 'Imposta percorso', exact: true }).click();
  await dialog(page).getByRole('button', { name: 'Vai a un passo esistente', exact: true }).click();
  await pickGraphNode(page, 'Revisione comune'); await apply(page);
  const saved = await readBuilder(page, decisionsId); const decision = saved.revision.graph.nodes.find((node) => node.kind === 'decision');
  expect(saved.revision.graph.nodes).toHaveLength(before.revision.graph.nodes.length);
  if (decision?.kind !== 'decision') throw new Error('Decision missing');
  expect(decision.outcomes.filter((outcome) => outcome.destination.kind === 'node')).toEqual([
    expect.objectContaining({ id: 'outcome-19', destination: { kind: 'node', nodeId: 'shared' } }),
  ]);
});

test('errore quota: ricarica confermata elimina solo la proposta e permette Back dopo il recupero', async ({ page }) => {
  const { blankId } = await setupBuilder(page); await page.goto('./#/build/' + blankId);
  const before = await readBuilder(page, blankId);
  await page.getByRole('button', { name: 'Primo passo · +', exact: true }).click();
  await dialog(page).getByRole('button', { name: 'Crea il prossimo passo', exact: true }).click();
  await page.evaluate((version) => { const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args: Parameters<IDBObjectStore['put']>) {
      if (this.name === 'builderStates' && (args[0] as { editVersion?: number }).editVersion === version) {
        IDBObjectStore.prototype.put = original; throw new DOMException('Quota fixture', 'QuotaExceededError');
      } return original.apply(this, args);
    };
  }, before.revision.editVersion + 1);
  await dialog(page).getByRole('button', { name: 'Istruzione', exact: true }).click();
  await expect(dialog(page).getByRole('alert')).toContainText('Modifica non salvata');
  await dialog(page).getByRole('button', { name: 'Annulla', exact: true }).click();
  await page.getByRole('button', { name: 'Ricarica bozza salvata', exact: true }).click();
  const confirm = page.getByRole('dialog', { name: 'Scartare la modifica non salvata?', exact: true });
  await confirm.getByRole('button', { name: 'Ricarica bozza salvata', exact: true }).click(); await expect(confirm).not.toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0); expect((await readBuilder(page, blankId)).revision.graph).toEqual(before.revision.graph);
  await page.getByRole('button', { name: 'Indietro', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Dettagli procedura', exact: true })).toBeVisible();
});

test('Copy attività 27 tra procedure conserva confini e nuovi ID; Cut verso altra Draft rifiutato', async ({ page }) => {
  await setupBuilder(page, 'many'); const source = await readBuilder(page, 'many');
  await page.getByRole('button', { name: 'Azioni attività: Attività 27', exact: true }).click();
  await dialog(page).getByRole('button', { name: 'Copia', exact: true }).click();
  await page.goto('./#/build/multi'); await expect(page.getByRole('heading', { name: 'Esempio multi', exact: true })).toBeVisible();
  await chooseNode(page, 'tasks', 'Lavori dimostrativi');
  await dialog(page).getByRole('button', { name: 'Incolla attività qui', exact: true }).click(); await apply(page);
  const saved = await readBuilder(page, 'multi'); const task = saved.revision.graph.nodes.find((node) => node.kind === 'multitask');
  if (task?.kind !== 'multitask') throw new Error('Multitask missing'); expect(task.activities).toHaveLength(4);
  const copy = task.activities.find((activity) => activity.name === 'Attività 27')!; expect(copy.id).not.toBe('activity-27');
  expect(copy.first).toMatchObject({ kind: 'node' });
  if (copy.first.kind !== 'node') throw new Error('Entry missing');
  expect(saved.revision.graph.nodes.find((node) => node.id === (copy.first.kind === 'node' ? copy.first.nodeId : ''))).toMatchObject({ title: 'Operazione 27', next: { kind: 'activity-complete' } });
  expect((await readBuilder(page, 'many')).revision.graph).toEqual(source.revision.graph);
  await page.goto('./#/build/procedure'); await chooseNode(page, 'a-step', 'Percorso A'); await dialog(page).getByRole('button', { name: 'Taglia', exact: true }).click();
  const cutSource = await readBuilder(page); await page.goto('./#/build/multi'); await expect(page.getByRole('heading', { name: 'Esempio multi', exact: true })).toBeVisible();
  await row(page, 'tasks').getByRole('button', { name: 'Dopo tutte le attività · Fine esempio', exact: true }).click();
  await dialog(page).getByRole('button', { name: 'Incolla qui', exact: true }).click();
  await expect(dialog(page).getByRole('alert')).toContainText('Usa Copia');
  const scroll = page.getByTestId('builder-scroll'); await scroll.evaluate((element) => { element.scrollTop += 20; });
  const top = await scroll.evaluate((element) => element.scrollTop);
  await expect.poll(async () => (await readBuilder(page, 'multi')).history.view.scrollTop).toBe(top);
  await expect(dialog(page).getByRole('alert')).toContainText('Usa Copia');
  expect((await readBuilder(page, 'multi')).revision.graph).toEqual(saved.revision.graph);
  expect((await readBuilder(page)).revision.graph).toEqual(cutSource.revision.graph);
});

test('Ready-only resta immutata all’ingresso, prima rinomina crea Draft+history atomiche senza falsa recenza', async ({ page }) => {
  await setupBuilder(page, 'ready-only'); const before = await readBuilder(page, 'ready-only');
  expect(before.procedure.workingDraftId).toBeUndefined(); await expect(page.getByRole('button', { name: 'Annulla modifica', exact: true })).toBeDisabled();
  await chooseNode(page, 'end', 'Esempio terminato'); await dialog(page).getByRole('button', { name: 'Rinomina / fase', exact: true }).click();
  await dialog(page).getByRole('button', { name: 'Fine', exact: true }).click(); await expect(dialog(page)).not.toBeVisible();
  expect((await readBuilder(page, 'ready-only')).procedure.workingDraftId).toBeUndefined();
  await chooseNode(page, 'decision', 'Scelta dimostrativa'); await dialog(page).getByRole('button', { name: 'Rinomina / fase', exact: true }).click();
  await dialog(page).getByRole('button', { name: 'Fine', exact: true }).click(); await expect(dialog(page)).not.toBeVisible();
  const unchanged = await readBuilder(page, 'ready-only'); expect(unchanged.procedure.workingDraftId).toBeUndefined(); expect(unchanged.history.past).toEqual([]);
  await chooseNode(page, 'decision', 'Scelta dimostrativa'); await dialog(page).getByRole('button', { name: 'Rinomina / fase', exact: true }).click();
  await dialog(page).getByRole('textbox', { name: 'Titolo breve', exact: true }).fill('Titolo autore');
  await dialog(page).getByRole('button', { name: 'Fine', exact: true }).click();
  await expect(page.locator('[data-revision-state]')).toHaveAttribute('data-revision-state', 'working-draft');
  const saved = await readBuilder(page, 'ready-only'); expect(saved.ready).toEqual(before.ready); expect(saved.history.past).toHaveLength(1);
  expect(saved.procedure.workingDraftId).toBe(saved.revision.id); expect(saved.procedure.lastOpenedAt).toBe(before.procedure.lastOpenedAt);
  await page.reload(); await expect(page.getByRole('button', { name: 'Titolo autore', exact: true })).toBeVisible();
});

test('ritorno Details conserva scroll; fasi persistenti e modifica offline senza richieste esterne', async ({ page, context, baseURL }) => {
  await setupBuilder(page, 'many'); const pane = page.getByTestId('builder-scroll');
  await pane.evaluate((element) => { element.scrollTop = 550; }); await expect.poll(async () => (await readBuilder(page, 'many')).history.view.scrollTop).toBeGreaterThan(500);
  const savedTop = await pane.evaluate((element) => element.scrollTop);
  await page.getByRole('button', { name: 'Indietro', exact: true }).click(); await page.getByRole('button', { name: 'Continua modifica', exact: true }).click();
  await expect.poll(() => pane.evaluate((element) => element.scrollTop)).toBe(savedTop);
  const requests: string[] = []; page.on('request', (request) => { if (new URL(request.url()).origin !== new URL(baseURL!).origin) requests.push(request.url()); });
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Azioni Builder', exact: true }).click(); await dialog(page).getByRole('button', { name: 'Gestisci fasi', exact: true }).click();
  await dialog(page).getByRole('textbox', { name: 'Nome fase', exact: true }).fill('Fase autore offline');
  await dialog(page).getByRole('button', { name: 'Aggiungi fase', exact: true }).click();
  await expect.poll(async () => (await readBuilder(page, 'many')).revision.graph.phases.map((phase) => phase.name)).toEqual(['Fase autore offline']);
  expect(requests).toEqual([]); await context.setOffline(false);
});

for (const scale of [4, 13, 30, 48]) {
  test('320px Builder e sheet senza overflow a ' + scale + 'pt, toolbar raggiungibile durante scroll', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 844 }); await setupBuilder(page); await page.goto('./#/settings'); await setScale(page, scale);
    await page.getByRole('button', { name: 'Chiudi', exact: true }).click(); await page.goto('./#/build/procedure');
    await expect(page.getByRole('toolbar', { name: 'Strumenti Builder', exact: true })).toBeVisible(); await expectNoBleeding(page);
    if (scale <= 13) {
      const header = await page.locator('.nf-builder-header').boundingBox();
      expect(header!.y).toBeGreaterThanOrEqual(0); expect(header!.y + header!.height).toBeLessThanOrEqual(844);
    }
    if (scale === 13) await capture(page, testInfo, 'outline-320px');
    await row(page, 'b-step').getByRole('button', { name: 'Percorso B', exact: true }).scrollIntoViewIfNeeded();
    const undo = await page.getByRole('button', { name: 'Annulla modifica', exact: true }).boundingBox();
    expect(undo).not.toBeNull(); expect(undo!.y).toBeGreaterThanOrEqual(0); expect(undo!.y + undo!.height).toBeLessThanOrEqual(844);
    if (scale >= 30) {
      const top = await page.evaluate(() => window.scrollY); expect(top).toBeGreaterThan(0);
      await expect.poll(async () => (await readBuilder(page)).history.view.scrollTop).toBe(top);
      await page.reload(); await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(top);
      if (scale === 48) await capture(page, testInfo, 'outline-320px-48pt');
    }
    await chooseNode(page, 'b-step', 'Percorso B'); await expectNoBleeding(page); await dialog(page).getByRole('button', { name: 'Rinomina / fase', exact: true }).click();
    await expectNoBleeding(page); await dialog(page).getByRole('button', { name: 'Annulla', exact: true }).click(); await dialog(page).getByRole('button', { name: 'Chiudi', exact: true }).last().click();
    await changeA(page); await expectNoBleeding(page);
    if (scale === 13) await capture(page, testInfo, 'impact-320px');
    await dialog(page).getByRole('button', { name: 'Annulla', exact: true }).click();
    await cancelGraphTarget(page);
    await dialog(page).getByRole('button', { name: 'Annulla', exact: true }).click();
    await chooseNode(page, 'a-step', 'Percorso A'); await dialog(page).getByRole('button', { name: 'Taglia', exact: true }).click();
    await row(page, 'b-step').getByRole('button', { name: 'Passo successivo · Revisione comune', exact: true }).click();
    await dialog(page).getByRole('button', { name: 'Incolla qui', exact: true }).click(); await expectNoBleeding(page);
    await dialog(page).getByRole('button', { name: 'Annulla', exact: true }).click(); await dialog(page).getByRole('button', { name: 'Annulla', exact: true }).click();
    await page.getByRole('button', { name: 'Annulla spostamento', exact: true }).click();
  });
}
