# Local-model observations

**English** | [简体中文](zh-CN/MODEL-OBSERVATIONS.md)

These are development smoke observations on fictional data, not held-out evaluation results. The model and machine details are recorded in [model-smoke-results.json](model-smoke-results.json).

1. The first two direct model calls returned no parseable JSON with the initial generation settings. Those failures are retained in [model-smoke-initial-failure.json](model-smoke-initial-failure.json). The installed model advertises thinking support. Explicitly disabling thinking in the bounded structured-output call resolved these cases; this observation alone does not identify every cause of empty output.
2. A two-case direct call then produced the expected filter-and-library operations and rejected unsupported email sending. The selected cases and output are recorded in the results file.
3. An additional browser request using unseen phrasing returned a proposal referencing an absent panel. Semantic validation rejected it with “The requested panel is absent from this package”; the active interface remained unchanged. The planner prompt was then clarified to distinguish adding a library panel from changing visibility on an existing one.

The smoke suite and prompt were used during development, so successful runs must not be interpreted as an unbiased estimate of model performance. Validating references prevents this particular malformed change from being applied; it does not establish that a valid proposal matches a user's intent. A future evaluation should freeze prompts and use a separate test set with all failures retained.
