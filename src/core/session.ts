import { capabilityLabels, initialSpec, validateSpec } from './spec';
import { createInstances, datasets } from '../data/fixtures';
import type { AuditEvent, Instance, UDISpec } from './types';

export interface StudioState {
  spec: UDISpec; revision: number; history: UDISpec[];
  instances: Record<string, Instance>; datasetId: string; audit: AuditEvent[];
}
export const storageKey = 'udi-studio:0.1';
export function freshState(): StudioState {
  return { spec: initialSpec(), revision: 1, history: [], instances: createInstances(), datasetId: 'aurora', audit: [] };
}
export function loadState(): StudioState {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw || raw.length > 300_000) return freshState();
    const saved = JSON.parse(raw) as StudioState;
    if (!validateSpec(saved.spec).valid || !Number.isSafeInteger(saved.revision) || saved.revision < 1 || !datasets.some(d => d.id === saved.datasetId)) return freshState();
    const defaults = createInstances();
    for (const key of Object.keys(defaults)) {
      const item = saved.instances?.[key];
      if (!item || item.id !== defaults[key].id || item.datasetId !== key || !Array.isArray(item.grants) || !Array.isArray(item.notes)) return freshState();
      defaults[key].grants = item.grants.filter(c => Object.hasOwn(capabilityLabels, c));
      defaults[key].notes = item.notes.filter(n => typeof n === 'string').slice(-30);
    }
    return { ...saved, instances: defaults, history: (saved.history ?? []).filter(s => validateSpec(s).valid).slice(-20), audit: (saved.audit ?? []).filter(a => typeof a.message === 'string' && typeof a.time === 'string').slice(-100) };
  } catch { return freshState(); }
}
