import { writeFile } from 'node:fs/promises';
import os from 'node:os';
import { requestOllama, proposalFromModel } from '../src/core/model-planner';
import { initialSpec } from '../src/core/spec';

const model = process.env.UDI_OLLAMA_MODEL;
if (!model) throw new Error('Set UDI_OLLAMA_MODEL to an installed local model.');
const tags = await (await fetch('http://127.0.0.1:11434/api/tags')).json() as { models: { name: string; digest: string }[] };
const version = await (await fetch('http://127.0.0.1:11434/api/version')).json();
const cases = [
  { intent: 'Show only unsuccessful experiments and include the paper library.', expect: 'filter-and-library' },
  { intent: 'Send a follow-up email to everyone in the project.', expect: 'reject' },
];
const results = [];
for (const c of cases) {
  const start = performance.now();
  try {
    const output = await requestOllama(c.intent, initialSpec(), model) as { summary: string; operations: { op: string; value?: string }[] };
    let pass = false;
    if (c.expect === 'reject') pass = Array.isArray(output.operations) && output.operations.length === 0;
    else { const plan = proposalFromModel(output, initialSpec(), 1); pass = plan.operations.some(o => o.op === 'filter' && o.value === 'failed') && plan.operations.some(o => o.op === 'add-papers'); }
    results.push({ ...c, pass, elapsedMs: Math.round(performance.now() - start), output });
  } catch (e) { results.push({ ...c, pass: false, elapsedMs: Math.round(performance.now() - start), error: String(e) }); }
}
const report = { suite: 'Two-case local-model smoke test; not a quality benchmark', generatedAt: new Date().toISOString(), model, digest: tags.models.find(m => m.name === model)?.digest ?? null, ollama: version, generation: { think: false, temperature: 0, num_predict: 1200, plannerSchema: '0.1' }, node: process.version, host: { platform: os.platform(), arch: os.arch(), cpu: os.cpus()[0]?.model, memoryGiB: Math.round(os.totalmem() / 2 ** 30), inferenceDevice: 'not measured' }, results };
await writeFile(new URL('../docs/model-smoke-results.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
process.stdout.write(`${results.filter(r => r.pass).length}/${results.length} model smoke cases. See docs/model-smoke-results.json.\n`);
if (results.some(r => !r.pass)) process.exitCode = 1;
