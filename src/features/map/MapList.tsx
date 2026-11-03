import { useLayoutEffect, useRef, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import type { Graph } from '@domain/model';
import type { MapProjection, MapRoute } from '@domain/map/projection';
import { Button } from '@shared/components';
import { titleOf } from '@features/builder/labels';
import { Relationships } from './Relationships';
import { mapIcon } from './labels';

export function MapList({ graph, projection, route, current, expanded, toggle, inspect, scrollRef }: {
  graph: Graph; projection: MapProjection; route: MapRoute; current?: string | undefined; expanded: Set<string>;
  toggle(id: string): void; inspect(id: string): void; scrollRef: RefObject<number>;
}) {
  const { t } = useTranslation(); const element = useRef<HTMLDivElement>(null); const rows = useRef(new Map<string, HTMLButtonElement>());
  useLayoutEffect(() => { if (element.current) element.current.scrollTop = scrollRef.current; }, [scrollRef]);
  function focus(id: string) { const button = rows.current.get(id); button?.scrollIntoView({ block: 'center' }); button?.focus({ preventScroll: true }); }
  return <div className="nf-map-list-shell">
    {current && <Button purpose="view" className="nf-map-jump" onClick={() => focus(current)}>{t('map.jump')}</Button>}
    <div ref={element} className="nf-map-list" onScroll={(event) => { scrollRef.current = event.currentTarget.scrollTop; }}>
      {projection.cyclic && <p role="alert">{t('map.cycle')}</p>}
      <ol className="nf-list" aria-label={t('map.outline')}>{projection.order.map((id) => {
        const node = projection.byId.get(id)!; const title = titleOf(node, t); const links = projection.edges.filter((link) => link.edge.nodeId === id);
        const phase = 'phaseId' in node ? graph.phases.find((phase) => phase.id === node.phaseId)?.name : undefined;
        const state = id === current ? 'current' : route.visitedNodes.has(id) ? 'visited' : undefined;
        return <li key={id} data-map-row={id} data-route-state={state} className="nf-map-list-node">
          <div className="nf-map-list-heading">
            <Button purpose="view" className="nf-map-list-inspect" icon={mapIcon(node)} ref={(button) => { if (button) rows.current.set(id, button); else rows.current.delete(id); }}
              onClick={(event) => { event.currentTarget.focus({ preventScroll: true }); inspect(id); }} aria-label={t('map.inspect', { title })} aria-current={id === current ? 'step' : undefined}>
              <span>{projection.references.get(id)} · {title}<small className="nf-meta">{t('builder.kinds.' + node.kind)}{node.kind === 'end' && <> · {t('builder.ends.' + node.endKind)}</>}{phase && <> · {phase}</>}{state && <> · {state === 'current' ? '◎' : '✓'} {t('map.' + state)}</>}</small></span>
            </Button>
            {links.length > 0 && <Button purpose="view" aria-label={t('map.relationships', { title })} aria-expanded={expanded.has(id)} aria-controls={'map-links-' + id}
              onClick={() => toggle(id)}>{expanded.has(id) ? '⌄' : '›'}</Button>}
          </div>
          {expanded.has(id) && <div id={'map-links-' + id}><Relationships nodeId={id} projection={projection} route={route} focusNode={focus} /></div>}
        </li>;
      })}</ol>
    </div>
  </div>;
}
