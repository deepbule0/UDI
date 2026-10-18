import { BookOpen, CalendarDays, ChartNoAxesCombined, Check, Layers3, LockKeyhole } from 'lucide-react';
import { readSource } from '../core/runtime';
import type { Capability, Dataset, Instance, UDISpec, View } from '../core/types';
import { datasets } from '../data/fixtures';
import { useI18n } from '../i18n';
import './preview.css';

/** A real, read-only rendering of a definition against public bundled records.
 * Never bind this preview to a user's instance or grant access to their data. */
export function ExperiencePreview({ spec, compact = false }: { spec: UDISpec; compact?: boolean }) {
  const { locale, t } = useI18n();
  const s = (en: string, zh: string) => locale === 'en' ? en : zh;
  const sample = datasets[0];
  const instance: Instance = {
    id: 'public-preview', datasetId: sample.id, notes: [],
    grants: spec.capabilities.filter((capability): capability is Exclude<Capability, 'notes.write'> => capability !== 'notes.write'),
  };
  const visible = spec.views.filter(view => view.visible && (spec.layout !== 'focus' || view.type === 'metrics' || view.type === 'table'));

  function renderView(view: View) {
    let records: ReturnType<typeof readSource>;
    try { records = readSource(spec, instance, sample, view.source); }
    catch { return <p className="ep-unavailable"><LockKeyhole size={15} />{s('This view needs data access.', '此视图需要数据访问权限。')}</p>; }
    if (view.type === 'metrics') {
      const runs = records as Dataset['experiments'];
      const best = Math.max(...runs.filter(run => run.status === 'passed').map(run => run.psnr), 0);
      return <div className="ep-metrics"><div><strong>{runs.length}</strong><span>{s('Experiments', '实验')}</span></div><div><strong>{runs.filter(run => run.status === 'failed').length}</strong><span>{s('Need attention', '需要关注')}</span></div><div><strong>{best.toFixed(2)}</strong><span>{s('Best completed result', '最佳已完成结果')}</span></div></div>;
    }
    if (view.type === 'table') {
      const runs = (records as Dataset['experiments']).filter(run => view.filter !== 'failed' || run.status === 'failed');
      const groups = view.groupBy === 'model' ? [...new Set(runs.map(run => run.model))].sort((a, b) => a.localeCompare(b)) : [''];
      return <div className="ep-results" data-filter={view.filter ?? 'all'} data-grouping={view.groupBy ?? 'none'}>{groups.map(group => <div className="ep-result-group" key={group}>{group && <h5>{group}</h5>}{runs.filter(run => !group || run.model === group).map(run => <div className={`ep-result ${run.delta < (view.highlightBelow ?? -0.5) ? 'ep-result-highlight' : ''}`} key={run.id}><span className={`ep-result-dot ep-status-${run.status}`} /><div><strong>{t(run.name)}</strong><span>{run.model} · {t(run.status)}</span></div><span className="ep-result-score">{run.status === 'running' ? '—' : run.psnr.toFixed(2)}<small>{run.status === 'running' ? '—' : `${run.delta > 0 ? '+' : ''}${run.delta.toFixed(2)} dB`}</small></span></div>)}</div>)}{runs.length === 0 && <p className="ep-unavailable">{s('No matching sample results.', '没有匹配的示例结果。')}</p>}</div>;
    }
    if (view.type === 'bar-chart') {
      const runs = records as Dataset['experiments'];
      const models = [...new Set(runs.map(run => run.model))].map(model => {
        const matches = runs.filter(run => run.model === model && run.status === 'passed');
        return { model, value: Math.max(...matches.map(run => run.psnr), 0) };
      });
      return <div className="ep-chart" aria-label={s('Best completed result by model', '各模型最佳已完成结果')}>{models.map(model => <div className="ep-chart-row" key={model.model}><span>{model.model}</span><div><i style={{ width: `${Math.min(100, Math.max(0, model.value / 40 * 100))}%` }} /></div><strong>{model.value ? model.value.toFixed(2) : '—'}</strong></div>)}</div>;
    }
    if (view.type === 'timeline') return <ol className="ep-timeline">{(records as Dataset['deadlines']).map(deadline => <li key={deadline.id}><CalendarDays size={16} /><div><strong>{t(deadline.title)}</strong><span>{new Date(`${deadline.date}T12:00:00`).toLocaleDateString(locale, { month: 'short', day: 'numeric' })} · {t(deadline.category)}</span></div></li>)}</ol>;
    if (view.type === 'collection') return <div className="ep-library">{(records as Dataset['papers']).map(paper => <div key={paper.id}><BookOpen size={17} /><div><strong>{t(paper.title)}</strong><span>{paper.year} · {t(paper.tag)}</span></div></div>)}</div>;
    return null;
  }

  return <div className={`experience-preview ep-${spec.layout}${compact ? ' ep-compact' : ''}`} aria-label={s('Interface preview using sample data', '使用示例数据的界面预览')}>
    <div className="ep-toolbar"><span><span className="ep-sample-dot" />{s('Sample workspace', '示例工作空间')}</span><span><Layers3 size={12} />{spec.layout === 'focus' ? s('Focused', '专注布局') : s('Balanced', '均衡布局')}</span></div>
    <div className="ep-grid">{visible.map(view => <section className={`ep-view ep-view-${view.type}`} key={view.id} data-view-type={view.type}><h4>{view.type === 'bar-chart' ? <ChartNoAxesCombined size={14} /> : view.type === 'metrics' ? <Check size={14} /> : null}{t(view.title)}</h4>{renderView(view)}</section>)}</div>
    {visible.length === 0 && <p className="ep-unavailable">{s('This interface has no visible views yet.', '此界面暂未显示任何视图。')}</p>}
    {spec.actions.length > 0 && <div className="ep-actions">{spec.actions.map(action => <button type="button" disabled key={action.id}>{t(action.title)}</button>)}<small>{s('Actions are off in this preview.', '预览中不执行操作。')}</small></div>}
    {!compact && <p className="ep-sample-note">{s('Preview uses fictional Aurora sample data. It does not read or change your records.', '预览使用虚构的 Aurora 示例数据，不会读取或修改你的记录。')}</p>}
  </div>;
}
