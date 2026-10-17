import Ajv from 'ajv';
import schema from '../../spec/udi.schema.json';
import example from '../../examples/research-cockpit.udi.json';
import type { Capability, UDISpec } from './types';

const validateShape = new Ajv({ allErrors: true, strict: true }).compile(schema);
const expectedCapability = { experiment: 'experiments.read', commit: 'commits.read', deadline: 'deadlines.read', paper: 'papers.read' };
const expectedEntity = { metrics: 'experiment', table: 'experiment', 'bar-chart': 'experiment', timeline: 'deadline', collection: 'paper' };

export function validateSpec(input: unknown): { valid: true; spec: UDISpec } | { valid: false; errors: string[] } {
  if (!validateShape(input)) return { valid: false, errors: (validateShape.errors ?? []).map(e => `${e.instancePath || '/'} ${e.message}`) };
  const spec = input as unknown as UDISpec;
  const errors: string[] = [];
  for (const [name, list] of [['source', spec.sources], ['view', spec.views], ['action', spec.actions]] as const) {
    if (new Set(list.map(x => x.id)).size !== list.length) errors.push(`Duplicate ${name} ID`);
  }
  for (const source of spec.sources) {
    if (source.capability !== expectedCapability[source.entity]) errors.push(`Source ${source.id} has an incompatible capability`);
    if (!spec.capabilities.includes(source.capability)) errors.push(`Source ${source.id} capability is not declared`);
  }
  for (const view of spec.views) {
    const source = spec.sources.find(s => s.id === view.source);
    if (!source) errors.push(`View ${view.id} refers to a missing source`);
    else if (source.entity !== expectedEntity[view.type]) errors.push(`View ${view.id} has an incompatible source entity`);
    if (view.type !== 'table' && (view.filter !== undefined || view.groupBy !== undefined || view.highlightBelow !== undefined)) errors.push(`View ${view.id} uses table-only settings`);
  }
  for (const action of spec.actions) {
    if (!spec.capabilities.includes(action.capability)) errors.push(`Action ${action.id} capability is not declared`);
    if (!spec.sources.some(s => s.entity === 'experiment')) errors.push(`Action ${action.id} requires an experiment source`);
  }
  return errors.length ? { valid: false, errors } : { valid: true, spec: structuredClone(spec) };
}

export function assertSpec(input: unknown): UDISpec {
  const result = validateSpec(input);
  if (!result.valid) throw new Error(result.errors.join('; '));
  return result.spec;
}
export const initialSpec = (): UDISpec => assertSpec(example);

// Stable serialization for exact state comparison, not a cryptographic signature.
export function fingerprint(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(fingerprint).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${fingerprint((value as Record<string, unknown>)[key])}`).join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}

export function exportPackage(input: unknown): string {
  // Accept the specification only. Instance bindings, grants, results and history are not accepted.
  return JSON.stringify(assertSpec(input), null, 2) + '\n';
}
export function importPackage(text: string): UDISpec {
  if (new TextEncoder().encode(text).length > 64 * 1024) throw new Error('Package exceeds the 64 KiB limit.');
  return assertSpec(JSON.parse(text));
}
export function forkPackage(spec: UDISpec): UDISpec {
  const fork = structuredClone(spec);
  fork.metadata.id = `${spec.metadata.id.slice(0, 50)}-fork`;
  fork.metadata.title = `${spec.metadata.title.slice(0, 73)} (fork)`;
  fork.metadata.version = '0.1.0';
  return assertSpec(fork);
}
export const capabilityLabels: Record<Capability, string> = {
  'experiments.read': 'Read experiment results', 'commits.read': 'Read linked commits',
  'deadlines.read': 'Read project deadlines', 'papers.read': 'Read research library',
  'notes.write': 'Create local review notes',
};
