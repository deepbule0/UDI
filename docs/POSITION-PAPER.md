# User-Defined Interfaces: reusable personal software through agent-mediated definitions

**Position paper · version 0.1 · October 17, 2026**

## Abstract

An agent can generate an interface in response to a prompt. A harder problem is making that interface useful over time, understandable to its user, and reusable without copying the user's private workspace. We propose **User-Defined Interface (UDI)** as a design framework for that lifecycle. A UDI separates a portable interface package from an installation's data bindings, capability grants, and operational state. Agents propose changes to the package; a deterministic runtime validates and applies them, resolves data, renders approved components, and mediates effects. This repository offers a deliberately bounded reference prototype, an executable package schema, a threat model, and an evaluation agenda. The contribution is the explicit integration of these concerns around user ownership of an evolving definition. It is not a claim of priority for generative UI or proof of a new computing paradigm.

## 1. Motivation

Many activities span application boundaries. A researcher tracks experiment results in one system, commits in another, literature in a library, and deadlines in a calendar. The user repeatedly reconstructs the activity's context by moving among those applications.

An interface organized around the activity could bring relevant information together. Existing dashboards, low-code tools, scripts, and personal information systems already address parts of this problem. Agents offer another authoring mechanism: describing a goal and progressively revising the resulting environment through ordinary language and direct interaction.

The question is not simply whether AI can generate a dashboard. It is whether users can **maintain, inspect, and transfer a useful personal tool** while retaining control over the data it sees and the actions it performs.

## 2. Definition and scope

A User-Defined Interface is a persistent interactive environment whose structure and supported behavior can be revised from user intent, with agent proposals mediated through an inspectable definition and a policy-enforcing runtime.

“User-defined” describes control over the environment's definition. It does not mean unlimited expressiveness, removal of developers, or automatic understanding of every user request. The runtime still determines the supported components, operations, and capabilities.

The phrase and acronym are historical: Wixon, Whiteside, Good, and Jones used **user-defined interface (UDI)** for an email interface iteratively shaped around users' spontaneous commands in CHI 1983. This project reuses that terminology, without claiming to coin it, for the particular agent-mediated architecture specified below. [Building a User-Defined Interface, 1983](https://michaelgood.info/publications/usability/building-a-user-defined-interface/).

The slogan **interface follows intent** expresses a design goal. It is not evidence that conventional GUIs never adapt or that conversational authoring is always preferable. Some tasks are faster with direct controls, and stable spatial layouts can be important for learning and accessibility.

## 3. The package–instance distinction

The central object is a portable **package** containing:

- Metadata and a format version.
- Logical data-source contracts and requested capabilities.
- Views, filters, layout, and supported action definitions.

An **instance** contains the user's concrete source bindings, granted capabilities, records, derived results, local notes, and activity history. The same package may be installed into several instances without those instances sharing operational state.

For a conceptual model, let a package be \(P=(M,C,S,V,A)\), where the terms denote metadata, capability requests, sources, views, and actions. Let an instance be \(I=(B,G,D,H)\), representing bindings, grants, data, and history. A runtime computes the visible environment as \(R(P,I)\). Export serializes \(P\), not \(I\).

This is a structural boundary, not a noninterference proof. A generated title could include a person's name. A useful export interface therefore combines structural exclusion with a human review of public text. Production deployments may also need classification, scanning, and provenance policies.

## 4. The revision loop

A user request becomes a proposal against a particular package revision. The proposal identifies a bounded set of operations. The host validates their syntax, applies them to a copy, validates the resulting package, and presents the proposed change. Only approval replaces the active definition.

Proposals must fail if their base revision or exact base definition no longer matches. This avoids applying a change inferred from an obsolete workspace. Undo creates a new revision containing the previous definition; it does not reverse completed effects or restore prior grants.

The agent is an author of proposals, not an authority for its own output. A model statement such as “this is read-only” cannot override the host's action catalog. Requests for new capabilities become visible differences; the host manages the corresponding grants separately.

## 5. Runtime responsibilities

Rendering should use an approved component vocabulary rather than execute arbitrary generated frontend code. Data access should resolve logical sources through instance-local adapters. Actions should call fixed handlers whose effects are known to the host.

For capability \(c\), instance \(i\), and resource \(r\), a production policy decision should require at least:

\[
\operatorname{allow}(c,i,r)=
\operatorname{declared}(c,P)\land
\operatorname{granted}(c,i)\land
\operatorname{inScope}(r,i)\land
\operatorname{hostPolicy}(c,r).
\]

The browser prototype demonstrates declaration, grant, and fixture-binding checks. It does not implement a trusted external resource gateway. A production gateway must hold credentials outside generated definitions and untrusted client code, enforce resource scope on every call, and support revocation independently of model behavior.

Sensitive effects need an exact action preview and a separately authorized execution. The prototype's local-note handler recomputes the payload and rechecks access at execution time. Its browser confirmation is an interaction demonstration; it is not a durable, single-use authorization token.

## 6. Research example

The reference package renders experiment metrics, a table, a model-performance chart, and deadlines. Users can filter failed runs, group rows by model, add a research-library panel, or enter a focused layout. Each run can expose the commit ID explicitly recorded with it.

Changing the instance from Aurora lab to Atlas lab resolves the same logical source names against different records. Exporting the package omits both datasets, grants, local notes, and history. Re-importing the package requires access to be granted again.

This example establishes feasibility of the lifecycle in a narrow domain. It does not establish causal experiment diagnosis, semantic entity resolution, live literature recommendation, general natural-language programming, or production connector security.

## 7. Relationship to prior work

UDI belongs to a long line of work on end-user programming, adaptive interfaces, and human augmentation. SUPPLE, for example, frames interface generation as an optimization problem based on functional requirements and user/device characteristics. UDI's emphasis is the ongoing authoring and transfer of an activity-specific definition, rather than optimization of presentation alone. [SUPPLE, Gajos and Weld, 2004](https://www.eecs.harvard.edu/~kgajos/papers/2004/gajos04supple.shtml).

Modern systems supply complementary pieces. A2UI describes agent-generated interfaces through declarative components; AG-UI structures agent/frontend interaction; MCP Apps provides host-embedded tool interfaces; json-render supplies catalog-constrained generation and rendering. The separate [related-work analysis](RELATED-WORK.md) explains their roles and the absence of implemented compatibility adapters.

The proposed contribution is therefore a **testable lifecycle architecture**, not a replacement claim against those projects. Evidence of novelty would require a broader literature review and direct comparison of implementations and user outcomes.

## 8. Falsifiable hypotheses

1. **Revision cost:** users can adapt a reusable package to a changed task with less effort than recreating the tool or editing its source code.
2. **Transfer cost:** another user can install and bind a package more efficiently than building an equivalent workspace from scratch.
3. **Control comprehension:** explicit separation of capability requests, grants, and action approval improves understanding of an agent's authority.
4. **Continuity:** reviewable incremental changes and undo preserve task continuity better than unreviewed regeneration.

These are hypotheses. This repository reports conformance checks, not evidence that the hypotheses hold. Proposed studies should measure task completion, errors, perceived control, interface predictability, transfer failures, and privacy incidents, alongside model latency and cost.

## 9. Limitations and next steps

The current package vocabulary is domain-specific. Portability has been demonstrated only between bundled instances of one runtime. The offline parser cannot generalize beyond a small grammar. The optional local-model bridge accepts the same bounded operations; its selected smoke examples do not establish general model quality. Browser-local data and policy are inspectable and editable by the user.

Next steps are to evaluate an actual model planner, add one scoped read-only connector behind a trusted gateway, map the package onto an existing renderer, and test package transfer with users who did not author the original tool. Only after those results should UDI expand toward background workflows, a semantic graph, or a community registry.

## 10. Conclusion

UDI asks what should persist after an agent generates an interface: an inspectable, revisable definition that the user can keep and transfer. The package–instance split, reviewed revisions, and runtime-mediated capabilities make that question concrete enough to implement and evaluate. Their usefulness beyond this prototype remains an open research and engineering question.
