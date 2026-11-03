import { z } from 'zod';

export const textColorSchema = z.enum(['primary', 'info', 'success', 'warning', 'danger']);
export const textFormatSchema = z.array(z.strictObject({
  start: z.number().int().nonnegative(), end: z.number().int().positive(),
  bold: z.boolean().optional(), italic: z.boolean().optional(), underline: z.boolean().optional(), color: textColorSchema.optional(),
}).refine((mark) => mark.end > mark.start)).max(2048);
export type TextFormat = z.infer<typeof textFormatSchema>;
export type TextColor = z.infer<typeof textColorSchema>;

export function textLines(text: string) {
  const lines: { text: string; start: number }[] = []; let start = 0;
  for (const line of text.split('\n')) { lines.push({ text: line, start }); start += line.length + 1; }
  return lines;
}

export function formatSegments(text: string, format: TextFormat = []) {
  const bounds = [...new Set([0, text.length, ...format.flatMap((mark) => [Math.min(text.length, mark.start), Math.min(text.length, mark.end)])])].sort((a, b) => a - b);
  return bounds.slice(0, -1).map((start, index) => {
    const end = bounds[index + 1]!; const style: Omit<TextFormat[number], 'start' | 'end'> = {};
    for (const mark of format) if (mark.start <= start && mark.end >= end) Object.assign(style, mark);
    return { ...style, start, end, text: text.slice(start, end) };
  });
}

export function applyTextStyle(text: string, format: TextFormat, start: number, end: number,
  key: 'bold' | 'italic' | 'underline' | 'color', color?: TextColor): TextFormat {
  if (!text.length) return format;
  if (start === end) { start = 0; end = text.length; }
  const segments = formatSegments(text, [...format, { start, end }]);
  const turnOff = key !== 'color' && segments.filter((part) => part.start >= start && part.end <= end).every((part) => part[key]);
  return segments.flatMap((segment) => {
    const part: TextFormat[number] = { start: segment.start, end: segment.end, ...(segment.bold ? { bold: true } : {}),
      ...(segment.italic ? { italic: true } : {}), ...(segment.underline ? { underline: true } : {}), ...(segment.color ? { color: segment.color } : {}) };
    if (part.start >= start && part.end <= end) {
      if (key === 'color') { if (color) part.color = color; else delete part.color; }
      else if (turnOff) delete part[key]; else part[key] = true;
    }
    return part.bold || part.italic || part.underline || part.color ? [part] : [];
  });
}

/** Preserve unaffected formatting and inherit the style at the insertion point. */
export function changedTextFormat(previous: string, next: string, format: TextFormat = []): TextFormat {
  let start = 0; while (start < previous.length && start < next.length && previous[start] === next[start]) start++;
  let oldEnd = previous.length; let newEnd = next.length;
  while (oldEnd > start && newEnd > start && previous[oldEnd - 1] === next[newEnd - 1]) { oldEnd--; newEnd--; }
  const delta = newEnd - oldEnd;
  return format.flatMap((mark) => {
    const left = mark.start <= start ? mark.start : mark.start >= oldEnd ? mark.start + delta : newEnd;
    const right = mark.end < start ? mark.end : mark.end >= oldEnd ? mark.end + delta : newEnd;
    return right > left ? [{ ...mark, start: left, end: right }] : [];
  });
}
