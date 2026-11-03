import { useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { applyTextStyle, changedTextFormat, type TextColor, type TextFormat } from '@domain/model/text';
import { Button } from '@shared/components';
import { FormattedNote } from '@shared/components/FormattedText';

export function TextEditor({ label, value, format = [], bulleted, field, change }: {
  label: string; value: string; format?: TextFormat | undefined; bulleted?: boolean | undefined; field?: string;
  change(text: string, format: TextFormat, bulleted?: boolean): void;
}) {
  const { t } = useTranslation(); const id = useId(); const input = useRef<HTMLTextAreaElement>(null);
  const selection = useRef({ start: 0, end: 0 });
  function apply(key: 'bold' | 'italic' | 'underline' | 'color', color?: TextColor) {
    const { start, end } = selection.current;
    change(value, applyTextStyle(value, format, start, end, key, color), bulleted);
    requestAnimationFrame(() => { input.current?.focus({ preventScroll: true }); input.current?.setSelectionRange(start, end); });
  }
  return <div className="nf-stack nf-text-editor">
    <label htmlFor={id}>{label}</label>
    <p className="nf-meta">{t('editor.formatHint')}</p>
    <div className="nf-row" role="group" aria-label={t('editor.formatText', { label })}>
      {(['bold', 'italic', 'underline'] as const).map((key) => <Button key={key} aria-label={t('editor.' + key)} title={t('editor.' + key)}
        onPointerDown={(event) => event.preventDefault()} onClick={() => apply(key)}>{key === 'bold' ? <strong>B</strong> : key === 'italic' ? <em>I</em> : <u>U</u>}</Button>)}
      <label className="nf-stack">{t('editor.textColor')}<select value="" onChange={(event) => apply('color', event.target.value === 'default' ? undefined : event.target.value as TextColor)}>
        <option value="" disabled>{t('editor.textColor')}</option><option value="default">{t('editor.defaultColor')}</option>
        {(['primary', 'info', 'success', 'warning', 'danger'] as const).map((color) => <option key={color} value={color}>{t('editor.colors.' + color)}</option>)}
      </select></label>
      {bulleted !== undefined && <Button aria-label={t('editor.bullets')} aria-pressed={bulleted} onClick={() => change(value, format, !bulleted)}>• ≡</Button>}
    </div>
    <textarea ref={input} id={id} data-editor-field={field} rows={4} value={value}
      onSelect={(event) => { selection.current = { start: event.currentTarget.selectionStart, end: event.currentTarget.selectionEnd }; }}
      onChange={(event) => change(event.target.value, changedTextFormat(value, event.target.value, format), bulleted)} />
    {(format.length > 0 || bulleted) && <div className="nf-card" aria-label={t('editor.formattedPreview')}>
      <FormattedNote note={{ text: value, format, bulleted: Boolean(bulleted), visibility: 'always-visible' }} />
    </div>}
  </div>;
}
