export type Capability = 'experiments.read' | 'commits.read' | 'deadlines.read' | 'papers.read' | 'notes.write';
export type Entity = 'experiment' | 'commit' | 'deadline' | 'paper';
export type ViewType = 'metrics' | 'table' | 'bar-chart' | 'timeline' | 'collection';
export interface View {
  id: string; type: ViewType; title: string; source: string; visible: boolean;
  filter?: 'all' | 'failed'; groupBy?: 'none' | 'model'; highlightBelow?: number;
}
export interface UDISpec {
  specVersion: '0.1';
  metadata: { id: string; title: string; description: string; version: string };
  layout: 'balanced' | 'focus';
  capabilities: Capability[];
  sources: { id: string; entity: Entity; capability: Capability }[];
  views: View[];
  actions: { id: string; title: string; capability: 'notes.write'; handler: 'create-review-note' }[];
}
export interface Experiment {
  id: string; name: string; model: string; status: 'passed' | 'failed' | 'running';
  psnr: number; delta: number; commitId: string; date: string;
}
export interface Commit { id: string; title: string; files: string[] }
export interface Deadline { id: string; title: string; date: string; category: string }
export interface Paper { id: string; title: string; authors: string; year: number; tag: string }
export interface Dataset {
  id: string; name: string; project: string; description: string;
  experiments: Experiment[]; commits: Commit[]; deadlines: Deadline[]; papers: Paper[];
}
export interface Instance {
  id: string; datasetId: string; grants: Capability[]; notes: string[];
}
export type Operation =
  | { op: 'filter'; value: 'all' | 'failed' }
  | { op: 'group'; value: 'none' | 'model' }
  | { op: 'layout'; value: 'balanced' | 'focus' }
  | { op: 'visibility'; viewId: string; value: boolean }
  | { op: 'add-papers' }
  | { op: 'highlight'; value: number }
  | { op: 'add-action' };
export interface Proposal {
  baseRevision: number; baseFingerprint: string; summary: string;
  operations: Operation[]; additions: Capability[];
}
export interface AuditEvent { id: string; time: string; kind: 'revision' | 'permission' | 'action' | 'binding' | 'package'; message: string }
