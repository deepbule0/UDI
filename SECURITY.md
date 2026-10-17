# Security model and limitations

UDI Studio is a research prototype running on fictional fixtures. Do not connect sensitive services to this browser policy layer or treat its controls as production authorization.

## Assets and trust boundaries

The assets are instance records, local notes, source bindings, grants, the integrity of a reviewed definition, and the integrity of an approved action. Untrusted inputs include imported packages, future model outputs, source content, and browser persistence. The host owns the component catalog and action handlers.

The prototype's host, policy code, and fixture data share a browser process. A user or script controlling that process can inspect the bundled records and edit local storage or code. Capability controls demonstrate application behavior; they cannot isolate data already shipped to the client. A real gateway must enforce authorization on a trusted server or equivalent isolated process.

## Threats and implemented mitigations

| Threat | Demonstrated mitigation | Remaining boundary |
| --- | --- | --- |
| Package contains executable code or an unknown renderer | Closed JSON Schema, unknown-field rejection, fixed React components, no `eval` or raw HTML renderer | Approved component code and dependencies must still be trusted |
| Package substitutes another source's capability | Entity/capability compatibility and declaration checks | Real adapter results need validation and resource scope checks |
| Capability request silently becomes access | Grants are instance-local; new requests leave grants unchanged | Browser grants are editable and do not authorize real services |
| Write occurs without a clear preview | Exact local-note preview and separate confirmation; execution rechecks definition, instance, data and grants | Confirmation is not a signed or single-use authority; no replay prevention |
| Stale agent proposal changes an evolved workspace | Base revision and stable exact-definition comparison; atomic candidate validation | No multi-user transaction or cross-tab conflict resolution |
| Shared export includes workspace records or tokens | Export accepts only the strict specification shape | Free-text metadata can disclose secrets or personal information |
| Prompt injection changes policy | Model outputs are restricted to validated operations; models cannot supply grants or handlers | Valid operations may still be undesirable; human review is required |
| Local-model bridge is used by a remote web page | Loopback listener, Host/Origin checks, JSON-only POST; no permissive CORS | Other local processes are trusted; not hardened for multi-user hosting |
| Oversized package exhausts import resources | 64 KiB package limit, bounded arrays and strings | Not a general denial-of-service defense |

## Credentials and network behavior

The static demo has no account credentials, analytics, external connector calls, or background workers. Fonts are bundled. The optional development bridge accepts a definition and intent and sends them to Ollama at `127.0.0.1:11434`; records, local notes, binding IDs, and grants are not part of its request contract. Free-text intent and metadata may still be sensitive. The bridge has no remote-model fallback and cannot receive a caller-supplied model endpoint.

The optional model is a dependency managed by the person running it. Transport validation tests do not establish model behavior or protection against a compromised local runtime.

## Persistence and audit

The app stores its state under `udi-studio:0.1` in browser local storage. Reset clears this app's demo state. No data is encrypted by the application. The local activity log is bounded and editable, not a tamper-resistant audit trail. Undo restores interface definitions; it does not revoke capabilities or reverse effects. Two tabs can overwrite each other's persisted state.

## Before production use

A production system needs a credential-holding gateway, authenticated users, resource-scoped policy on every operation, adapter output validation, concurrency control, approval tokens bound to payload and expiry, idempotency for side effects, hardened content policies, export review, a package supply-chain model, and an independent security assessment. These are architectural requirements, not implemented features.

## Reporting

When a public repository and private reporting contact are configured, use that repository's private security reporting channel. Until then, do not include real secrets, private records, or exploit details affecting real services in public issues. This repository does not invent a maintainer email address.
