# Evaluation: evidence and open questions

**English** | [简体中文](zh-CN/EVALUATION.md)

## What the current checks establish

`npm run check` runs TypeScript validation, core/adapter unit tests, and a production build. `npm run test:e2e` exercises the desktop and phone browser lifecycle. After a build, `npm run test:pwa` checks the production manifest, icons, offline reload, and cache isolation. `npm run evaluate` writes [evaluation-results.json](evaluation-results.json) from the public [case set](../eval/cases.json).

The conformance set has 11 supported intents and five unsupported requests, including one mixed supported/unsupported request. Three additional invariants check definition round trips, different dataset resolution, and exclusion of fixture records and local binding IDs from export. These are authored regression cases matched to the explicit grammar. They are neither held-out language understanding tests nor a comparison with another project.

Core tests cover invalid fields and versions, executable component rejection, duplicate IDs, source/capability substitution, incompatible entity bindings, import limits, export boundary behavior, free-text leakage, revision staleness, atomic failure, request/grant separation, action confirmation, revoked grants, foreign instances, changed source data, and malformed model output.

Browser acceptance covers review-before-apply, persistence, undo, dataset rebinding, denied rendering after revocation, explicitly granted and confirmed note creation, export/re-import with cleared grants, narrow-screen overflow, and a fixture-backed model response.

The local verification run on October 17, 2026 passed 150 core/adapter/localization/controller/data/community/session/sharing tests, 46 browser scenarios in Edge, three production PWA checks, 16 deterministic intent cases, three lifecycle invariants, TypeScript checks, and the production build. GitHub-hosted validation has not run successfully; see [Actions](https://github.com/deepbule0/UDI/actions/workflows/ci.yml).

Phone checks use touch emulation at 390 × 844 and 430 × 932 pixels. They cover tab navigation, review/apply/undo, independent grants, language links, evidence-sheet focus, package transfer, and confirmed notes. Production checks verify valid PNG install icons, Chinese offline reopening with saved state, rejection of uncached API requests while offline, and preservation of unrelated origin caches. These are Chromium/Edge checks, not physical Android/iPhone installation tests or a Safari compatibility certification.

Localization checks cover English/Chinese URL selection, preference persistence, Chinese intent review, unsupported compound requests, narrow-screen controls, and identical package/instance state before and after a language switch. Export retains the canonical machine definition rather than serializing translated presentation labels.

Two selected direct calls and one browser integration with a real local model also passed. Outputs, model digest, runtime and host metadata are in [model-smoke-results.json](model-smoke-results.json) and [bridge-smoke-results.json](bridge-smoke-results.json). Earlier empty outputs and an invalid panel reference are disclosed in [MODEL-OBSERVATIONS.md](MODEL-OBSERVATIONS.md). The prompt was refined during these attempts. These are development smoke observations, not held-out quality results.

These checks provide evidence that the reference lifecycle works under selected conditions. They are not a security proof, accessibility certification, usability study, cross-runtime portability demonstration, or performance ranking. “Passed export checks” means structured fields and selected sentinel values are excluded; it does not mean arbitrary private text is detected.

Agent checks cover reviewed chat/settings parity, concurrent-state staleness, request-only note creation, and minimization of optional model payloads. Personal-data checks cover strict JSON validation, fresh namespaces, permission-denied rendering before grants, reload, download, and confirmed removal. Community tests use mocked GitHub responses and a mocked composer to verify parsing, public-post discovery, installation grant resets, and privacy boundaries. They do not publish a real issue, establish community adoption, or claim end-to-end GitHub sign-in/submission testing.

Share-link checks additionally cover Unicode, plain/compressed envelopes, canonical encoding, decompression bounds, unsupported versions, and exclusion of instance state. Browser checks exercise initial links under React StrictMode, preview without mutation, explicit adoption, clearing all grants while preserving personal records/notes/chat, cancellation, malformed links, Chinese phone sharing, and form-based workspace creation with separate read consent. Clipboard and public composer operations are mocked; no real message or post is sent. See the [framework requirements](FRAMEWORK.md) for the general target and the distinction from this bounded profile.

## Proposed comparative evaluation

Hold the connector fixtures, task outcomes, and permissions constant. Compare:

1. A fixed dashboard with direct configuration controls.
2. An agent-generated workspace regenerated as a whole after each request.
3. A UDI-style package with reviewed incremental operations and independent instance grants.

An implementation using A2UI, AG-UI, or json-render is not automatically a competing experimental condition: those tools can implement the UDI lifecycle too. Compare concrete behaviors, not protocol names.

Measure:

| Question | Measures |
| --- | --- |
| Does revision help? | Correct task completion, edit time, number of corrections, accidental loss of useful views |
| Does transfer help? | Successful installation into a second dataset, mapping corrections, time to first useful view |
| Do users understand authority? | Correct predictions of allowed actions; detection of newly requested access; inappropriate grants |
| Is generated output reliable? | Schema acceptance, semantic task correctness, rejected unsupported requests, repair frequency |
| Is the system practical? | Planner latency/cost, render latency, connector calls, perceived interruption |
| Does export protect instance state? | Structured leakage tests, seeded text leakage, human review errors |

Start with a formative usability pilot and publish its protocol before claiming quantitative improvements. A later comparative study should specify recruitment, task difficulty, counterbalancing, exclusion criteria, sample-size rationale, and uncertainty reporting. Do not infer a user benefit from runtime conformance alone.

## Reproducibility requirements

For model experiments, publish model identifier/digest, hardware/runtime, complete prompt and schema, dataset version, randomization settings, retries, failed outputs, human corrections, and total inference costs. Separate “syntactically accepted” from “correct for the user's intent.” Include unseen phrasing, ambiguous requests, permission escalation, malicious source content, and invalid bindings. Evaluate model refusal and unsupported requests rather than silently mapping them to approximate actions.
