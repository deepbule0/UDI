import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Activity, ArrowDownToLine, ArrowLeft, ArrowRight, ArrowUpRight, Braces, Check, CheckCheck, ChevronDown, ChevronRight, CircleHelp, Database, FileJson2, FlaskConical, GitFork, Layers3, LayoutDashboard, LockKeyhole, PanelRightClose, Plus, RotateCcw, Send, ShieldCheck, Sparkles, Upload, X } from 'lucide-react';
import { capabilityLabels, exportPackage, forkPackage, importPackage, initialSpec, validateSpec } from './core/spec';
import { applyProposal, planIntent, suggestedIntents } from './core/planner';
import { proposalFromModel } from './core/model-planner';
import { executeAction, prepareAction, type PreparedAction } from './core/runtime';
import { createInstances, datasets } from './data/fixtures';
import type { AuditEvent, Capability, Experiment, Instance, Proposal, UDISpec } from './core/types';
import Workspace, { ExperimentDetail } from './Workspace';

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
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} className={`modal ${wide ? 'wide' : ''}`} onCancel={onClose} aria-label={title}><div className="modal-top"><span>{title}</span><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={18} /></button></div>{children}</dialog>;
}

export default function App() {
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
    <aside className="sidebar"><a className="brand" href="#" onClick={e => { e.preventDefault(); setPage('workspace'); }}><span className="brand-mark">u<span>ı</span></span><strong>udi<span>studio</span></strong></a>
      <div className="workspace-label"><span className="workspace-avatar"><FlaskConical size={18} /></span><div><b>Personal workspace</b><small>Local prototype</small></div></div>
      <span className="nav-heading">BUILD AROUND YOU</span><nav aria-label="Main navigation">{nav.map(({ id, label, icon: Icon }) => <button key={id} className={page === id ? 'active' : ''} onClick={() => setPage(id)}><Icon size={17} />{label}{page === id && <i />}{id === 'activity' && audit.length > 0 && <span className="nav-count">{audit.length}</span>}</button>)}</nav>
      <div className="sidebar-concept"><div className="orbit-symbol"><span /><span /><span /><span /></div><h3>Your intent.<br />Your interface.</h3><p>The software should<br />take your shape.</p><button onClick={() => setModal('about')}>Meet UDI <ArrowUpRight size={14} /></button></div>
      <div className="sidebar-bottom"><button onClick={() => setModal('about')}><CircleHelp size={16} /> About this prototype</button><button onClick={() => setModal('reset')}><RotateCcw size={15} /> Reset demo</button><span><i className="dot green" /> UDI Core 0.1</span></div>
    </aside>

    <header className="topbar"><div><span>Workspace</span><ChevronRight size={13} /><b>{spec.metadata.title}</b></div><div><span className="offline-badge"><i className="dot green" /> Offline demo</span><button className="icon-button mobile-edit" aria-label="Toggle intent editor" onClick={() => setEditorOpen(v => !v)}><Sparkles size={18} /></button><span className="local-avatar" title="Data stays in this browser">L</span></div></header>

    <main className="main-content"><div className="page-heading"><div><span className="eyebrow">SOFTWARE, DEFINED BY YOU</span><h1>{page === 'workspace' ? spec.metadata.title : page === 'access' ? 'Your data. Your rules.' : page === 'package' ? 'An interface worth sharing.' : 'Every change, in the open.'}</h1><p>{page === 'workspace' ? 'A workspace that works the way you think.' : page === 'access' ? 'Bind the package to a dataset. Decide what it can access.' : page === 'package' ? 'Take the definition with you. Keep the instance here.' : 'A local record of revisions, permissions, and actions.'}</p></div>{page === 'workspace' && <button className="button subtle inspect-button" onClick={() => setPage('package')}><Braces size={15} /> Inspect spec</button>}</div>

      <div className="instance-bar"><div><span className="dataset-icon"><Database size={16} /></span><div><small>CONNECTED INSTANCE</small><label className="sr-only" htmlFor="dataset">Local dataset</label><select id="dataset" aria-label="Local dataset" value={dataset.id} onChange={e => bind(e.target.value)}>{datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div><span className="instance-divider" /><span className="project-name">{dataset.project}</span></div><span className="synthetic-label">Fictional data <CircleHelp size={13} /></span></div>

      {page === 'workspace' && <><Workspace spec={spec} instance={instance} dataset={dataset} onAccess={() => setPage('access')} onSelect={setSelected} />{spec.actions.length > 0 && <section className="panel action-panel"><div><h3>Actions, with your approval</h3><p>Preview the exact note before a local write.</p></div>{spec.actions.map(a => <button key={a.id} className="button dark" onClick={() => startAction(a.id)}><Plus size={15} />{a.title}</button>)}</section>}<div className="workspace-footnote"><ShieldCheck size={14} /><span>Interface definition is shareable. Data bindings and grants stay in this browser.</span></div></>}

      {page === 'access' && <div className="access-page"><section className="panel"><div className="panel-heading"><div><h3>Local source bindings</h3><p>Logical source names are resolved by this instance.</p></div><Database size={18} /></div>{spec.sources.map(s => <div className="source-row" key={s.id}><span className="source-icon">{s.entity === 'experiment' ? <FlaskConical size={18} /> : s.entity === 'paper' ? <FileJson2 size={18} /> : <Database size={18} />}</span><div><b>{s.id}</b><small>{dataset.name} / {s.entity} records</small></div><span className="source-tag">Local fixture</span></div>)}</section><section className="panel"><div className="panel-heading"><div><h3>Requested capabilities</h3><p>Requests are part of a package. Grants belong to an instance.</p></div><ShieldCheck size={18} /></div>{spec.capabilities.map(c => <div className="permission-row" key={c}><div><b>{capabilityLabels[c]}</b><code>{c}</code></div><button className={`toggle ${instance.grants.includes(c) ? 'on' : ''}`} role="switch" aria-checked={instance.grants.includes(c)} aria-label={capabilityLabels[c]} onClick={() => toggle(c)}><span /></button></div>)}<p className="access-note"><LockKeyhole size={16} /> Grants apply to {dataset.name} only. A write also requires a separate action preview and confirmation.</p></section>{instance.notes.length > 0 && <section className="panel"><div className="panel-heading"><h3>Local review notes</h3><span className="count-badge">{instance.notes.length}</span></div>{instance.notes.map((note, i) => <pre className="saved-note" key={i}>{note}</pre>)}</section>}<p className="notice">These are in-browser demonstration controls, not an authentication boundary for real services. No external accounts are connected.</p></div>}

      {page === 'package' && <div className="package-page"><section className="package-banner"><span className="package-art"><Layers3 size={38} strokeWidth={1.3} /></span><div><span className="eyebrow">PORTABLE BY DEFINITION</span><h2>{spec.metadata.title}</h2><p>{spec.metadata.description}</p><div className="package-tags"><span>UDI Core {spec.specVersion}</span><span>v{spec.metadata.version}</span><span>{spec.views.length} views</span></div></div></section><div className="package-actions"><button className="button dark" onClick={() => setModal('export')}><ArrowDownToLine size={15} />Export package</button><button className="button" onClick={() => { commit(forkPackage(spec), 'Forked the interface package.'); notify('Created a local fork. Bindings were preserved.'); }}><GitFork size={15} />Fork</button><button className="button" onClick={() => { setModal('import'); setIncoming(null); setImportError(''); }}><Upload size={15} />Import package</button></div><section className="panel spec-panel"><div className="panel-heading"><h3><FileJson2 size={17} />{spec.metadata.id}.udi.json</h3><span className="valid-badge"><Check size={13} /> Schema validated</span></div><pre tabIndex={0}>{exportPackage(spec)}</pre></section><p className="notice"><ShieldCheck size={16} /> The package has no record payloads, binding paths, grants, or audit history. Free-text titles and descriptions still need human review before publication.</p></div>}

      {page === 'activity' && <section className="panel activity-panel"><div className="panel-heading"><div><h3>Instance activity</h3><p>Stored locally · last 100 events · editable browser state</p></div><Activity size={18} /></div>{audit.length === 0 ? <div className="empty-state"><Activity size={30} /><h3>A clean slate.</h3><p>Apply an interface change or switch the dataset to start a local activity history.</p><button className="button" onClick={() => { setPage('workspace'); generate(suggestedIntents[0]); }}>Try your first revision <ArrowRight size={14} /></button></div> : [...audit].reverse().map(a => <div className="audit-row" key={a.id}><span className={`audit-dot ${a.kind}`} /><div><small>{a.kind}</small><p>{a.message}</p></div><time>{new Date(a.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></div>)}</section>}

      <footer className="main-footer"><span>USER-DEFINED INTERFACE</span><span>An open idea. A working prototype.</span><button onClick={() => setModal('about')}>How it works <ArrowUpRight size={12} /></button></footer>
    </main>

    {editorOpen && <aside className="intent-panel"><div className="intent-heading"><div><Sparkles size={17} /><b>Shape your workspace</b></div><button className="icon-button" aria-label="Close intent editor" onClick={() => setEditorOpen(false)}><PanelRightClose size={17} /></button></div><div className="intent-body"><span className="agent-label"><i className="dot green" /> YOUR INTENT → YOUR INTERFACE</span><h2>What would make<br />this work better for you?</h2><p className="intent-intro">Start with a small change.<br />The interface follows your lead.</p><div className="editor-message"><span className="sparkle-avatar"><Sparkles size={16} /></span><p>Your research cockpit is ready. Try focusing on failed runs, or bring your paper library into view.</p></div><div className="suggestion-label">A FEW THINGS TO TRY</div><div className="suggestions">{suggestedIntents.map((s, i) => <button key={s} onClick={() => generate(s)}><span>{i === 0 ? <FlaskConical size={14} /> : i === 2 ? <Plus size={14} /> : <ArrowUpRight size={14} />}{s}</span><ChevronRight size={13} /></button>)}</div>
      {error && <div role="alert" className="editor-error">{error}</div>}
      {proposal && <section className="proposal" aria-label="Proposed revision"><div><span className="proposal-icon"><Braces size={15} /></span><b>Review the change</b><span>r{revision + 1}</span></div><p>{proposal.summary}</p><pre>{JSON.stringify(proposal.operations, null, 2)}</pre>{proposal.additions.length > 0 ? <p className="new-permission"><LockKeyhole size={14} /> New request: {proposal.additions.join(', ')}. Grant separately in Data & access.</p> : <p className="no-escalation"><CheckCheck size={14} /> No additional permissions</p>}<div className="proposal-buttons"><button className="button dark" onClick={apply}>Apply change <Check size={14} /></button><button className="text-button" onClick={() => setProposal(null)}>Discard</button></div></section>}
      <div className="editor-principle"><span><ShieldCheck size={16} /></span><div><b>You stay in control.</b><p>Changes are proposed first.<br />Data access is always a separate choice.</p></div></div></div>
      <div className="intent-composer"><form onSubmit={e => { e.preventDefault(); generate(); }}><label htmlFor="intent-input" className="sr-only">Describe an interface change</label><textarea id="intent-input" placeholder="Describe a change…" value={intent} onChange={e => setIntent(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generate(); } }} rows={2} maxLength={300} /><div><label className="planner-mode"><span className="sr-only">Planner mode</span><select aria-label="Planner mode" value={plannerMode} onChange={e => setPlannerMode(e.target.value)} disabled={planning}><option value="offline">Offline parser</option>{import.meta.env.DEV && <option value="ollama">Local model · Ollama</option>}</select></label><button aria-label="Propose interface change" type="submit" disabled={!intent.trim() || planning}><ArrowRight size={17} /></button></div></form><p>{planning ? "Generating a proposal…" : plannerMode === "offline" ? "Limited grammar · no LLM · no API key" : "Local model · definition only · review before applying"}</p></div><div className="revision-bar"><span><i className="dot green" />Revision {revision}</span><button onClick={undo} disabled={!history.length}><RotateCcw size={13} />Undo</button></div>
    </aside>}
    {!editorOpen && <button className="editor-reopen button dark" onClick={() => setEditorOpen(true)}><Sparkles size={16} />Shape workspace</button>}

    {toast && <div className="toast" role="status"><Check size={16} />{toast}<button className="icon-button" aria-label="Dismiss notification" onClick={() => setToast('')}><X size={14} /></button></div>}

    {selected && <Modal title="Recorded evidence" onClose={() => setSelected(null)}><ExperimentDetail experiment={selected} spec={spec} instance={instance} dataset={dataset} /></Modal>}
    {action && <Modal title="Review local write" onClose={() => setAction(null)}><div className="modal-content"><span className="eyebrow">APPROVE THE EXACT ACTION</span><h2>Create a review note</h2><p>This appends one note to the {dataset.name} instance in this browser.</p><pre className="action-preview">{action.content}</pre><p className="notice">Requested: notes.write · Scope: {instance.id} · Revision: {revision}</p><button className="button dark" onClick={() => { try { const next = executeAction(spec, revision, instance, dataset, action, true); setState(s => ({ ...s, instances: { ...s.instances, [s.datasetId]: next }, audit: [...s.audit, log('action', `Created one confirmed local review note in ${dataset.name}.`)].slice(-100) })); setAction(null); notify('Review note created. View it in Data & access.'); } catch (e) { notify((e as Error).message); setAction(null); } }}>Approve & create local note <Check size={15} /></button></div></Modal>}
    {modal === 'export' && <Modal title="Export interface package" onClose={() => setModal(null)}><div className="modal-content"><span className="package-art small"><Layers3 size={26} /></span><h2>Share the way it works.</h2><p>Export a validated definition another instance can import and bind to its own data.</p><ul className="export-list"><li><Check size={16} />Views, filters, layout, and action definitions</li><li><Check size={16} />Logical sources and capability requests</li><li><LockKeyhole size={16} />Record payloads, grants, and bindings excluded</li><li><LockKeyhole size={16} />Notes and activity history excluded</li></ul><p className="notice">Review names and descriptions before sharing. Structured separation does not guarantee that free text contains no private information.</p><button className="button dark" onClick={download}><ArrowDownToLine size={16} />Download .udi.json</button></div></Modal>}
    {modal === 'import' && <Modal title="Install an interface package" onClose={() => setModal(null)} wide><div className="modal-content"><h2>Same definition. Your instance.</h2><p>Choose a .udi.json file or paste a package. Installation clears local capability grants; you must review them again.</p><input hidden type="file" accept=".json,application/json" ref={uploadRef} onChange={async e => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 65536) { setImportError('Package exceeds the 64 KiB limit.'); return; } const text = await file.text(); setImportText(text); setIncoming(null); setImportError(''); }} /><button className="button" onClick={() => uploadRef.current?.click()}><Upload size={15} />Choose package</button><textarea className="import-input" aria-label="Package JSON" value={importText} onChange={e => { setImportText(e.target.value); setIncoming(null); }} placeholder={'{ "specVersion": "0.1", … }'} />{importError && <p role="alert" className="editor-error">{importError}</p>}{incoming ? <div className="import-review"><h3><Check size={16} />{incoming.metadata.title}</h3><p>{incoming.views.length} views · {incoming.actions.length} actions</p><p>Requests: {incoming.capabilities.join(', ')}</p><button className="button dark" onClick={() => { commit(incoming, `Installed ${incoming.metadata.id}; cleared grants for all local instances.`, true); setModal(null); setPage('access'); notify('Package installed. Review and grant each capability to connect this instance.'); }}>Install & review data access <ArrowRight size={15} /></button></div> : <button className="button dark" onClick={checkImport}>Validate package <ShieldCheck size={15} /></button>}</div></Modal>}
    {modal === 'about' && <Modal title="The UDI idea" onClose={() => setModal(null)}><div className="modal-content about-content"><span className="eyebrow">USER-DEFINED INTERFACE</span><h2>Software should<br />take your shape.</h2><p>UDI is a proposal for persistent personal software: users shape the interface; a runtime validates the definition, binds local data, and mediates actions.</p><div className="about-loop"><span>Intent</span><ArrowRight size={14} /><span>Definition</span><ArrowRight size={14} /><span>Runtime</span></div><h3>What this prototype demonstrates</h3><p>Reviewable revisions, five component types, independent dataset bindings, local capability checks, confirmed note creation, and package export/import.</p><h3>What is simulated</h3><p>The hosted demo uses a small deterministic grammar. Local development also supports an optional Ollama model. Both datasets and paper titles are fictional; live connectors and background workflows are not implemented. Browser checks do not secure real accounts.</p><p className="notice">UDI builds on end-user programming and generative UI. This prototype does not claim a new transport protocol or compatibility with A2UI, AG-UI, or MCP Apps.</p></div></Modal>}
    {modal === 'reset' && <Modal title="Reset the local demo" onClose={() => setModal(null)}><div className="modal-content"><h2>Start with a fresh workspace?</h2><p>This clears this prototype’s revisions, local notes, grants, and activity in this browser. Download your package first if you want to keep your changes.</p><div className="modal-actions"><button className="button" onClick={() => setModal(null)}>Cancel</button><button className="button dark" onClick={() => { setState(fresh()); setProposal(null); setIntent(''); setError(''); setPage('workspace'); setModal(null); notify('Demo reset.'); }}>Reset demo</button></div></div></Modal>}
  </div>;
}
