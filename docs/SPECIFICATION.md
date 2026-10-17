# UDI Core 0.1: package and runtime contract

**English** | [简体中文](zh-CN/SPECIFICATION.md)

**Status:** experimental draft. The JSON Schema and reference validator define the implemented subset. This document uses MUST/SHOULD as project requirements, not as evidence of standards-body adoption.

## 1. Artifacts and versions

A package is one UTF-8 JSON document, conventionally named `name.udi.json`. The current `specVersion` MUST be `"0.1"`. `metadata.version` is a separate semantic-version-shaped package release string. The local revision counter is an instance editing mechanism and is not exported as a package release version.

Import MUST reject documents larger than 65,536 UTF-8 bytes, unknown format versions, unknown fields, malformed JSON, and violations of [udi.schema.json](../spec/udi.schema.json). The reference implementation does not migrate older formats. Maximum collections and text lengths are defined by the schema.

## 2. Package fields

| Field | Contract |
| --- | --- |
| `specVersion` | Literal `0.1` |
| `metadata` | Package ID, title, description, release version |
| `capabilities` | Unique capability requests; no grants or credentials |
| `sources` | Logical IDs, entity kinds, and required read capabilities |
| `views` | Catalog component IDs, source references, visibility, bounded settings |
| `actions` | References to fixed host handlers and their required capabilities |
| `layout` | `balanced` or `focus` |

The [research package](../examples/research-cockpit.udi.json) is the canonical full example. A source such as `{ "id": "experiments", "entity": "experiment", "capability": "experiments.read" }` is a logical requirement. It is not a path, OAuth credential, HTTP URL, or connection to a particular project.

Source, view, and action IDs MUST be unique within their respective collections. View source references MUST resolve. Each source's capability MUST match its entity kind and be declared in the package. Action capabilities MUST also be declared. These semantic constraints are implemented by `validateSpec` in addition to JSON Schema checks.

## 3. Catalog and data contracts

| View type | Source entity | Behavior |
| --- | --- | --- |
| `metrics` | `experiment` | All-run counts and best passed-run PSNR |
| `table` | `experiment` | `filter`, `groupBy`, and `highlightBelow` |
| `bar-chart` | `experiment` | Best passed-run PSNR per model on a 0–40 dB scale |
| `timeline` | `deadline` | Events ordered by date |
| `collection` | `paper` | Local library cards |

`filter` is `all` or `failed`. `groupBy` is `none` or `model`; the reference renderer orders model groups and labels the start of a group. `highlightBelow` is a threshold between −10 and 0 dB. These settings MUST be rejected on non-table components.

`balanced` displays all visible views. `focus` displays metrics and tables while suppressing secondary chart, timeline, and library panels; it does not delete their definitions. Explicit `visible: false` suppresses a view in either layout.

Normalized fixture records are defined in [types.ts](../src/core/types.ts). Experiments reference commits by `commitId`; the detail view joins on exact recorded ID. No inferred causality or semantic similarity is part of the contract. A real connector needs schema validation at its trust boundary; typed fixture records do not establish that guarantee.

## 4. Instance contract

The reference `Instance` has an ID, a dataset binding, granted capabilities, and local notes. Editing state additionally holds the active package, revision counter, previous definitions, and activity history. This is all browser-local state.

Source resolution MUST check the instance/dataset match and both declaration and grant before returning data. Fixture records are cloned on read. Capability grants are scoped to a particular bundled dataset. Initial read grants are preconfigured only for the fictional demonstration. Import installation clears grants for both local instances.

An implementation integrating real resources MUST enforce scope outside untrusted client code. UDI Core 0.1 does not specify connector credentials, transport, identity federation, or server authorization.

## 5. Revision proposals

A reference proposal contains a `baseRevision`, stable serialization of the base definition (`baseFingerprint`), a summary, operations, and computed capability additions. The fingerprint is exact-state comparison material, not a cryptographic hash or signature.

Supported operations are `filter`, `group`, `layout`, `visibility`, `highlight`, `add-papers`, and `add-action`. See [planner-output.schema.json](../spec/planner-output.schema.json) for model output shape. The host computes base-state fields and capability differences; model-supplied grants are invalid.

Application MUST compare both base revision and definition, apply operations to a copy, and validate the complete candidate before replacement. Failure leaves the original definition unchanged. A new capability request MUST NOT modify grants. Undo restores a previous definition under a new, increasing local revision; it does not roll back data, notes, or permission decisions.

The UI retains at most 20 previous definitions. Package `metadata.version` does not change automatically for every edit; release versioning is a maintainer decision.

## 6. Actions

The only v0.1 action handler is `create-review-note`, requiring `notes.write` plus access to its declared experiment source. It creates a deterministic summary of all failed experiments in the bound dataset, independently of the table's visible filter.

Preparation MUST capture action ID, instance ID, local revision, exact package definition, and payload. Execution MUST require host confirmation, reject changed revision/instance/definition, recompute the payload with current data and grants, and append only the recomputed result. No generated code or arbitrary action endpoint is accepted.

The reference confirmation is a trusted-UI boolean inside one browser application. It is not replay-proof, a signed approval, an authentication primitive, or an exactly-once execution protocol. Repeated authorized calls can append repeated notes. Production effects need stronger authorization and idempotency contracts.

## 7. Export and installation

`exportPackage` accepts a valid specification object only. Unknown structured fields, including bindings, records, grants, and history, cause validation failure. It MUST NOT accept the whole application state and strip fields heuristically.

Import validates a package before presenting its requested capabilities. Installation replaces the definition, preserves the local dataset choices and notes, and clears local grants. Fork changes package metadata while retaining logical definitions. Neither operation copies another person's instance.

Titles and descriptions are public strings in the package. They can contain private information. The reference exporter provides a review notice but no content scanner; structural exclusion MUST NOT be described as a complete privacy guarantee.

## 8. Compatibility

v0.1 supports one reference runtime and four entity kinds. There is no custom component execution, expression language, event workflow engine, package signature, marketplace, multi-user synchronization, or A2UI/AG-UI/MCP adapter. Unknown extensions fail validation. Future versions should explicitly version and test adapters rather than imply wire compatibility from shared terminology.
