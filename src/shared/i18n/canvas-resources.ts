export const canvasResources = {
  it: { canvas: {
    controls: 'Controlli Graph', surface: 'Canvas Graph', diagram: 'Grafo della procedura', zoomIn: 'Aumenta zoom', zoomOut: 'Riduci zoom', zoomLevel: 'Livello zoom', zoomLimit: 'Limite zoom raggiunto.',
    fit: 'Adatta', center: 'Centra selezione', noSelection: 'Seleziona un passo.', find: 'Trova nel grafo', locate: 'Focalizza: {{title}}',
    overview: 'Panoramica: tocca un passo per tornare alla dimensione di modifica.',
    edge: 'Collegamento: {{title}}', choose: 'Scegli destinazione: {{title}}', chooseDestination: 'Scegli la destinazione o annulla.',
    connected: 'È già il passo collegato.', pathFor: 'Percorso per: {{title}}',
    browseActivities: 'Sfoglia attività', browseOutcomes: 'Sfoglia esiti', activityFocus: 'Attività {{index}} di {{count}}', outcomeFocus: 'Esito {{index}} di {{count}}',
    shown: '{{count}} visibili di {{total}}',
  } },
  en: { canvas: {
    controls: 'Graph controls', surface: 'Graph canvas', diagram: 'Procedure graph', zoomIn: 'Zoom in', zoomOut: 'Zoom out', zoomLevel: 'Zoom level', zoomLimit: 'Zoom limit reached.',
    fit: 'Fit', center: 'Center selection', noSelection: 'Select a step.', find: 'Find on graph', locate: 'Focus: {{title}}',
    overview: 'Overview: tap a step to return to editing size.',
    edge: 'Connection: {{title}}', choose: 'Choose destination: {{title}}', chooseDestination: 'Choose a destination or cancel.',
    connected: 'This step is already connected.', pathFor: 'Path for: {{title}}',
    browseActivities: 'Browse activities', browseOutcomes: 'Browse outcomes', activityFocus: 'Activity {{index}} of {{count}}', outcomeFocus: 'Outcome {{index}} of {{count}}',
    shown: '{{count}} shown of {{total}}',
  } },
} as const;
