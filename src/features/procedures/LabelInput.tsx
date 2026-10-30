import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { normalize } from '@domain/library';
import { uniqueLabels } from '@domain/procedures';
import { Button } from '@shared/components';

export function LabelInput({ label, values, onChange, suggestions = [], addText }: {
  label: string; values: string[]; onChange(values: string[]): void; suggestions?: string[]; addText?: string;
}) {
  const { t } = useTranslation(); const [text, setText] = useState(''); const id = useId();
  const add = () => { if (text.trim()) { onChange(uniqueLabels([...values, text])); setText(''); } };
  return <div className="nf-stack"><label htmlFor={id}>{label}</label>
    <div className="nf-row">{values.map((value) => <Button key={normalize(value)} aria-label={t('procedure.removeLabel', { label: value })}
      onClick={() => onChange(values.filter((item) => item !== value))}>{value} ×</Button>)}</div>
    <div className="nf-row"><input id={id} value={text} list={`${id}-suggestions`} onChange={(event) => setText(event.target.value)}
      onBlur={add} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); add(); } }} />
      <Button onClick={add}>{addText ?? t('procedure.addLabel')}</Button></div>
    <datalist id={`${id}-suggestions`}>{uniqueLabels(suggestions).filter((value) => !values.some((item) => normalize(item) === normalize(value)))
      .map((value) => <option key={normalize(value)} value={value} />)}</datalist>
  </div>;
}
