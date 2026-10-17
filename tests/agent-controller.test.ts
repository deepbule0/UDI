import { describe, expect, it } from 'vitest';
import { freshState } from '../src/core/session';
import { exportPackage } from '../src/core/spec';
import { applyAgentProposal, planAgentCommand, proposeBinding, proposeInterfaceOperation, proposePermission, undoAgentRevision } from '../src/agent/controller';

describe('reviewed agent controls', () => {
  it('proposes a chat revision without changing state and applies it through the core planner', () => {
    const state = freshState();
    const before = structuredClone(state);
    const review = planAgentCommand('Show only failed experiments', state);
    expect(state).toEqual(before);
    const next = applyAgentProposal(state, review);
    expect(next.spec.views.find(v => v.type === 'table')?.filter).toBe('failed');
    expect(next.revision).toBe(2);
    expect(next.history).toEqual([state.spec]);
    expect(next.instances).toEqual(state.instances);
    expect(next.audit.at(-1)?.kind).toBe('revision');
  });
  it('uses the same revision path for a settings control', () => {
    const state = freshState();
    const next = applyAgentProposal(state, proposeInterfaceOperation(state, { op: 'layout', value: 'focus' }, 'Focus layout'));
    expect(next.spec.layout).toBe('focus');
    expect(next.revision).toBe(2);
    expect(next.history).toHaveLength(1);
  });
  it('validates controls against the current package before showing a review', () => {
    const state = freshState();
    expect(() => proposeInterfaceOperation(state, { op: 'visibility', viewId: 'missing', value: true }, 'Show missing panel')).toThrow('absent');
  });
  it.each(['Use Atlas lab', 'Switch to Atlas lab', '切换到 Atlas lab', '使用Atlas实验室'])('reviews binding command %s without moving credentials or notes', command => {
    const state = freshState();
    state.instances.aurora.notes.push('Aurora private note');
    state.instances.atlas.grants = ['commits.read'];
    const review = planAgentCommand(command, state);
    expect(state.datasetId).toBe('aurora');
    expect(review.kind).toBe('binding');
    const next = applyAgentProposal(state, review);
    expect(next.datasetId).toBe('atlas');
    expect(next.instances).toEqual(state.instances);
    expect(next.revision).toBe(1);
    expect(next.audit.at(-1)?.kind).toBe('binding');
  });
  it.each(['Revoke experiment access', '撤销实验访问权限'])('reviews permission command %s and applies it to one instance', command => {
    const state = freshState();
    const review = planAgentCommand(command, state);
    expect(state.instances.aurora.grants).toContain('experiments.read');
    const next = applyAgentProposal(state, review);
    expect(next.instances.aurora.grants).not.toContain('experiments.read');
    expect(next.instances.atlas).toEqual(state.instances.atlas);
    expect(next.spec).toEqual(state.spec);
    expect(next.history).toHaveLength(0);
    expect(next.audit.at(-1)?.kind).toBe('permission');
  });
  it('grants an explicitly requested capability only after approval', () => {
    const state = freshState();
    state.instances.aurora.grants = [];
    const review = planAgentCommand('Grant commit access', state);
    expect(state.instances.aurora.grants).toEqual([]);
    expect(applyAgentProposal(state, review).instances.aurora.grants).toEqual(['commits.read']);
  });
  it('rejects permissions that the interface has not requested and unknown sources', () => {
    const state = freshState();
    expect(() => proposePermission(state, 'notes.write', true)).toThrow('request');
    expect(() => proposePermission(state, 'admin.write' as never, true)).toThrow('request');
    expect(() => proposeBinding(state, 'unavailable')).toThrow('unavailable');
  });
  it('adding note creation requests a capability without granting it', () => {
    const state = freshState();
    const review = planAgentCommand('添加审阅笔记操作', state);
    if (review.kind !== 'interface') throw new Error('Expected interface review');
    expect(review.proposal.additions).toEqual(['notes.write']);
    const next = applyAgentProposal(state, review);
    expect(next.spec.capabilities).toContain('notes.write');
    expect(next.instances.aurora.grants).not.toContain('notes.write');
    expect(next.instances.aurora.notes).toHaveLength(0);
  });
  it.each(['revision', 'spec', 'binding', 'grant', 'target-grant', 'note'] as const)('rejects a reviewed change after a concurrent %s change', change => {
    const state = freshState();
    const review = proposePermission(state, 'experiments.read', false);
    const next = structuredClone(state);
    if (change === 'revision') next.revision++;
    if (change === 'spec') next.spec.metadata.title = 'Changed';
    if (change === 'binding') next.datasetId = 'atlas';
    if (change === 'grant') next.instances.aurora.grants = [];
    if (change === 'target-grant') next.instances.atlas.grants = [];
    if (change === 'note') next.instances.aurora.notes.push('New local write');
    expect(() => applyAgentProposal(next, review)).toThrow('workspace changed');
  });
  it('cannot reuse an applied permission review', () => {
    const state = freshState();
    const review = proposePermission(state, 'experiments.read', false);
    const next = applyAgentProposal(state, review);
    expect(() => applyAgentProposal(next, review)).toThrow('workspace changed');
  });
  it('undo restores the interface while retaining binding, current grants, and completed writes', () => {
    let state = freshState();
    state = applyAgentProposal(state, planAgentCommand('Focus on experiments', state));
    state = applyAgentProposal(state, proposeBinding(state, 'atlas'));
    state = applyAgentProposal(state, proposePermission(state, 'commits.read', false));
    state.instances.atlas.notes.push('Previously confirmed local write');
    const next = undoAgentRevision(state);
    expect(next.spec.layout).toBe('balanced');
    expect(next.revision).toBe(3);
    expect(next.datasetId).toBe('atlas');
    expect(next.instances).toEqual(state.instances);
    expect(next.history).toHaveLength(0);
    expect(() => undoAgentRevision(next)).toThrow('no interface revision');
  });
  it('bounds revision and audit history and exports no chat or instance state', () => {
    let state = freshState();
    state.audit = Array.from({ length: 100 }, (_, i) => ({ id: String(i), time: '2026-10-17', kind: 'revision', message: 'old' }));
    state.history = Array.from({ length: 20 }, () => structuredClone(state.spec));
    state = applyAgentProposal(state, planAgentCommand('Use a balanced layout', state));
    expect(state.audit).toHaveLength(100);
    expect(state.history).toHaveLength(20);
    const exported = JSON.parse(exportPackage(state.spec));
    expect(exported).not.toHaveProperty('instances');
    expect(exported).not.toHaveProperty('chat');
    expect(exported).not.toHaveProperty('audit');
  });
});
