import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Activity, ArrowDownToLine, ArrowLeft, ArrowRight, ArrowUpRight, Braces, Check, CheckCheck, ChevronDown, ChevronRight, CircleHelp, Database, FileJson2, FlaskConical, GitFork, Layers3, LayoutDashboard, LockKeyhole, PanelRightClose, Plus, RotateCcw, Send, ShieldCheck, Sparkles, Upload, X } from 'lucide-react';
import { capabilityLabels, exportPackage, forkPackage, importPackage, initialSpec, validateSpec } from './core/spec';
import { applyProposal, planIntent, suggestedIntents } from './core/planner';
import { proposalFromModel } from './core/model-planner';
import { executeAction, prepareAction, type PreparedAction } from './core/runtime';
import { createInstances, datasets } from './data/fixtures';
import type { AuditEvent, Capability, Experiment, Instance, Proposal, UDISpec } from './core/types';
import Workspace, { ExperimentDetail } from './Workspace';
import { LanguageSwitch, useI18n } from './i18n';

type Page = 'workspace' | 'access' | 'package' | 'activity';
interface SavedState { spec: UDISpec; revision: number; history: UDISpec[]; instances: Record<string, Instance>; datasetId: string; audit: AuditEvent[] }
const storageKey = 'udi-studio:0.1';
function fresh(): SavedState { return { spec: initialSpec(), revision: 1, history: [], instances: createInstances(), datasetId: 'aurora', audit: [] }; }
function load(): SavedState {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw || raw.length > 300_000) return fresh();
    const saved = JSON.parse(raw) as SavedState;
    if (!validateSpec(saved.spec).valid || !Number.isSafeInteger(saved.revision) || saved.revision < 1 || !datasets.some(d => d.id === saved.datasetId)) return fresh();
    const defaults = createInstances();
    for (const key of Object.keys(defaults)) {
      const item = saved.instances?.[key];
      if (!item || item.id !== defaults[key].id || item.datasetId !== key || !Array.isArray(item.grants) || !Array.isArray(item.notes)) return fresh();
      defaults[key].grants = item.grants.filter(c => Object.hasOwn(capabilityLabels, c));
      defaults[key].notes = item.notes.filter(n => typeof n === 'string').slice(-30);
    }
    return { ...saved, instances: defaults, history: (saved.history ?? []).filter(s => validateSpec(s).valid).slice(-20), audit: (saved.audit ?? []).filter(a => typeof a.message === 'string' && typeof a.time === 'string').slice(-100) };
  } catch { return fresh(); }
}
function Modal({ children, title, onClose, wide = false }: { children: ReactNode; title: string; onClose: () => void; wide?: boolean }) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} className={`modal ${wide ? 'wide' : ''}`} onCancel={onClose} aria-label={title}><div className="modal-top"><span>{title}</span><button className="icon-button" aria-label={t("Close dialog")} onClick={onClose}><X size={18} /></button></div>{children}</dialog>;
}

export default function App() {
  const { locale, t, te } = useI18n();
  const suggestions = suggestedIntents.map(s => t(s));
  const [state, setState] = useState<SavedState>(load);
  const [page, setPage] = useState<Page>('workspace');
  const [intent, setIntent] = useState('');
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [modal, setModal] = useState<'export' | 'import' | 'about' | 'reset' | null>(null);
  const [importText, setImportText] = useState('');
  const [incoming, setIncoming] = useState<UDISpec | null>(null);
  const [importError, setImportError] = useState('');
  const [selected, setSelected] = useState<Experiment | null>(null);
  const [action, setAction] = useState<PreparedAction | null>(null);
  const [editorOpen, setEditorOpen] = useState(true);
  const [plannerMode, setPlannerMode] = useState('offline');
  const [planning, setPlanning] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const { spec, revision, history, audit } = state;
  const dataset = datasets.find(d => d.id === state.datasetId)!;
  const instance = state.instances[state.datasetId];
  const notify = (message: string) => setToast(message);
  const log = (kind: AuditEvent['kind'], message: string): AuditEvent => ({ id: crypto.randomUUID(), time: new Date().toISOString(), kind, message });
  useEffect(() => { try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { setToast('Browser storage is unavailable or full. This session still works; export your package to save it.'); } }, [state]);
  useEffect(() => { if (toast) { const timer = setTimeout(() => setToast(''), 5500); return () => clearTimeout(timer); } }, [toast]);

  function commit(next: UDISpec, message: string, resetGrants = false) {
    setState(s => ({ ...s, spec: next, revision: s.revision + 1, history: [...s.history, s.spec].slice(-20),
      instances: resetGrants ? Object.fromEntries(Object.entries(s.instances).map(([k, i]) => [k, { ...i, grants: [] }])) : s.instances,
      audit: [...s.audit, log('revision', message)].slice(-100) }));
    setProposal(null); setError(''); setAction(null); setSelected(null);
  }
  async function generate(text = intent) {
    if (planning) return;
    setPlanning(true); setError('');
    try {
      let next: Proposal;
      if (plannerMode === 'ollama') {
        const response = await fetch('/api/plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ intent: text, spec, revision }), signal: AbortSignal.timeout(50_000) });
        const output = await response.json();
        if (!response.ok) throw new Error(output.error ?? 'Local planner unavailable. Start npm run agent; see docs/AGENT.md.');
        next = proposalFromModel(output, spec, revision);
      } else next = planIntent(text, spec, revision);
      setProposal(next); setIntent(text); setError(''); setEditorOpen(true);
    }
    catch (e) { setError((e as Error).message); setProposal(null); }
    finally { setPlanning(false); }
  }
  function apply() {
    if (!proposal) return;
    try { const next = applyProposal(spec, revision, proposal); commit(next, proposal.summary); notify('Revision applied. Your data bindings stayed local.'); }
    catch (e) { setError((e as Error).message); }
  }
  function undo() {
    if (!history.length) return;
    setState(s => ({ ...s, spec: s.history[s.history.length - 1], history: s.history.slice(0, -1), revision: s.revision + 1, audit: [...s.audit, log('revision', 'Restored the previous interface specification.')].slice(-100) }));
    setProposal(null); setAction(null); setSelected(null); setError(''); notify('Previous interface restored. Revision counter advanced.');
  }
  function bind(id: string) {
    setState(s => ({ ...s, datasetId: id, audit: [...s.audit, log('binding', `Bound the same package to ${datasets.find(d => d.id === id)!.name}.`)].slice(-100) }));
    setSelected(null); setAction(null); notify('Same interface. A different local dataset.');
  }
  function toggle(capability: Capability) {
    const granted = instance.grants.includes(capability);
    setState(s => ({ ...s, instances: { ...s.instances, [s.datasetId]: { ...s.instances[s.datasetId], grants: granted ? s.instances[s.datasetId].grants.filter(c => c !== capability) : [...s.instances[s.datasetId].grants, capability] } }, audit: [...s.audit, log('permission', `${granted ? 'Revoked' : 'Granted'} ${capability} for ${dataset.name}.`)].slice(-100) }));
    setAction(null);
  }
  function download() {
    const content = exportPackage(spec);
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `${spec.metadata.id}.udi.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setState(s => ({ ...s, audit: [...s.audit, log('package', 'Exported the validated interface specification; instance state was excluded.')].slice(-100) }));
    setModal(null); notify('Interface package downloaded. Review its free-text fields before publishing.');
  }
  function checkImport() { try { setIncoming(importPackage(importText)); setImportError(''); } catch (e) { setImportError((e as Error).message); setIncoming(null); } }
  function startAction(id: string) { try { setAction(prepareAction(spec, revision, instance, dataset, id)); } catch (e) { notify((e as Error).message); setPage('access'); } }
  const nav: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [{ id: 'workspace', label: 'Workspace', icon: LayoutDashboard }, { id: 'access', label: 'Data & access', icon: Database }, { id: 'package', label: 'Interface package', icon: Layers3 }, { id: 'activity', label: 'Activity', icon: Activity }];

  return <div className={`app-shell ${editorOpen ? '' : 'editor-collapsed'}`}>
    <aside className="sidebar"><a className="brand" href="#" onClick={e => { e.preventDefault(); setPage('workspace'); }}><span className="brand-mark">{t("u")}<span>{t("ı")}</span></span><strong>{t("udi")}<span>{t("studio")}</span></strong></a>
      <div className="workspace-label"><span className="workspace-avatar"><FlaskConical size={18} /></span><div><b>{t("Personal workspace")}</b><small>{t("Local prototype")}</small></div></div>
      <span className="nav-heading">{t("BUILD AROUND YOU")}</span><nav aria-label={t("Main navigation")}>{nav.map(({ id, label, icon: Icon }) => <button key={id} className={page === id ? 'active' : ''} onClick={() => setPage(id)}><Icon size={17} />{t(label)}{page === id && <i />}{id === 'activity' && audit.length > 0 && <span className="nav-count">{audit.length}</span>}</button>)}</nav>
      <div className="sidebar-concept"><div className="orbit-symbol"><span /><span /><span /><span /></div><h3>{t("Your intent.")}<br />{t("Your interface.")}</h3><p>{t("The software should")}<br />{t("take your shape.")}</p><button onClick={() => setModal('about')}>{t("Meet UDI ")}<ArrowUpRight size={14} /></button></div>
      <div className="sidebar-bottom"><button onClick={() => setModal('about')}><CircleHelp size={16} />{t(" About this prototype")}</button><button onClick={() => setModal('reset')}><RotateCcw size={15} />{t(" Reset demo")}</button><span><i className="dot green" />{t(" UDI Core 0.1")}</span></div>
    </aside>

    <header className="topbar"><div><span>{t("Workspace")}</span><ChevronRight size={13} /><b>{t(spec.metadata.title)}</b></div><div><LanguageSwitch /><span className="offline-badge"><i className="dot green" />{t(" Offline demo")}</span><button className="icon-button mobile-edit" aria-label={t("Toggle intent editor")} onClick={() => setEditorOpen(v => !v)}><Sparkles size={18} /></button><span className="local-avatar" title={t("Data stays in this browser")}>{t("L")}</span></div></header>

    <main className="main-content"><div className="page-heading"><div><span className="eyebrow">{t("SOFTWARE, DEFINED BY YOU")}</span><h1>{t(page === 'workspace' ? spec.metadata.title : page === 'access' ? 'Your data. Your rules.' : page === 'package' ? 'An interface worth sharing.' : 'Every change, in the open.')}</h1><p>{t(page === 'workspace' ? 'A workspace that works the way you think.' : page === 'access' ? 'Bind the package to a dataset. Decide what it can access.' : page === 'package' ? 'Take the definition with you. Keep the instance here.' : 'A local record of revisions, permissions, and actions.')}</p></div>{page === 'workspace' && <button className="button subtle inspect-button" onClick={() => setPage('package')}><Braces size={15} />{t(" Inspect spec")}</button>}</div>

      <div className="instance-bar"><div><span className="dataset-icon"><Database size={16} /></span><div><small>{t("CONNECTED INSTANCE")}</small><label className="sr-only" htmlFor="dataset">{t("Local dataset")}</label><select id="dataset" aria-label={t("Local dataset")} value={dataset.id} onChange={e => bind(e.target.value)}>{datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div><span className="instance-divider" /><span className="project-name">{dataset.project}</span></div><span className="synthetic-label">{t("Fictional data ")}<CircleHelp size={13} /></span></div>

      {page === 'workspace' && <><Workspace spec={spec} instance={instance} dataset={dataset} onAccess={() => setPage('access')} onSelect={setSelected} />{spec.actions.length > 0 && <section className="panel action-panel"><div><h3>{t("Actions, with your approval")}</h3><p>{t("Preview the exact note before a local write.")}</p></div>{spec.actions.map(a => <button key={a.id} className="button dark" onClick={() => startAction(a.id)}><Plus size={15} />{t(a.title)}</button>)}</section>}<div className="workspace-footnote"><ShieldCheck size={14} /><span>{t("Interface definition is shareable. Data bindings and grants stay in this browser.")}</span></div></>}

      {page === 'access' && <div className="access-page"><section className="panel"><div className="panel-heading"><div><h3>{t("Local source bindings")}</h3><p>{t("Logical source names are resolved by this instance.")}</p></div><Database size={18} /></div>{spec.sources.map(s => <div className="source-row" key={s.id}><span className="source-icon">{s.entity === 'experiment' ? <FlaskConical size={18} /> : s.entity === 'paper' ? <FileJson2 size={18} /> : <Database size={18} />}</span><div><b>{s.id}</b><small>{t('{dataset} / {entity} records', { dataset: dataset.name, entity: t(s.entity) })}</small></div><span className="source-tag">{t("Local fixture")}</span></div>)}</section><section className="panel"><div className="panel-heading"><div><h3>{t("Requested capabilities")}</h3><p>{t("Requests are part of a package. Grants belong to an instance.")}</p></div><ShieldCheck size={18} /></div>{spec.capabilities.map(c => <div className="permission-row" key={c}><div><b>{t(capabilityLabels[c])}</b><code>{c}</code></div><button className={`toggle ${instance.grants.includes(c) ? 'on' : ''}`} role="switch" aria-checked={instance.grants.includes(c)} aria-label={t(capabilityLabels[c])} onClick={() => toggle(c)}><span /></button></div>)}<p className="access-note"><LockKeyhole size={16} />{t('Grants apply to {dataset} only. A write also requires a separate action preview and confirmation.', { dataset: dataset.name })}</p></section>{instance.notes.length > 0 && <section className="panel"><div className="panel-heading"><h3>{t("Local review notes")}</h3><span className="count-badge">{instance.notes.length}</span></div>{instance.notes.map((note, i) => <pre className="saved-note" key={i}>{note}</pre>)}</section>}<p className="notice">{t("These are in-browser demonstration controls, not an authentication boundary for real services. No external accounts are connected.")}</p></div>}

      {page === 'package' && <div className="package-page"><section className="package-banner"><span className="package-art"><Layers3 size={38} strokeWidth={1.3} /></span><div><span className="eyebrow">{t("PORTABLE BY DEFINITION")}</span><h2>{t(spec.metadata.title)}</h2><p>{t(spec.metadata.description)}</p><div className="package-tags"><span>{t("UDI Core ")}{spec.specVersion}</span><span>{t("v")}{spec.metadata.version}</span><span>{t('{count} views', { count: spec.views.length })}</span></div></div></section><div className="package-actions"><button className="button dark" onClick={() => setModal('export')}><ArrowDownToLine size={15} />{t("Export package")}</button><button className="button" onClick={() => { commit(forkPackage(spec), 'Forked the interface package.'); notify('Created a local fork. Bindings were preserved.'); }}><GitFork size={15} />{t("Fork")}</button><button className="button" onClick={() => { setModal('import'); setIncoming(null); setImportError(''); }}><Upload size={15} />{t("Import package")}</button></div><section className="panel spec-panel"><div className="panel-heading"><h3><FileJson2 size={17} />{spec.metadata.id}{t(".udi.json")}</h3><span className="valid-badge"><Check size={13} />{t(" Schema validated")}</span></div><pre tabIndex={0}>{exportPackage(spec)}</pre></section><p className="notice"><ShieldCheck size={16} />{t(" The package has no record payloads, binding paths, grants, or audit history. Free-text titles and descriptions still need human review before publication.")}</p></div>}

      {page === 'activity' && <section className="panel activity-panel"><div className="panel-heading"><div><h3>{t("Instance activity")}</h3><p>{t("Stored locally · last 100 events · editable browser state")}</p></div><Activity size={18} /></div>{audit.length === 0 ? <div className="empty-state"><Activity size={30} /><h3>{t("A clean slate.")}</h3><p>{t("Apply an interface change or switch the dataset to start a local activity history.")}</p><button className="button" onClick={() => { setPage('workspace'); generate(suggestions[0]); }}>{t("Try your first revision ")}<ArrowRight size={14} /></button></div> : [...audit].reverse().map(a => <div className="audit-row" key={a.id}><span className={`audit-dot ${a.kind}`} /><div><small>{t(a.kind)}</small><p>{t(a.message)}</p></div><time>{new Date(a.time).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</time></div>)}</section>}

      <footer className="main-footer"><span>{t("USER-DEFINED INTERFACE")}</span><span>{t("An open idea. A working prototype.")}</span><button onClick={() => setModal('about')}>{t("How it works ")}<ArrowUpRight size={12} /></button></footer>
    </main>

    {editorOpen && <aside className="intent-panel"><div className="intent-heading"><div><Sparkles size={17} /><b>{t("Shape your workspace")}</b></div><button className="icon-button" aria-label={t("Close intent editor")} onClick={() => setEditorOpen(false)}><PanelRightClose size={17} /></button></div><div className="intent-body"><span className="agent-label"><i className="dot green" />{t(" YOUR INTENT → YOUR INTERFACE")}</span><h2>{t("What would make")}<br />{t("this work better for you?")}</h2><p className="intent-intro">{t("Start with a small change.")}<br />{t("The interface follows your lead.")}</p><div className="editor-message"><span className="sparkle-avatar"><Sparkles size={16} /></span><p>{t("Your research cockpit is ready. Try focusing on failed runs, or bring your paper library into view.")}</p></div><div className="suggestion-label">{t("A FEW THINGS TO TRY")}</div><div className="suggestions">{suggestions.map((s, i) => <button key={s} onClick={() => generate(s)}><span>{i === 0 ? <FlaskConical size={14} /> : i === 2 ? <Plus size={14} /> : <ArrowUpRight size={14} />}{s}</span><ChevronRight size={13} /></button>)}</div>
      {error && <div role="alert" className="editor-error">{te(error)}</div>}
      {proposal && <section className="proposal" aria-label={t("Proposed revision")}><div><span className="proposal-icon"><Braces size={15} /></span><b>{t("Review the change")}</b><span>{t("r")}{revision + 1}</span></div><p>{t(proposal.summary)}</p><pre>{JSON.stringify(proposal.operations, null, 2)}</pre>{proposal.additions.length > 0 ? <p className="new-permission"><LockKeyhole size={14} />{t('New request: {capabilities}. Grant separately in Data & access.', { capabilities: proposal.additions.join(', ') })}</p> : <p className="no-escalation"><CheckCheck size={14} />{t(" No additional permissions")}</p>}<div className="proposal-buttons"><button className="button dark" onClick={apply}>{t("Apply change ")}<Check size={14} /></button><button className="text-button" onClick={() => setProposal(null)}>{t("Discard")}</button></div></section>}
      <div className="editor-principle"><span><ShieldCheck size={16} /></span><div><b>{t("You stay in control.")}</b><p>{t("Changes are proposed first.")}<br />{t("Data access is always a separate choice.")}</p></div></div></div>
      <div className="intent-composer"><form onSubmit={e => { e.preventDefault(); generate(); }}><label htmlFor="intent-input" className="sr-only">{t("Describe an interface change")}</label><textarea id="intent-input" placeholder={t("Describe a change…")} value={intent} onChange={e => setIntent(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generate(); } }} rows={2} maxLength={300} /><div><label className="planner-mode"><span className="sr-only">{t("Planner mode")}</span><select aria-label={t("Planner mode")} value={plannerMode} onChange={e => setPlannerMode(e.target.value)} disabled={planning}><option value="offline">{t("Offline parser")}</option>{import.meta.env.DEV && <option value="ollama">{t("Local model · Ollama")}</option>}</select></label><button aria-label={t("Propose interface change")} type="submit" disabled={!intent.trim() || planning}><ArrowRight size={17} /></button></div></form><p>{t(planning ? "Generating a proposal…" : plannerMode === "offline" ? "Limited grammar · no LLM · no API key" : "Local model · definition only · review before applying")}</p></div><div className="revision-bar"><span><i className="dot green" />{t('Revision {revision}', { revision })}</span><button onClick={undo} disabled={!history.length}><RotateCcw size={13} />{t("Undo")}</button></div>
    </aside>}
    {!editorOpen && <button className="editor-reopen button dark" onClick={() => setEditorOpen(true)}><Sparkles size={16} />{t("Shape workspace")}</button>}

    {toast && <div className="toast" role="status"><Check size={16} />{t(toast)}<button className="icon-button" aria-label={t("Dismiss notification")} onClick={() => setToast('')}><X size={14} /></button></div>}

    {selected && <Modal title={t("Recorded evidence")} onClose={() => setSelected(null)}><ExperimentDetail experiment={selected} spec={spec} instance={instance} dataset={dataset} /></Modal>}
    {action && <Modal title={t("Review local write")} onClose={() => setAction(null)}><div className="modal-content"><span className="eyebrow">{t("APPROVE THE EXACT ACTION")}</span><h2>{t("Create a review note")}</h2><p>{t('This appends one note to the {dataset} instance in this browser.', { dataset: dataset.name })}</p><pre className="action-preview">{action.content}</pre><p className="notice">{t('Requested: notes.write · Scope: {instance} · Revision: {revision}', { instance: instance.id, revision })}</p><button className="button dark" onClick={() => { try { const next = executeAction(spec, revision, instance, dataset, action, true); setState(s => ({ ...s, instances: { ...s.instances, [s.datasetId]: next }, audit: [...s.audit, log('action', `Created one confirmed local review note in ${dataset.name}.`)].slice(-100) })); setAction(null); notify('Review note created. View it in Data & access.'); } catch (e) { notify((e as Error).message); setAction(null); } }}>{t("Approve & create local note ")}<Check size={15} /></button></div></Modal>}
    {modal === 'export' && <Modal title={t("Export interface package")} onClose={() => setModal(null)}><div className="modal-content"><span className="package-art small"><Layers3 size={26} /></span><h2>{t("Share the way it works.")}</h2><p>{t("Export a validated definition another instance can import and bind to its own data.")}</p><ul className="export-list"><li><Check size={16} />{t("Views, filters, layout, and action definitions")}</li><li><Check size={16} />{t("Logical sources and capability requests")}</li><li><LockKeyhole size={16} />{t("Record payloads, grants, and bindings excluded")}</li><li><LockKeyhole size={16} />{t("Notes and activity history excluded")}</li></ul><p className="notice">{t("Review names and descriptions before sharing. Structured separation does not guarantee that free text contains no private information.")}</p><button className="button dark" onClick={download}><ArrowDownToLine size={16} />{t("Download .udi.json")}</button></div></Modal>}
    {modal === 'import' && <Modal title={t("Install an interface package")} onClose={() => setModal(null)} wide><div className="modal-content"><h2>{t("Same definition. Your instance.")}</h2><p>{t("Choose a .udi.json file or paste a package. Installation clears local capability grants; you must review them again.")}</p><input hidden type="file" accept=".json,application/json" ref={uploadRef} onChange={async e => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 65536) { setImportError('Package exceeds the 64 KiB limit.'); return; } const text = await file.text(); setImportText(text); setIncoming(null); setImportError(''); }} /><button className="button" onClick={() => uploadRef.current?.click()}><Upload size={15} />{t("Choose package")}</button><textarea className="import-input" aria-label={t("Package JSON")} value={importText} onChange={e => { setImportText(e.target.value); setIncoming(null); }} placeholder={'{ "specVersion": "0.1", … }'} />{importError && <p role="alert" className="editor-error">{te(importError)}</p>}{incoming ? <div className="import-review"><h3><Check size={16} />{incoming.metadata.title}</h3><p>{t('{views} views · {actions} actions', { views: incoming.views.length, actions: incoming.actions.length })}</p><p>{t('Requests: {capabilities}', { capabilities: incoming.capabilities.join(', ') })}</p><button className="button dark" onClick={() => { commit(incoming, `Installed ${incoming.metadata.id}; cleared grants for all local instances.`, true); setModal(null); setPage('access'); notify('Package installed. Review and grant each capability to connect this instance.'); }}>{t("Install & review data access ")}<ArrowRight size={15} /></button></div> : <button className="button dark" onClick={checkImport}>{t("Validate package ")}<ShieldCheck size={15} /></button>}</div></Modal>}
    {modal === 'about' && <Modal title={t("The UDI idea")} onClose={() => setModal(null)}><div className="modal-content about-content"><span className="eyebrow">{t("USER-DEFINED INTERFACE")}</span><h2>{t("Software should")}<br />{t("take your shape.")}</h2><p>{t("UDI is a proposal for persistent personal software: users shape the interface; a runtime validates the definition, binds local data, and mediates actions.")}</p><div className="about-loop"><span>{t("Intent")}</span><ArrowRight size={14} /><span>{t("Definition")}</span><ArrowRight size={14} /><span>{t("Runtime")}</span></div><h3>{t("What this prototype demonstrates")}</h3><p>{t("Reviewable revisions, five component types, independent dataset bindings, local capability checks, confirmed note creation, and package export/import.")}</p><h3>{t("What is simulated")}</h3><p>{t("The hosted demo uses a small deterministic grammar. Local development also supports an optional Ollama model. Both datasets and paper titles are fictional; live connectors and background workflows are not implemented. Browser checks do not secure real accounts.")}</p><p className="notice">{t("UDI builds on end-user programming and generative UI. This prototype does not claim a new transport protocol or compatibility with A2UI, AG-UI, or MCP Apps.")}</p></div></Modal>}
    {modal === 'reset' && <Modal title={t("Reset the local demo")} onClose={() => setModal(null)}><div className="modal-content"><h2>{t("Start with a fresh workspace?")}</h2><p>{t("This clears this prototype’s revisions, local notes, grants, and activity in this browser. Download your package first if you want to keep your changes.")}</p><div className="modal-actions"><button className="button" onClick={() => setModal(null)}>{t("Cancel")}</button><button className="button dark" onClick={() => { setState(fresh()); setProposal(null); setIntent(''); setError(''); setPage('workspace'); setModal(null); notify('Demo reset.'); }}>{t("Reset demo")}</button></div></div></Modal>}
  </div>;
}
