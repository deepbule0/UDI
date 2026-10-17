# Optional local-model planner

The default demo works without a model. This optional development bridge lets a locally installed Ollama model translate natural-language edits into the same bounded operation vocabulary.

## Run it

Install and start [Ollama](https://docs.ollama.com/), then install a model that supports structured JSON outputs and record its exact local model name. Model selection depends on your hardware; this project does not bundle or endorse a specific model.

In one terminal, set `UDI_OLLAMA_MODEL` to that installed name and run:

```sh
npm run agent
```

PowerShell example, replacing the quoted name with your installed model:

```powershell
$env:UDI_OLLAMA_MODEL = 'your-installed-model-name'
npm run agent
```

In a second terminal:

```sh
npm run dev -- --port 4178
```

Select **Local model · Ollama** in the intent composer's planner selector. The bridge listens only on `127.0.0.1:4179`; Vite proxies `/api/plan` to it. Ollama is expected on `127.0.0.1:11434`. The static production build deliberately offers only the offline planner because it has no local proxy or hosted model service.

## Contract

Browser → bridge: `{ intent, spec, revision }`. No dataset, note, grant, credential, or instance-binding object is accepted. The bridge validates the definition before model invocation.

Bridge → Ollama: `/api/chat`, `stream: false`, the planner output schema in `format`, bounded output length, and a low-temperature setting. This follows [Ollama's structured-output interface](https://docs.ollama.com/capabilities/structured-outputs).

Model → bridge: `{ summary, operations }`. The host rejects unknown fields and operations, computes capability additions, simulates the candidate, and validates the resulting definition. An empty operation list represents an unsupported request and is surfaced as an error with the model's explanation. The browser validates the returned operation document again against its original base definition.

No model output can execute a handler, grant access, read fixture records, supply a URL, or bypass the user's change review through this interface. A valid proposed change can still be wrong for the user's intent.

## Validation status

Unit tests exercise malformed model output, semantic failures, capability additions, request minimization, and failure propagation using an injected mock transport. Browser tests also exercise model mode with a fixture-backed HTTP response.

On October 17, 2026, two direct smoke cases and one browser → proxy → bridge → model → review → render case passed using the locally installed `qwen3.5:9b-q8_0` model and Ollama 0.40.4. See [raw smoke output](model-smoke-results.json), [browser integration record](bridge-smoke-results.json), and [development failures and observations](MODEL-OBSERVATIONS.md). The generation request explicitly disables thinking and caps output. Recorded timings describe those calls only; the inference device was not measured. No broad quality benchmark or multi-turn study is claimed.

To repeat the two direct smoke cases after setting the environment variable, run `npm run smoke:model`. To repeat the browser integration, start both servers and run `npx tsx scripts/capture-model-demo.ts` (set `PLAYWRIGHT_CHANNEL=msedge` to use installed Edge on Windows).

To evaluate a real model, record the exact model identifier and digest, Ollama version, hardware, prompt/schema versions, every request/output, schema success, semantic task success, refusal behavior, latency, and human correction rate. The offline conformance cases are insufficient evidence for language-model performance.
