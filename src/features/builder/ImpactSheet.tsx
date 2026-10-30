import { useTranslation } from 'react-i18next';
import type { Graph } from '@domain/model';
import { destinationAt, impact, incoming, outlets } from '@domain/builder/structure';
import { Button, Sheet } from '@shared/components';
import { destinationLabel, edgeTitle, titleOf } from './labels';
export type EditPlan = { graph: Graph; label: string; createdId?: string; openEditor?: boolean };
export function ImpactSheet({ before, plan, busy, error, cancel, confirm }: {
  before: Graph; plan: EditPlan; busy: boolean; error: string | null; cancel(): void; confirm(): void;
}) {
  const { t } = useTranslation(); const changes = impact(before, plan.graph);
  return <Sheet open title={t('builder.impact')} onClose={cancel}>
    <ul className="nf-list nf-stack">{changes.changed.map((change, index) => <li key={index} className="nf-stack nf-impact-row">
      <strong>{edgeTitle(change.before ? before : plan.graph, change.edge, t)}</strong>
      <span>{t('builder.before')}: {destinationLabel(before, change.before, t)}</span>
      <span>{t('builder.after')}: {destinationLabel(plan.graph, change.after, t)}</span>
    </li>)}</ul>
    {changes.removed.length > 0 && <p>{t('builder.removed')}: {changes.removed.map((node) => titleOf(node, t)).join(', ')}</p>}
    {changes.removed.map((node) => <p key={node.id}>{t('builder.deletionScope', { title: titleOf(node, t), incoming: incoming(before, node.id).length, outgoing: outlets(node).length })}</p>)}
    {changes.added.length > 0 && <p>{t('builder.added')}: {changes.added.map((node) => titleOf(node, t)).join(', ')}</p>}
    {plan.graph.phases.length > before.phases.length && <p>{t('builder.newPhases')}: {plan.graph.phases.slice(before.phases.length).map((phase) => phase.name).join(', ')}</p>}
    {before.phases.filter((phase) => !plan.graph.phases.some((after) => after.id === phase.id)).map((phase) => <p key={phase.id}>{t('builder.removedPhase', {
      name: phase.name, count: before.nodes.filter((node) => 'phaseId' in node && node.phaseId === phase.id).length,
    })}</p>)}
    {changes.unreachable.length > 0 && <p className="nf-outline-broken">{t('builder.unreachable')}: {changes.unreachable.map((node) => titleOf(node, t)).join(', ')}</p>}
    <p>{t('builder.draftMayBeIncomplete')}</p>
    <details><summary>{t('builder.unchanged', { count: changes.unchanged.length })}</summary>
      <ul>{changes.unchanged.map((edge, index) => <li key={index}>{edgeTitle(before, edge, t)} · {destinationLabel(before, destinationAt(before, edge), t)}</li>)}</ul></details>
    {error && <p role="alert">{error}</p>}
    <div className="nf-row"><Button onClick={cancel} disabled={busy} disabledReason={t('common.loading')}>{t('common.cancel')}</Button>
      <Button variant="primary" onClick={confirm} disabled={busy} disabledReason={t('common.loading')}>{t(error ? 'common.retry' : 'builder.apply')}</Button></div>
  </Sheet>;
}
