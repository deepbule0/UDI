# UDI Pocket phone app demo

**English** | [简体中文](zh-CN/MOBILE.md)

[Open in English](https://deepbule0.github.io/UDI/mobile.html?lang=en) · [用中文打开](https://deepbule0.github.io/UDI/mobile.html?lang=zh-CN) · [Desktop demo](https://deepbule0.github.io/UDI/?lang=en)

UDI Pocket lets people use an app normally, ask an agent to adapt its supported behavior and presentation, or try a shared experience and make it their own. Share a link instead of handling an API or definition file. The phone demo has a card layout and bottom navigation, and can be added to a supported phone's Home Screen as a progressive web app (PWA).

This is an experimental web app. There is no App Store or Google Play binary. It uses the same package schema, validator, planner, capability checks, and action confirmation rules as UDI Studio.

The [UDI framework](FRAMEWORK.md) is a general proposal for reusable app experiences, including presentation, supported behavior, and data organization. This application implements only the research-workspace profile, Core 0.1. Music, reading, and other app categories are illustrative applications; the demo does not implement those provider integrations.

The bottom navigation contains **Home** (workspace cards), **Agent** (chat and settings-style controls), **Data** (platform and personal datasets, grants, and notes), **Community** (public interface posts, project starters, and package tools), and **Activity** (local history).

<img src="assets/udi-mobile.en.png" width="340" alt="UDI Pocket English workspace with experiment cards and bottom navigation" />

## Try the lifecycle

1. Open the phone demo and choose **EN / 中文**. The workspace shows fictional experiment records as cards, with supporting metrics, model comparisons, and deadlines.
2. Open **Agent → Chat** and send **Show only failed experiments**. Inspect the proposal. The current workspace changes only after you select **Apply change**. **Controls** offers settings-style choices for layout, visible panels, source binding, and permissions; these also prepare changes for review.
3. Return to **Home** and inspect a run's recorded commit. This is an explicit provenance link in fixture data, not a connection to a live GitHub repository.
4. Switch from **Aurora lab** to **Atlas lab**. The interface definition stays the same while the bound records and per-instance grants change. **Undo** restores the previous definition while preserving the selected binding.
5. In **Agent**, try **Add related papers** or **Add a review-note action**. Adding an action requests `notes.write`; it does not grant it. Prepare a grant in **Agent**, or enable that capability for the current instance in **Data**, then preview and separately confirm the exact local note from **Home**. Notes stay in this browser storage context. Chat also supports explicit binding and permission commands such as **Use Atlas lab** and **Revoke experiment access**.
6. In **Data**, choose **Create my workspace** and enter a workspace name and one experiment's name, model, status, and score. No file is needed. The new workspace starts with **no grants**; select **Allow reading this workspace** or individual access choices. JSON import and records-only backups are optional **Advanced data tools**. Deletion requires a separate confirmation. The form creates an initial entry; it is not a complete record editor.
7. Open **Community** to browse public interface posts or project starters. **Try this interface** renders a real preview with public sample records. **Use this interface** or **Make a copy & use** replaces the definition and clears grants for all local instances. Your records and notes remain; choose your workspace and data access next.
8. On **Home**, choose **Share this interface**; in Community, use **Share my interface**. Review its name, description, and privacy summary, then choose **Share…** or **Copy link**. The recipient sees a sample-data preview and must explicitly choose **Use this interface**. Opening a link alone changes nothing. No account, upload, file, or JSON is needed. See the [community guide](COMMUNITY.md).

The hosted Agent uses a small deterministic parser, with supported English and Chinese commands. It runs on the device after the app loads, needs no API key, and does not call a language model. Unsupported requests fail visibly. It changes interface definitions, bindings, and grants through reviewed proposals; it does not autonomously import, delete, or publish data. All bundled datasets and paper titles are fictional. The local form and advanced import support only the documented research records, not arbitrary app data. There are no real-account data connectors, music playback, push notifications, camera access, or background external actions.

Community reads real public GitHub posts when available and labels cached or unavailable feeds. Built-in cards are marked **UDI project starter**; they do not imply other people have posted. Browsing and direct link sharing need no sign-in. Creating a public listing is a separate **Advanced publishing → Publish to public community** flow: review, open the GitHub composer, sign in, and submit there. Opening the composer does not publish, and copying a link does not create a listing. No GitHub token is stored in the app.

## Add it to your phone

Open the demo in the phone's regular browser first. Tap the question-mark button at the top to open **About & install**, which includes installation guidance and cache status. Installation controls depend on the browser and OS version; using the website without installing it is also supported.

### Android with Chrome

1. Open [UDI Pocket](https://deepbule0.github.io/UDI/mobile.html?lang=en) in Chrome.
2. Open Chrome's **More** menu, then **Install and create shortcut → Install**. Some versions show **Install app** or **Add to Home screen** instead.
3. Follow the browser's confirmation, then launch **UDI Pocket** from the new icon.

If the app exposes an install button while Chrome has made an install prompt available, that button opens the browser's installation flow. The browser makes the final installation decision. [Google Chrome installation instructions](https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DAndroid&hl=en).

### iPhone with Safari

1. Open [UDI Pocket](https://deepbule0.github.io/UDI/mobile.html?lang=en) in Safari.
2. Open **Share**; depending on Safari's layout, first open **More** or the page menu.
3. Select **Add to Home Screen**, leave **Open as Web App** enabled if that option appears, then tap **Add**.

If the action is missing, find **Edit Actions** at the bottom of the Share sheet and add it. Launch the app from its Home Screen icon. [Apple's iPhone instructions](https://support.apple.com/en-lamr/guide/iphone/iphea86e5236/ios).

## Offline use and updates

The initial visit requires a successful network load. The service worker then caches the built app and bundled assets. Wait for **Ready for offline use** in **About & install** before relying on offline use; installation alone does not establish that the cache is complete. Once ready, the bundled workspace, supported Agent commands, local revisions, local note actions, and personal datasets can work without a connection. Share links contain their definitions, so creating or decoding one needs no upload; the recipient still needs the application available. Sending through another app depends on that app's connectivity. Community needs a network connection for fresh posts; otherwise it can show saved posts and project starters. A public listing requires GitHub online.

Cached data can be removed by the browser, device storage pressure, or clearing site data. Reconnect to obtain new versions; select **Update app** when an update is offered. The optional Ollama bridge is a separate local-development feature and is not provided by this public phone demo.

## What persists and what transfers

The phone and desktop routes use the same local state key. When opened at the **same origin in the same browser profile and storage context**, they can reuse the saved definition, revision history, selected dataset, grants, notes, and local activity. Reload the destination route after making changes. They do not synchronize across devices, browser profiles, private browsing contexts, or different hosting origins.

On iPhone, a Home Screen web app has storage isolated from Safari. Your existing Safari workspace may therefore not appear in the installed app. A share link can transfer the definition if opened in the destination context; advanced file export/import is another option. Notes, grants, and history do not transfer this way. This follows [WebKit's documented web-app storage behavior](https://webkit.org/blog/14787/webkit-features-in-safari-17-2/).

**Share this interface** creates a link carrying the validated definition: views, filters, supported organization, logical sources, capability requests, and action definitions. It excludes dataset records, bindings, grants, notes, activity, and Agent conversation. Anyone with the link can read its free-text names and descriptions. Incoming definitions are removed from the address bar before parsing; they are never applied automatically. Links are capped at **16,000 characters** and decoded definitions at **64 KiB**. Some messaging apps accept less. There is no hosted short-link service or revocation, and later edits do not update a previously sent copy.

Advanced package export/import uses the same definition in a `.udi.json` file, with a **64 KiB** import limit and optional pasted JSON. It remains useful for development or migration. Neither a share link nor a package is a complete workspace backup or a device-sync mechanism.

Personal records use a separate browser-local store and separate JSON download. Imports are limited to **500 KiB**, **200 records per collection**, and **5 datasets**, with strict fields, finite numbers, unique IDs, dates, and commit references. Imported IDs are assigned a new `personal-*` namespace. Data downloads include records; they exclude notes and grants. Removing a personal dataset permanently removes its local records, grants, and notes after confirmation. If it was active, the workspace falls back to Aurora. Local browser storage can be cleared by the browser; keep downloaded copies of data you need.

The browser contains both the demonstration policy code and fictional data. Home Screen installation does not strengthen that security boundary. See the [threat model](../SECURITY.md) and [draft specification](SPECIFICATION.md) for the underlying limits.

## Run locally

```sh
npm ci
npm run dev
```

Open `/mobile.html?lang=en` or `/mobile.html?lang=zh-CN` on the Vite URL. Production caching is available in the built preview and published HTTPS site; service workers require a secure context, with a localhost exception. A phone visiting an HTTP LAN address does not receive that localhost exception.
