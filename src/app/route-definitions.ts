/** Solo coordinate di navigazione; nessun dato o comportamento delle feature. */
export const routeDefinitions = [
  { path: '/setup', example: '/setup', page: '00', title: 'Primo avvio' },
  { path: '/library', example: '/library', page: '01', title: 'Libreria' },
  { path: '/procedure/:id', example: '/procedure/example', page: '02', title: 'Dettagli procedura' },
  { path: '/run/:id', example: '/run/example', page: '03', title: 'Esecuzione guidata' },
  { path: '/run/:id/end', example: '/run/example/end', page: '04', title: 'Fine procedura' },
  { path: '/procedure/:id/map', example: '/procedure/example/map', page: '05', title: 'Mappa' },
  { path: '/new', example: '/new', page: '06', title: 'Nuova procedura' },
  { path: '/build/:id', example: '/build/example', page: '07', title: 'Builder' },
  { path: '/build/:id/step/:nodeId', example: '/build/example/step/node-example', page: '08', title: 'Editor passo' },
  { path: '/build/:id/check', example: '/build/example/check', page: '09', title: 'Verifica' },
  { path: '/settings', example: '/settings', page: '10', title: 'Impostazioni' },
  { path: '/data/procedures', example: '/data/procedures', page: '11A', title: 'Procedure e libreria' },
  { path: '/data/app', example: '/data/app', page: '11B', title: 'Backup app e impostazioni' },
] as const;
