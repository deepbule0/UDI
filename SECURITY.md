# Security model and limitations

**English** | [简体中文](docs/zh-CN/SECURITY.md)

UDI Studio is a research prototype running on fictional fixtures. Do not connect sensitive services to this browser policy layer or treat its controls as production authorization.

The [general framework](docs/FRAMEWORK.md) defines a broader target. The current Core 0.1 research profile demonstrates boundaries locally; production provider integrations are not implemented.

## Direct sharing and adoption

Share/Copy link serializes only a strictly validated definition in a URL fragment, without uploading it to a UDI server. URL fragments are not part of ordinary HTTP requests, but browser extensions, page scripts, history, or a chosen sharing app may observe the link. Anyone holding it can decode public names, descriptions, and definition fields. Review free text; this mechanism provides no confidentiality, signature, author authentication, hosted short-link storage, or revocation service. Editing an experience later does not change a sent copy, and withdrawing a community post cannot recall copies.

Creation excludes records, notes, binding IDs, grants, chat, and activity. Canonical base64url, a 16,000-character URL/fragment cap, bounded 64 KiB decompression, fatal UTF-8 decoding, strict schema validation, and semantic checks bound incoming definitions. The app removes an incoming definition fragment before asynchronous parsing. Opening a link shows public fictional sample records only; it does not apply changes or read private instances. Explicit **Use** revalidates the definition, preserves records and notes, clears every instance's grants, and opens data review. Preview actions are disabled. These controls do not authenticate the sender or prove a definition is useful.

Native sharing and clipboard writes happen only after explicit user gestures. Link sharing is separate from public community listing. GitHub publication remains an advanced flow with a final human submission. **Create my workspace** stores validated research records locally with no initial grants; the explicit reading-consent button grants requested read capabilities only and never adds note-writing access.

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

The static demo has no account credentials, analytics, external connector calls, or background account automation. Its production service worker caches public app assets for offline use. Fonts are bundled. The optional development bridge accepts a definition and intent and sends them to Ollama at `127.0.0.1:11434`; records, local notes, binding IDs, and grants are not part of its request contract. Free-text intent and metadata may still be sensitive. The bridge has no remote-model fallback and cannot receive a caller-supplied model endpoint.

The optional model is a dependency managed by the person running it. Transport validation tests do not establish model behavior or protection against a compromised local runtime.

## Persistence and audit

The app stores its state under `udi-studio:0.1` in browser local storage. Reset clears this app's demo state. No data is encrypted by the application. The local activity log is bounded and editable, not a tamper-resistant audit trail. Undo restores interface definitions; it does not revoke capabilities or reverse effects. Two tabs can overwrite each other's persisted state.

The phone PWA's service worker is scoped to its deployment directory and caches the public build, including bundled fictional fixtures; it does not cache API responses or use the cache to store local grants, notes, or imported definitions. Those remain in local storage. Home Screen installation and offline availability add no authorization boundary. A cached build may remain older until updated, and browser storage can be cleared or evicted. Resetting the demo does not remove the service-worker cache; clearing site data removes local state and cached assets. The desktop and phone routes share state only within the same origin and storage context, and an iPhone Home Screen app is isolated from Safari. There is no device synchronization. See the [phone guide](docs/MOBILE.md).

## Community and personal data

Community performs unauthenticated GET requests to the public repository's GitHub Issues API with credentials and referrer omitted. It accepts only marked, labeled, open posts containing one schema-valid JSON package, constructs links from the repository and issue number, and renders text without executing Markdown or HTML. A validated definition is still untrusted. Installation resets all instance grants. Public feed caches are separate from personal records and can be stale or unavailable under rate limits.

Posting exports the definition into a reviewed GitHub composer URL, or a copy-and-paste body for large packages. No app-held GitHub credential is used, and opening a composer does not create a post. The person must sign in and submit on GitHub. Public free text and introductions still need human privacy review. Imported records, grants, notes, bindings, and chat history are not automatically sent to the community. User-authored free text can still contain private information.

Personal JSON is strictly validated, assigned a fresh namespace, and stored as unencrypted browser-local records. Imports start without grants. Downloading personal data is a separate records-only operation. Confirmed removal deletes that dataset and its instance grants/notes; reset also clears imported records and the last 40 locally retained conversation messages. Chat prompts may themselves contain private text; the optional local-model bridge receives the submitted prompt and package definition, not an automatic dump of records or conversation history.

## Production requirements

A production system needs a credential-holding gateway, authenticated users, resource-scoped policy on every operation, adapter output validation, concurrency control, approval tokens bound to payload and expiry, idempotency for side effects, hardened content policies, export review, a package supply-chain model, and an independent security assessment. These are architectural requirements, not implemented features.

## Reporting

When a public repository and private reporting contact are configured, use that repository's private security reporting channel. Until then, do not include real secrets, private records, or exploit details affecting real services in public issues. This repository does not invent a maintainer email address.
