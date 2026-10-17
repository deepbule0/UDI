import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Activity, ArrowDownToLine, ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Braces, Check, CheckCheck, ChevronRight, CircleHelp, Clock3, Database, Download, FileJson2, FlaskConical, GitCommitHorizontal, GitFork, Home, Layers3, LockKeyhole, Plus, RotateCcw, Send, ShieldCheck, Smartphone, Sparkles, Upload, WifiOff, X } from 'lucide-react';
import { capabilityLabels, exportPackage, forkPackage, importPackage } from '../core/spec';
import { applyProposal, planIntent, suggestedIntents } from '../core/planner';
import { executeAction, prepareAction, readSource, type PreparedAction } from '../core/runtime';
import { freshState, loadState, storageKey, type StudioState } from '../core/session';
import type { AuditEvent, Capability, Commit, Deadline, Experiment, Paper, Proposal, UDISpec, View } from '../core/types';
import { datasets } from '../data/fixtures';
import { LanguageSwitch } from '../i18n';
import { useInstallApp } from '../pwa';
import { useMobileI18n } from './mobile-i18n';
import './mobile.css';

type Tab = 'home' | 'shape' | 'data' | 'share' | 'activity';
type Sheet = 'about' | 'export' | 'import' | 'spec' | 'reset' | null;

function BottomSheet({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t } = useMobileI18n();
  useEffect(() => {
    const dialog = ref.current;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);
  return <dialog className="m-sheet" ref={ref} aria-label={title} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="m-sheet-handle" /><header className="m-sheet-header"><strong>{title}</strong><button className="m-icon-button" aria-label={t('Close dialog')} onClick={onClose}><X size={21} /></button></header>
    <div className="m-sheet-body">{children}</div>
  </dialog>;
}

export default function MobileApp() {
  const { t, te, locale } = useMobileI18n();
  const [state, setState] = useState<StudioState>(loadState);
  const [tab, setTab] = useState<Tab>('home');
  const [sheet, setSheet] = useState<Sheet>(null);
  const [intent, setIntent] = useState('');
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [selected, setSelected] = useState<Experiment | null>(null);
  const [action, setAction] = useState<PreparedAction | null>(null);
  const [importText, setImportText] = useState('');
  const [incoming, setIncoming] = useState<UDISpec | null>(null);
  const [importError, setImportError] = useState('');
  const uploadRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLElement>(null);
  const installApp = useInstallApp();
  const { spec, revision, history, audit } = state;
  const dataset = datasets.find(item => item.id === state.datasetId)!;
  const instance = state.instances[state.datasetId];
  const nav = [
    { id: 'home', title: 'Home', icon: Home }, { id: 'shape', title: 'Shape', icon: Sparkles },
    { id: 'data', title: 'Data', icon: ShieldCheck }, { id: 'share', title: 'Share', icon: Layers3 },
    { id: 'activity', title: 'Activity', icon: Activity },
  ] as const;

  useEffect(() => { try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { setToast('Browser storage is unavailable or full. This session still works; export your package to save it.'); } }, [state]);
  useEffect(() => {
    const sync = (event: StorageEvent) => { if (event.key === storageKey) { setState(loadState()); setProposal(null); setAction(null); setSelected(null); } };
    window.addEventListener('storage', sync); return () => window.removeEventListener('storage', sync);
  }, []);
  useEffect(() => { if (toast) { const timer = setTimeout(() => setToast(''), 5000); return () => clearTimeout(timer); } }, [toast]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [tab]);
  function log(kind: AuditEvent['kind'], message: string): AuditEvent { return { id: crypto.randomUUID(), time: new Date().toISOString(), kind, message }; }
  function commit(next: UDISpec, message: string, resetGrants = false) {
    setState(previous => ({ ...previous, spec: next, revision: previous.revision + 1, history: [...previous.history, previous.spec].slice(-20),
      instances: resetGrants ? Object.fromEntries(Object.entries(previous.instances).map(([key, item]) => [key, { ...item, grants: [] }])) : previous.instances,
      audit: [...previous.audit, log('revision', message)].slice(-100) }));
    setProposal(null); setError(''); setAction(null); setSelected(null);
  }
  function generate(text = intent) {
    try { setProposal(planIntent(text, spec, revision)); setIntent(text); setError(''); }
    catch (exception) { setError((exception as Error).message); setProposal(null); }
  }
  function apply() {
    if (!proposal) return;
    try { commit(applyProposal(spec, revision, proposal), proposal.summary); setToast('Applied. Your workspace is ready.'); setTab('home'); }
    catch (exception) { setError((exception as Error).message); }
  }
  function undo() {
    if (!history.length) return;
    setState(previous => ({ ...previous, spec: previous.history[previous.history.length - 1], revision: previous.revision + 1, history: previous.history.slice(0, -1), audit: [...previous.audit, log('revision', 'Restored the previous interface specification.')].slice(-100) }));
    setProposal(null); setError(''); setAction(null); setSelected(null); setToast('Your previous definition is restored.');
  }
  function bind(id: string) {
    if (id === state.datasetId) return;
    setState(previous => ({ ...previous, datasetId: id, audit: [...previous.audit, log('binding', `Bound the same package to ${datasets.find(item => item.id === id)!.name}.`)].slice(-100) }));
    setAction(null); setSelected(null); setToast('Same interface. New perspective.');
  }
  function toggle(capability: Capability) {
    const granted = instance.grants.includes(capability);
    setState(previous => ({ ...previous, instances: { ...previous.instances, [previous.datasetId]: { ...previous.instances[previous.datasetId], grants: granted ? previous.instances[previous.datasetId].grants.filter(item => item !== capability) : [...previous.instances[previous.datasetId].grants, capability] } }, audit: [...previous.audit, log('permission', `${granted ? 'Revoked' : 'Granted'} ${capability} for ${dataset.name}.`)].slice(-100) }));
    setAction(null);
  }
  function startAction(id: string) {
    try { setAction(prepareAction(spec, revision, instance, dataset, id)); }
    catch (exception) { setToast((exception as Error).message); setTab('data'); }
  }
  function confirmAction() {
    if (!action) return;
    try {
      const next = executeAction(spec, revision, instance, dataset, action, true);
      setState(previous => ({ ...previous, instances: { ...previous.instances, [previous.datasetId]: next }, audit: [...previous.audit, log('action', `Created one confirmed local review note in ${dataset.name}.`)].slice(-100) }));
      setAction(null); setToast('Review note created. View it in Data & access.'); setTab('data');
    } catch (exception) { setToast((exception as Error).message); setAction(null); }
  }
  function download() {
    const content = exportPackage(spec);
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `${spec.metadata.id}.udi.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setState(previous => ({ ...previous, audit: [...previous.audit, log('package', 'Exported the validated interface specification; instance state was excluded.')].slice(-100) }));
    setSheet(null); setToast('Interface package downloaded. Review its free-text fields before publishing.');
  }
  function checkImport() { try { setIncoming(importPackage(importText)); setImportError(''); } catch (exception) { setImportError((exception as Error).message); setIncoming(null); } }
  async function chooseFile(file: File | undefined) {
    if (!file) return;
    setIncoming(null); setImportError('');
    if (file.size > 64 * 1024) { setImportError('Package exceeds the 64 KiB limit.'); return; }
    try { setImportText(await file.text()); } catch { setImportError('Failed to read this file.'); }
  }
  function installPackage() {
    if (!incoming) return;
    commit(incoming, `Installed ${incoming.metadata.id}; cleared grants for all local instances.`, true);
    setIncoming(null); setSheet(null); setTab('data'); setToast('Data access was reset. Review each grant before reading records.');
  }
  function locked(view: View) {
    return <section className="m-card m-locked" key={view.id}><span className="m-round-icon"><LockKeyhole size={21} /></span><h3>{t(view.title)}</h3><p>{t('Access to this source is turned off.')}</p><button className="m-text-button" onClick={() => setTab('data')}>{t('Review data access')}<ArrowRight size={16} /></button></section>;
  }
  function renderView(view: View) {
    let records: ReturnType<typeof readSource>;
    try { records = readSource(spec, instance, dataset, view.source); } catch { return locked(view); }
    if (view.type === 'metrics') {
      const rows = records as Experiment[];
      const best = Math.max(...rows.filter(item => item.status === 'passed').map(item => item.psnr), 0);
      return <section className="m-stats" key={view.id} aria-label={t(view.title)}>
        <div><span>{t('Experiments')}</span><strong>{String(rows.length).padStart(2, '0')}</strong><small>{t('All experiments')}</small></div>
        <div><span>{t('Best PSNR')}</span><strong>{best ? best.toFixed(2) : '—'}</strong><small>dB</small></div>
        <div><span>{t('Needs a closer look')}</span><strong>{String(rows.filter(item => item.status === 'failed').length).padStart(2, '0')}</strong><small>{t('failed runs')}</small></div>
      </section>;
    }
    if (view.type === 'table') {
      const rows = (records as Experiment[]).filter(item => view.filter !== 'failed' || item.status === 'failed');
      if (view.groupBy === 'model') rows.sort((left, right) => left.model.localeCompare(right.model));
      return <section className="m-runs" key={view.id} aria-label={t(view.title)}><div className="m-section-heading"><div><span className="m-kicker">{t(view.filter === 'failed' ? 'FAILED RUNS' : 'ALL RUNS')}</span><h2>{t(view.title)}</h2></div><span className="m-counter">{rows.length}</span></div>
        {view.filter === 'failed' && <p className="m-inline-note"><span className="m-tiny-dot" />{t('Filtered: failed')}</p>}
        {rows.length === 0 && <div className="m-card"><p>{t('This view has no matching records.')}</p></div>}
        {rows.map((experiment, index) => <div key={experiment.id}>
          {view.groupBy === 'model' && (index === 0 || rows[index - 1].model !== experiment.model) && <h3 className="m-group-title">{experiment.model}</h3>}
          <button className={`m-run-card ${experiment.delta < (view.highlightBelow ?? -0.5) ? 'm-regression' : ''}`} aria-label={t('Inspect {id}', { id: experiment.id })} onClick={() => setSelected(experiment)}>
            <div className="m-run-top"><span className="m-record-id">{experiment.id}</span><span className={`m-status ${experiment.status}`}><i />{t(experiment.status[0].toUpperCase() + experiment.status.slice(1))}</span></div>
            <h3>{experiment.name}</h3><p>{experiment.model}<span>·</span>{experiment.date.slice(5).replace('-', '/')}</p>
            <div className="m-run-bottom"><div><strong>{experiment.status === 'running' ? '—' : experiment.psnr.toFixed(2)}</strong><span>PSNR / dB</span></div><span className={`m-delta ${experiment.delta < 0 ? 'negative' : 'positive'}`}>{experiment.delta < 0 ? <ArrowDownRight size={15} /> : <ArrowUpRight size={15} />}{experiment.status === 'running' ? '—' : `${experiment.delta > 0 ? '+' : ''}${experiment.delta.toFixed(2)}`}<small>dB</small></span><span className="m-run-chevron"><ChevronRight size={20} /></span></div>
          </button>
        </div>)}
        <p className="m-source-note"><GitCommitHorizontal size={15} />{t('Every run has a recorded commit')}</p>
      </section>;
    }
    if (view.type === 'bar-chart') {
      const rows = records as Experiment[];
      const models = [...new Set(rows.map(item => item.model))];
      return <section className="m-card" key={view.id}><div className="m-card-heading"><h2>{t(view.title)}</h2><Activity size={18} /></div><p className="m-card-description">{t('Best completed run · PSNR in dB')}</p>
        <div className="m-performance">{models.map((model, index) => { const value = Math.max(...rows.filter(item => item.model === model && item.status === 'passed').map(item => item.psnr), 0); return <div key={model}><div><span>{model}</span><strong>{value ? value.toFixed(2) : '—'}</strong></div><div className="m-bar-track"><i className={`m-bar m-bar-${index % 3}`} style={{ width: `${Math.max(0, value / 40 * 100)}%` }} /></div></div>; })}</div>
        <small className="m-footnote">{t('0–40 dB scale · running and failed runs excluded')}</small></section>;
    }
    if (view.type === 'timeline') return <section className="m-card" key={view.id}><div className="m-card-heading"><h2>{t(view.title)}</h2><Clock3 size={18} /></div><div className="m-deadlines">{[...records as Deadline[]].sort((left, right) => left.date.localeCompare(right.date)).map(item => <article key={item.id}><span className="m-date"><small>{new Date(`${item.date}T12:00:00Z`).toLocaleDateString(locale, { month: 'short', timeZone: 'UTC' })}</small><strong>{item.date.slice(8)}</strong></span><div><h3>{item.title}</h3><p>{t(item.category)}</p></div></article>)}</div></section>;
    return <section className="m-card" key={view.id}><div className="m-card-heading"><h2>{t(view.title)}</h2><BookOpen size={18} /></div><p className="m-card-description">{t('Bundled fictional papers; no live literature search.')}</p><div className="m-papers">{(records as Paper[]).map(item => <article key={item.id}><span className="m-round-icon"><BookOpen size={19} /></span><div><h3>{item.title}</h3><p>{item.authors} · {item.year}</p><span className="m-chip">{item.tag}</span></div></article>)}</div></section>;
  }

  let selectedCommit: Commit | undefined;
  if (selected) {
    try { const source = spec.sources.find(item => item.entity === 'commit'); if (source) selectedCommit = (readSource(spec, instance, dataset, source.id) as Commit[]).find(item => item.id === selected.commitId); } catch { /* A permission message is rendered below. */ }
  }
  const visibleViews = spec.views.filter(view => view.visible && (spec.layout !== 'focus' || view.type === 'metrics' || view.type === 'table'));

  return <div className="m-app">
    <header className="m-header"><button className="m-brand" aria-label={t('Home')} onClick={() => setTab('home')}><span className="m-brand-mark">u<span>ı</span></span><strong>udi<span> / mobile</span></strong></button><div className="m-header-actions"><LanguageSwitch /><button className="m-icon-button" aria-label={t('About & install')} onClick={() => setSheet('about')}><CircleHelp size={21} /></button></div></header>
    {installApp.offline && <div className="m-offline-banner" role="status"><WifiOff size={15} />{t('You are offline')}</div>}
    {installApp.updateAvailable && <div className="m-update-banner"><span>{t('Update available')}</span><button onClick={installApp.update}>{t('Update app')}<ArrowRight size={14} /></button></div>}
    <main className="m-main" ref={scrollRef} id="mobile-main">
      {tab === 'home' && <>
        <section className="m-hero"><div className="m-hero-top"><span className="m-kicker">{t('LOCAL BY DESIGN')}</span><span className="m-revision">r{revision}</span></div><h1>{t('Your research,')}<br /><em>{t('your rhythm.')}</em></h1><p>{t('A little less friction. A lot more you.')}</p><button className="m-hero-cta" onClick={() => setTab('shape')}><Sparkles size={17} />{t('Shape this space')}<ArrowUpRight size={18} /></button><div className="m-hero-orbit" aria-hidden="true"><i /><i /><i /><span>u</span></div></section>
        <div className="m-instance-strip"><span className="m-round-icon"><FlaskConical size={18} /></span><div><label htmlFor="mobile-dataset">{t('Local dataset')}</label><select id="mobile-dataset" aria-label={t('Local dataset')} value={dataset.id} onChange={event => bind(event.target.value)}>{datasets.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div><span className="m-fixture-tag">{t('Fictional data')}</span></div>
        <div className="m-views">{visibleViews.length ? visibleViews.map(renderView) : <div className="m-card m-empty"><Layers3 size={28} /><h2>{t('No visible views')}</h2><p>{t('Import a package with visible views to build your workspace.')}</p></div>}</div>
        {spec.actions.length > 0 && <section className="m-card m-action-card"><span className="m-kicker">{t('Preview first. Confirm once.')}</span><h2>{t('Actions, with your approval')}</h2><p>{t('Preview the exact note before a local write.')}</p>{spec.actions.map(item => <button className="m-button m-dark" key={item.id} onClick={() => startAction(item.id)}><Plus size={18} />{t(item.title)}</button>)}</section>}
        <p className="m-bottom-message"><ShieldCheck size={16} />{t('One definition. Your local data.')}</p>
      </>}

      {tab === 'shape' && <>
        <div className="m-page-intro"><span className="m-kicker">{t('YOUR INTENT → YOUR INTERFACE')}</span><h1>{t('Change one thing.')}<br /><em>{t('Make it yours.')}</em></h1><p>{t('Describe what you need. Review the definition before anything changes.')}</p></div>
        <form className="m-compose" onSubmit={event => { event.preventDefault(); generate(); }}><label htmlFor="mobile-intent"><Sparkles size={17} />{t('Describe an interface change')}</label><textarea id="mobile-intent" value={intent} onChange={event => setIntent(event.target.value)} placeholder={t('Describe a change…')} rows={4} maxLength={1000} /><div><span><i className="m-tiny-dot" />{t('Offline parser')}</span><button className="m-send" type="submit" aria-label={t('Propose interface change')} disabled={!intent.trim()}><ArrowUpRight size={23} /></button></div></form>
        <p className="m-planner-note"><Braces size={16} />{t('No model or live connector is running. These suggestions use a small, deterministic grammar.')}</p>
        {error && <div role="alert" className="m-error">{te(error)}</div>}
        {proposal && <section className="m-proposal" aria-label={t('Proposed revision')}><div className="m-card-heading"><span className="m-kicker">{t('Your next revision')}</span><span className="m-revision">r{revision + 1}</span></div><h2>{t('Review the change')}</h2><p>{t(proposal.summary)}</p><details><summary>{t('Definition changes')}<Braces size={15} /></summary><pre>{JSON.stringify(proposal.operations, null, 2)}</pre></details>{proposal.additions.length > 0 ? <div className="m-permission-callout"><LockKeyhole size={17} /><span>{t('New request: {capabilities}. Grant separately in Data & access.', { capabilities: proposal.additions.join(', ') })}</span></div> : <p className="m-safe-label"><ShieldCheck size={15} />{t('No additional permissions')}</p>}<button className="m-button m-dark" onClick={apply}><Check size={18} />{t('Apply change')}</button><button className="m-button m-plain" onClick={() => setProposal(null)}>{t('Discard')}</button><small>{t('Nothing changes until you apply.')}</small></section>}
        <div className="m-section-heading"><h2>{t('Supported suggestions')}</h2><span className="m-counter">{suggestedIntents.length}</span></div><div className="m-suggestions">{suggestedIntents.map((suggestion, index) => <button key={suggestion} onClick={() => generate(t(suggestion))}><span className="m-suggestion-index">0{index + 1}</span><span>{t(suggestion)}</span><ArrowUpRight size={17} /></button>)}</div>
        <div className="m-revision-bar"><span>{t('Revision {revision}', { revision })} · {spec.views.length} {t('view definitions')}</span><button disabled={!history.length} onClick={undo}><RotateCcw size={15} />{t('Undo')}</button></div>
      </>}

      {tab === 'data' && <>
        <div className="m-page-intro"><span className="m-kicker">{t('LOCAL BY DESIGN')}</span><h1>{t('Data on your terms.')}</h1><p>{t('Same package. Two separate worlds.')}</p></div>
        <section className="m-card"><div className="m-card-heading"><h2>{t('Choose your local instance')}</h2><Database size={18} /></div><p>{t('Switch datasets without changing your interface definition. Grants and notes belong to each instance.')}</p><div className="m-dataset-options" role="group" aria-label={t('Local dataset')}>{datasets.map(item => <button key={item.id} aria-pressed={state.datasetId === item.id} onClick={() => bind(item.id)}><span className="m-round-icon"><FlaskConical size={18} /></span><span><strong>{item.name}</strong><small>{item.project}</small></span>{state.datasetId === item.id ? <span className="m-option-check"><Check size={15} /></span> : <span className="m-option-empty" />}</button>)}</div></section>
        <section className="m-card"><div className="m-card-heading"><div><span className="m-kicker">{dataset.name}</span><h2>{t('Requested access')}</h2></div><ShieldCheck size={21} /></div><p>{t('Requests are part of a package. Grants belong to an instance.')}</p><div className="m-permissions">{spec.capabilities.map(capability => <div className="m-permission-row" key={capability}><div><strong>{t(capabilityLabels[capability])}</strong><code>{capability}</code><small>{t(capability === 'notes.write' ? 'Write access' : 'Read access')} · {t('Local only')}</small></div><button role="switch" className="m-toggle" aria-label={t(capabilityLabels[capability])} aria-checked={instance.grants.includes(capability)} onClick={() => toggle(capability)}><span /></button></div>)}</div><p className="m-info-note"><LockKeyhole size={16} />{t('Grants apply to {dataset} only. A write also requires a separate action preview and confirmation.', { dataset: dataset.name })}</p></section>
        <section className="m-card"><div className="m-card-heading"><h2>{t('Local review notes')}</h2><span className="m-counter">{instance.notes.length}</span></div>{instance.notes.length ? instance.notes.map((note, index) => <article className="m-note" key={index}><span>{String(index + 1).padStart(2, '0')} · {t('Saved locally')}</span><pre>{note}</pre></article>) : <p>{t('No notes yet. Add a review-note action in Shape, grant notes.write here, then preview the exact write from Home.')}</p>}</section>
        <p className="m-info-note m-outside"><CircleHelp size={17} />{t('These are in-browser demonstration controls, not an authentication boundary for real services. No external accounts are connected.')}</p>
      </>}

      {tab === 'share' && <>
        <div className="m-page-intro"><span className="m-kicker">{t('PORTABLE BY DEFINITION')}</span><h1>{t('Your definition travels.')}<br /><em>{t('Your data stays here.')}</em></h1><p>{t('One portable package. Independent local instances.')}</p></div>
        <section className="m-package-card"><span className="m-package-symbol"><Layers3 size={42} strokeWidth={1.4} /></span><span className="m-kicker">UDI CORE {spec.specVersion}</span><h2>{t(spec.metadata.title)}</h2><p>{t(spec.metadata.description)}</p><div className="m-package-meta"><span>v{spec.metadata.version}</span><span>{t('{count} views', { count: spec.views.length })}</span><span>r{revision}</span></div><button className="m-button m-dark" onClick={() => setSheet('export')}><ArrowDownToLine size={18} />{t('Export package')}</button></section>
        <div className="m-share-actions"><button className="m-button" onClick={() => { setSheet('import'); setIncoming(null); setImportError(''); }}><Upload size={18} />{t('Import package')}</button><button className="m-button" onClick={() => { commit(forkPackage(spec), 'Forked the interface package.'); setToast('Created a local fork. Bindings were preserved.'); }}><GitFork size={18} />{t('Fork')}</button></div>
        <section className="m-card m-package-boundary"><h2>{t('Inside the package')}</h2>{['Views, layout & filters', 'Capability requests', 'Action definitions'].map(text => <p key={text}><Check size={16} />{t(text)}</p>)}<div /><h2>{t('Stays in this browser')}</h2>{['Records & source bindings', 'Permissions & local notes', 'Revision history & activity'].map(text => <p key={text}><LockKeyhole size={15} />{t(text)}</p>)}</section>
        <button className="m-inspect-link" onClick={() => setSheet('spec')}><FileJson2 size={19} /><span><strong>{t('Inspect definition')}</strong><small>{spec.metadata.id}.udi.json</small></span><ChevronRight size={18} /></button>
        <p className="m-info-note m-outside"><ShieldCheck size={17} />{t('Review names and descriptions before sharing. Structured separation does not guarantee that free text contains no private information.')}</p>
      </>}

      {tab === 'activity' && <>
        <div className="m-page-intro"><span className="m-kicker">{t('Stored in this browser only')}</span><h1>{t('A trace of your choices.')}</h1><p>{t('Your revisions, bindings, and approvals, kept in one local timeline.')}</p></div>
        <div className="m-activity-summary"><span className="m-round-icon"><Activity size={22} /></span><div><strong>{audit.length}</strong><span>{t('Instance activity')}</span></div><small>{t('Revision {revision}', { revision })}</small></div>
        {audit.length === 0 ? <div className="m-card m-empty"><span className="m-round-icon"><Activity size={28} /></span><h2>{t('No activity yet')}</h2><p>{t('Start with a suggestion in Shape. Your first change will appear here.')}</p><button className="m-button" onClick={() => setTab('shape')}>{t('Shape this space')}<ArrowRight size={16} /></button></div> : <section className="m-timeline" aria-label={t('Instance activity')}>{[...audit].reverse().map(event => <article key={event.id}><span className={`m-event-icon m-event-${event.kind}`}>{event.kind === 'permission' ? <ShieldCheck size={17} /> : event.kind === 'binding' ? <Database size={17} /> : event.kind === 'action' ? <CheckCheck size={17} /> : event.kind === 'package' ? <Layers3 size={17} /> : <Braces size={17} />}</span><div><div><strong>{t(event.kind)}</strong><time dateTime={event.time}>{new Date(event.time).toLocaleString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time></div><p>{t(event.message)}</p></div></article>)}</section>}
        <p className="m-footnote m-center">{t('Stored locally · last 100 events · editable browser state')}</p>
      </>}
    </main>
    <nav className="m-tabbar" aria-label={t('Phone navigation')}>{nav.map(({ id, title, icon: Icon }) => <button key={id} aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)}><span><Icon size={21} strokeWidth={tab === id ? 2.2 : 1.7} />{id === 'shape' && <i />}</span><strong>{t(title)}</strong></button>)}</nav>

    {toast && <div className="m-toast" role="status"><Check size={18} /><p>{t(toast) === toast ? te(toast) : t(toast)}</p><button aria-label={t('Dismiss notification')} onClick={() => setToast('')}><X size={17} /></button></div>}

    {selected && <BottomSheet title={t('Recorded evidence')} onClose={() => setSelected(null)}><span className="m-kicker">{t('EXPERIMENT PROVENANCE')}</span><h2 className="m-sheet-title">{selected.name}</h2><p>{selected.id} · {selected.model} · {selected.date}</p><div className="m-detail-metrics"><div><small>PSNR / dB</small><strong>{selected.status === 'running' ? '—' : selected.psnr.toFixed(2)}</strong></div><div><small>{t('Compared with baseline')}</small><strong className={selected.delta < 0 ? 'negative' : 'positive'}>{selected.status === 'running' ? '—' : `${selected.delta > 0 ? '+' : ''}${selected.delta.toFixed(2)}`}</strong></div></div><div className="m-provenance"><GitCommitHorizontal size={22} /><div><span className="m-kicker">{t('Recorded commit ID')}</span>{selectedCommit ? <><code>{selectedCommit.id}</code><h3>{selectedCommit.title}</h3>{selectedCommit.files.map(file => <span key={file} className="m-file-tag">{file}</span>)}</> : <p>{t('Commit access is unavailable. Review permissions in Data & access.')}</p>}</div></div><p className="m-info-note"><CircleHelp size={17} />{t('This is a join on the run’s recorded commit ID. It does not establish what caused a regression.')}</p><p className="m-footnote">{t('Demo records, not live research results.')}</p></BottomSheet>}

    {action && <BottomSheet title={t('Review local write')} onClose={() => setAction(null)}><span className="m-kicker">{t('One confirmed write')}</span><h2 className="m-sheet-title">{t('Create a review note')}</h2><p>{t('The exact note below will be added to this dataset only.')}</p><span className="m-chip">{dataset.name} · r{revision}</span><pre className="m-action-preview">{action.content}</pre><p className="m-info-note"><LockKeyhole size={16} />{t('Requested: notes.write · Scope: {instance} · Revision: {revision}', { instance: instance.id, revision })}</p><button className="m-button m-dark" onClick={confirmAction}><CheckCheck size={18} />{t('Approve & create local note')}</button><button className="m-button m-plain" onClick={() => setAction(null)}>{t('Cancel')}</button></BottomSheet>}

    {sheet === 'about' && <BottomSheet title={t('About & install')} onClose={() => setSheet(null)}><span className="m-about-icon"><Smartphone size={30} strokeWidth={1.5} /></span><span className="m-kicker">USER-DEFINED INTERFACE</span><h2 className="m-sheet-title">{t('Your interface, in your pocket.')}</h2><p>{t('An installable web app demo of User-Defined Interface. Same definition and runtime as the desktop prototype, designed for your phone.')}</p><div className="m-install-card"><div className="m-card-heading"><h3>{t(installApp.installed ? 'Installed on this device' : 'Install on this device')}</h3>{installApp.installed ? <Check size={20} /> : <Download size={20} />}</div>{installApp.canInstall && <button className="m-button m-dark" onClick={() => { void installApp.install().catch(() => setToast('Open in your browser, then use “Add to Home Screen” or “Install app”. On iPhone, open in Safari and choose Share → Add to Home Screen.')); }}><Plus size={17} />{t('Install on this device')}</button>}<p>{t('Open in your browser, then use “Add to Home Screen” or “Install app”. On iPhone, open in Safari and choose Share → Add to Home Screen.')}</p><small><span className="m-tiny-dot" />{t(installApp.offline ? 'You are offline' : installApp.offlineReady ? 'Ready for offline use' : 'Preparing offline access')}</small></div><p className="m-footnote">{t('This is a web app demo, with no App Store or Play Store release.')}</p><h3>{t('A small, honest prototype.')}</h3><p>{t('The planner is a bounded offline parser; datasets and papers are fictional. No external accounts, model calls, or background workflows are connected. Capability checks demonstrate the architecture and do not secure real services.')}</p><p>{t('Browser data can be cleared by your device. Export your definition to keep a portable copy.')}</p><p>{t('Installed and browser copies may use separate local storage. Export and import transfer the definition only.')}</p><div className="m-about-links"><a href={`./?lang=${locale}`}><Home size={17} />{t('Desktop workspace')}<ArrowUpRight size={16} /></a><a href="https://github.com/deepbule0/UDI" target="_blank" rel="noreferrer"><Braces size={17} />{t('Open source on GitHub')}<ArrowUpRight size={16} /></a><button onClick={() => setSheet('reset')}><RotateCcw size={17} />{t('Reset demo')}<ChevronRight size={16} /></button></div></BottomSheet>}

    {sheet === 'export' && <BottomSheet title={t('Export interface package')} onClose={() => setSheet(null)}><span className="m-about-icon"><Layers3 size={30} /></span><h2 className="m-sheet-title">{t('Review this export')}</h2><p>{t('Export contains the definition only. Review names and descriptions for private information before sharing.')}</p><div className="m-export-meta"><strong>{t(spec.metadata.title)}</strong><code>{spec.metadata.id}.udi.json</code><span>UDI {spec.specVersion} · v{spec.metadata.version}</span></div><ul className="m-export-list"><li><Check size={17} />{t('Views, filters, layout, and action definitions')}</li><li><Check size={17} />{t('Logical sources and capability requests')}</li><li><LockKeyhole size={17} />{t('Record payloads, grants, and bindings excluded')}</li><li><LockKeyhole size={17} />{t('Notes and activity history excluded')}</li></ul><button className="m-button m-dark" onClick={download}><Download size={18} />{t('Download .udi.json')}</button></BottomSheet>}

    {sheet === 'import' && <BottomSheet title={t('Import package')} onClose={() => setSheet(null)}><span className="m-kicker">{t('Same definition. Your instance.')}</span><h2 className="m-sheet-title">{t('Install an interface package')}</h2><p>{t('Import replaces the definition and clears grants for both local datasets. Your notes stay local.')}</p><input className="m-visually-hidden" type="file" accept=".json,.udi.json,application/json" ref={uploadRef} aria-label={t('Package file')} onChange={event => { void chooseFile(event.target.files?.[0]); event.target.value = ''; }} /><button className="m-button" onClick={() => uploadRef.current?.click()}><Upload size={18} />{t('Choose a .udi.json file')}</button><label className="m-input-label" htmlFor="mobile-package">{t('Paste package JSON')}</label><textarea id="mobile-package" className="m-json-input" value={importText} onChange={event => { setImportText(event.target.value); setIncoming(null); setImportError(''); }} placeholder="{ … }" spellCheck={false} />{importError && <p role="alert" className="m-error">{te(importError)}</p>}{incoming ? <div className="m-import-review"><span><ShieldCheck size={18} />{t('Validated. Ready to review.')}</span><h3>{t(incoming.metadata.title)}</h3><p>{t('{views} views · {actions} actions', { views: incoming.views.length, actions: incoming.actions.length })}</p><p>{t('Requests: {capabilities}', { capabilities: incoming.capabilities.join(', ') })}</p><button className="m-button m-dark" onClick={installPackage}>{t('Install & review data access')}<ArrowRight size={16} /></button></div> : <button className="m-button m-dark" disabled={!importText.trim()} onClick={checkImport}><ShieldCheck size={17} />{t('Validate package')}</button>}</BottomSheet>}

    {sheet === 'spec' && <BottomSheet title={t('Inspect definition')} onClose={() => setSheet(null)}><span className="m-valid-label"><ShieldCheck size={15} />{t('Schema validated')}</span><h2 className="m-sheet-title">{t(spec.metadata.title)}</h2><p>{spec.metadata.id}.udi.json</p><pre className="m-spec-json" tabIndex={0}>{exportPackage(spec)}</pre></BottomSheet>}
    {sheet === 'reset' && <BottomSheet title={t('Reset the local demo')} onClose={() => setSheet(null)}><h2 className="m-sheet-title">{t('Start with a fresh workspace?')}</h2><p>{t('This clears this prototype’s revisions, local notes, grants, and activity in this browser. Download your package first if you want to keep your changes.')}</p><p>{t('This also resets the desktop demo on this origin. Export your package first to keep your interface changes.')}</p><button className="m-button m-danger" onClick={() => { setState(freshState()); setProposal(null); setError(''); setIntent(''); setAction(null); setSelected(null); setSheet(null); setTab('home'); setToast('Demo reset.'); }}>{t('Reset demo and clear local state')}</button><button className="m-button m-plain" onClick={() => setSheet(null)}>{t('Cancel')}</button></BottomSheet>}
  </div>;
}
