import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppearance } from '@app/appearance-context';
import { defaultFilters, hasFilters, libraryFiltersSchema, normalize, recentProcedures, selectLibrary } from '@domain/library';
import type { Group, LibraryViewState, Procedure } from '@domain/model';
import { Button, Dialog, Search, Sheet } from '@shared/components';
import { FiltersSheet } from './FiltersSheet';
import { GroupDialogs, type GroupDialog } from './GroupDialogs';
import { Identity, ProcedureRow } from './ProcedureRow';
import { libraryService, type LibrarySnapshot } from './service';
import './library.css';

export function LibraryPage({ initial }: { initial: LibrarySnapshot }) {
  const { t } = useTranslation(); const { preferences } = useAppearance(); const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState(initial); const [view, setView] = useState(initial.view);
  const currentView = useRef(view); const pane = useRef<HTMLDivElement>(null); const recentPane = useRef<HTMLElement>(null);
  const browsePane = useRef<HTMLDivElement>(null); const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingFocus = useRef<string | null>(null);
  const failed = useRef<(() => Promise<void>) | null>(null); const [error, setError] = useState(false);
  const [modal, setModal] = useState<'filters' | 'recent' | 'app' | 'archived' | null>(null); const [groupDialog, setGroupDialog] = useState<GroupDialog | null>(null);
  const [recentTop, setRecentTop] = useState(0);
  const filters = libraryFiltersSchema.parse(view.filters ?? {});
  const filtered = Boolean(view.searchText?.trim()) || hasFilters(filters);
  const results = selectLibrary(snapshot.procedures, snapshot.groups, view, preferences.locale, snapshot.revisions);
  const recent = recentProcedures(snapshot.procedures);
  const showRecent = recent.length > 0 && !filtered && view.sortMode !== 'recent' && !view.recentCollapsed;
  const grouped = !filtered && view.sortMode === 'groups';
  const knownGroups = new Set(snapshot.groups.map((group) => group.id));
  const ungroupedResults = results.filter((procedure) => !procedure.groupId || !knownGroups.has(procedure.groupId));
  const tags = [...new Map(snapshot.procedures.flatMap((procedure) => procedure.tags).map((tag) => [normalize(tag), tag])).values()].sort();

  async function perform(operation: () => Promise<void>) {
    try { await operation(); failed.current = null; setError(false); }
    catch { failed.current = operation; setError(true); }
  }
  function persist(next: LibraryViewState) {
    void perform(async () => { await libraryService.saveView(next); });
  }
  function change(patch: Partial<LibraryViewState>, resetScroll = true) {
    const next = { ...currentView.current, ...patch, ...(resetScroll ? { scrollTop: 0 } : {}) };
    currentView.current = next; setView(next);
    if (resetScroll && pane.current) pane.current.scrollTop = 0;
    persist(next);
  }
  async function reload(focusId?: string) {
    setSnapshot(await libraryService.load(filters.includeSteps));
    if (focusId) {
      if (!grouped) change({ sortMode: 'groups', searchText: '', filters: defaultFilters(),
        collapsedGroupIds: currentView.current.collapsedGroupIds.filter((id) => id !== focusId),
      });
      else if (currentView.current.collapsedGroupIds.includes(focusId)) change({
        collapsedGroupIds: currentView.current.collapsedGroupIds.filter((id) => id !== focusId),
      }, false);
      pendingFocus.current = focusId;
    }
  }
  function open(procedure: Procedure) {
    void perform(async () => {
      await libraryService.saveView(currentView.current);
      setModal(null); void navigate(`/procedure/${encodeURIComponent(procedure.id)}`);
    });
  }
  useLayoutEffect(() => { if (pane.current) pane.current.scrollTop = initial.view.scrollTop; }, [initial.view.scrollTop]);
  useEffect(() => {
    if (!filters.includeSteps) return;
    let active = true;
    void libraryService.load(true).then((loaded) => { if (active) setSnapshot(loaded); }, () => { if (active) setError(true); });
    return () => { active = false; };
  }, [filters.includeSteps]);
  useEffect(() => {
    if (groupDialog || !pendingFocus.current) return;
    const id = pendingFocus.current; pendingFocus.current = null;
    requestAnimationFrame(() => document.getElementById(`group-${id}`)?.focus());
  }, [groupDialog]);
  useLayoutEffect(() => {
    const recentElement = recentPane.current; const browseElement = browsePane.current;
    if (!recentElement || !browseElement) return;
    // Keep the touch row and scaled heading intact even on a short viewport: the page may scroll vertically.
    const measure = () => browseElement.style.setProperty('--nf-browse-min', `${Math.ceil(recentElement.getBoundingClientRect().height * 5)}px`);
    measure(); const observer = new ResizeObserver(measure); observer.observe(recentElement);
    return () => { observer.disconnect(); browseElement.style.removeProperty('--nf-browse-min'); };
  }, [showRecent]);
  useEffect(() => () => {
    if (saveTimer.current) { clearTimeout(saveTimer.current); void libraryService.saveView(currentView.current).catch(() => {}); }
  }, []);
  function row(procedure: Procedure, fullRecent = false) {
    const group = snapshot.groups.find((item) => item.id === procedure.groupId)?.name ?? t('library.ungrouped');
    return <ProcedureRow key={procedure.id} procedure={procedure} {...(!grouped || fullRecent ? { group } : {})}
      onOpen={() => open(procedure)} recent={fullRecent} {...(!fullRecent ? { onFavorite: () => {
        void perform(async () => { await libraryService.setFavorite(procedure.id, !procedure.favorite); await reload(); });
      } } : {})} />;
  }
  function groupSection(group: Pick<Group, 'id' | 'name'>, members: Procedure[], realGroup?: Group) {
    const collapsed = view.collapsedGroupIds.includes(group.id);
    return <section key={group.id} className="nf-group" aria-label={group.name}>
      <div className="nf-group-header"><h3><button id={`group-${group.id}`} type="button" aria-expanded={!collapsed}
        aria-controls={`members-${group.id}`} onClick={() => change({ collapsedGroupIds: collapsed
          ? view.collapsedGroupIds.filter((id) => id !== group.id) : [...view.collapsedGroupIds, group.id] }, false)}>
        <span aria-hidden="true">{collapsed ? '▸' : '▾'}</span> {group.name} <span className="nf-meta">({members.length})</span>
      </button></h3>{realGroup && <Button aria-label={t('library.groupMore', { name: group.name })}
        onClick={() => setGroupDialog({ kind: 'menu', group: realGroup })}>···</Button>}</div>
      {!collapsed && <ul id={`members-${group.id}`} className="nf-list">{members.map((procedure) => row(procedure))}</ul>}
    </section>;
  }
  return <section className="nf-library" aria-labelledby="library-title">
    <div className="nf-library-toolbar nf-stack">
      <header className="nf-row"><h1 id="library-title">{t('library.title')}</h1><Link to="/new">{t('library.new')}</Link>
        <Button aria-label={t('library.more')} onClick={() => setModal('app')}>···</Button></header>
      <div className="nf-library-search"><Search label={t('library.search')} value={view.searchText ?? ''}
        onChange={(searchText) => change({ searchText })} /><Button aria-label={t('library.filters')}
        aria-pressed={hasFilters(filters)} onClick={() => setModal('filters')}>☷</Button></div>
      <div className="nf-row" role="group" aria-label={t('library.filters')}>
        {(['all', 'favorites', 'drafts'] as const).map((quick) => <Button key={quick} aria-pressed={filters.quick === quick}
          onClick={() => change({ filters: { ...filters, quick } })}>{t(`library.${quick}`)}</Button>)}
      </div>
      {error && <div className="nf-row"><p role="alert">{t('library.saveError')}</p><Button onClick={() => {
        void perform(failed.current ?? (() => reload()));
      }}>{t('common.retry')}</Button></div>}
    </div>
    <div className="nf-library-browse" ref={browsePane} data-testid="browse-area">
      {showRecent && <section ref={recentPane} className="nf-recent" aria-label={t('library.recent')} data-testid="recent-strip">
        <div className="nf-recent-heading"><h2><button type="button" aria-label={t('library.collapseRecent')} aria-expanded="true"
          onClick={() => change({ recentCollapsed: true }, false)}><span aria-hidden="true">▾</span> {t('library.recent')}</button></h2>
          <button type="button" aria-label={t('library.recentMore')} onClick={(event) => {
            setRecentTop(event.currentTarget.getBoundingClientRect().bottom); setModal('recent');
          }}>···</button></div>
        <div className="nf-recent-tiles">{recent.slice(0, 3).map((procedure) => <button key={procedure.id} type="button"
          aria-label={procedure.title} title={procedure.title} onClick={() => open(procedure)}>
          <Identity procedure={procedure} /><span>{procedure.title}</span></button>)}</div>
      </section>}
      <section className="nf-library-pane" aria-labelledby="library-heading" data-testid="library-pane">
        <div className="nf-library-heading nf-row"><h2 id="library-heading">{t('library.heading')}</h2>
          <Button onClick={() => setGroupDialog({ kind: 'create' })}>{t('library.newGroup')}</Button>
          <label>{t('library.view')} <select aria-label={t('library.view')} value={view.sortMode} onChange={(event) => change({ sortMode: event.target.value as LibraryViewState['sortMode'] })}>
            {(['groups', 'priority', 'recent', 'az'] as const).map((mode) => <option key={mode} value={mode}>{t(`library.${mode}`)}</option>)}
          </select></label>
          {recent.length > 0 && view.recentCollapsed && !filtered && view.sortMode !== 'recent' && <>
            <Button aria-label={t('library.expandRecent')} onClick={() => change({ recentCollapsed: false }, false)}>▸ {t('library.recent')}</Button>
            <Button aria-label={t('library.recentMore')} onClick={() => setModal('recent')}>···</Button>
          </>}
        </div>
        <div className="nf-library-scroll" ref={pane} data-testid="library-scroll" onScroll={(event) => {
          currentView.current = { ...currentView.current, scrollTop: event.currentTarget.scrollTop };
          if (saveTimer.current) clearTimeout(saveTimer.current);
          saveTimer.current = setTimeout(() => persist(currentView.current), 150);
        }}>
          {grouped ? <>{snapshot.groups.map((group) => groupSection(group, results.filter((procedure) => procedure.groupId === group.id), group))}
            {ungroupedResults.length > 0 && groupSection({ id: 'ungrouped', name: t('library.ungrouped') }, ungroupedResults)}</>
            : <ul className="nf-list">{results.map((procedure) => row(procedure))}</ul>}
          {results.length === 0 && <div className="nf-stack nf-empty"><p>{t(filtered ? 'library.noMatches' : 'library.empty')}</p>
            {filtered && <Button onClick={() => change({ searchText: '', filters: defaultFilters() })}>{t('library.clearFilters')}</Button>}</div>}
        </div>
      </section>
    </div>
    <FiltersSheet open={modal === 'filters'} onClose={() => setModal(null)} filters={filters} groups={snapshot.groups} tags={tags}
      onChange={(next) => change({ filters: next })} />
    <Sheet open={modal === 'recent'} className="nf-recent-sheet" style={{ '--nf-recent-top': `${recentTop}px` } as CSSProperties}
      title={t('library.recentCount', { count: recent.length })} onClose={() => setModal(null)}>
      <ul className="nf-list nf-recent-overflow">{recent.map((procedure) => row(procedure, true))}</ul>
    </Sheet>
    <Dialog open={modal === 'app'} title={t('library.more')} onClose={() => setModal(null)}>
      <Link to="/data/app" state={{ dataReturn: '/library' }}>{t('pages.11B')}</Link><Link to="/settings">{t('pages.10')}</Link>
      <Button onClick={() => setModal('archived')}>{t('procedure.archivedList')}</Button>
    </Dialog>
    <Sheet open={modal === 'archived'} title={t('procedure.archivedList')} onClose={() => setModal(null)}>
      <ul className="nf-list">{snapshot.procedures.filter((procedure) => procedure.archived).map((procedure) => <ProcedureRow key={procedure.id}
        procedure={procedure} onOpen={() => open(procedure)} />)}</ul>
    </Sheet>
    {groupDialog && <GroupDialogs key={`${groupDialog.kind}-${'group' in groupDialog ? groupDialog.group.id : ''}`}
      dialog={groupDialog} groups={snapshot.groups} procedures={snapshot.procedures} onClose={() => setGroupDialog(null)} onSaved={reload} />}
  </section>;
}
