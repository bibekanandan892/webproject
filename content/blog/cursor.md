---
title: "Cursor"
date: "2026-09-11T22:20"
category: "AI"
tags: ["cursor", "code-editors", "latency", "embeddings", "coding-agents"]
summary: "Three different models do three different jobs, and the reason is a latency budget. A completion has about 210 ms of model time before it feels late, and a large model needs six times that."
draft: false
cover: "/blog/cursor.svg"
---

Cursor is a code editor with models built into it. Built on a familiar editor base, with three features layered on: inline completion as you type, a chat that knows your project, and an agent mode that edits files and runs commands.

What makes it interesting as an engineering artefact is that those three features cannot share a model, and the reason is a hard constraint rather than a cost preference.

## The latency budget

A quick typist puts down a character roughly every 200 ms. For an inline suggestion to feel like part of typing rather than an interruption, it has to appear within about 250 ms of the pause that invited it. Past that, the developer has already typed the next thing.

Subtract a network round trip of around 40 ms and **210 ms of model time** is all there is.

| | time to first token | 30 tokens | total |
| --- | --- | --- | --- |
| small model | 20 ms | 120 ms | **140 ms** |
| large model | 700 ms | 540 ms | 1,240 ms |

The small model fits. The large model is 5.9× over the budget, and the two are 8.9× apart.

So the split is not an optimization. Inline completion *cannot* be served by the model that powers chat, at any price, because the physics of one forward pass per token with a deep model puts the answer outside the window in which it would be useful.

Which is why there are three models rather than one:

- A **small fast model** for inline completion, where the requirement is presence rather than depth. It sees the surrounding lines, recent edits and a little project context, and predicts the next few lines.
- A **large model** for chat and agent work, where the task genuinely needs reasoning and a second or two is acceptable.
- A **small apply model** whose only job is turning a described change into exact line edits.

<figure>
<svg viewBox="0 0 560 292" width="560" role="img" aria-label="A timeline showing a small model's completion landing inside a 210 millisecond budget while a large model's response lands far outside it." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">210 MS, AND THE LARGE MODEL NEEDS 1,240</text>
<path d="M120 40 V160" stroke="var(--primary)" stroke-opacity="0.35" stroke-dasharray="4 4"/>
<path d="M191 40 V160" stroke="var(--primary)" stroke-opacity="0.7" stroke-dasharray="5 4"/>
<text class="b" x="196" y="52">210 ms budget</text>
<text class="l" x="20" y="83">small model</text>
<rect x="120" y="68" width="47" height="20" rx="3" fill="color-mix(in srgb, var(--primary) 30%, transparent)" stroke="var(--primary)" stroke-opacity="0.65"/>
<text class="b" x="196" y="83">140 ms — inside</text>
<text class="l" x="20" y="139">large model</text>
<rect x="120" y="124" width="420" height="20" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 30%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 52%, transparent)"/>
<text class="l" x="204" y="139">1,240 ms — 5.9× over</text>
<text class="l" x="120" y="180">0</text>
<text class="l" x="540" y="180" text-anchor="end">1,240 ms</text>
<path d="M20 202 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="l" x="20" y="226">a quick typist puts down a character every 200 ms</text>
<text class="b" x="20" y="248">so completion and chat cannot be the same model</text>
<text class="l" x="20" y="270">not a cost decision — the answer would simply arrive too late</text>
</svg>
<figcaption>The budget is set by how fast a person types, which no amount of engineering changes.</figcaption>
</figure>

## Finding the right code

Chat and agent mode need the relevant parts of your project in the prompt, and a project does not fit.

Cursor indexes it: split every file into chunks of a function or a related block, embed each chunk, store the vectors. A question is embedded the same way and the nearest chunks come back.

For a project of 1,800 files at about nine chunks each:

| | |
| --- | --- |
| chunks in the index | 16,200 |
| tokens of code they represent | 3.56 M |
| chunks retrieved for one question | 12 |
| tokens sent | 2,640 |

A **1,350× reduction**, and the vectors themselves cost about 100 MB — small enough to keep beside a project, which is what makes the search instant.

Note what this buys over plain text search: the question does not have to use the same words as the code. Asking about "where we check whether a session is still valid" can retrieve a function called `isTokenFresh`, because the embedding captures what the code does rather than what it is called.

## The apply model

This one is easy to overlook and structurally interesting.

A large model asked to change code produces a *description* of the change — often with elisions, approximate indentation, and context lines that do not exactly match the file. Turning that into precise edits to specific lines is a different kind of task: mechanical, high-volume, requiring no reasoning about the problem, only careful matching against the actual file.

So it gets its own small model. The large model decides *what* should change; the apply model works out *exactly which characters*. Splitting them means the expensive model is not spending tokens reproducing unchanged lines, and the result is a diff a person can read and approve.

That approval step is the part worth keeping. A diff shown for accept-or-reject is a different product from a file silently rewritten, even when the change is identical.

## Agent mode

The same loop any coding agent runs: the model is given tools — read a file, search, edit, run a command — and repeats think, act, observe until the task is done or it stops.

What makes it work in an editor is that the observations are real. A failing test or a type error comes back as text and conditions the next step, so being wrong is detected rather than shipped. And the permission gates sit exactly where an irreversible action would be, which is the only place they matter.

## The privacy shape

Code has to reach a remote model to be reasoned about — that is unavoidable in this architecture, and worth being clear-eyed about.

Two mitigations exist. The index stores embeddings rather than source, and a privacy mode discards request contents after answering. Both are meaningful and neither is the same as the code never leaving. An embedding is a lossy projection, not an encryption, and enough of them with a matching model can recover a surprising amount of what they were made from.

## What to take away

The design is mostly a set of answers to "how long may this take?"

Inline completion gets 210 ms and therefore a small model. Chat gets a second and therefore a large one. Applying a change gets its own small model because it is a mechanical transformation that should not cost reasoning tokens. Retrieval exists because 3.5 million tokens of code have to become 2,600.

None of those is a model capability question. They are all budget questions, and the architecture is what the budgets force.
