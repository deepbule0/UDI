import { readFile, writeFile } from 'node:fs/promises';
import { applyProposal, planIntent } from '../src/core/planner';
import { initialSpec, validateSpec, exportPackage, importPackage, fingerprint } from '../src/core/spec';
import { createInstances, datasets } from '../src/data/fixtures';
import { readSource } from '../src/core/runtime';

const cases = JSON.parse(await readFile(new URL('../eval/cases.json', import.meta.url), 'utf8')) as { intent: string; expect: string }[];
const results = cases.map(c => {
  let actual = 'reject'; let validCandidate = true;
  try { const spec = initialSpec(); const proposal = planIntent(c.intent, spec, 1); actual = proposal.operations[0].op; validCandidate = validateSpec(applyProposal(spec, 1, proposal)).valid; } catch { /* Expected for unsupported cases. */ }
  return { ...c, actual, pass: actual === c.expect && validCandidate };
});
const spec = initialSpec(); const instances = createInstances();
const a = readSource(spec, instances.aurora, datasets[0], 'experiments');
const b = readSource(spec, instances.atlas, datasets[1], 'experiments');
const packageText = exportPackage(spec);
const invariants = [
  { name: 'round-trip definition', pass: fingerprint(importPackage(packageText)) === fingerprint(spec) },
  { name: 'same source resolves different datasets', pass: fingerprint(a) !== fingerprint(b) },
  { name: 'fixture records and local binding IDs excluded', pass: !['EXP-048', 'AUD-021', 'local-aurora', 'local-atlas'].some(value => packageText.includes(value)) },
];
const report = { suite: 'UDI 0.1 deterministic conformance; not an LLM benchmark', generatedAt: new Date().toISOString(), node: process.version, platform: process.platform, passed: results.filter(r => r.pass).length, total: results.length, results, invariants };
await writeFile(new URL('../docs/evaluation-results.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
process.stdout.write(`${report.passed}/${report.total} intent cases; ${invariants.filter(i => i.pass).length}/${invariants.length} lifecycle invariants.\nReport: docs/evaluation-results.json\n`);
if (results.some(r => !r.pass) || invariants.some(i => !i.pass)) process.exitCode = 1;
