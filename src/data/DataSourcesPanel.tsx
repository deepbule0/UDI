import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Database, Download, FileJson, LockKeyhole, Plus, ShieldCheck, Trash2, Upload, X } from 'lucide-react';
import { capabilityLabels } from '../core/spec';
import type { StudioState } from '../core/session';
import type { Capability, Dataset } from '../core/types';
import { useI18n } from '../i18n';
import { allDatasets, createPersonalInstance, datasetImportByteLimit, downloadDataset, importPersonalDataset, loadPersonalDatasets, removePersonalDataset, sampleDataset } from './sources';
import './data-sources.css';

const zh: Record<string, string> = {
  'YOUR WORKSPACE': '你的工作空间', 'Choose what this interface can use': '选择让界面使用哪些内容',
  'Start with a public example, or create your own workspace here. You choose what your interface is allowed to see and do.': '先体验公共示例，也可以在这里创建自己的工作空间。界面能查看什么、执行什么，都由你决定。',
  'Try an example': '体验示例', 'Fictional research records, ready to explore.': '可直接体验的虚构研究记录。',
  'My workspaces': '我的工作空间', 'Your own entries, saved on this device.': '你自己填写的内容，保存在此设备上。',
  'Create my workspace': '创建我的工作空间', 'Create workspace': '创建工作空间', 'Add your first experiment': '添加第一个实验',
  'Give your workspace a name and add one result. You can use the same interface with your own information, without preparing a file.': '为工作空间命名，再添加一条结果。无需准备文件，就能把同一界面用于自己的内容。',
  'Workspace name': '工作空间名称', 'Experiment name': '实验名称', 'Model name': '模型名称', 'Result status': '结果状态', 'PSNR score': 'PSNR 分数',
  'Passed': '通过', 'Failed': '失败', 'Running': '进行中', 'A number from 0 to 1000.': '填写 0 到 1000 之间的数字。',
  'Local demo workspace': '本地演示工作空间', 'These entries stay in this browser. Connecting a real account or service is not available in this prototype.': '这些内容保存在此浏览器中。此原型尚不支持连接真实账户或服务。',
  'Workspace created. Choose its access below to start using your information.': '已创建工作空间。在下方选择允许访问的内容，即可开始使用。',
  'Could not create your workspace. Use plain text for names, check the score, and try again.': '无法创建工作空间。请使用普通文字填写名称，检查分数后重试。',
  'This browser already has five workspaces. Save a copy in Advanced data tools, then delete one to make room.': '此浏览器已有五个工作空间。请在“高级数据工具”中保存副本，再删除一个以腾出空间。',
  'This browser could not save your workspace. Free some browser storage or try another browser.': '此浏览器无法保存工作空间。请清理部分浏览器存储空间，或尝试其他浏览器。',
  'Platform example': '平台示例', 'My local workspace': '我的本地工作空间', 'In use': '正在使用',
  'Fictional example supplied with the app.': '应用内置的虚构示例。',
  'Your entries stay in this browser, without uploading or syncing to other devices.': '你的内容保存在此浏览器中，不会上传或同步到其他设备。',
  'Use this workspace': '使用此工作空间', 'Review access': '查看访问权限', 'Delete workspace': '删除工作空间',
  'What this interface can use': '此界面可以使用的内容',
  'Choose what to allow for this workspace. A new workspace starts with access off. A shared interface never carries someone else’s permissions.': '为此工作空间选择允许访问的内容。新工作空间默认关闭访问权限。共享界面不会携带他人的授权。',
  'Read experiment results': '读取实验结果', 'Read linked commits': '读取关联提交', 'Read project deadlines': '读取项目截止日期', 'Read research library': '读取研究文献库', 'Create local review notes': '创建本地审阅笔记',
  'Allow reading this workspace': '允许读取此工作空间', 'Reading allowed': '已允许读取', 'This allows only the reading listed here. Creating notes stays a separate choice.': '只允许读取下方列出的内容。创建笔记需要单独选择。',
  'Not used by this interface': '此界面暂不使用', 'Your saved review notes': '已保存的审阅笔记',
  'Your interface’s layout can be shared. Your records, permissions, notes, and account connections stay yours. Check any names or descriptions you have written before sharing.': '界面布局可以分享，你的记录、权限、笔记和账户连接仍属于你。分享前，请检查自己填写的名称和描述。',
  'Personal data imported. Review access before reading or writing.': '已导入个人数据。读取或写入前，请审阅权限。',
  'Workspace selected. Choose its access below.': '已选择工作空间。请在下方设置访问权限。', 'Workspace deleted from this browser.': '已从此浏览器删除工作空间。',
  'Delete this workspace?': '删除此工作空间？',
  'This permanently removes its records, local notes, and permissions from this browser. Your interface design stays available. To keep a copy of the records, cancel and use Advanced data tools first.': '这会从此浏览器永久删除该工作空间的记录、本地笔记和权限。界面设计会保留。如需保留记录副本，请先取消，并使用“高级数据工具”保存。',
  'Cancel': '取消', 'Close workspace deletion': '关闭删除工作空间对话框', 'Your first workspace starts with one small entry.': '从一条简单记录，开始你的第一个工作空间。',
  'experiments': '条实验', 'commits': '条历史记录', 'deadlines': '个截止日期', 'papers': '篇论文', 'notes': '条笔记', 'allowed': '项允许访问',
  'Browser storage can be cleared. Keep a backup of important entries with Advanced data tools.': '浏览器存储可能被清除。重要内容请通过“高级数据工具”保留备份。',
  'Advanced data tools': '高级数据工具', 'For people moving existing research records or building an adapter. Everyday use does not need these tools.': '用于迁移现有研究记录或开发适配器。日常使用无需这些工具。',
  'Import personal data': '导入个人数据', 'Choose dataset JSON': '选择数据集 JSON', 'Download example JSON': '下载 JSON 示例',
  'Paste dataset JSON': '粘贴数据集 JSON', 'Import & review access': '导入并审阅权限',
  'Up to 500 KiB per JSON file, 200 records per collection, and 5 personal datasets. No URLs, scripts, credentials, or live connectors.': '每个 JSON 文件最多 500 KiB，每类记录最多 200 条，最多保存 5 个个人数据集。不支持 URL、脚本、凭据或实时连接器。',
  'Import failed. Check the JSON format and limits.': '导入失败，请检查 JSON 格式和限制。',
  'Save workspace backups': '保存工作空间备份', 'Download data': '下载数据', 'Backups contain records only; permissions and review notes are not included.': '备份仅包含记录，不含权限或审阅笔记。',
  'Technical permission names': '权限技术名称', 'First workspace entry': '工作空间的第一条记录', 'Created with the workspace form on this device.': '通过此设备上的工作空间表单创建。',
};

export function DataSourcesPanel({ state, onChange, onSourcesChanged }: { state: StudioState; onChange: (next: StudioState) => void; onSourcesChanged: () => void }) {
  const { locale, t } = useI18n();
  const tr = (value: string) => locale === 'zh-CN' ? zh[value] ?? t(value) : value;
  const [json, setJson] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [experimentName, setExperimentName] = useState('');
  const [modelName, setModelName] = useState('');
  const [status, setStatus] = useState<'passed' | 'failed' | 'running'>('passed');
  const [score, setScore] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [review, setReview] = useState<string | null>(state.datasetId);
  const [deleting, setDeleting] = useState<Dataset | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const sources = allDatasets();
  const personal = loadPersonalDatasets();
  const platform = sources.filter(dataset => !dataset.id.startsWith('personal-'));
  const audit = (next: StudioState, message: string, kind: 'binding' | 'permission' = 'binding'): StudioState => ({ ...next, audit: [...next.audit, { id: crypto.randomUUID(), time: new Date().toISOString(), kind, message }].slice(-100) });

  useEffect(() => setReview(state.datasetId), [state.datasetId]);

  useEffect(() => {
    if (!deleting) return;
    const element = dialog.current;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (element && !element.open) element.showModal();
    return () => { element?.close(); if (opener?.isConnected) opener.focus({ preventScroll: true }); };
  }, [deleting]);
  const bind = (dataset: Dataset) => {
    const instance = state.instances[dataset.id] ?? createPersonalInstance(dataset);
    onChange(audit({ ...state, datasetId: dataset.id, instances: { ...state.instances, [dataset.id]: instance } }, `Bound interface to ${dataset.id}`));
    setReview(dataset.id); setNotice(tr('Workspace selected. Choose its access below.')); setError('');
  };
  const importData = (value: string, created = false) => {
    setError('');
    try {
      const dataset = importPersonalDataset(value);
      onChange(audit({ ...state, datasetId: dataset.id, instances: { ...state.instances, [dataset.id]: createPersonalInstance(dataset) } }, `${created ? 'Created' : 'Imported'} personal dataset ${dataset.id}; grants require review`));
      onSourcesChanged(); setReview(dataset.id); setJson(''); setImportOpen(false); setCreateOpen(false);
      setNotice(tr(created ? 'Workspace created. Choose its access below to start using your information.' : 'Personal data imported. Review access before reading or writing.'));
      return true;
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : '';
      setError(created ? tr(message.includes('at most 5') ? 'This browser already has five workspaces. Save a copy in Advanced data tools, then delete one to make room.' : message.includes('storage') ? 'This browser could not save your workspace. Free some browser storage or try another browser.' : 'Could not create your workspace. Use plain text for names, check the score, and try again.') : `${tr('Import failed. Check the JSON format and limits.')} ${message}`);
      return false;
    }
  };
  const createWorkspace = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const dataset: Dataset = {
      id: 'my-workspace', name: workspaceName.trim(), project: workspaceName.trim(), description: tr('Created with the workspace form on this device.'),
      experiments: [{ id: 'MY-001', name: experimentName.trim(), model: modelName.trim(), status, psnr: Number(score), delta: 0, commitId: 'first-entry', date: new Date().toISOString().slice(0, 10) }],
      commits: [{ id: 'first-entry', title: tr('First workspace entry'), files: [] }], deadlines: [], papers: [],
    };
    if (importData(JSON.stringify(dataset), true)) { setWorkspaceName(''); setExperimentName(''); setModelName(''); setStatus('passed'); setScore(''); }
  };
  const toggle = (dataset: Dataset, capability: Capability) => {
    const instance = state.instances[dataset.id] ?? createPersonalInstance(dataset);
    const enabled = instance.grants.includes(capability);
    const grants = enabled ? instance.grants.filter(item => item !== capability) : [...instance.grants, capability];
    onChange(audit({ ...state, instances: { ...state.instances, [dataset.id]: { ...instance, grants } } }, `${enabled ? 'Revoked' : 'Granted'} ${capability} for ${dataset.id}`, 'permission'));
  };
  const allowReading = (dataset: Dataset) => {
    const instance = state.instances[dataset.id] ?? createPersonalInstance(dataset);
    const requested = state.spec.capabilities.filter(capability => capability.endsWith('.read'));
    const grants = [...new Set([...instance.grants, ...requested])];
    onChange(audit({ ...state, instances: { ...state.instances, [dataset.id]: { ...instance, grants } } }, `Granted requested reading access for ${dataset.id}`, 'permission'));
  };
  const remove = () => {
    if (!deleting) return;
    try {
      removePersonalDataset(deleting.id);
      const instances = { ...state.instances }; delete instances[deleting.id];
      onChange(audit({ ...state, instances, datasetId: state.datasetId === deleting.id ? 'aurora' : state.datasetId }, `Removed personal dataset ${deleting.id} and its local notes and grants`));
      onSourcesChanged(); if (review === deleting.id) setReview(null); setDeleting(null); setNotice(tr('Workspace deleted from this browser.')); setError('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); setDeleting(null); }
  };
  const card = (dataset: Dataset) => {
    const isPersonal = dataset.id.startsWith('personal-');
    const instance = state.instances[dataset.id] ?? createPersonalInstance(dataset);
    const current = state.datasetId === dataset.id;
    const readingAllowed = state.spec.capabilities.filter(capability => capability.endsWith('.read')).every(capability => instance.grants.includes(capability));
    return <article key={dataset.id} className={`udi-ds-card${current ? ' udi-ds-current' : ''}`}>
      <div className="udi-ds-card-heading"><Database size={20}/><div><span>{tr(isPersonal ? 'My local workspace' : 'Platform example')}</span><h4>{dataset.name}</h4></div>{current && <strong>{tr('In use')}</strong>}</div>
      <p className="udi-ds-description">{dataset.description}</p><p className="udi-ds-origin"><LockKeyhole size={14}/>{tr(isPersonal ? 'Your entries stay in this browser, without uploading or syncing to other devices.' : 'Fictional example supplied with the app.')}</p>
      <div className="udi-ds-counts"><span>{dataset.experiments.length} {tr('experiments')}</span>{dataset.deadlines.length > 0 && <span>{dataset.deadlines.length} {tr('deadlines')}</span>}{dataset.papers.length > 0 && <span>{dataset.papers.length} {tr('papers')}</span>}<span>{instance.grants.length} {tr('allowed')}</span>{instance.notes.length > 0 && <span>{instance.notes.length} {tr('notes')}</span>}</div>
      <div className="udi-ds-card-actions"><button type="button" className="udi-ds-secondary" aria-expanded={review === dataset.id} onClick={() => current ? setReview(review === dataset.id ? null : dataset.id) : bind(dataset)}><ShieldCheck size={16}/>{tr(current ? 'Review access' : 'Use this workspace')}</button>{isPersonal && <button type="button" className="udi-ds-icon udi-ds-danger" aria-label={`${tr('Delete workspace')}: ${dataset.name}`} onClick={() => setDeleting(dataset)}><Trash2 size={17}/></button>}</div>
      {review === dataset.id && <div className="udi-ds-access"><h5>{tr('What this interface can use')}</h5><p>{tr('Choose what to allow for this workspace. A new workspace starts with access off. A shared interface never carries someone else’s permissions.')}</p>{(Object.keys(capabilityLabels) as Capability[]).map(capability => <label key={capability}><span><strong>{tr(capabilityLabels[capability])}</strong>{!state.spec.capabilities.includes(capability) && <small>{tr('Not used by this interface')}</small>}</span><input type="checkbox" aria-label={`${tr(capabilityLabels[capability])}: ${dataset.name}`} checked={instance.grants.includes(capability)} disabled={!state.spec.capabilities.includes(capability) && !instance.grants.includes(capability)} onChange={() => toggle(dataset, capability)}/></label>)}<div className="udi-ds-read-consent"><button type="button" disabled={readingAllowed} onClick={() => allowReading(dataset)}><ShieldCheck size={17}/>{tr(readingAllowed ? 'Reading allowed' : 'Allow reading this workspace')}</button><p>{tr('This allows only the reading listed here. Creating notes stays a separate choice.')}</p></div>{instance.notes.length > 0 && <details><summary>{tr('Your saved review notes')} ({instance.notes.length})</summary>{instance.notes.map((note, index) => <pre key={index}>{note}</pre>)}</details>}</div>}
    </article>;
  };

  return <section className="udi-data-sources" aria-label={tr('YOUR WORKSPACE')}>
    <div className="udi-ds-intro"><span>{tr('YOUR WORKSPACE')}</span><h2>{tr('Choose what this interface can use')}</h2><p>{tr('Start with a public example, or create your own workspace here. You choose what your interface is allowed to see and do.')}</p></div>
    <div className="udi-ds-create-invite"><div><h3>{tr('My workspaces')}</h3><p>{tr('Your own entries, saved on this device.')}</p></div><button type="button" onClick={() => { setCreateOpen(!createOpen); setError(''); }} aria-expanded={createOpen}><Plus size={17}/>{tr('Create my workspace')}</button></div>
    {createOpen && <form className="udi-ds-create" onSubmit={createWorkspace} aria-label={tr('Create my workspace')}><h3>{tr('Add your first experiment')}</h3><p>{tr('Give your workspace a name and add one result. You can use the same interface with your own information, without preparing a file.')}</p><label htmlFor="udi-workspace-name">{tr('Workspace name')}</label><input id="udi-workspace-name" autoFocus required maxLength={100} autoComplete="off" value={workspaceName} onChange={event => setWorkspaceName(event.target.value)}/><label htmlFor="udi-experiment-name">{tr('Experiment name')}</label><input id="udi-experiment-name" required maxLength={200} autoComplete="off" value={experimentName} onChange={event => setExperimentName(event.target.value)}/><label htmlFor="udi-model-name">{tr('Model name')}</label><input id="udi-model-name" required maxLength={100} autoComplete="off" value={modelName} onChange={event => setModelName(event.target.value)}/><div className="udi-ds-form-row"><div><label htmlFor="udi-result-status">{tr('Result status')}</label><select id="udi-result-status" value={status} onChange={event => setStatus(event.target.value as typeof status)}><option value="passed">{tr('Passed')}</option><option value="failed">{tr('Failed')}</option><option value="running">{tr('Running')}</option></select></div><div><label htmlFor="udi-result-score">{tr('PSNR score')}</label><input id="udi-result-score" type="number" required min={0} max={1000} step="any" inputMode="decimal" aria-describedby="udi-score-help" value={score} onChange={event => setScore(event.target.value)}/><small id="udi-score-help">{tr('A number from 0 to 1000.')}</small></div></div><div className="udi-ds-actions"><button type="submit">{tr('Create workspace')}</button><button type="button" className="udi-ds-secondary" onClick={() => setCreateOpen(false)}>{tr('Cancel')}</button></div></form>}
    {error && <p className="udi-ds-error" role="alert">{error}</p>}{notice && <p className="udi-ds-notice" role="status">{notice}</p>}
    {personal.length > 0 ? <div className="udi-ds-list udi-ds-personal">{personal.map(card)}</div> : <p className="udi-ds-empty">{tr('Your first workspace starts with one small entry.')}</p>}
    <p className="udi-ds-local-note"><LockKeyhole size={15}/><span><strong>{tr('Local demo workspace')}</strong>{tr('These entries stay in this browser. Connecting a real account or service is not available in this prototype.')}</span></p>
    <div className="udi-ds-group-heading"><h3>{tr('Try an example')}</h3><p>{tr('Fictional research records, ready to explore.')}</p></div><div className="udi-ds-list">{platform.map(card)}</div>
    <p className="udi-ds-boundary"><LockKeyhole size={15}/>{tr('Your interface’s layout can be shared. Your records, permissions, notes, and account connections stay yours. Check any names or descriptions you have written before sharing.')}</p>
    <details className="udi-ds-advanced"><summary>{tr('Advanced data tools')}</summary><div><p>{tr('For people moving existing research records or building an adapter. Everyday use does not need these tools.')}</p><div className="udi-ds-actions"><button type="button" className="udi-ds-secondary" onClick={() => setImportOpen(!importOpen)} aria-expanded={importOpen}><Plus size={17}/>{tr('Import personal data')}</button><button type="button" className="udi-ds-secondary" onClick={() => downloadDataset(sampleDataset())}><FileJson size={17}/>{tr('Download example JSON')}</button></div>
      {importOpen && <div className="udi-ds-import"><p>{tr('Up to 500 KiB per JSON file, 200 records per collection, and 5 personal datasets. No URLs, scripts, credentials, or live connectors.')}</p><input ref={input} type="file" accept=".json,application/json" hidden onChange={async event => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ''; if (!file) return; if (file.size > datasetImportByteLimit) { setError(`${tr('Import failed. Check the JSON format and limits.')} Dataset exceeds 500 KiB.`); return; } try { importData(await file.text()); } catch { setError(tr('Import failed. Check the JSON format and limits.')); } }}/><button type="button" className="udi-ds-secondary" onClick={() => input.current?.click()}><Upload size={17}/>{tr('Choose dataset JSON')}</button><label htmlFor="udi-personal-dataset-json">{tr('Paste dataset JSON')}</label><textarea id="udi-personal-dataset-json" value={json} maxLength={datasetImportByteLimit} onChange={event => setJson(event.target.value)} rows={7} spellCheck={false} placeholder={'{ "id": "my-research", "name": "...", ... }'}/><button type="button" disabled={!json.trim()} onClick={() => importData(json)}>{tr('Import & review access')}</button></div>}
      {personal.length > 0 && <div className="udi-ds-backups"><h4>{tr('Save workspace backups')}</h4><p>{tr('Backups contain records only; permissions and review notes are not included.')}</p>{personal.map(dataset => <button key={dataset.id} type="button" className="udi-ds-secondary" aria-label={`${tr('Download data')}: ${dataset.name}`} onClick={() => downloadDataset(dataset)}><Download size={17}/>{dataset.name}</button>)}</div>}
      <h4>{tr('Technical permission names')}</h4><dl className="udi-ds-technical">{(Object.keys(capabilityLabels) as Capability[]).map(capability => <div key={capability}><dt>{tr(capabilityLabels[capability])}</dt><dd><code>{capability}</code></dd></div>)}</dl><p className="udi-ds-storage">{tr('Browser storage can be cleared. Keep a backup of important entries with Advanced data tools.')}</p></div></details>
    {deleting && <dialog ref={dialog} className="udi-ds-dialog" aria-labelledby="udi-ds-delete-title" onCancel={() => setDeleting(null)} onClick={event => { if (event.target === event.currentTarget) setDeleting(null); }}><div><button type="button" className="udi-ds-icon udi-ds-dialog-close" aria-label={tr('Close workspace deletion')} onClick={() => setDeleting(null)}><X size={20}/></button><Trash2 size={26}/><h2 id="udi-ds-delete-title">{tr('Delete this workspace?')}</h2><strong>{deleting.name}</strong><p>{tr('This permanently removes its records, local notes, and permissions from this browser. Your interface design stays available. To keep a copy of the records, cancel and use Advanced data tools first.')}</p><div className="udi-ds-actions"><button type="button" className="udi-ds-secondary" onClick={() => setDeleting(null)}>{tr('Cancel')}</button><button type="button" className="udi-ds-delete" onClick={remove}>{tr('Delete workspace')}</button></div></div></dialog>}
  </section>;
}
