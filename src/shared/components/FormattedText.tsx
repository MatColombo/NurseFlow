import type { StepNote } from '@domain/model';
import { formatSegments, textLines, type TextFormat } from '@domain/model/text';

/** React escapes every authored character; formatting is an allowlist of data attributes. */
export function FormattedText({ text, format }: { text: string; format?: TextFormat | undefined }) {
  return <>{formatSegments(text, format).map((part) => <span key={part.start} style={{
    fontWeight: part.bold ? 700 : undefined, fontStyle: part.italic ? 'italic' : undefined,
    textDecoration: part.underline ? 'underline' : undefined, color: part.color ? `var(--nf-${part.color})` : undefined,
  }}>{part.text}</span>)}</>;
}
export function FormattedNote({ note }: { note: StepNote }) {
  if (!note.bulleted) return <p className="nf-authored"><FormattedText text={note.text} format={note.format} /></p>;
  return <ul className="nf-authored nf-authored-list">{textLines(note.text).map(({ text: line, start }, index) => {
    const format = (note.format ?? []).flatMap((mark) => mark.start < start + line.length && mark.end > start ?
      [{ ...mark, start: Math.max(0, mark.start - start), end: Math.min(line.length, mark.end - start) }] : []);
    return <li key={index}><FormattedText text={line} format={format} /></li>;
  })}</ul>;
}
