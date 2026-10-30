import { describe, expect, it } from 'vitest';
import { uiPreferencesSchema } from './model';
import { browserLocale, defaultFilters, recentProcedures, selectLibrary } from './library';
import { libraryFixture } from '@test/fixtures/library';

const fixture = libraryFixture();
function select(searchText = '', filters = defaultFilters(), sortMode: 'groups' | 'priority' | 'az' | 'recent' = 'groups') {
  return selectLibrary(fixture.procedures, fixture.groups, uiPreferencesSchema.parse({ searchText, filters, sortMode }), 'it', fixture.revisions);
}
describe('selezione locale della libreria', () => {
  it.each(['ALFA', 'àlfa', 'sinonimo speciale', 'materiali blu alfa'])('ricerca normalizzata su campi diversi: %s', (query) => {
    expect(select(query).map((procedure) => procedure.id)).toEqual(['fixture-0']);
  });
  it('cerca gruppo, tag e descrizione; richiede tutti i termini', () => {
    expect(select('esercizi rosso contenitore').map((procedure) => procedure.id)).toEqual(['fixture-1']);
    expect(select('alfa inesistente')).toEqual([]);
  });
  it('indicizza il testo dei passi solo quando richiesto', () => {
    expect(select('colore cartoncino')).toEqual([]);
    expect(select('colore cartoncino', { ...defaultFilters(), includeSteps: true })).toHaveLength(25);
  });
  it('usa OR dentro una facet e AND fra facet', () => {
    const results = select('', { ...defaultFilters(), groupIds: ['materials', 'exercises'], tags: ['rosso', 'blu'], priority: '2', status: 'draft' });
    expect(results.length).toBeGreaterThan(1);
    expect(results.every((procedure) => procedure.priority === 2 && procedure.workingDraftId)).toBe(true);
    expect(select('', { ...defaultFilters(), groupIds: ['materials'], tags: ['rosso'] })).toEqual([]);
  });
  it('seleziona preferite e bozze anche quando esiste una Ready', () => {
    expect(select('', { ...defaultFilters(), quick: 'favorites' }).map((procedure) => procedure.id)).toEqual(['fixture-0']);
    expect(select('', { ...defaultFilters(), quick: 'drafts' })).toHaveLength(25);
  });
  it('priorità globale 2→1→0 con parità risolta per apertura e titolo', () => {
    const results = select('', defaultFilters(), 'priority');
    expect(results[0]?.id).toBe('fixture-20');
    expect(results.map((procedure) => procedure.priority)).toEqual(results.map((procedure) => procedure.priority).sort((a, b) => b - a));
  });
  it('ricerca ordina titolo > tag/gruppo > alias > descrizione > passo', () => {
    const source = fixture.procedures.slice(0, 4).map((procedure, index) => ({ ...procedure, title: `Voce ${index}`,
      tags: index === 1 ? ['segnale'] : [], aliases: index === 2 ? ['segnale'] : [],
      description: index === 3 ? 'segnale' : '' }));
    source[0] = { ...source[0]!, title: 'segnale' };
    expect(selectLibrary(source, [], uiPreferencesSchema.parse({ searchText: 'segnale' }), 'it').map((procedure) => procedure.id))
      .toEqual(['fixture-0', 'fixture-1', 'fixture-2', 'fixture-3']);
  });
  it('recenti unici, cronologici, massimo 20; archiviati e mai aperti esclusi', () => {
    const recent = recentProcedures(fixture.procedures);
    expect(recent).toHaveLength(20); expect(recent[0]?.id).toBe('fixture-21');
    expect(recent.some((procedure) => procedure.archived || !procedure.lastOpenedAt)).toBe(false);
    expect(new Set(recent.map((procedure) => procedure.id)).size).toBe(20);
  });
  it('rileva la prima lingua supportata e usa English come fallback', () => {
    expect(browserLocale(['fr-FR', 'it-IT', 'en-US'])).toBe('it'); expect(browserLocale(['de-DE'])).toBe('en');
  });
  it('un riferimento a gruppo mancante compare nel filtro Ungrouped', () => {
    const procedure = { ...fixture.procedures[0]!, groupId: 'missing' };
    expect(selectLibrary([procedure], [], uiPreferencesSchema.parse({ filters: { groupIds: ['ungrouped'] } }), 'it')).toEqual([procedure]);
  });
});
