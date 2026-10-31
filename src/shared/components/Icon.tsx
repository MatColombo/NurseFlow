const paths = {
  fork: 'M12 21v-8M5 3v5l7 5 7-5V3',
  check: 'm5 12 4 4L19 6', close: 'm6 6 12 12M6 18 18 6',
  search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  warning: 'm12 3 10 18H2L12 3Zm0 6v5m0 3v1', problem: 'M12 8v5m0 3v1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  draft: 'M14 2H4v20h16V8l-6-6Zm0 0v6h6M8 12h8m-8 4h8',
  ready: 'M9 3h6v3h4v16H5V6h4V3Zm0 0v5h6V3m-7 11 3 3 5-6',
  image: 'M3 3h18v18H3V3Zm0 13 6-6 12 11M16 7h.01',
  back: 'm15 5-7 7 7 7', chevron: 'm9 5 7 7-7 7',
  info: 'M12 11v6m0-10v1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  procedure: 'M9 3h6v4h5v15H4V7h5V3Zm0 0v6h6V3M8 13h8m-8 4h8',
} as const;
export type IconName = keyof typeof paths;

/** Only bundled paths; no SVG/HTML strings or external URLs accepted. */
export function Icon({ name, label }: { name: IconName; label?: string }) {
  return (
    <svg className="nf-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" focusable="false"
      role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <path d={paths[name]} />
    </svg>
  );
}
