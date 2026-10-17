import { beforeEach, describe, expect, it, vi } from 'vitest';
import { allDatasets, createPersonalInstance, datasetImportByteLimit, importPersonalDataset, loadPersonalDatasets, personalDatasetsKey, removePersonalDataset, sampleDataset, validateDataset } from '../src/data/sources';
import { datasets } from '../src/data/fixtures';
import { exportPackage, initialSpec } from '../src/core/spec';

beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => { store.set(key, value); }, removeItem: (key: string) => { store.delete(key); }, clear: () => store.clear() });
});

describe('personal dataset boundary', () => {
  it('accepts normalized sample and platform shapes without mutating either', () => {
    const original = sampleDataset(); const before = structuredClone(original); const result = validateDataset(original);
    expect(result.valid).toBe(true);
    if (!result.valid) throw new Error(result.error);
    result.dataset.experiments[0].name = 'Changed';
    expect(original).toEqual(before);
    for (const dataset of datasets) expect(validateDataset(dataset).valid).toBe(true);
  });
  it('assigns a fresh private namespace even if input impersonates a platform ID', () => {
    const input = { ...sampleDataset(), id: 'aurora', name: 'PRIVATE_DATA_SENTINEL' };
    const first = importPersonalDataset(JSON.stringify(input)); const second = importPersonalDataset(JSON.stringify(input));
    expect(first.id).toMatch(/^personal-[a-f0-9-]{36}$/u); expect(second.id).not.toBe(first.id);
    expect(allDatasets().slice(0, 2)).toEqual(datasets);
    expect(allDatasets().find(dataset => dataset.id === 'aurora')?.name).toBe('Aurora lab');
    expect(loadPersonalDatasets()).toEqual([first, second]);
    expect(exportPackage(initialSpec())).not.toContain('PRIVATE_DATA_SENTINEL');
  });
  it('creates an instance with no implicit grants, notes, or shared references', () => {
    const dataset = importPersonalDataset(JSON.stringify(sampleDataset()));
    const first = createPersonalInstance(dataset); const second = createPersonalInstance(dataset);
    first.grants.push('notes.write'); first.notes.push('local note');
    expect(second).toEqual({ id: `local-${dataset.id}`, datasetId: dataset.id, grants: [], notes: [] });
  });
  it('limits the raw UTF-8 import before parsing', () => {
    expect(() => importPersonalDataset(' '.repeat(datasetImportByteLimit + 1))).toThrow('500 KiB');
    expect(() => importPersonalDataset('中'.repeat(Math.floor(datasetImportByteLimit / 3) + 1))).toThrow('500 KiB');
    expect(loadPersonalDatasets()).toEqual([]);
  });
  it('rejects malformed JSON and unexpected executable or credential fields', () => {
    expect(() => importPersonalDataset('{invalid')).toThrow('valid JSON');
    for (const key of ['credentials', 'url', 'script', '__proto__']) {
      const object = JSON.parse(JSON.stringify(sampleDataset())) as Record<string, unknown>; Object.defineProperty(object, key, { value: 'unsafe', enumerable: true });
      expect(validateDataset(object).valid).toBe(false);
    }
    expect(loadPersonalDatasets()).toEqual([]);
  });
  it('validates finite numeric values, status, calendar dates, and integer years', () => {
    for (const value of [NaN, Infinity, -Infinity, -1, '32']) { const input = sampleDataset(); input.experiments[0].psnr = value as number; expect(validateDataset(input).valid).toBe(false); }
    const status = sampleDataset(); status.experiments[0].status = 'executed' as 'passed'; expect(validateDataset(status).valid).toBe(false);
    const date = sampleDataset(); date.experiments[0].date = '2026-02-30'; expect(validateDataset(date).valid).toBe(false);
    const year = sampleDataset(); year.papers[0].year = 2026.5; expect(validateDataset(year).valid).toBe(false);
  });
  it('rejects duplicate IDs and missing commit references', () => {
    const duplicates = sampleDataset(); duplicates.commits.push(structuredClone(duplicates.commits[0])); expect(validateDataset(duplicates).valid).toBe(false);
    const missing = sampleDataset(); missing.experiments[0].commitId = 'missing'; expect(validateDataset(missing).valid).toBe(false);
  });
  it('caps records, filenames, identifiers, and field lengths', () => {
    const records = sampleDataset(); records.papers = Array.from({ length: 201 }, (_, i) => ({ ...records.papers[0], id: `paper-${i}` })); expect(validateDataset(records).valid).toBe(false);
    const files = sampleDataset(); files.commits[0].files = Array(41).fill('file.txt'); expect(validateDataset(files).valid).toBe(false);
    const names = sampleDataset(); names.name = 'a'.repeat(101); expect(validateDataset(names).valid).toBe(false);
    const id = sampleDataset(); id.id = '../aurora'; expect(validateDataset(id).valid).toBe(false);
  });
  it.each(['<script>alert(1)</script>', 'https://example.com/data', 'javascript:alert(1)', 'data:text/html,unsafe', 'name\u0000hidden'])('rejects non-plain text %s', value => {
    const input = sampleDataset(); input.description = value; expect(validateDataset(input).valid).toBe(false);
  });
  it('limits the number of local datasets without losing the existing five', () => {
    for (let i = 0; i < 5; i++) importPersonalDataset(JSON.stringify(sampleDataset()));
    const before = localStorage.getItem(personalDatasetsKey);
    expect(() => importPersonalDataset(JSON.stringify(sampleDataset()))).toThrow('at most 5');
    expect(localStorage.getItem(personalDatasetsKey)).toBe(before);
  });
  it('never removes platform content and removes only the selected personal dataset', () => {
    const first = importPersonalDataset(JSON.stringify(sampleDataset())); const second = importPersonalDataset(JSON.stringify(sampleDataset()));
    expect(() => removePersonalDataset('aurora')).toThrow('cannot be removed');
    removePersonalDataset(first.id); expect(loadPersonalDatasets()).toEqual([second]); expect(allDatasets().filter(dataset => !dataset.id.startsWith('personal-'))).toEqual(datasets);
  });
  it('fails closed for corrupt or namespace-tampered local content', () => {
    localStorage.setItem(personalDatasetsKey, '{bad'); expect(loadPersonalDatasets()).toEqual([]);
    localStorage.setItem(personalDatasetsKey, JSON.stringify([sampleDataset()])); expect(loadPersonalDatasets()).toEqual([]);
    const input = importPersonalDataset(JSON.stringify(sampleDataset())); localStorage.setItem(personalDatasetsKey, JSON.stringify([input, input])); expect(loadPersonalDatasets()).toEqual([]);
  });
  it('reports denied browser storage instead of claiming an import succeeded', () => {
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => { throw new Error('QuotaExceededError'); } });
    expect(() => importPersonalDataset(JSON.stringify(sampleDataset()))).toThrow('storage is full or unavailable');
    expect(loadPersonalDatasets()).toEqual([]);
  });
});
