# Publishing UDI on GitHub

The repository is prepared for a public **experimental proposal and reference prototype** release. No GitHub repository has been created by this task, and no public research validation or production readiness is claimed.

## Repository metadata

- Suggested repository name: `udi` or `user-defined-interface`.
- Description: `An experimental package-and-runtime model for persistent, user-defined interfaces, with reviewed revisions and local data bindings.`
- Topics: `generative-ui`, `human-computer-interaction`, `end-user-programming`, `ai-agents`, `declarative-ui`, `personal-software`.
- License supplied: MIT for original code/documentation; review it as the project owner before publication.
- Suggested first tag: `v0.1.0`.

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

Create an empty GitHub repository using your account. From this directory, inspect the existing Git history and remotes first:

```sh
git status
git remote -v
```

If Git has not yet been initialized, run `git init -b main`, `git add .`, and `git commit -m "Introduce UDI proposal and reference prototype"`. If this directory already has the prepared source commit, keep it. Add your repository URL as a new remote so any existing hosting configuration remains intact:

```sh
git remote add github https://github.com/YOUR-ACCOUNT/YOUR-REPOSITORY.git
git push -u github HEAD:main
git tag v0.1.0
git push github v0.1.0
```

Replace the account and repository values with the actual destination. Review the files before pushing. The `.openai/hosting.json` file contains a private preview Site ID, not a credential. It is specific to this preview; GitHub Pages ignores it. Contributors should omit the `project_id` in their own fresh Sites project and let registration create a new one.

## Publish the static demo with GitHub Pages

The included Pages workflow runs only when manually dispatched. In repository Settings → Pages, choose GitHub Actions as the source. Run **Deploy demo to Pages** from Actions. The build uses a relative asset base so it works under a project subpath.

The public static demo uses the offline parser only. The optional local-model bridge runs in local development; do not expose it as a production API. GitHub Actions and Pages workflows are provided but have not been executed on a GitHub runner by this task.

## Release message

Use [ANNOUNCEMENT.md](ANNOUNCEMENT.md) as a starting point. Lead with the package–instance separation and the reproducible lifecycle. Describe the parser, connectors, portability, and security honestly. Avoid “first,” “new standard,” “production secure,” or comparisons implying superiority without an actual evaluation.
