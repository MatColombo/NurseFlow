import { useCallback, useLayoutEffect, useRef, useState } from 'react';
export function useBuilderLayout(bodyMinimum = 160) {
  const header = useRef<HTMLElement>(null); const toolbar = useRef<HTMLDivElement>(null); const footer = useRef<HTMLElement>(null);
  const extras = useRef(new Set<HTMLElement>()); const observerRef = useRef<ResizeObserver | null>(null); const remeasure = useRef<() => void>(() => {});
  const [flow, setFlow] = useState(false);
  const chrome = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    extras.current.add(node); observerRef.current?.observe(node); remeasure.current();
    return () => { extras.current.delete(node); observerRef.current?.unobserve(node); remeasure.current(); };
  }, []);
  useLayoutEffect(() => {
    const root = document.documentElement; const priorPadding = root.style.scrollPaddingBlockStart;
    const measure = () => {
      const occupied = [header.current, toolbar.current, footer.current, ...extras.current].reduce((sum, node) => sum + (node?.getBoundingClientRect().height ?? 0), 0);
      const section = header.current?.parentElement; const main = section?.closest('main');
      const gap = section ? parseFloat(getComputedStyle(section).rowGap) || 0 : 0;
      const padding = main ? parseFloat(getComputedStyle(main).paddingTop) + parseFloat(getComputedStyle(main).paddingBottom) : 0;
      const flowing = occupied + bodyMinimum + gap * (3 + extras.current.size) + padding > window.innerHeight;
      root.style.scrollPaddingBlockStart = flowing ? ((toolbar.current?.getBoundingClientRect().height ?? 0) + 8) + 'px' : priorPadding;
      setFlow(flowing);
    };
    remeasure.current = measure; measure(); const observer = new ResizeObserver(measure); observerRef.current = observer;
    for (const node of [header.current, toolbar.current, footer.current, ...extras.current]) if (node) observer.observe(node);
    window.addEventListener('resize', measure); return () => { remeasure.current = () => {}; observerRef.current = null; observer.disconnect(); window.removeEventListener('resize', measure); root.style.scrollPaddingBlockStart = priorPadding; };
  }, [bodyMinimum]);
  return { header, toolbar, footer, chrome, flow };
}
