# Evidence-led roadmap

**English** | [简体中文](zh-CN/ROADMAP.md)

This roadmap records shipped scope and future decision gates, not delivery promises. UDI's [general framework](FRAMEWORK.md) concerns user-defined experiences within capable platforms. The executable **Core 0.1 research profile** is one bounded implementation, not a universal application schema.

## v0.1: make the lifecycle inspectable

Shipped: strict package schema, semantic checks, five view types, reviewed bounded revisions, undo, independent fixture bindings, local capability controls, confirmed local notes, package export/import/fork, an offline parser, an optional local-model bridge, and reproducible checks.

Gate: another developer can run the demo, understand its limitations, and reproduce the transfer loop without assistance.

## v0.2: carry the same lifecycle onto phones

Shipped: bilingual UDI Pocket with touch cards, install metadata, offline app-shell caching, and phone acceptance checks. It uses the same Core 0.1 definition and runtime as Studio. See the [phone guide](MOBILE.md). Native store binaries, cross-device synchronization, and real mobile connectors remain future work.

## v0.3: expose authoring, data ownership, and sharing

Shipped: Agent chat plus settings-style controls with reviewed state changes, personal research JSON import/download/removal, and a lightweight GitHub Issues community with validated posts, preview/install/fork, and reviewed publication through the user's GitHub account. Project examples are labeled separately. This does not establish community adoption, moderation, or general model capability.

## v0.4: make reuse and sharing ordinary-user tasks

Shipped: visual previews rendered from the selected definition against public fictional sample data; explicit **Use this interface** and personal-copy actions; workspace choice and access consent; form-based personal research workspace creation; and self-contained share links with receiving-side preview and explicit adoption.

The primary path is **Try → Use → choose a workspace and consent → personalize → Share link**. People do not need programming, APIs, or JSON files for that path. Agent chat and ordinary controls remain complementary. Package files and public GitHub publication are advanced options. See the [community guide](COMMUNITY.md).

The publication separates the general framework from the research reference profile. Illustrative domains include study, reading, travel, photos, productivity, and music. None of those service integrations is implemented. Application v0.4.0 still uses Core 0.1; hosted chat remains a bounded deterministic parser rather than a hosted language model.

Gate: people who did not build the demo can complete this lifecycle, understand what they shared and authorized, and recover from an unwanted change without technical assistance.

## Next: test the complete experience with ordinary users

Recruit people with different technical experience, including people who do not author software. Compare link-based reuse against technical package exchange and against configuring an equivalent fixed app.

Measure time to a useful experience, completion errors, requested assistance, accessibility, understanding of shared versus private information, access decisions, and successful recovery. Test both a project example and an experience authored by another participant. Evaluate unseen language requests separately from successful schema validation, publishing unsupported requests and failures.

Gate: evidence that UDI improves adaptation or reuse without unacceptable loss of predictability, privacy, or control. Current conformance tests do not establish those outcomes.

## Then: implement one real provider adapter

Choose a provider with useful content, a clear default experience, and at least one supported operation beyond appearance changes. The example may involve music, reading, learning, travel, photos, or productivity; domain selection should follow an actual user need rather than redefine UDI around that domain.

Put credentials and policy in a trusted gateway. Define versioned source and operation contracts, resource scope, revocation, and explicit failure behavior. Begin with scoped reads, then introduce a bounded write only after exact-effect review, transaction semantics, and expiring single-use authorization are ready. Provider rights and supported APIs remain constraints.

Gate: an independently reviewed integration demonstrates that a user can personalize supported presentation, data organization, and a useful interaction while the provider still enforces access and effects.

## Then: demonstrate compatibility rather than assume it

Implement a versioned adapter to an established declarative renderer or a second independent runtime. Publish capability negotiation, unsupported-feature behavior, migrations, and conformance fixtures. Distinguish presentation adaptation from execution compatibility.

Gate: a successful cross-implementation reuse exercise with documented losses and failures. Rebinding datasets or opening a share link within this one runtime is insufficient evidence of cross-provider or ecosystem portability.

## Later: broader workflows and governed distribution

Consider event and workflow contracts, background execution, concurrency, recovery, package integrity, provenance, moderation, reporting, and larger-scale discovery. A semantic graph and background agent are possible extensions, not prerequisites for UDI. Lightweight public GitHub posts already work, but do not provide a mature sharing service or evidence of community adoption.

Gate: recurring user needs justify added complexity, and the security model can explain each new effect. A draft framework becomes a credible standardization candidate through independent implementations, public review, and demonstrated interoperability, not through naming alone.
