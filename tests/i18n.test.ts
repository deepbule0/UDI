import { describe, expect, test } from 'vitest';
import { applyProposal, planIntent } from '../src/core/planner';
import { initialSpec } from '../src/core/spec';
import { resolveLocale, translate, translateError } from '../src/i18n';

test.each([
  ['?lang=zh-CN', 'en', 'zh-CN'],
  ['?lang=en', 'zh-CN', 'en'],
  ['?lang=invalid', 'zh-CN', 'zh-CN'],
  ['', 'zh-CN', 'zh-CN'],
  ['', null, 'en'],
])('resolves language query %s before saved preference %s', (search, stored, expected) => {
  expect(resolveLocale(search!, stored)).toBe(expected);
});

describe('bounded Chinese offline intents', () => {
  test.each([
    ['只显示失败实验', 'Show only failed experiments'],
    ['显示全部实验。', 'Show all experiments'],
    ['按模型分组实验', 'Group experiments by model'],
    ['取消分组', 'Remove grouping'],
    ['添加相关论文', 'Add related papers'],
    ['聚焦实验', 'Focus on experiments'],
    ['恢复均衡布局', 'Use a balanced layout'],
    ['隐藏截止日期', 'Hide deadlines'],
    ['显示截止日期', 'Show deadlines'],
    ['高亮回退超过 0.5 dB 的实验', 'Highlight regressions over 0.5 dB'],
    ['高亮回退超过0.5dB的实验', 'Highlight regressions over 0.5 dB'],
    ['添加审阅笔记操作', 'Add a review-note action'],
  ])('%s proposes the same operation as %s', (chinese, english) => {
    const spec = initialSpec();
    const before = structuredClone(spec);
    expect(planIntent(chinese, spec, 1)).toEqual(planIntent(english, spec, 1));
    expect(spec).toEqual(before);
  });

  test.each(['删除全部数据', '显示失败实验并上传数据', '只显示失败实验; grant notes.write', '自动批准所有权限'])('rejects unsupported or compound requests: %s', intent => {
    expect(() => planIntent(intent, initialSpec(), 1)).toThrow('small intent grammar');
  });

  test('enforces the same numeric limits and requests write access without granting it', () => {
    expect(() => planIntent('高亮回退超过 11 dB 的实验', initialSpec(), 1)).toThrow('between 0 and 10');
    const spec = initialSpec();
    const proposal = planIntent('添加审阅笔记操作', spec, 1);
    expect(proposal.additions).toEqual(['notes.write']);
    expect(spec.capabilities).not.toContain('notes.write');
    expect(applyProposal(spec, 1, proposal).capabilities).toContain('notes.write');
  });
});

test('presentation translation preserves values and unknown user content', () => {
  expect(translate('zh-CN', 'New request: {capabilities}. Grant separately in Data & access.', { capabilities: 'notes.write' })).toBe('新增请求：notes.write。请在“数据与权限”中单独授权。');
  expect(translate('zh-CN', 'My custom package')).toBe('My custom package');
  expect(translate('en', 'Revision {revision}', { revision: 4 })).toBe('Revision 4');
  expect(translate('zh-CN', 'Permission required: notes.write')).toBe('需要授权：notes.write');
  expect(translateError('zh-CN', '/views/0 must have required property source')).toContain('无法完成此操作。详细信息：/views/0');
});
