# Evidence-led roadmap

**English** | [简体中文](zh-CN/ROADMAP.md)

This roadmap is a set of decision gates, not delivery promises.

## v0.1: make the lifecycle inspectable

Shipped: strict package schema, semantic checks, five view types, reviewed bounded revisions, undo, independent fixture bindings, local capability controls, confirmed local notes, package export/import/fork, an offline parser, an optional local-model bridge, and reproducible checks.

Gate: another developer can run the demo, understand its limitations, and reproduce the transfer loop without assistance.

## v0.2: carry the same lifecycle onto phones

Shipped: bilingual UDI Pocket with touch cards, five navigation tabs, install metadata, offline app-shell caching, and phone acceptance checks. It uses the same Core 0.1 definition and runtime as Studio. See the [phone guide](MOBILE.md). Native store binaries, cross-device synchronization, and real mobile connectors remain future work.

## v0.3: expose authoring, data ownership, and sharing

Shipped: Agent chat plus settings-style controls with reviewed state changes, personal research JSON import/download/removal, and a lightweight GitHub Issues community with validated posts, preview/install/fork, and reviewed publication through the user's GitHub account. Starter examples are labeled as project examples. This does not establish community adoption, moderation, or general model capability. See [community and personal data](COMMUNITY.md).

## Evaluation priorities

1. Run a documented model evaluation on unseen user requests. Separate valid JSON from correct intent interpretation. Publish unsupported cases and failures.
2. Ask people to reuse a package authored by someone else. Measure binding corrections, comprehension, and time to a useful workspace.

Gate: evidence that revision and transfer help users compared with equivalent fixed configuration or whole-interface regeneration.

## Then: one real connector and one renderer adapter

Move policy and credentials into a trusted gateway. Add a scoped read-only source with validated results. Implement a versioned adapter to an established declarative renderer. Add transaction semantics for concurrent edits and expiring, single-use approvals before introducing external writes.

Gate: independent review of data boundaries and a successful cross-implementation package exercise. Rebinding datasets within one runtime is not sufficient evidence of ecosystem portability.

## Later: wider workflows and governed distribution

The lightweight GitHub Issues community is already available; robust moderation, package integrity, and larger-scale distribution remain future work. Consider an event/workflow contract, migrations, provenance, and capability-difference reviews. A semantic graph and background agent are possible extensions, not prerequisites for the core idea.

Gate: recurring real user needs that the simpler package model cannot express. Do not build a marketplace before there are useful packages and a credible security model.
