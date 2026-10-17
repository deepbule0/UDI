import { expect, it } from 'vitest';
import { proposalFromModel, requestOllama } from '../src/core/model-planner';
import { initialSpec } from '../src/core/spec';

it('rejects arbitrary model code, undeclared operation fields, and forged grants', () => {
  for (const output of [
    { summary: 'Run code', operations: [{ op: 'execute', value: 'fetch()' }] },
    { summary: 'Hide', operations: [{ op: 'visibility', viewId: 'deadlines', value: false, script: 'bad' }] },
    { summary: 'Grant', operations: [{ op: 'add-action' }], grants: ['notes.write'] },
  ]) expect(() => proposalFromModel(output, initialSpec(), 1)).toThrow('invalid operation');
});
it('computes capability additions locally and checks references', () => {
  const plan = proposalFromModel({ summary: 'Add a note action', operations: [{ op: 'add-action' }] }, initialSpec(), 1);
  expect(plan.additions).toEqual(['notes.write']);
  expect(() => proposalFromModel({ summary: 'Hide missing', operations: [{ op: 'visibility', viewId: 'absent', value: false }] }, initialSpec(), 1)).toThrow('absent');
});
it('sends only intent and definition to the loopback model', async () => {
  let sent: Record<string, unknown> = {};
  const transport = (async (url, options) => {
    expect(url).toBe('http://127.0.0.1:11434/api/chat');
    sent = JSON.parse(options!.body as string);
    return new Response(JSON.stringify({ message: { content: JSON.stringify({ summary: 'Filter failed', operations: [{ op: 'filter', value: 'failed' }] }) } }), { status: 200 });
  }) as typeof fetch;
  const output = await requestOllama('Focus on failed runs', initialSpec(), 'test-fixture-model', transport);
  expect(sent.stream).toBe(false);
  expect(sent.think).toBe(false);
  const text = JSON.stringify(sent);
  expect(text).not.toContain('EXP-048'); expect(text).not.toContain('local-aurora');
  expect(proposalFromModel(output, initialSpec(), 1).operations[0].op).toBe('filter');
});
it('propagates model failures without falling back to an invented success', async () => {
  const transport = (async () => new Response('{}', { status: 503 })) as typeof fetch;
  await expect(requestOllama('Show papers', initialSpec(), 'test-fixture-model', transport)).rejects.toThrow('503');
});
