# UDI Pocket phone app demo

**English** | [简体中文](zh-CN/MOBILE.md)

[Open in English](https://deepbule0.github.io/UDI/mobile.html?lang=en) · [用中文打开](https://deepbule0.github.io/UDI/mobile.html?lang=zh-CN) · [Desktop demo](https://deepbule0.github.io/UDI/?lang=en)

UDI Pocket brings the same interface-package lifecycle to a phone: describe a change, inspect a proposal, apply it, and keep using the resulting workspace. It has a phone-oriented card layout and bottom navigation, and can be added to a supported phone's Home Screen as a progressive web app (PWA).

This is an experimental web app. There is no App Store or Google Play binary. It uses the same package schema, validator, planner, capability checks, and action confirmation rules as UDI Studio.

The bottom navigation contains **Home** (workspace cards), **Shape** (intent and proposal review), **Data** (bindings, grants, and notes), **Share** (interface-package tools), and **Activity** (local history).

<img src="assets/udi-mobile.en.png" width="340" alt="UDI Pocket English workspace with experiment cards and bottom navigation" />

## Try the lifecycle

1. Open the phone demo and choose **EN / 中文**. The workspace shows fictional experiment records as cards, with supporting metrics, model comparisons, and deadlines.
2. Open **Shape** and select **Show only failed experiments**. Inspect the proposal. The current workspace changes only after you select **Apply change**.
3. Return to **Home** and inspect a run's recorded commit. This is an explicit provenance link in fixture data, not a connection to a live GitHub repository.
4. Switch from **Aurora lab** to **Atlas lab**. The interface definition stays the same while the bound records and per-instance grants change. **Undo** restores the previous definition while preserving the selected binding.
5. In **Shape**, try **Add related papers** or **Add a review-note action**. Adding an action requests `notes.write`; it does not grant it. Enable that capability for the current instance in **Data**, then preview and separately confirm the exact local note from **Home**. Notes stay in this browser storage context.
6. Open **Share** to inspect, export, or import the interface definition. Import validates the package and clears grants for all local instances; review permissions again before using its data and actions.

The hosted planner is a small deterministic parser, with supported English and Chinese intents. It runs on the device after the app loads, needs no API key, and does not call a language model. Unsupported requests fail visibly. All bundled datasets and paper titles are fictional. There are no real-account connectors, push notifications, camera access, or background external actions.

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

The initial visit requires a successful network load. The service worker then caches the built app and bundled assets. Wait for **Ready for offline use** in **About & install** before relying on offline use; installation alone does not establish that the cache is complete. Once ready, the bundled workspace, supported intent parsing, local revisions, and local note actions can work without a connection.

Cached data can be removed by the browser, device storage pressure, or clearing site data. Reconnect to obtain new versions; select **Update app** when an update is offered. The optional Ollama bridge is a separate local-development feature and is not provided by this public phone demo.

## What persists and what transfers

The phone and desktop routes use the same local state key. When opened at the **same origin in the same browser profile and storage context**, they can reuse the saved definition, revision history, selected dataset, grants, notes, and local activity. Reload the destination route after making changes. They do not synchronize across devices, browser profiles, private browsing contexts, or different hosting origins.

On iPhone, a Home Screen web app has storage isolated from Safari. Your existing Safari workspace may therefore not appear in the installed app. Export the definition from the original context and import it into the other context if you want to transfer the interface; notes, grants, and history do not transfer this way. This follows [WebKit's documented web-app storage behavior](https://webkit.org/blog/14787/webkit-features-in-safari-17-2/).

Package export produces a `.udi.json` definition. It includes views, filters, logical sources, capability requests, and action definitions. It excludes dataset records, bindings, grants, notes, and activity history. Import accepts a supported, validated package of at most **64 KiB**. It is a way to reuse an interface, not a complete workspace backup or device-sync mechanism. Review names and descriptions before sharing: free-text fields can still contain information you entered. On phones, file download and file selection use the browser's normal controls; the import dialog also accepts pasted JSON.

The browser contains both the demonstration policy code and fictional data. Home Screen installation does not strengthen that security boundary. See the [threat model](../SECURITY.md) and [draft specification](SPECIFICATION.md) for the underlying limits.

## Run locally

```sh
npm ci
npm run dev
```

Open `/mobile.html?lang=en` or `/mobile.html?lang=zh-CN` on the Vite URL. Production caching is available in the built preview and published HTTPS site; service workers require a secure context, with a localhost exception. A phone visiting an HTTP LAN address does not receive that localhost exception.
