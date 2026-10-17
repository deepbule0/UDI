# Introducing UDI: software, defined by you

**English** | [简体中文](zh-CN/ANNOUNCEMENT.md)

What should happen after an AI generates an interface?

The result should be something you can keep, understand, change, and reuse with your own data. That question is the starting point for **User-Defined Interface (UDI)**.

UDI separates a reusable interface package from a personal instance. The package describes views, logical data sources, capability requests, and supported actions. The instance supplies its own bindings, grants, records, and history. An agent proposes revisions; a deterministic runtime validates them; the user reviews meaningful changes and approves effects.

A UDI-enabled app can supply its data, supported capabilities, and a usable default interface. People can then reshape it through Agent chat or ordinary controls, or start from a community-shared definition. The [music-app example](EXAMPLES.md) illustrates this broader proposal: a provider supplies audio and playback functions, while people adapt the player to their own library and preferences. Audio playback is not implemented in the current research demo.

The current experimental release, v0.3.0, includes a position paper, an executable draft specification, and two demonstrations: [UDI Studio for desktop](https://deepbule0.github.io/UDI/?lang=en) and [UDI Pocket for phones](https://deepbule0.github.io/UDI/mobile.html?lang=en). You can revise views, switch datasets, inspect commit provenance, add a library panel, review permissions, create a confirmed local note, and export or reinstall the definition. Both demos support English and Simplified Chinese.

The Agent tab now offers conversation and settings-style controls over reviewed interface, source, and permission changes. Data management separates platform samples from browser-local personal JSON imports. Community can discover and install validated public GitHub posts, and prepare your own post for final submission on GitHub. Project starter examples are labeled separately from community activity. See the [community guide](COMMUNITY.md).

UDI Pocket is an installable web app with card views, five bottom tabs, and offline use after the app shell is cached. It shares the Core 0.1 package and runtime; it does not provide a native store binary or device synchronization. See the [phone guide](MOBILE.md).

It is deliberately small. The default planner uses a limited offline grammar, the data is fictional, and browser permission checks are a demonstration rather than production authorization. An optional local Ollama bridge is available for experimenting with model-generated operations.

UDI builds on prior work in end-user programming, adaptive interfaces, and generative UI. A2UI, AG-UI, MCP Apps, and json-render are relevant foundations, not projects this prototype claims to replace. The proposal focuses on making the lifecycle around a generated interface explicit and testable.

The name also has history: Wixon and colleagues used “user-defined interface” and “UDI” in CHI 1983. This project adapts that term to the architecture described here and makes no claim to have coined it.

I’m sharing this as an experimental idea and working reference, and I welcome criticism of the assumptions as much as code contributions. The first questions are practical: can people revise these tools reliably, and can someone else's definition become useful with your data?

Run the demo, inspect the package, and try to break the boundaries. The most useful next contributions are a versioned renderer adapter, one properly scoped connector, reproducible model evaluations, and user studies of package transfer.
