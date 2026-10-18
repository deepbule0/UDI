# UDI through a music app

**English** | [简体中文](zh-CN/EXAMPLES.md)

[General framework](FRAMEWORK.md) · [Desktop demo](https://deepbule0.github.io/UDI/?lang=en) · [Phone demo](https://deepbule0.github.io/UDI/mobile.html?lang=en) · [Community and personal-data guide](COMMUNITY.md)

**Music is one illustrative application of the general UDI framework.** The same persistent, shareable experience lifecycle can apply to reading, photos, travel, research, and other apps, with a suitable provider contract for each domain. This page develops one hypothetical case; the [framework draft](FRAMEWORK.md) defines the broader responsibilities and proposed requirements.

A compatible music host would supply a default player, agent and direct controls for supported personalization, and a path to preview and adopt shared experiences. The host handles the underlying service integration.

**This music example describes a proposed application of UDI. The working prototype uses research records. Its schema and runtime do not support music playback or a music-service adapter, and the music prompts below are illustrative rather than accepted demo commands.**

## A useful app from the beginning

The provider supplies music access, song information, artwork, and trusted functions such as search, playback, queues, and playlist editing. It also supplies a good default app. A listener can open it, find music, and press Play immediately.

The user can then adapt the experience over time. They keep the provider's content and supported functions while choosing how those functions serve their needs. They do not have to design an app before listening, and a shared experience does not supply music access on its own.

## Define how the app works for you

An **Agent** area provides conversation alongside a familiar settings-style **Controls** panel. A listener might ask:

> “Make albums my home screen, hide trending recommendations, and keep a large player visible.”

> “Organize my liked music by composer. Keep recently added albums easy to reach.”

> “Help me make a playlist from my selected songs, and let me review it before saving.”

> “Use this shared minimal player, but make the buttons larger and put my queue beside the lyrics when there is enough room.”

These requests concern a whole experience: presentation, the organization of available information, preferences, and supported actions. A reusable definition could describe an album-first home screen, a composer grouping, a persistent queue, and a review-before-save playlist flow. Its meaning goes beyond a visual theme.

There are two different effects to explain clearly. Grouping an existing library by composer may change only this person's view. Saving a playlist changes account data and requires a supported provider operation, authorization, and an appropriate confirmation. The agent should make that distinction understandable before a user agrees.

A music integration would need to expose the relevant information and operations. The agent cannot invent missing catalog fields, acquire unavailable music, or bypass account access checks. Once a supported definition is applied, ordinary playback and queue navigation continue through normal controls; every tap does not need another conversation or model call.

## Share a way of listening

Imagine a listener creates **Minimal Classical Player**:

1. They select **Share**, give the experience a name and short description, and send a link in a conversation.
2. Their friend opens the link and sees a visual preview using clearly labeled example content.
3. They choose **Use this interface**, select their own supported service account or library, and review what the experience asks to read or change.
4. They use the same listening arrangement with their own music, likes, playlists, and history.
5. They ask the agent to adapt it further, or adjust ordinary controls, then share their variation.

A community can make these experiences discoverable, so someone can browse and try a shared style without first authoring one. Direct sharing should also work without becoming a public community post. Neither path should make users handle the developer-facing package format.

The reusable definition describes the experience and its requests. It does not transfer the author's credentials, private library records, listening history, grants, or music rights. A recipient approves their own connections and permissions. Names and descriptions can still reveal personal information, so sharing needs a readable review of those words.

## Try the current research equivalent

The desktop and phone demos offer a small, working version of this lifecycle:

1. Use the default research workspace immediately, or open **Community → Try this interface** to see a visual preview of a shared definition using fictional sample records. Preview actions are disabled.
2. Choose **Use this interface** or **Make a copy & use**. The current definition is replaced and existing data grants are cleared; local records and notes remain.
3. In **Data**, select a public fictional workspace or **Create my workspace**. The form asks for a name and one experiment result; it does not require a data file. New personal workspaces have no grants.
4. Review the readable access choices. **Allow reading this workspace** approves only the requested reading; note writing stays a separate choice. These personal entries remain in this browser. Real account connections are not implemented.
5. Use **Agent → Chat** for a supported request such as `Show only failed experiments`, or **Controls** for settings-style changes. Review before applying.
6. Select **Share this interface**, name it, and choose **Copy link** or your device's sharing menu. No account or upload is needed. A recipient previews the definition and makes their own data choices.

A share link carries the supported definition and does **not** create a public community listing. The current discovery feed uses validated public GitHub posts and clearly labeled project starters. **Advanced publishing** provides the separate GitHub review and submission flow, which requires the poster's own GitHub account. It is a prototype distribution mechanism, not a mature consumer marketplace.

Optional JSON imports and data backups sit under **Advanced data tools**. Interface file tools and technical details remain available for developers and power users. They implement portability underneath the ordinary experience; they are not prerequisites for trying, shaping, or sharing it.

## What still needs a music implementation

| Intended music experience | Current working research prototype |
| --- | --- |
| Music and a usable default player | Fictional research records and a default workspace |
| Agent plus settings-style control over the experience | Bounded English/Chinese commands, optional local model bridge, and controls |
| Reorganize likes and library; supported playlist operations | Research views, filters, grouping, visibility, and a separately confirmed local note action |
| Preview, use, adapt, and share a listening experience | Visual sample previews, local reuse, direct share links, and advanced public GitHub posts |
| Use each person's own account and library | Independent local workspace bindings and permissions; no live account connector |

A music version needs a domain-specific contract, service integration, components, and playback runtime. Reading, photos, or travel would likewise need their own documented profiles. The current package schema supports research components. UDI's larger proposal is the reusable, personalizable experience and its lifecycle; the repository demonstrates that lifecycle within a deliberately limited domain. A shared label does not prove interoperability: a receiving host must support the specific contract and operations, as described in the [framework's compatibility requirements](FRAMEWORK.md#6-profiles-and-compatibility).
