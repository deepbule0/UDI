import { applyProposal, planIntent } from '../core/planner';
import { assertSpec, capabilityLabels, fingerprint } from '../core/spec';
import type { StudioState } from '../core/session';
import type { AuditEvent, Capability, Operation, Proposal } from '../core/types';
import { allDatasets } from '../data/sources';

interface BaseReview { snapshot: string; summary: string }
export type AgentProposal =
  | (BaseReview & { kind: 'interface'; proposal: Proposal })
  | (BaseReview & { kind: 'binding'; datasetId: string })
  | (BaseReview & { kind: 'permission'; capability: Capability; granted: boolean });

// A review is tied to the exact visible instance as well as the definition.
// This is a stale-state guard, not an authentication boundary or signature.
export function agentSnapshot(state: StudioState): string {
  return fingerprint({ revision: state.revision, spec: state.spec, datasetId: state.datasetId, instances: state.instances });
}
const event = (kind: AuditEvent['kind'], message: string): AuditEvent => ({ id: crypto.randomUUID(), time: new Date().toISOString(), kind, message });
const audit = (state: StudioState, kind: AuditEvent['kind'], message: string) => [...state.audit, event(kind, message)].slice(-100);

export function reviewInterface(state: StudioState, proposal: Proposal): AgentProposal {
  const next = applyProposal(state.spec, state.revision, proposal);
  const checked = { ...proposal, additions: next.capabilities.filter(c => !state.spec.capabilities.includes(c)) };
  return { kind: 'interface', snapshot: agentSnapshot(state), summary: proposal.summary, proposal: checked };
}
export function proposeInterfaceOperation(state: StudioState, operation: Operation, summary: string): AgentProposal {
  return reviewInterface(state, { baseRevision: state.revision, baseFingerprint: fingerprint(state.spec), summary, operations: [operation], additions: [] });
}
export function proposeBinding(state: StudioState, datasetId: string): AgentProposal {
  const dataset = allDatasets().find(d => d.id === datasetId);
  if (!dataset || !state.instances[datasetId] || state.instances[datasetId].datasetId !== datasetId) throw new Error('This data source is unavailable. Refresh the source list.');
  if (datasetId === state.datasetId) throw new Error('This source is already connected.');
  return { kind: 'binding', datasetId, snapshot: agentSnapshot(state), summary: `Connect this interface to ${dataset.name}. Existing grants stay with their own instances.` };
}
export function proposePermission(state: StudioState, capability: Capability, granted: boolean): AgentProposal {
  if (!Object.hasOwn(capabilityLabels, capability) || !state.spec.capabilities.includes(capability)) throw new Error('The interface must request this capability before it can be granted.');
  if (state.instances[state.datasetId].grants.includes(capability) === granted) throw new Error('This permission already has the requested value.');
  return { kind: 'permission', capability, granted, snapshot: agentSnapshot(state), summary: `${granted ? 'Grant' : 'Revoke'} ${capability} for the current data instance only.` };
}

function normalized(text: string) { return text.trim().toLowerCase().replace(/[.!?。！？]+$/, '').trim(); }
const capabilityAliases: Record<string, Capability> = {
  experiment: 'experiments.read', experiments: 'experiments.read', 'experiment results': 'experiments.read', 'experiments.read': 'experiments.read', '实验': 'experiments.read', '实验结果': 'experiments.read',
  commit: 'commits.read', commits: 'commits.read', 'linked commits': 'commits.read', 'commits.read': 'commits.read', '提交': 'commits.read', '代码提交': 'commits.read',
  deadline: 'deadlines.read', deadlines: 'deadlines.read', 'deadlines.read': 'deadlines.read', '截止日期': 'deadlines.read',
  paper: 'papers.read', papers: 'papers.read', library: 'papers.read', 'papers.read': 'papers.read', '论文': 'papers.read', '论文库': 'papers.read',
  note: 'notes.write', notes: 'notes.write', 'note creation': 'notes.write', 'notes.write': 'notes.write', '笔记': 'notes.write', '创建笔记': 'notes.write',
};
export function planAgentCommand(text: string, state: StudioState): AgentProposal {
  if (!text.trim() || text.length > 500) throw new Error('Enter a command with 1–500 characters.');
  const command = normalized(text);
  const binding = command.match(/^(?:use|switch to|connect(?: to)?)\s+(.+)$/) ?? command.match(/^(?:使用|切换到|连接到)\s*(.+)$/);
  if (binding) {
    const wanted = normalized(binding[1]);
    const dataset = allDatasets().find(d => [d.id, d.name, `${d.id} lab`, `${d.id} 实验室`, `${d.id}实验室`].some(alias => normalized(alias) === wanted));
    if (dataset) return proposeBinding(state, dataset.id);
    // "Use a balanced layout" belongs to the interface grammar, not binding.
  }
  const permission = command.match(/^(grant|revoke)\s+(.+?)(?:\s+access)?$/);
  const chinese = command.match(/^(授予|允许|撤销|取消)\s*(.+?)(?:的)?(?:访问)?权限$/);
  if (permission || chinese) {
    const match = permission ?? chinese!;
    const capability = capabilityAliases[normalized(match[2])];
    if (!capability) throw new Error('Use a named capability: experiments, commits, deadlines, papers, or notes.');
    return proposePermission(state, capability, ['grant', '授予', '允许'].includes(match[1]));
  }
  return reviewInterface(state, planIntent(text, state.spec, state.revision));
}

export function applyAgentProposal(state: StudioState, review: AgentProposal): StudioState {
  if (review.snapshot !== agentSnapshot(state)) throw new Error('The workspace changed after this review. Propose the change again.');
  if (review.kind === 'interface') {
    const spec = applyProposal(state.spec, state.revision, review.proposal);
    return { ...state, spec, revision: state.revision + 1, history: [...state.history, state.spec].slice(-20), audit: audit(state, 'revision', review.summary) };
  }
  if (review.kind === 'binding') {
    proposeBinding(state, review.datasetId);
    return { ...state, datasetId: review.datasetId, audit: audit(state, 'binding', review.summary) };
  }
  proposePermission(state, review.capability, review.granted);
  const instance = state.instances[state.datasetId];
  const grants = review.granted ? [...instance.grants, review.capability] : instance.grants.filter(c => c !== review.capability);
  return { ...state, instances: { ...state.instances, [state.datasetId]: { ...instance, grants } }, audit: audit(state, 'permission', review.summary) };
}
export function undoAgentRevision(state: StudioState): StudioState {
  if (!state.history.length) throw new Error('There is no interface revision to undo.');
  return { ...state, spec: assertSpec(state.history[state.history.length - 1]), revision: state.revision + 1, history: state.history.slice(0, -1), audit: audit(state, 'revision', 'Restored the previous interface. Data bindings, permissions, and local notes were preserved.') };
}
