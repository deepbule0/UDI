# Contributing to UDI

**English** | [简体中文](docs/zh-CN/CONTRIBUTING.md)

The most useful contributions test the idea, clarify a boundary, or make the reference lifecycle more reliable. Small changes with a concrete task are easier to evaluate than broad new abstractions.

## Development

```sh
npm ci
npm run dev
npm run check
npx playwright install chromium
npm run test:e2e
npm run test:pwa
npm run evaluate
```

Core logic lives in `src/core/`, the renderer in `src/Workspace.tsx`, application state and review surfaces in `src/App.tsx`, the package contracts in `spec/`, and fictional fixtures in `src/data/`. The optional local-model bridge is documented in `docs/AGENT.md`.

The phone app lives in `src/mobile/`, with shared persisted state in `src/core/session.ts`. `src/pwa.ts` handles installation/update UI and `scripts/pwa.ts` generates the production worker. Open `/mobile.html` during development. Run PWA checks after a production build; caching is disabled in the dev server. Keep both languages and the desktop/phone lifecycle consistent.

Agent chat/settings are in `src/agent/`, personal-data validation and management in `src/data/sources.ts` and `DataSourcesPanel.tsx`, and the GitHub-backed community in `src/community/`. Community browser tests mock the feed and composer and must not publish real issues.

## Changes worth proposing

- A tested A2UI or json-render adapter with an explicitly named upstream version.
- One trusted, read-only connector with resource-scoped authorization and result validation.
- Real-model evaluation with raw outputs, failures, and reproducible conditions.
- Accessibility improvements, especially text contrast, keyboard navigation, and small screens.
- Usability evidence for package transfer or reviewable revision.

Before adding a component or operation, explain the user task it serves, its normalized data contract, its permission requirements, and its failure behavior. Do not add arbitrary code execution to packages. Do not describe a package capability request as a grant or a successful schema check as a privacy guarantee.

## Pull requests

State the problem and resulting behavior, include a small reproduction, describe relevant validation, and disclose limitations. Update the schema, specification, fixtures, and tests together when changing a contract. If behavior is incompatible, discuss a version change rather than silently accepting unknown extensions.

Use fictional or anonymized data. Never include account tokens, browser state, real experiment logs, or private service URLs. Do not add contributor names, institutional affiliations, benchmarks, or endorsements without evidence.

Contributions are expected under the repository's MIT License. Respect prior work, explain disagreements precisely, and keep discussion focused on behavior and evidence.
