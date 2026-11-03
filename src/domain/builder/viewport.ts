import type { CanvasView } from './model';
import type { Point } from './scene';
export function boundedZoom(zoom: number, minimum = .05) { return Math.max(minimum, Math.min(3, zoom)); }
export function zoomAt(view: CanvasView, zoom: number, anchor: Point, minimum = .05): CanvasView {
  const next = boundedZoom(zoom, minimum); const factor = next / view.zoom;
  return { ...view, initialized: true, zoom: next, x: anchor.x - (anchor.x - view.x) * factor, y: anchor.y - (anchor.y - view.y) * factor };
}
export function centerAt(view: CanvasView, box: Point & { width: number; height: number }, width: number, height: number, leadingHeight = 0): CanvasView {
  const zoom = Math.max(1, view.zoom);
  // An oversized card starts at the viewport top. Reserve its leading controls
  // as well: a header alone can otherwise push an outlet's centre past the clip.
  const overflow = Math.max(0, Math.min(box.height, leadingHeight) * zoom - height);
  return { ...view, initialized: true, zoom, x: width / 2 - (box.x + box.width / 2) * zoom,
    y: height / 2 - (box.y + Math.min(box.height, height / zoom) / 2) * zoom - overflow };
}
export function fitViewport(view: CanvasView, scene: { width: number; height: number }, width: number, height: number, minimum = .05): CanvasView {
  const zoom = boundedZoom(Math.min(1, Math.max(1, width - 24) / scene.width, Math.max(1, height - 24) / scene.height), minimum);
  return { ...view, initialized: true, zoom, x: (width - scene.width * zoom) / 2, y: (height - scene.height * zoom) / 2 };
}
