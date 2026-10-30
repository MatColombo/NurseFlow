import { useEffect, useLayoutEffect, useRef, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import type { CanvasView } from '@domain/builder/model';
import { zoomAt } from '@domain/builder/viewport';
import type { Point } from '@domain/builder/scene';
export function useCanvasGestures(element: RefObject<HTMLDivElement | null>, view: CanvasView, change: (view: CanvasView) => void, fit: () => void, clear: () => void) {
  const current = useRef(view); const changed = useRef(change); const points = useRef(new Map<number, Point>());
  const suppressed = useRef(false); const panning = useRef(false);
  useLayoutEffect(() => { current.current = view; changed.current = change; });
  const emit = (value: CanvasView) => { current.current = value; changed.current(value); };
  useEffect(() => {
    // A touch beginning on a card can end outside the canvas without pointer capture.
    const finish = (event: PointerEvent) => { points.current.delete(event.pointerId); if (!points.current.size) panning.current = false; };
    window.addEventListener('pointerup', finish); window.addEventListener('pointercancel', finish);
    return () => { window.removeEventListener('pointerup', finish); window.removeEventListener('pointercancel', finish); };
  }, []);
  useEffect(() => {
    const node = element.current; if (!node) return;
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) return; // Preserve the browser's own zoom shortcut.
      event.preventDefault();
      if (event.altKey) {
        const rect = node.getBoundingClientRect(); emit(zoomAt(current.current, current.current.zoom * Math.exp(-event.deltaY / 500), { x: event.clientX - rect.left, y: event.clientY - rect.top }));
      } else emit({ ...current.current, initialized: true, x: current.current.x - event.deltaX, y: current.current.y - event.deltaY });
    };
    node.addEventListener('wheel', wheel, { passive: false }); return () => node.removeEventListener('wheel', wheel);
  }, [element]);
  function down(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    points.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (points.current.size === 1) {
      suppressed.current = false; panning.current = !(event.target instanceof Element && event.target.closest('button,[data-graph-edge]'));
    }
    if (panning.current || points.current.size > 1) event.currentTarget.setPointerCapture(event.pointerId);
  }
  function move(event: ReactPointerEvent<HTMLDivElement>) {
    const previous = points.current.get(event.pointerId); if (!previous) return;
    const old = [...points.current.values()]; points.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const next = [...points.current.values()];
    if (old.length >= 2 && next.length >= 2) {
      const distance = (values: Point[]) => Math.hypot(values[0]!.x - values[1]!.x, values[0]!.y - values[1]!.y);
      const middle = (values: Point[]) => ({ x: (values[0]!.x + values[1]!.x) / 2, y: (values[0]!.y + values[1]!.y) / 2 });
      const a = middle(old); const b = middle(next); const rect = event.currentTarget.getBoundingClientRect();
      const zoomed = zoomAt(current.current, current.current.zoom * distance(next) / Math.max(1, distance(old)), { x: a.x - rect.left, y: a.y - rect.top });
      emit({ ...zoomed, x: zoomed.x + b.x - a.x, y: zoomed.y + b.y - a.y }); suppressed.current = true;
    } else if (panning.current) {
      const dx = event.clientX - previous.x; const dy = event.clientY - previous.y;
      if (Math.abs(dx) + Math.abs(dy) > 1) { suppressed.current = true; emit({ ...current.current, initialized: true, x: current.current.x + dx, y: current.current.y + dy }); }
    }
  }
  function up(event: ReactPointerEvent<HTMLDivElement>) {
    points.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!points.current.size) panning.current = false;
  }
  function keyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || event.ctrlKey || event.metaKey || event.altKey) return;
    const offsets: Record<string, Point> = { ArrowLeft: { x: 64, y: 0 }, ArrowRight: { x: -64, y: 0 }, ArrowUp: { x: 0, y: 64 }, ArrowDown: { x: 0, y: -64 } };
    const delta = offsets[event.key];
    if (delta) { event.preventDefault(); emit({ ...current.current, initialized: true, x: current.current.x + delta.x, y: current.current.y + delta.y }); }
    else if (event.key === 'Home') { event.preventDefault(); fit(); }
    else if (event.key === 'Escape') clear();
    else if (event.key === '+' || event.key === '-') {
      event.preventDefault(); const node = element.current;
      if (node) emit(zoomAt(current.current, current.current.zoom * (event.key === '+' ? 1.25 : .8), { x: node.clientWidth / 2, y: node.clientHeight / 2 }));
    }
  }
  return { onPointerDown: down, onPointerMove: move, onPointerUp: up, onPointerCancel: up, onKeyDown: keyboard,
    onClickCapture(event: React.MouseEvent<HTMLDivElement>) { if (suppressed.current && event.detail > 0) { event.preventDefault(); event.stopPropagation(); } },
    onClick(event: React.MouseEvent<HTMLDivElement>) { if (!(event.target instanceof Element && event.target.closest('button,[data-graph-edge]'))) clear(); } };
}
