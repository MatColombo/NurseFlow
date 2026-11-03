import { useTranslation } from 'react-i18next';
import type { EditableStep, StepEdit } from '@domain/editor/edits';
import type { Graph } from '@domain/model';
import { Button } from '@shared/components';
import { TextEditor } from './TextEditor';
export function ContentFields({ node, graph, change, newPhase }: { node: EditableStep; graph: Graph; change(edit: StepEdit): void; newPhase(): void }) {
  const { t } = useTranslation();
  const field = (key: string, label: string, value: string, multiline = false) => <label className="nf-stack" key={key}>{t(label)}
    {multiline ? <textarea data-editor-field={key} rows={4} value={value} onChange={(event) => change({ type: 'content', patch: { [key]: event.target.value } })} /> :
      <input data-editor-field={key} value={value} onChange={(event) => change({ type: 'content', patch: { [key]: event.target.value } })} />}</label>;
  return <>
    <div className="nf-row"><span>{t('builder.kinds.' + node.kind)}</span><label className="nf-stack">{t('editor.phase')}<select data-editor-field="phaseId" value={node.phaseId ?? ''} onChange={(event) => change({ type: 'content', patch: { phaseId: event.target.value || null } })}>
      <option value="">{t('builder.noPhase')}</option>{graph.phases.map((phase) => <option key={phase.id} value={phase.id}>{phase.name}</option>)}</select></label><Button onClick={newPhase}>{t('editor.newPhase')}</Button></div>
    <details className="nf-card nf-stack nf-editor-section" open><summary>{t('editor.content')}</summary>
      {node.kind === 'end' ? <>
        <label className="nf-stack">{t('editor.endKind')}<select data-editor-field="endKind" value={node.endKind} onChange={(event) => change({ type: 'content', patch: { endKind: event.target.value as typeof node.endKind } })}>{(['completed', 'stopped', 'escalation', 'neutral'] as const).map((kind) => <option key={kind} value={kind}>{t('builder.ends.' + kind)}</option>)}</select></label>
        {field('heading', 'editor.heading', node.heading)}{field('message', 'editor.message', node.message, true)}
      </> : <>{field('title', 'editor.titleField', node.title ?? '')}{node.kind === 'decision' ? <>{field('question', 'editor.question', node.question, true)}{field('context', 'editor.context', node.context ?? '', true)}</> :
        <><TextEditor label={t(node.kind === 'alert' ? 'editor.warning' : 'editor.instruction')} field="text" value={node.text} format={node.textFormat}
          change={(text, textFormat) => change({ type: 'content', patch: { text, textFormat } })} />{node.kind === 'alert' && field('additionalText', 'editor.additional', node.additionalText ?? '', true)}</>}</>}
    </details>
  </>;
}
