import { beforeEach, expect, test, vi } from 'vitest';
import { freshState, loadState, resetStudioState, storageKey } from '../src/core/session';
import { importPersonalDataset, personalDatasetsKey, removePersonalDataset, sampleDataset, createPersonalInstance } from '../src/data/sources';

beforeEach(() => {
  const items = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (key: string) => items.get(key) ?? null, setItem: (key: string, value: string) => items.set(key, value), removeItem: (key: string) => items.delete(key) });
});

test('a personal binding, grants, notes, and interface revision survive validated reload', () => {
  const data = importPersonalDataset(JSON.stringify(sampleDataset()));
  const state = freshState();
  state.datasetId = data.id; state.revision = 9;
  state.instances[data.id] = { ...createPersonalInstance(data), grants: ['experiments.read'], notes: ['private review'] };
  localStorage.setItem(storageKey, JSON.stringify(state));
  expect(loadState()).toEqual(state);
});

test('missing personal data falls back to platform binding while preserving the interface', () => {
  const data = importPersonalDataset(JSON.stringify(sampleDataset()));
  const state = freshState(); state.datasetId = data.id; state.revision = 7;
  state.spec.metadata.title = 'My persistent interface';
  localStorage.setItem(storageKey, JSON.stringify(state));
  removePersonalDataset(data.id);
  const restored = loadState();
  expect(restored.datasetId).toBe('aurora'); expect(restored.revision).toBe(7);
  expect(restored.spec).toEqual(state.spec); expect(restored.instances[data.id]).toBeUndefined();
});

test('reset removes personal records and the locally retained conversation', () => {
  importPersonalDataset(JSON.stringify(sampleDataset()));
  localStorage.setItem('udi-agent:chat:0.1', '[{"role":"user","text":"private request"}]');
  const reset = resetStudioState();
  expect(Object.keys(reset.instances)).toEqual(['aurora', 'atlas']);
  expect(localStorage.getItem(personalDatasetsKey)).toBeNull();
  expect(localStorage.getItem('udi-agent:chat:0.1')).toBeNull();
});
