import { assertSpec, fingerprint } from './spec';
import type { Capability, Operation, Proposal, UDISpec } from './types';

export const suggestedIntents = ['Show only failed experiments', 'Group experiments by model', 'Add related papers', 'Focus on experiments', 'Add a review-note action'];

// Exact aliases keep Chinese inputs within the same bounded operation grammar.
// They do not infer additional operations or silently accept compound requests.
const chineseIntents: Record<string, string> = {
  '只显示失败实验': 'show only failed experiments', '只显示失败的实验': 'show only failed experiments',
  '显示失败实验': 'show only failed experiments', '显示失败的实验': 'show only failed experiments',
  '显示全部实验': 'show all experiments', '显示所有实验': 'show all experiments', '清除筛选': 'clear filter',
  '按模型分组实验': 'group experiments by model', '按模型分组': 'group experiments by model',
  '取消实验分组': 'ungroup experiments', '取消分组': 'remove grouping',
  '添加相关论文': 'add related papers', '显示相关论文': 'show related papers', '添加论文': 'add papers', '显示论文': 'show papers',
  '聚焦实验': 'focus on experiments', '使用紧凑布局': 'use a compact layout',
  '使用均衡布局': 'use a balanced layout', '恢复均衡布局': 'use a balanced layout', '重置布局': 'reset layout',
  '隐藏截止日期': 'hide deadlines', '显示截止日期': 'show deadlines',
  '添加审阅笔记操作': 'add a review-note action', '添加审阅笔记按钮': 'add a review-note action',
};

function normalizeIntent(intent: string): string {
  const text = intent.trim().toLowerCase().replace(/[.!?。！？]+$/, '').trim();
  if (Object.hasOwn(chineseIntents, text)) return chineseIntents[text];
  const threshold = text.match(/^(?:高亮|突出显示)回退(?:超过|大于)\s*(\d+(?:\.\d+)?)\s*db\s*(?:的实验)?$/);
  return threshold ? `highlight regressions over ${threshold[1]} db` : text;
}

// A deliberately bounded, offline planner. No LLM or external request is hidden here.
export function planIntent(intent: string, spec: UDISpec, revision: number): Proposal {
  const text = normalizeIntent(intent);
  const operations: Operation[] = [];
  let summary = '';
  if (/^(show (only )?failed experiments|filter (to )?failed experiments)$/.test(text)) { operations.push({ op: 'filter', value: 'failed' }); summary = 'Show failed experiments in the experiment table.'; }
  else if (/^(show all experiments|clear (the )?filter)$/.test(text)) { operations.push({ op: 'filter', value: 'all' }); summary = 'Restore all experiments in the experiment table.'; }
  else if (/^group (experiments )?by model$/.test(text)) { operations.push({ op: 'group', value: 'model' }); summary = 'Group the experiment table by model.'; }
  else if (/^(ungroup experiments|remove grouping)$/.test(text)) { operations.push({ op: 'group', value: 'none' }); summary = 'Remove model grouping.'; }
  else if (/^(add|show) (related )?papers$/.test(text)) { operations.push({ op: 'add-papers' }); summary = 'Add a research-library panel using the declared papers source.'; }
  else if (/^(focus on experiments|use a compact layout)$/.test(text)) { operations.push({ op: 'layout', value: 'focus' }); summary = 'Focus on experiment metrics and the table; hide secondary panels until balanced layout is restored.'; }
  else if (/^(use a balanced layout|reset layout)$/.test(text)) { operations.push({ op: 'layout', value: 'balanced' }); summary = 'Restore the balanced workspace layout.'; }
  else if (/^(hide|show) deadlines$/.test(text)) { operations.push({ op: 'visibility', viewId: 'deadlines', value: text.startsWith('show') }); summary = `${text.startsWith('show') ? 'Show' : 'Hide'} the deadline panel.`; }
  else if (/^highlight regressions (over|above) (\d+(\.\d+)?) db$/.test(text)) {
    const value = Number(text.match(/(\d+(\.\d+)?) db$/)?.[1]);
    if (value > 10) throw new Error('Choose a regression threshold between 0 and 10 dB.');
    operations.push({ op: 'highlight', value: -value }); summary = `Highlight PSNR changes below −${value} dB.`;
  }
  else if (/^add (a )?review[ -]note action$/.test(text)) { operations.push({ op: 'add-action' }); summary = 'Add a local review-note action. This requests notes.write; it does not grant it.'; }
  else throw new Error('This offline planner supports a small intent grammar. Try a suggestion, “Show all experiments”, “Hide deadlines”, or “Highlight regressions over 0.5 dB”.');
  const additions: Capability[] = operations.some(o => o.op === 'add-action') && !spec.capabilities.includes('notes.write') ? ['notes.write'] : [];
  return { baseRevision: revision, baseFingerprint: fingerprint(spec), summary, operations, additions };
}

export function applyProposal(spec: UDISpec, revision: number, proposal: Proposal): UDISpec {
  if (proposal.baseRevision !== revision || proposal.baseFingerprint !== fingerprint(spec)) throw new Error('This proposal is stale. Generate it again against the current revision.');
  const next = structuredClone(spec);
  for (const operation of proposal.operations) {
    switch (operation.op) {
      case 'filter': case 'group': case 'highlight': {
        const table = next.views.find(v => v.type === 'table');
        if (!table) throw new Error('This package has no experiment table.');
        if (operation.op === 'filter') table.filter = operation.value;
        else if (operation.op === 'group') table.groupBy = operation.value;
        else table.highlightBelow = operation.value;
        break;
      }
      case 'layout': next.layout = operation.value; break;
      case 'visibility': {
        const view = next.views.find(v => v.id === operation.viewId);
        if (!view) throw new Error('The requested panel is absent from this package.');
        view.visible = operation.value; break;
      }
      case 'add-papers': {
        const source = next.sources.find(s => s.entity === 'paper');
        if (!source) throw new Error('This package has no declared paper source.');
        const view = next.views.find(v => v.id === 'papers');
        if (view) view.visible = true;
        else next.views.push({ id: 'papers', type: 'collection', title: 'From your library', source: source.id, visible: true });
        break;
      }
      case 'add-action':
        if (!next.capabilities.includes('notes.write')) next.capabilities.push('notes.write');
        if (!next.actions.some(a => a.id === 'review-note')) next.actions.push({ id: 'review-note', title: 'Create review note', capability: 'notes.write', handler: 'create-review-note' });
        break;
      default: throw new Error('Unknown operation.');
    }
  }
  return assertSpec(next);
}
