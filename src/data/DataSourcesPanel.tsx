import { useEffect, useRef, useState } from 'react';
import { Database, Download, FileJson, LockKeyhole, Plus, ShieldCheck, Trash2, Upload, X } from 'lucide-react';
import { capabilityLabels } from '../core/spec';
import type { StudioState } from '../core/session';
import type { Capability, Dataset } from '../core/types';
import { useI18n } from '../i18n';
import { allDatasets, createPersonalInstance, datasetImportByteLimit, downloadDataset, importPersonalDataset, loadPersonalDatasets, removePersonalDataset, sampleDataset } from './sources';
import './data-sources.css';

const zh: Record<string, string> = {
  'DATA SOURCES': '数据来源', 'Platform data. Your data.': '平台数据，你的数据。',
  'The platform supplies fictional Aurora and Atlas datasets. Import your own normalized research JSON to use the same interface with personal data.': '平台提供 Aurora 和 Atlas 虚构数据集。导入自己的标准化研究 JSON，即可将同一界面用于个人数据。',
  'Platform sample': '平台示例', 'Personal · browser only': '个人数据 · 仅限此浏览器', 'Connected': '已连接',
  'Import personal data': '导入个人数据', 'Choose dataset JSON': '选择数据集 JSON', 'Download example JSON': '下载 JSON 示例',
  'Paste dataset JSON': '粘贴数据集 JSON', 'Import & review access': '导入并审阅权限',
  'Up to 500 KiB per JSON file, 200 records per collection, and 5 personal datasets. No URLs, scripts, credentials, or live connectors.': '每个 JSON 文件最多 500 KiB，每类记录最多 200 条，最多保存 5 个个人数据集。不支持 URL、脚本、凭据或实时连接器。',
  'Fictional records bundled with the app; no account connected.': '应用内置的虚构记录，未连接任何账户。',
  'Imported by you. Stored in this browser; no upload or cross-device sync.': '由你导入，保存在此浏览器中；不会上传，也不会跨设备同步。',
  'Bind & review access': '绑定并审阅权限', 'Review access': '审阅权限', 'Download data': '下载数据', 'Remove data': '删除数据',
  'Permission review': '权限审阅', 'These grants belong to this dataset instance. Installing a shared interface clears grants; importing data grants nothing automatically.': '授权属于此数据集实例。安装共享界面会清除授权；导入数据不会自动授权。',
  'Read experiment results': '读取实验结果', 'Read linked commits': '读取关联提交', 'Read project deadlines': '读取项目截止日期', 'Read research library': '读取研究文献库', 'Create local review notes': '创建本地审阅笔记',
  'Not requested by this interface': '此界面未请求', 'Local review notes': '本地审阅笔记',
  'Data downloads contain records only. Interface packages exclude records, grants, notes, and bindings. Review all free-text names and descriptions before sharing an interface.': '数据下载仅包含记录。界面包不包含记录、授权、笔记或绑定。分享界面前，请检查所有名称和描述等自由文本。',
  'Personal data imported. Review access before reading or writing.': '已导入个人数据。读取或写入前，请审阅权限。', 'Dataset connected. Review this instance’s access below.': '已连接数据集。请在下方审阅此实例的访问权限。',
  'Dataset removed from this browser.': '已从此浏览器删除数据集。', 'Import failed. Check the JSON format and limits.': '导入失败，请检查 JSON 格式和限制。',
  'Remove this personal dataset?': '删除此个人数据集？', 'This deletes the imported records and this instance’s local notes and grants from this browser. It cannot be undone. Download the data first if you need a copy. The shared interface definition stays available.': '这将从此浏览器删除导入的记录及此实例的本地笔记和授权，无法撤销。如需保留副本，请先下载数据。共享界面定义会保留。',
  'Cancel': '取消', 'Delete local dataset': '删除本地数据集', 'Close data removal dialog': '关闭数据删除对话框', 'No personal datasets yet.': '尚无个人数据集。',
  'experiments': '条实验', 'commits': '条提交', 'deadlines': '条截止日期', 'papers': '篇论文', 'notes': '条笔记', 'grants': '项授权',
  'Storage is local and may be cleared by your browser. Export a data copy to keep it.': '数据保存在本地，可能被浏览器清除。如需长期保留，请导出数据副本。',
};

export function DataSourcesPanel({ state, onChange, onSourcesChanged }: { state: StudioState; onChange: (next: StudioState) => void; onSourcesChanged: () => void }) {
  const { locale, t } = useI18n();
  const tr = (value: string) => locale === 'zh-CN' ? zh[value] ?? t(value) : value;
  const [json, setJson] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [review, setReview] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Dataset | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const sources = allDatasets();
  const personal = loadPersonalDatasets();
  const audit = (next: StudioState, message: string, kind: 'binding' | 'permission' = 'binding'): StudioState => ({ ...next, audit: [...next.audit, { id: crypto.randomUUID(), time: new Date().toISOString(), kind, message }].slice(-100) });

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
    setReview(dataset.id); setNotice(tr('Dataset connected. Review this instance’s access below.')); setError('');
  };
  const importData = (value: string) => {
    setError('');
    try {
      const dataset = importPersonalDataset(value);
      onChange(audit({ ...state, datasetId: dataset.id, instances: { ...state.instances, [dataset.id]: createPersonalInstance(dataset) } }, `Imported personal dataset ${dataset.id}; grants require review`));
      onSourcesChanged(); setReview(dataset.id); setJson(''); setImportOpen(false); setNotice(tr('Personal data imported. Review access before reading or writing.'));
    } catch (reason) { setError(`${tr('Import failed. Check the JSON format and limits.')} ${reason instanceof Error ? reason.message : ''}`); }
  };
  const toggle = (dataset: Dataset, capability: Capability) => {
    const instance = state.instances[dataset.id] ?? createPersonalInstance(dataset);
    const enabled = instance.grants.includes(capability);
    const grants = enabled ? instance.grants.filter(item => item !== capability) : [...instance.grants, capability];
    onChange(audit({ ...state, instances: { ...state.instances, [dataset.id]: { ...instance, grants } } }, `${enabled ? 'Revoked' : 'Granted'} ${capability} for ${dataset.id}`, 'permission'));
  };
  const remove = () => {
    if (!deleting) return;
    try {
      removePersonalDataset(deleting.id);
      const instances = { ...state.instances }; delete instances[deleting.id];
      onChange(audit({ ...state, instances, datasetId: state.datasetId === deleting.id ? 'aurora' : state.datasetId }, `Removed personal dataset ${deleting.id} and its local notes and grants`));
      onSourcesChanged(); if (review === deleting.id) setReview(null); setDeleting(null); setNotice(tr('Dataset removed from this browser.')); setError('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); setDeleting(null); }
  };

  return <section className="udi-data-sources" aria-label={tr('DATA SOURCES')}>
    <div className="udi-ds-intro"><span>{tr('DATA SOURCES')}</span><h2>{tr('Platform data. Your data.')}</h2><p>{tr('The platform supplies fictional Aurora and Atlas datasets. Import your own normalized research JSON to use the same interface with personal data.')}</p></div>
    <div className="udi-ds-actions"><button type="button" onClick={() => setImportOpen(!importOpen)} aria-expanded={importOpen}><Plus size={17}/>{tr('Import personal data')}</button><button type="button" className="udi-ds-secondary" onClick={() => downloadDataset(sampleDataset())}><FileJson size={17}/>{tr('Download example JSON')}</button></div>
    {importOpen && <div className="udi-ds-import"><p>{tr('Up to 500 KiB per JSON file, 200 records per collection, and 5 personal datasets. No URLs, scripts, credentials, or live connectors.')}</p><input ref={input} type="file" accept=".json,application/json" hidden onChange={async event => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ''; if (!file) return; if (file.size > datasetImportByteLimit) { setError(`${tr('Import failed. Check the JSON format and limits.')} Dataset exceeds 500 KiB.`); return; } try { importData(await file.text()); } catch { setError(tr('Import failed. Check the JSON format and limits.')); } }}/><button type="button" className="udi-ds-secondary" onClick={() => input.current?.click()}><Upload size={17}/>{tr('Choose dataset JSON')}</button><label htmlFor="udi-personal-dataset-json">{tr('Paste dataset JSON')}</label><textarea id="udi-personal-dataset-json" value={json} maxLength={datasetImportByteLimit} onChange={event => setJson(event.target.value)} rows={7} spellCheck={false} placeholder={'{ "id": "my-research", "name": "...", ... }'}/><button type="button" disabled={!json.trim()} onClick={() => importData(json)}>{tr('Import & review access')}</button></div>}
    {error && <p className="udi-ds-error" role="alert">{error}</p>}{notice && <p className="udi-ds-notice" role="status">{notice}</p>}
    <div className="udi-ds-list">{sources.map(dataset => {
      const isPersonal = dataset.id.startsWith('personal-'); const instance = state.instances[dataset.id] ?? createPersonalInstance(dataset); const current = state.datasetId === dataset.id;
      return <article key={dataset.id} className={`udi-ds-card${current ? ' udi-ds-current' : ''}`}>
        <div className="udi-ds-card-heading"><Database size={20}/><div><span>{tr(isPersonal ? 'Personal · browser only' : 'Platform sample')}</span><h3>{dataset.name}</h3></div>{current && <strong>{tr('Connected')}</strong>}</div><p>{dataset.project}</p><p className="udi-ds-description">{dataset.description}</p><p className="udi-ds-origin"><LockKeyhole size={14}/>{tr(isPersonal ? 'Imported by you. Stored in this browser; no upload or cross-device sync.' : 'Fictional records bundled with the app; no account connected.')}</p>
        <div className="udi-ds-counts"><span>{dataset.experiments.length} {tr('experiments')}</span><span>{dataset.commits.length} {tr('commits')}</span><span>{dataset.deadlines.length} {tr('deadlines')}</span><span>{dataset.papers.length} {tr('papers')}</span><span>{instance.grants.length} {tr('grants')}</span><span>{instance.notes.length} {tr('notes')}</span></div>
        <div className="udi-ds-card-actions"><button type="button" className="udi-ds-secondary" aria-expanded={review === dataset.id} onClick={() => current ? setReview(review === dataset.id ? null : dataset.id) : bind(dataset)}><ShieldCheck size={16}/>{tr(current ? 'Review access' : 'Bind & review access')}</button>{isPersonal && <><button type="button" className="udi-ds-icon" aria-label={`${tr('Download data')}: ${dataset.name}`} onClick={() => downloadDataset(dataset)}><Download size={17}/></button><button type="button" className="udi-ds-icon udi-ds-danger" aria-label={`${tr('Remove data')}: ${dataset.name}`} onClick={() => setDeleting(dataset)}><Trash2 size={17}/></button></>}</div>
        {review === dataset.id && <div className="udi-ds-access"><h4>{tr('Permission review')}</h4><p>{tr('These grants belong to this dataset instance. Installing a shared interface clears grants; importing data grants nothing automatically.')}</p>{(Object.keys(capabilityLabels) as Capability[]).map(capability => <label key={capability}><span><strong>{tr(capabilityLabels[capability])}</strong><code>{capability}</code>{!state.spec.capabilities.includes(capability) && <small>{tr('Not requested by this interface')}</small>}</span><input type="checkbox" aria-label={`${tr(capabilityLabels[capability])}: ${dataset.name}`} checked={instance.grants.includes(capability)} disabled={!state.spec.capabilities.includes(capability) && !instance.grants.includes(capability)} onChange={() => toggle(dataset, capability)}/></label>)}{instance.notes.length > 0 && <details><summary>{tr('Local review notes')} ({instance.notes.length})</summary>{instance.notes.map((note, index) => <pre key={index}>{note}</pre>)}</details>}</div>}
      </article>;
    })}</div>
    {personal.length === 0 && <p className="udi-ds-empty">{tr('No personal datasets yet.')}</p>}<p className="udi-ds-boundary"><LockKeyhole size={15}/>{tr('Data downloads contain records only. Interface packages exclude records, grants, notes, and bindings. Review all free-text names and descriptions before sharing an interface.')}</p><p className="udi-ds-storage">{tr('Storage is local and may be cleared by your browser. Export a data copy to keep it.')}</p>
    {deleting && <dialog ref={dialog} className="udi-ds-dialog" aria-labelledby="udi-ds-delete-title" onCancel={() => setDeleting(null)} onClick={event => { if (event.target === event.currentTarget) setDeleting(null); }}><div><button type="button" className="udi-ds-icon udi-ds-dialog-close" aria-label={tr('Close data removal dialog')} onClick={() => setDeleting(null)}><X size={20}/></button><Trash2 size={26}/><h2 id="udi-ds-delete-title">{tr('Remove this personal dataset?')}</h2><strong>{deleting.name}</strong><p>{tr('This deletes the imported records and this instance’s local notes and grants from this browser. It cannot be undone. Download the data first if you need a copy. The shared interface definition stays available.')}</p><div className="udi-ds-actions"><button type="button" className="udi-ds-secondary" onClick={() => setDeleting(null)}>{tr('Cancel')}</button><button type="button" className="udi-ds-delete" onClick={remove}>{tr('Delete local dataset')}</button></div></div></dialog>}
  </section>;
}
