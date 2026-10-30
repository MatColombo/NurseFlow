import { useLayoutEffect, useRef, useState } from 'react';
export function useBuilderLayout() {
  const header = useRef<HTMLElement>(null); const toolbar = useRef<HTMLDivElement>(null); const footer = useRef<HTMLElement>(null);
  const [flow, setFlow] = useState(false);
  useLayoutEffect(() => {
    const root = document.documentElement; const priorPadding = root.style.scrollPaddingBlockStart;
    const measure = () => {
      const occupied = [header.current, toolbar.current, footer.current].reduce((sum, node) => sum + (node?.getBoundingClientRect().height ?? 0), 0);
      const flowing = occupied + 160 > window.innerHeight;
      root.style.scrollPaddingBlockStart = flowing ? ((toolbar.current?.getBoundingClientRect().height ?? 0) + 8) + 'px' : priorPadding;
      setFlow(flowing);
    };
    measure(); const observer = new ResizeObserver(measure);
    for (const node of [header.current, toolbar.current, footer.current]) if (node) observer.observe(node);
    window.addEventListener('resize', measure); return () => { observer.disconnect(); window.removeEventListener('resize', measure); root.style.scrollPaddingBlockStart = priorPadding; };
  }, []);
  return { header, toolbar, footer, flow };
}
