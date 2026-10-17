import { createServer } from 'node:http';
import { assertSpec } from '../src/core/spec';
import { proposalFromModel, requestOllama } from '../src/core/model-planner';

const model = process.env.UDI_OLLAMA_MODEL;
if (!model) throw new Error('Set UDI_OLLAMA_MODEL to the exact name of a model installed in your local Ollama. See docs/AGENT.md.');
let busy = false;
createServer(async (request, response) => {
  const reply = (status: number, value: unknown) => { response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); response.end(JSON.stringify(value)); };
  const localHosts = ['127.0.0.1', 'localhost'];
  try {
    const host = new URL(`http://${request.headers.host}`).hostname;
    const origin = request.headers.origin ? new URL(request.headers.origin) : null;
    if (!localHosts.includes(host) || (origin && (!localHosts.includes(origin.hostname) || origin.protocol !== 'http:'))) { reply(403, { error: 'Loopback clients only.' }); return; }
    if (request.method !== 'POST' || request.url !== '/api/plan') { reply(404, { error: 'Not found.' }); return; }
    if (!request.headers['content-type']?.startsWith('application/json')) { reply(415, { error: 'Expected application/json.' }); return; }
    if (busy) { reply(429, { error: 'A proposal is already being generated.' }); return; }
    busy = true;
    try {
      let bytes = 0; const chunks: Buffer[] = [];
      for await (const chunk of request) { bytes += chunk.length; if (bytes > 65_536) throw new Error('Request exceeds 64 KiB.'); chunks.push(Buffer.from(chunk)); }
      const input = JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>;
      if (typeof input.intent !== 'string' || input.intent.length < 1 || input.intent.length > 300 || !Number.isSafeInteger(input.revision) || Number(input.revision) < 1) throw new Error('Invalid planning request.');
      if (Object.keys(input).some(key => !['intent', 'spec', 'revision'].includes(key))) throw new Error('Only intent, spec, and revision are accepted.');
      const spec = assertSpec(input.spec);
      const output = await requestOllama(input.intent, spec, model);
      const proposal = proposalFromModel(output, spec, Number(input.revision));
      reply(200, { summary: proposal.summary, operations: proposal.operations });
    } finally { busy = false; }
  } catch (error) { reply(400, { error: error instanceof Error ? error.message : 'Planning failed.' }); }
}).listen(4179, '127.0.0.1', () => process.stdout.write('UDI local planner listening at http://127.0.0.1:4179 (Ollama on port 11434).\n'));
