# Introducing UDI: your own way to use an app

**English** | [简体中文](zh-CN/ANNOUNCEMENT.md)

A platform can provide the content and functions without prescribing the same experience for everyone.

**User-Defined Interface (UDI)** is a framework in which the platform supplies useful content, supported operations, and a good default app, while people shape their own way of using it through an agent or familiar controls. They can change presentation, interactions, data organization, and supported workflows, then share the resulting experience as easily as a link.

Illustrative domains include study, reading, travel, photos, productivity, and music. A reading service could offer a topic-based view, a travel tool a daily itinerary, or a music service a combined album-and-queue view. Each provider would define the content and operations it supports. These examples illustrate possible applications; the integrations are not implemented here.

The useful unit of sharing is a **reusable experience**: how the app looks and works within the provider's supported scope. The receiving person uses their own data and permissions. Ordinary users should not need to program, call APIs, upload a JSON interface, or understand a package format to participate.

The experimental **v0.4.0** application brings that consumer path to the reference demo:

1. **Try** an interface through a visual preview using fictional sample data.
2. **Use** the interface explicitly.
3. **Choose a workspace and consent** to the data access it needs. A personal research workspace can be created with a form.
4. **Personalize** through Agent chat or settings-style controls.
5. **Share a link** so another person can preview and use their own copy.

Try [UDI Studio for desktop](https://deepbule0.github.io/UDI/?lang=en) or [UDI Pocket for phones](https://deepbule0.github.io/UDI/mobile.html?lang=en). Both support English and Simplified Chinese. Pocket can be installed as a web app and used offline after its app shell is cached; it is not a native app-store binary or a device-sync service. See the [phone guide](MOBILE.md).

Discovery distinguishes UDI project examples from real public community posts. Sharing a link needs no account or file upload. Public listing in this prototype still uses a reviewed GitHub handoff under **Advanced publishing**; technical package import/export remains available under advanced tools. See the [community guide](COMMUNITY.md).

Behind the interaction, a reusable definition is separated from a private instance containing data bindings, grants, records, notes, and activity. An agent proposes bounded changes; the host validates the result and mediates access and effects. Shared names and descriptions still need review because they may contain personal text.

The **general framework** is broader than the demo. The application implements only the **Core 0.1 research profile**: experiment views, filtering and grouping, a research library, deadlines, local workspaces, and confirmed local review notes. It does not implement music playback, real provider connectors, or a general workflow engine. Hosted chat uses a small deterministic command grammar, not a hosted language model; an optional local Ollama bridge can propose the same supported operations.

UDI is a draft design framework with a working reference, not a ratified standard or demonstrated compatibility layer across applications. The [framework document](FRAMEWORK.md), [position paper](POSITION-PAPER.md), and [research-profile specification](SPECIFICATION.md) make those levels and boundaries explicit.

It builds on end-user programming, adaptive interfaces, and generative UI. A2UI, AG-UI, MCP Apps, and json-render provide relevant foundations, not projects this prototype claims to replace. The name has history too: Wixon and colleagues used “user-defined interface” and “UDI” in CHI 1983. This project does not claim to have coined that terminology; see [related work](RELATED-WORK.md).

The next questions need evidence: can ordinary people adapt and reuse an experience reliably, understand its access, and complete useful tasks with less assistance? Contributions toward a real provider adapter, a versioned renderer adapter, reproducible model evaluations, and end-user studies will help answer them. The [roadmap](ROADMAP.md) describes those decision gates.
