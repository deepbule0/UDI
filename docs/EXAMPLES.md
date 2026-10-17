# UDI through a music app

**English** | [简体中文](zh-CN/EXAMPLES.md)

[Desktop demo](https://deepbule0.github.io/UDI/?lang=en) · [Phone demo](https://deepbule0.github.io/UDI/mobile.html?lang=en) · [Community and personal-data guide](COMMUNITY.md)

UDI can work inside an everyday app. A music service is a useful example: the provider supplies music, supported functions, and a usable default interface. Each user can then reshape that interface through an agent, adjust ordinary settings, or adopt a definition shared by someone else.

**This music example describes a proposed application of UDI. The published prototype uses research records; it does not play music or implement a music-service adapter.**

## Start with a complete app

The provider supplies audio access, a catalog with song metadata and artwork, and supported capabilities such as search, playback, queue management, and playlist editing. It also supplies a working default interface: users can browse, press Play, and manage their queue immediately.

The interface is a starting point that the user can revise. UDI does not require everyone to design an app before using it, and a shared definition does not supply the underlying music service.

## Shape it through Agent or controls

An **Agent** area provides conversation alongside a settings-style **Controls** panel. A user might request:

> “Make albums the home screen, hide trending recommendations, and keep a large player at the bottom.”

> “Organize my library by composer. Put the queue beside the lyrics when there is enough room.”

> “Use this shared minimal player, but make the buttons larger and keep my recently played albums visible.”

These are illustrative music prompts, not commands accepted by the current research demo. A music adapter would need to expose the corresponding data, components, and operations. The agent would propose a supported definition change for review; controls would offer another way to make those choices.

Once applied, the definition persists. Normal playback, seeking, and queue navigation run through the app's controls and supported provider functions. Each tap does not require another agent conversation or model call.

## Adopt another person's interface

Imagine a user sharing a **Minimal Classical Player**. Another person browses Community, previews its layout and requested capabilities, and installs or forks the definition. They connect their own service account or library and choose their own grants. They can then ask the agent to adapt the design and share their variation.

The reusable definition describes presentation, workflow, logical sources, and capability requests. It does not transfer the author's credentials, private library records, listening history, or grants. Free-text titles and descriptions still need review before public posting. Sharing a layout also does not transfer audio access.

An installed definition cannot grant itself permissions. A playlist-writing feature, for example, requires both a supported provider operation and explicit authorization; asking for that capability is not authorization to use it. An interface cannot invent an unavailable catalog field or bypass the provider's access checks.

## What the published demo demonstrates

The desktop and phone research demos implement the shared lifecycle: a default workspace, **Agent** chat and settings-style controls, reviewed changes, **Data** bindings and permissions, personal JSON import, and **Community** discovery, preview, installation, forks, and reviewed GitHub posting. Ordinary runtime views remain usable after the conversation ends.

The hosted Agent uses a bounded English/Chinese grammar. Community is a GitHub-backed prototype with project starters and validated public posts, not a mature marketplace. Its current package schema supports research components, not music. A working music version would require a music-specific contract, adapter, renderer, and playback integration. See the [community guide](COMMUNITY.md) for the implemented posting, installation, and data boundaries.
