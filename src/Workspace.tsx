import { Activity, ArrowDownRight, ArrowUpRight, BookOpen, Check, ChevronRight, Clock3, ExternalLink, FlaskConical, GitCommitHorizontal, LockKeyhole, MoreHorizontal, TrendingUp } from 'lucide-react';
import { readSource } from './core/runtime';
import type { Commit, Dataset, Deadline, Experiment, Instance, Paper, UDISpec, View } from './core/types';

interface Props { spec: UDISpec; instance: Instance; dataset: Dataset; onAccess: () => void; onSelect: (experiment: Experiment) => void }

export default function Workspace({ spec, instance, dataset, onAccess, onSelect }: Props) {
  function render(view: View) {
    let records: ReturnType<typeof readSource>;
    try { records = readSource(spec, instance, dataset, view.source); }
    catch { return <section className={`panel locked-panel view-${view.type}`} key={view.id}><LockKeyhole size={22} /><h3>{view.title}</h3><p>Access to this source is turned off.</p><button className="text-button" onClick={onAccess}>Review data access <ChevronRight size={14} /></button></section>; }
    if (view.type === 'metrics') {
      const rows = records as Experiment[];
      const best = Math.max(...rows.filter(e => e.status === 'passed').map(e => e.psnr), 0);
      return <div className="metrics" key={view.id}>
        <div className="metric"><span>Experiments <FlaskConical size={16} /></span><div>{String(rows.length).padStart(2, '0')}<small>in this workspace</small></div><p><i className="dot green" /> {rows.filter(e => e.status === 'passed').length} passed <i className="dot amber" /> {rows.filter(e => e.status === 'running').length} running</p></div>
        <div className="metric"><span>Best PSNR <TrendingUp size={16} /></span><div>{best.toFixed(2)}<small>dB</small></div><p><ArrowUpRight size={14} /> Best completed experiment</p></div>
        <div className="metric"><span>Needs a closer look <Activity size={16} /></span><div>{String(rows.filter(e => e.status === 'failed').length).padStart(2, '0')}<small>failed runs</small></div><p className="muted">Linked to their recorded commits</p></div>
      </div>;
    }
    if (view.type === 'table') {
      const all = records as Experiment[];
      const rows = all.filter(e => view.filter !== 'failed' || e.status === 'failed');
      if (view.groupBy === 'model') rows.sort((a, b) => a.model.localeCompare(b.model));
      return <section className="panel experiment-panel" key={view.id}>
        <div className="panel-heading"><div><h3><FlaskConical size={17} /> {view.title}</h3><p>Small experiments. Clearer answers.</p></div><span className="count-badge">{rows.length} runs</span></div>
        <div className="table-scroll"><table><thead><tr><th>EXPERIMENT</th><th>MODEL</th><th>PSNR <span>↑</span></th><th>CHANGE</th><th>STATUS</th><th aria-label="Open experiment" /></tr></thead><tbody>
          {rows.map((e, index) => <tr key={e.id} className={e.delta < (view.highlightBelow ?? -0.5) ? 'regression' : ''}>
            <td><button className="experiment-link" onClick={() => onSelect(e)}><span>{e.name}</span><small>{view.groupBy === 'model' && (index === 0 || rows[index - 1].model !== e.model) ? `${e.model} · ` : ''}{e.id}</small></button></td>
            <td><span className="model-tag">{e.model}</span></td><td className="mono">{e.status === 'running' ? '—' : e.psnr.toFixed(2)}</td>
            <td><span className={`delta ${e.delta < 0 ? 'negative' : e.delta > 0 ? 'positive' : ''}`}>{e.delta < 0 ? <ArrowDownRight size={13} /> : e.delta > 0 ? <ArrowUpRight size={13} /> : null}{e.delta === 0 ? '—' : `${e.delta > 0 ? '+' : ''}${e.delta.toFixed(2)}`}</span></td>
            <td><span className={`status ${e.status}`}><i />{e.status[0].toUpperCase() + e.status.slice(1)}</span></td><td><button className="icon-button" aria-label={`Inspect ${e.id}`} onClick={() => onSelect(e)}><ChevronRight size={15} /></button></td>
          </tr>)}
        </tbody></table></div>
        <div className="panel-footer"><span><GitCommitHorizontal size={14} /> Every run has a recorded commit</span><span>{view.filter === 'failed' ? 'Filtered: failed' : 'All experiments'}</span></div>
      </section>;
    }
    if (view.type === 'bar-chart') {
      const rows = records as Experiment[];
      const models = [...new Set(rows.map(r => r.model))];
      const values = models.map(model => Math.max(...rows.filter(r => r.model === model && r.status === 'passed').map(r => r.psnr), 0));
      return <section className="panel chart-panel" key={view.id}><div className="panel-heading"><div><h3>{view.title}</h3><p>Best completed run · PSNR in dB</p></div><TrendingUp size={17} /></div><div className="bar-chart">{models.map((model, i) => <div className="bar-row" key={model}><div><span>{model}</span><b>{values[i] ? values[i].toFixed(2) : '—'}</b></div><div className="bar-track"><div style={{ width: `${Math.max(0, (values[i] / 40) * 100)}%` }} className={`bar bar-${i}`} /></div></div>)}</div><p className="chart-note">0–40 dB scale · running and failed runs excluded</p></section>;
    }
    if (view.type === 'timeline') {
      const rows = [...records as Deadline[]].sort((a, b) => a.date.localeCompare(b.date));
      return <section className="panel timeline-panel" key={view.id}><div className="panel-heading"><div><h3>{view.title}</h3><p>A little structure for what’s next.</p></div><Clock3 size={17} /></div><div className="timeline">{rows.map((d, i) => <div className="timeline-item" key={d.id}><div className={`date-box ${i === 0 ? 'nearest' : ''}`}><span>{new Date(`${d.date}T12:00:00Z`).toLocaleString('en', { month: 'short', timeZone: 'UTC' })}</span><b>{d.date.slice(8)}</b></div><div><h4>{d.title}</h4><span>{d.category}</span></div><ChevronRight size={14} /></div>)}</div></section>;
    }
    return <section className="panel papers-panel" key={view.id}><div className="panel-heading"><div><h3><BookOpen size={17} />{view.title}</h3><p>Bundled fictional papers; no live literature search.</p></div><span className="count-badge">{records.length} papers</span></div><div className="paper-grid">{(records as Paper[]).map(p => <article key={p.id}><BookOpen size={18} /><h4>{p.title}</h4><p>{p.authors} · {p.year}</p><span className="model-tag">{p.tag}</span></article>)}</div></section>;
  }
  return <div className={`workspace-grid layout-${spec.layout}`}>{spec.views.filter(v => v.visible).map(render)}</div>;
}

export function ExperimentDetail({ experiment, spec, instance, dataset }: { experiment: Experiment; spec: UDISpec; instance: Instance; dataset: Dataset }) {
  let commit: Commit | undefined;
  try {
    const source = spec.sources.find(s => s.entity === 'commit');
    if (source) commit = (readSource(spec, instance, dataset, source.id) as Commit[]).find(c => c.id === experiment.commitId);
  } catch { /* Permission denial is shown in the detail surface. */ }
  return <div className="experiment-detail"><span className="eyebrow">EXPERIMENT PROVENANCE</span><h2>{experiment.name}</h2><p className="muted">{experiment.id} · {experiment.model} · {experiment.date}</p><div className="detail-numbers"><div><small>PSNR</small><strong>{experiment.psnr.toFixed(2)} <span>dB</span></strong></div><div><small>Change from baseline</small><strong className={experiment.delta < 0 ? 'negative' : 'positive'}>{experiment.delta > 0 ? '+' : ''}{experiment.delta.toFixed(2)} <span>dB</span></strong></div></div><div className="provenance"><GitCommitHorizontal size={20} /><div><small>Recorded commit ID</small>{commit ? <><code>{commit.id}</code><p>{commit.title}</p>{commit.files.map(f => <span className="file-tag" key={f}>{f}</span>)}</> : <p>Commit access is unavailable. Review permissions in Data & access.</p>}</div></div><p className="notice"><Check size={16} /> This is a join on the run’s recorded commit ID. It does not establish what caused a regression.</p></div>;
}
