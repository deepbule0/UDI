# User-Defined Interfaces: a framework for personal experiences within capable platforms

**English** | [简体中文](zh-CN/POSITION-PAPER.md)

**Draft position paper · application v0.4.0 · Core 0.1 research profile · October 17, 2026**

## Abstract

Applications usually provide both their functions and the interface through which everyone uses them. We propose **User-Defined Interface (UDI)** as a design framework in which a platform supplies content, supported operations, and a useful default application, while people shape their own persistent experience through an agent or ordinary controls. That experience can include presentation, interactions, data organization, and supported workflows. People should be able to try someone else's experience, use it with their own data and permissions, adapt it, and share it through a familiar link without programming or handling interface files. A reusable definition and a private instance provide the technical separation behind that experience. Agents propose bounded revisions; the host validates definitions and mediates access and effects. This repository offers an experimental reference implementation and a research-specific executable profile. It does not establish a ratified standard, general compatibility, or a new computing paradigm.

## 1. Problem and value

Platforms supply content, supported operations, and default applications. UDI proposes that users can shape a persistent experience over those capabilities without authoring software. Provider contracts define what is available; users choose how supported information and operations are presented, organized, and used.

Domain examples include reading queues, study routines, travel planning, photo organization, productivity workflows, and music-library or playback arrangements. These are illustrative applications, not implemented integrations. UDI can operate within one platform; combining several providers requires additional contracts, authorization, and implementation work.

The question is whether ordinary users can **shape, retain, and share how they use an application**, without becoming developers or giving a shared design access to someone else's private account. End-user programming, adaptive interfaces, configurable applications, and generative UI already address parts of this question. The proposed contribution is an explicit, testable lifecycle connecting provider capabilities, user authoring, controlled execution, and reuse.

## 2. Definition and scope

A **User-Defined Interface** is a persistent, user-controlled application experience whose presentation and supported behavior can be revised through intent or direct controls and reused independently of a person's private operational state.

The platform or content provider remains responsible for meaningful content, supported functions, and a usable default experience. Users shape how these are presented, organized, and invoked within that supported scope. A prompt might change a layout, organize a collection, or describe a supported sequence of operations. It does not invent unavailable services or override platform policy.

The ordinary-user interaction is higher level than an API request, source-code editor, or file upload. Those mechanisms may exist for implementers and advanced exchange. They are not the required authoring or sharing experience. The [general framework](FRAMEWORK.md) distinguishes this product model from the current research-specific [Core 0.1 profile](SPECIFICATION.md).

The phrase and acronym have history: Wixon, Whiteside, Good, and Jones used **user-defined interface (UDI)** for an email interface iteratively shaped around users' spontaneous commands in CHI 1983. This project reuses that terminology for the particular agent-mediated framework described here, without claiming to coin it. [Building a User-Defined Interface, 1983](https://michaelgood.info/publications/usability/building-a-user-defined-interface/).

**Interface follows intent** expresses a design goal. Conversation is not always the best control: predictable settings, direct manipulation, stable layouts, and accessibility remain important. Agent chat and ordinary controls should offer complementary routes to the same supported changes.

## 3. Three responsibilities, one experience

The framework distinguishes three responsibilities:

- **Provider:** content and data contracts, supported operations, approved UI elements, policy, and a good default app.
- **User-defined experience:** reusable choices about presentation, interactions, organization, requested capabilities, and supported action or workflow references.
- **Private instance:** a person's account or source bindings, access decisions, records, notes, execution state, and history.

A portable **package** is a technical representation of the reusable experience. It is not the entirety of the UDI idea and need not appear as a file in the product. Conceptually, let \(P=(M,C,S,V,A)\) denote metadata, capability requests, source contracts, views and organization, and supported actions. Let \(I=(B,G,D,H)\) denote private bindings, grants, data, and history. A provider runtime computes the experience as \(R(P,I)\), subject to its capabilities and policies. Sharing carries \(P\), not \(I\).

This model does not require arbitrary workflow programming or claim that the current schema represents every domain. Core 0.1 implements a small research profile; broader provider contracts and workflow semantics need their own versioned profiles and validation.

The split is a structural boundary, not a noninterference proof. A title, view label, or description can still contain private text. Sharing must explain what travels and allow review. Production deployments may also need classification, provenance, and scanning. Compatibility depends on the receiving runtime's supported profile, capabilities, and policies; a valid definition does not prove that an unrelated app can run it.

## 4. Authoring and reuse

The intended consumer lifecycle is **Try → Use → choose a workspace and consent → personalize → Share link**. A person sees a meaningful preview before replacing their interface. The receiving instance connects its own data and grants access separately. The person can revise the adopted experience and share their variation.

Agent requests become proposals against a particular revision. The host validates a bounded operation set, applies it to a copy, validates the result, and presents meaningful changes. Approval replaces the active definition. Direct controls can use the same revision path; permission changes and actual effects need their own appropriate review.

Proposals fail when their base revision or exact base definition no longer matches. Undo creates a new revision containing a previous definition; it does not reverse completed external effects or restore old access grants. A framework implementation should also preserve an understandable route back to the provider's default experience.

The agent authors proposals; it does not authorize itself. A model statement such as “this is read-only” cannot override the provider's operation catalog. A shared interface's capability requests are not the recipient's approval. Viewing, copying, or installing an experience must not silently import another person's permissions.

## 5. Runtime responsibilities

Rendering should use an approved component vocabulary rather than execute arbitrary generated frontend code. Logical data sources resolve through instance-local bindings. Operations call fixed, known handlers. Data organization and workflows must remain within the semantics the provider actually supports; their effects cannot be inferred from appearance alone.

For capability \(c\), instance \(i\), and resource \(r\), a production policy decision should require at least:

\[
\operatorname{allow}(c,i,r)=
\operatorname{declared}(c,P)\land
\operatorname{granted}(c,i)\land
\operatorname{inScope}(r,i)\land
\operatorname{hostPolicy}(c,r).
\]

The browser prototype demonstrates declaration, grant, and local dataset-binding checks. It does not provide a trusted external resource gateway. A production gateway must keep credentials outside shared definitions and untrusted client code, enforce resource scope on every call, and support revocation independently of model behavior.

Sensitive effects require an exact preview and separately authorized execution. The prototype's local-note handler recomputes the payload and rechecks access at execution time. Browser confirmation demonstrates the interaction; it is not a durable, single-use authorization token. External writes, concurrent workflows, and recovery require stronger transaction and approval semantics.

## 6. The current reference implementation

The v0.4.0 app offers desktop UDI Studio and [UDI Pocket for phones](MOBILE.md), in English and Simplified Chinese. Both use the **Core 0.1 research profile**, so their shared behavior demonstrates one implementation rather than interoperability between independent runtimes.

The primary flow uses visual sample-data previews, an explicit **Use this interface** action, workspace selection and access consent, agent or settings-based personalization, and share links. People can create a personal research workspace with a form; working through JSON is optional. The [community guide](COMMUNITY.md) covers reuse. Clearly labeled project examples are separate from real public posts. File import/export and GitHub publication remain advanced tools rather than the ordinary-user entry point.

The executable profile supports experiment metrics, a results table, a model-performance chart, deadlines, and a research library. Bounded changes include failed-result filtering, grouping by model, view visibility, focus layout, and a confirmed local review note. Changing from Aurora to Atlas or a personal local workspace rebinds logical sources without transferring someone else's records or grants. Previews use fictional public sample data; adopting a definition clears existing access for review.

Hosted Agent chat uses a limited deterministic command grammar, not a hosted language model. An optional local Ollama bridge can propose the same supported operations. Local data and browser checks are inspectable and editable by the device's user. There are no implemented music, reading, travel, photo, or productivity service integrations, and no general workflow engine.

## 7. Relationship to prior work

UDI belongs to a long line of end-user programming, adaptive interfaces, and human augmentation. SUPPLE, for example, frames interface generation as an optimization problem based on functional requirements and user/device characteristics. This proposal emphasizes ongoing user authoring and reuse of a persistent experience, including its controlled connection to data and supported effects. [SUPPLE, Gajos and Weld, 2004](https://www.eecs.harvard.edu/~kgajos/papers/2004/gajos04supple.shtml).

Modern systems supply complementary pieces. A2UI describes agent-generated interfaces through declarative components; AG-UI structures agent/frontend interaction; MCP Apps provides host-embedded tool interfaces; json-render supplies catalog-constrained generation and rendering. The [related-work analysis](RELATED-WORK.md) explains their roles and the absence of implemented compatibility adapters.

The proposed contribution is a **testable lifecycle architecture and product model**, not a replacement claim against these projects. A stronger novelty claim would require a broader literature review and direct comparison of implementations and user outcomes.

## 8. Falsifiable hypotheses

1. **Revision cost:** ordinary users can adapt an experience to a changed task with less effort than recreating it or editing source code.
2. **Reuse cost:** another person can try an experience and connect their own data more efficiently than building an equivalent configuration from scratch.
3. **Control comprehension:** separating requested functions, granted access, and action approval improves understanding of an agent's authority.
4. **Continuity:** reviewed incremental changes and undo preserve task continuity better than unreviewed regeneration.
5. **Sharing accessibility:** visual previews and familiar share links reduce errors and assistance compared with technical package exchange.

These are hypotheses. Repository conformance checks do not establish that they hold. Studies should include people who did not build the system and compare task completion, correction effort, accessibility, perceived control, predictability, reuse failures, and privacy incidents. Model latency and cost are additional measures, not substitutes for user outcomes.

## 9. Limitations and next steps

The general framework is a draft proposal, not a ratified standard. The current profile is research-specific and portable only within compatible installations of this reference runtime. Share links do not establish cross-provider or cross-runtime compatibility, and a public community feed does not establish adoption or effective moderation.

Next steps are to evaluate unseen language requests, study the complete reuse loop with ordinary users, implement one real provider adapter behind a trusted gateway, and build a versioned renderer adapter. A provider integration should demonstrate useful content and a supported operation beyond changing appearance. Broader workflows, migrations, background execution, and governed distribution require separate contracts, implementation, and evidence. See the [roadmap](ROADMAP.md).

## 10. Conclusion

UDI proposes that a capable platform can offer a good default app while letting people shape and share their own persistent way of using it. Reusable definitions, private instances, reviewed revisions, and runtime-mediated capabilities make that proposal concrete enough to implement and test. The research prototype establishes a bounded example of that lifecycle; broader usefulness remains an open research and engineering question.
