import Ajv from 'ajv';
import outputSchema from '../../spec/planner-output.schema.json';
import { applyProposal } from './planner';
import { fingerprint } from './spec';
import type { Operation, Proposal, UDISpec } from './types';

export { outputSchema };
const validateOutput = new Ajv({ allErrors: true }).compile(outputSchema);
export function proposalFromModel(output: unknown, spec: UDISpec, revision: number): Proposal {
  if (!validateOutput(output)) throw new Error('Planner returned an invalid operation document. No changes were applied.');
  const safe = output as unknown as { summary: string; operations: Operation[] };
  if (!safe.operations.length) throw new Error(safe.summary);
  const proposal: Proposal = { ...structuredClone(safe), baseRevision: revision, baseFingerprint: fingerprint(spec), additions: [] };
  const next = applyProposal(spec, revision, proposal);
  proposal.additions = next.capabilities.filter(c => !spec.capabilities.includes(c));
  return proposal;
}

export async function requestOllama(intent: string, spec: UDISpec, model: string, transport: typeof fetch = fetch): Promise<unknown> {
  const response = await transport('http://127.0.0.1:11434/api/chat', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(45_000),
    body: JSON.stringify({
      model, stream: false, think: false, format: outputSchema, options: { temperature: 0, num_predict: 1200 },
      messages: [
        { role: 'system', content: `Translate a user's interface revision into the supplied operation schema. You cannot execute actions or grant permissions. Return JSON only. A failed/unsuccessful run means filter value "failed". To add or show the paper library, use {"op":"add-papers"}; it creates the panel if absent. Never use visibility for a view ID that does not exist in the package. To add note creation use {"op":"add-action"}; this only requests access. Papers are a local library panel, not live recommendations. Focus hides secondary panels. If the request cannot be expressed, return an empty operations array and explain the limitation in summary. Use future tense in summary: this is a proposal, not completed work. Schema: ${JSON.stringify(outputSchema)}` },
        { role: 'user', content: JSON.stringify({ intent, spec }) },
      ],
    }),
  });
  if (!response.ok) throw new Error(`Local model returned HTTP ${response.status}. Check Ollama and UDI_OLLAMA_MODEL.`);
  const body = await response.json() as { message?: { content?: unknown } };
  const content = body.message?.content;
  if (typeof content !== 'string' || content.length > 16_384) throw new Error('Invalid or oversized model response.');
  if (!content.trim()) throw new Error('Local model returned no JSON content. Check model compatibility and generation limits.');
  return JSON.parse(content);
}
