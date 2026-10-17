import { assertSpec, fingerprint } from './spec';
import type { Capability, Dataset, Instance, UDISpec } from './types';

export function assertCapability(spec: UDISpec, instance: Instance, capability: Capability): void {
  if (!spec.capabilities.includes(capability)) throw new Error(`Undeclared capability: ${capability}`);
  if (!instance.grants.includes(capability)) throw new Error(`Permission required: ${capability}`);
}
export function readSource(spec: UDISpec, instance: Instance, dataset: Dataset, sourceId: string) {
  if (instance.datasetId !== dataset.id) throw new Error('Binding belongs to a different instance.');
  const source = spec.sources.find(s => s.id === sourceId);
  if (!source) throw new Error(`Unknown source: ${sourceId}`);
  assertCapability(spec, instance, source.capability);
  const key = { experiment: 'experiments', commit: 'commits', deadline: 'deadlines', paper: 'papers' } as const;
  return structuredClone(dataset[key[source.entity]]);
}

export interface PreparedAction { actionId: string; instanceId: string; revision: number; specFingerprint: string; content: string }
export function prepareAction(spec: UDISpec, revision: number, instance: Instance, dataset: Dataset, actionId: string): PreparedAction {
  const safeSpec = assertSpec(spec);
  const action = safeSpec.actions.find(a => a.id === actionId);
  if (!action) throw new Error('Unknown action.');
  assertCapability(safeSpec, instance, action.capability);
  const source = safeSpec.sources.find(s => s.entity === 'experiment');
  if (!source) throw new Error('Missing experiment source.');
  const experiments = readSource(safeSpec, instance, dataset, source.id) as Dataset['experiments'];
  const failed = experiments.filter(e => e.status === 'failed');
  const content = `Review: ${dataset.project}\n${failed.length} failed experiments\n${failed.map(e => `${e.id}: ${e.name} (${e.delta.toFixed(2)} dB; commit ${e.commitId})`).join('\n')}`;
  return { actionId, instanceId: instance.id, revision, specFingerprint: fingerprint(safeSpec), content };
}

// The host owns confirmation. Recompute the exact payload at execution time so
// stale or edited previews, revoked grants and cross-instance approvals fail.
export function executeAction(spec: UDISpec, revision: number, instance: Instance, dataset: Dataset, preview: PreparedAction, confirmed: boolean): Instance {
  if (!confirmed) throw new Error('This write requires explicit confirmation.');
  if (preview.instanceId !== instance.id || preview.revision !== revision || preview.specFingerprint !== fingerprint(spec)) throw new Error('Action preview is stale. Review it again.');
  const current = prepareAction(spec, revision, instance, dataset, preview.actionId);
  if (fingerprint(current) !== fingerprint(preview)) throw new Error('Action data changed. Review it again.');
  return { ...instance, notes: [...instance.notes, current.content] };
}
