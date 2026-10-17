# Releasing UDI on GitHub

**English** | [简体中文](zh-CN/PUBLISHING.md)

The public repository is [deepbule0/UDI](https://github.com/deepbule0/UDI). It is an **experimental proposal and reference prototype** with English and Simplified Chinese documentation. Publication is not evidence of research validation or production readiness.

## Repository metadata

- Repository: `https://github.com/deepbule0/UDI`.
- Demo deployment target: `https://deepbule0.github.io/UDI/`.
- Description: `An experimental package-and-runtime model for persistent, user-defined interfaces, with reviewed revisions and local data bindings.`
- Topics: `generative-ui`, `human-computer-interaction`, `end-user-programming`, `ai-agents`, `declarative-ui`, `personal-software`.
- License supplied: MIT for original code/documentation; review it as the project owner before publication.
- Initial public release tag: `v0.1.0`.

Use your own name and actual affiliations when adding author metadata or a citation file. No author identity has been fabricated. Configure a private security-reporting channel when the repository is created.

Keep the historical terminology acknowledgment: Wixon et al. used both the phrase and acronym in CHI 1983. Present this as your proposed architecture and prototype under an existing descriptive term, not the invention of the term itself.

## Validate the candidate

```sh
npm ci
npm run check
npx playwright install chromium
npm run test:e2e
npm run evaluate
```

Review the screenshot, [position paper](POSITION-PAPER.md), [security limitations](../SECURITY.md), [related work](RELATED-WORK.md), and generated evaluation reports. The checked-in browser screenshot shows fictional records. Local model smoke results, when present, are narrowly scoped observations, not a benchmark.

## Create and push

For a local checkout, clone the public repository. Inspect the existing history and remotes before publishing an update:

```sh
git clone https://github.com/deepbule0/UDI.git
cd UDI
git status
git remote -v
```

Use ordinary commits and pushes to update the repository. Keep both language versions aligned. In the original workspace, the GitHub remote is named `github`; a fresh clone names it `origin`. Inspect rather than overwrite an existing remote:

```sh
git push -u github HEAD:main
```

Tag a validated release commit with a new version and publish release notes in both languages. Do not move an existing release tag or force-push over unrelated work. The `.openai/hosting.json` file contains a private preview Site ID, not a credential. It is specific to this preview; GitHub Pages ignores it. Contributors should omit the `project_id` in their own fresh Sites project and let registration create a new one. Never commit `.openai/.local`, credentials, browser state, or real records.

## Publish the static demo with GitHub Pages

The included Pages workflow runs only when manually dispatched. In repository Settings → Pages, choose GitHub Actions as the source. Run **Deploy demo to Pages** from Actions. The build uses a relative asset base so it works under a project subpath.

The public static demo uses the offline parser only. The optional local-model bridge runs in local development; do not expose it as a production API. Check actual [GitHub Actions runs](https://github.com/deepbule0/UDI/actions) for CI and deployment results, and verify deployment before reporting the demo as live.

## Release message

Use [ANNOUNCEMENT.md](ANNOUNCEMENT.md) as a starting point. Lead with the package–instance separation and the reproducible lifecycle. Describe the parser, connectors, portability, and security honestly. Avoid “first,” “new standard,” “production secure,” or comparisons implying superiority without an actual evaluation.
