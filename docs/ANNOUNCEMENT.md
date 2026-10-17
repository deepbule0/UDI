# Introducing UDI: software, defined by you

What should happen after an AI generates an interface?

The result should be something you can keep, understand, change, and reuse with your own data. That question is the starting point for **User-Defined Interface (UDI)**.

UDI separates a reusable interface package from a personal instance. The package describes views, logical data sources, capability requests, and supported actions. The instance supplies its own bindings, grants, records, and history. An agent proposes revisions; a deterministic runtime validates them; the user reviews meaningful changes and approves effects.

The first release includes a position paper, an executable draft specification, and UDI Studio: a research-workspace prototype where you can revise a table, switch datasets, inspect commit provenance, add a library panel, review permissions, create a confirmed local note, and export or reinstall the definition.

It is deliberately small. The default planner uses a limited offline grammar, the data is fictional, and browser permission checks are a demonstration rather than production authorization. An optional local Ollama bridge is available for experimenting with model-generated operations.

UDI builds on prior work in end-user programming, adaptive interfaces, and generative UI. A2UI, AG-UI, MCP Apps, and json-render are relevant foundations, not projects this prototype claims to replace. The proposal focuses on making the lifecycle around a generated interface explicit and testable.

The name also has history: Wixon and colleagues used “user-defined interface” and “UDI” in CHI 1983. This project adapts that term to the architecture described here and makes no claim to have coined it.

I’m sharing this as an experimental idea and working reference, and I welcome criticism of the assumptions as much as code contributions. The first questions are practical: can people revise these tools reliably, and can someone else's definition become useful with your data?

Run the demo, inspect the package, and try to break the boundaries. The most useful next contributions are a versioned renderer adapter, one properly scoped connector, reproducible model evaluations, and user studies of package transfer.
