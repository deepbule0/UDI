import { datasets } from './fixtures';
import type { Dataset, Instance } from '../core/types';

export const personalDatasetsKey = 'udi-studio:personal-datasets:0.1';
export const datasetImportByteLimit = 500 * 1024;
export const personalDatasetLimit = 5;
const storedByteLimit = datasetImportByteLimit * personalDatasetLimit + 1024;
const maxRecords = 200;
type ObjectValue = Record<string, unknown>;

function object(value: unknown, keys: string[], path: string): ObjectValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${path}: expected an object.`);
  const item = value as ObjectValue;
  if (Object.keys(item).length !== keys.length || keys.some(key => !Object.hasOwn(item, key)) || Object.keys(item).some(key => !keys.includes(key))) throw new Error(`${path}: missing or unexpected fields.`);
  return item;
}
function text(value: unknown, path: string, max = 200): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value) || /<[^>]*>|(?:https?|javascript|data|file):|\b(?:eval|Function)\s*\(/iu.test(value)) throw new Error(`${path}: expected plain text of 1–${max} characters, without URLs or markup.`);
  return value;
}
function identifier(value: unknown, path: string): string {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}$/u.test(value)) throw new Error(`${path}: invalid identifier.`);
  return value;
}
function date(value: unknown, path: string): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/u.test(value) || !Number.isFinite(Date.parse(`${value}T00:00:00Z`)) || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) throw new Error(`${path}: expected a real YYYY-MM-DD date.`);
  return value;
}
function number(value: unknown, path: string, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new Error(`${path}: expected a finite number from ${min} to ${max}.`);
  return value;
}
function records<T extends { id: string }>(value: unknown, path: string, parse: (item: unknown, path: string) => T): T[] {
  if (!Array.isArray(value) || value.length > maxRecords) throw new Error(`${path}: expected at most ${maxRecords} records.`);
  const result = value.map((item, index) => parse(item, `${path}[${index}]`));
  if (new Set(result.map(item => item.id)).size !== result.length) throw new Error(`${path}: duplicate identifiers.`);
  return result;
}

/** Only normalized data is accepted. No credentials, URLs, HTML, or executable fields. */
export function validateDataset(input: unknown): { valid: true; dataset: Dataset } | { valid: false; error: string } {
  try {
    const root = object(input, ['id', 'name', 'project', 'description', 'experiments', 'commits', 'deadlines', 'papers'], 'dataset');
    const dataset: Dataset = {
      id: identifier(root.id, 'id'), name: text(root.name, 'name', 100), project: text(root.project, 'project', 200), description: text(root.description, 'description', 800),
      commits: records(root.commits, 'commits', (value, path) => {
        const item = object(value, ['id', 'title', 'files'], path);
        if (!Array.isArray(item.files) || item.files.length > 40) throw new Error(`${path}.files: expected at most 40 filenames.`);
        return { id: identifier(item.id, `${path}.id`), title: text(item.title, `${path}.title`), files: item.files.map((file, i) => text(file, `${path}.files[${i}]`)) };
      }),
      experiments: records(root.experiments, 'experiments', (value, path) => {
        const item = object(value, ['id', 'name', 'model', 'status', 'psnr', 'delta', 'commitId', 'date'], path);
        if (!['passed', 'failed', 'running'].includes(item.status as string)) throw new Error(`${path}.status: expected passed, failed, or running.`);
        return { id: identifier(item.id, `${path}.id`), name: text(item.name, `${path}.name`), model: text(item.model, `${path}.model`, 100), status: item.status as 'passed' | 'failed' | 'running', psnr: number(item.psnr, `${path}.psnr`, 0, 1000), delta: number(item.delta, `${path}.delta`, -1000, 1000), commitId: identifier(item.commitId, `${path}.commitId`), date: date(item.date, `${path}.date`) };
      }),
      deadlines: records(root.deadlines, 'deadlines', (value, path) => {
        const item = object(value, ['id', 'title', 'date', 'category'], path);
        return { id: identifier(item.id, `${path}.id`), title: text(item.title, `${path}.title`), date: date(item.date, `${path}.date`), category: text(item.category, `${path}.category`, 100) };
      }),
      papers: records(root.papers, 'papers', (value, path) => {
        const item = object(value, ['id', 'title', 'authors', 'year', 'tag'], path);
        const year = number(item.year, `${path}.year`, 1000, 9999);
        if (!Number.isInteger(year)) throw new Error(`${path}.year: expected an integer.`);
        return { id: identifier(item.id, `${path}.id`), title: text(item.title, `${path}.title`), authors: text(item.authors, `${path}.authors`), year, tag: text(item.tag, `${path}.tag`, 100) };
      }),
    };
    const commitIds = new Set(dataset.commits.map(item => item.id));
    if (dataset.experiments.some(item => !commitIds.has(item.commitId))) throw new Error('experiments.commitId: every experiment must reference an existing commit.');
    if (new TextEncoder().encode(JSON.stringify(dataset)).byteLength > datasetImportByteLimit) throw new Error('Dataset exceeds 500 KiB.');
    return { valid: true, dataset };
  } catch (error) { return { valid: false, error: error instanceof Error ? error.message : 'Invalid dataset.' }; }
}

export function loadPersonalDatasets(): Dataset[] {
  try {
    const raw = localStorage.getItem(personalDatasetsKey);
    if (!raw || raw.length > storedByteLimit) return [];
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value) || value.length > personalDatasetLimit) return [];
    const parsed = value.map(item => validateDataset(item));
    if (parsed.some(result => !result.valid)) return [];
    const result = parsed.map(item => (item as { valid: true; dataset: Dataset }).dataset);
    if (result.some(item => !/^personal-[a-f0-9-]{36}$/u.test(item.id)) || new Set(result.map(item => item.id)).size !== result.length) return [];
    return result;
  } catch { return []; }
}

export const allDatasets = (): Dataset[] => [...datasets, ...loadPersonalDatasets()];
export const createPersonalInstance = (dataset: Dataset): Instance => ({ id: `local-${dataset.id}`, datasetId: dataset.id, grants: [], notes: [] });

export function importPersonalDataset(json: string): Dataset {
  if (new TextEncoder().encode(json).byteLength > datasetImportByteLimit) throw new Error('Dataset exceeds 500 KiB.');
  let input: unknown;
  try { input = JSON.parse(json); } catch { throw new Error('Dataset must be valid JSON.'); }
  const result = validateDataset(input);
  if (!result.valid) throw new Error(result.error);
  const current = loadPersonalDatasets();
  if (current.length >= personalDatasetLimit) throw new Error('Keep at most 5 personal datasets. Export and remove one before importing another.');
  const dataset = { ...result.dataset, id: `personal-${crypto.randomUUID()}` };
  // A generated namespace is longer than many user IDs; enforce the final size too.
  const finalResult = validateDataset(dataset);
  if (!finalResult.valid) throw new Error(finalResult.error);
  try { localStorage.setItem(personalDatasetsKey, JSON.stringify([...current, dataset])); }
  catch { throw new Error('Browser storage is full or unavailable. Export or remove an existing personal dataset.'); }
  return dataset;
}

export function removePersonalDataset(id: string): void {
  if (!id.startsWith('personal-')) throw new Error('Platform datasets cannot be removed.');
  localStorage.setItem(personalDatasetsKey, JSON.stringify(loadPersonalDatasets().filter(item => item.id !== id)));
}

export function sampleDataset(): Dataset {
  return {
    id: 'my-research', name: 'My research', project: 'My first personal dataset', description: 'Replace these sample records with your own research data before importing.',
    experiments: [{ id: 'MY-001', name: 'Baseline experiment', model: 'MyModel', status: 'passed', psnr: 31.2, delta: 0.5, commitId: 'my-commit-1', date: '2026-10-17' }],
    commits: [{ id: 'my-commit-1', title: 'Record baseline', files: ['research/baseline.txt'] }],
    deadlines: [{ id: 'my-deadline-1', title: 'Review results', date: '2026-10-24', category: 'Review' }],
    papers: [{ id: 'my-paper-1', title: 'My reading notes', authors: 'My name', year: 2026, tag: 'Reading' }],
  };
}

export function downloadDataset(dataset: Dataset): void {
  const url = URL.createObjectURL(new Blob([JSON.stringify(dataset, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = `${dataset.id}.dataset.json`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
