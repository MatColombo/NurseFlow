export const mapResources = {
  it: { map: {
    list: 'Lista', graph: 'Mappa', current: 'Corrente', visited: 'Visitato', pending: 'Da iniziare', 'in-progress': 'In corso', done: 'Completata',
    jump: 'Vai al corrente', backDetails: 'Indietro ai dettagli', backStep: 'Indietro al passo', backEnd: 'Indietro alla fine',
    unavailable: 'Impossibile aprire la mappa', graphFailed: 'Grafico non disponibile. Usa la Lista per consultare i passi.',
    unlinked: 'Non collegato', broken: 'W08 · Percorso non disponibile', required: 'Tutte le attività richieste', count: '{{completed}}/{{total}} completate',
    inspect: 'Esamina {{title}}', relationships: 'Collegamenti di {{title}}', reference: 'Riferimento a {{title}} · {{ref}}',
    note: 'Nota di {{label}}', outline: 'Lista dei passi', canvas: 'Mappa della procedura', cycle: 'Struttura incompleta o ciclica: consulta i riferimenti senza eseguirli.',
  } },
  en: { map: {
    list: 'List', graph: 'Map', current: 'Current', visited: 'Visited', pending: 'Pending', 'in-progress': 'In progress', done: 'Completed',
    jump: 'Jump to Current', backDetails: 'Back to details', backStep: 'Back to step', backEnd: 'Back to End',
    unavailable: 'Unable to open map', graphFailed: 'Graph unavailable. Use List to inspect the steps.',
    unlinked: 'Unlinked', broken: 'W08 · Path unavailable', required: 'All activities required', count: '{{completed}}/{{total}} completed',
    inspect: 'Inspect {{title}}', relationships: 'Paths from {{title}}', reference: 'Reference to {{title}} · {{ref}}',
    note: 'Note for {{label}}', outline: 'Step list', canvas: 'Procedure map', cycle: 'Incomplete or cyclic structure: inspect references without executing them.',
  } },
} as const;
