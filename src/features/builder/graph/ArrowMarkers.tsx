const arrowTones = ['primary', 'completed', 'neutral', 'stopped', 'escalation'] as const;
const colors = ['primary', 'success', 'info', 'danger', 'warning'];
export function ArrowMarkers({ id }: { id: string }) {
  return <defs>{arrowTones.map((tone, index) => <marker key={tone} id={`${id}-${tone}`} viewBox="0 0 12 12" refX="11" refY="6"
    markerWidth="12" markerHeight="12" orient="auto" markerUnits="userSpaceOnUse" overflow="visible">
    <path d="M1 1 L11 6 L1 11 Z" fill={`var(--nf-${colors[index]})`} stroke="none" />
  </marker>)}</defs>;
}
