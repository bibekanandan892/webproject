---
title: "Claude Code"
date: "2026-09-11T21:40"
category: "AI"
tags: ["claude-code", "coding-agents", "tools", "verification", "context"]
summary: "A coding agent is a model plus tools plus a loop. The two things that make it work are searching instead of reading — a 700× reduction in what enters the context — and being able to check its own answer, which turns 55% into 96%."
draft: false
cover: "/blog/claude-code.svg"
---

Claude Code is a coding agent that runs in a terminal. It reads files, edits them, runs commands, and repeats until the job is done.

Stripped to its structure it is a loop with three phases: **find out what is true, change something, prove the change worked.** Everything interesting is in how the first and third are made possible.

## Why a chat window is not enough

A model in a chat window can write excellent code and cannot do anything with it. You paste a file in, get a suggestion out, apply it yourself, run the tests yourself, and paste the failure back.

The model never sees the repository, never sees the test output unless you carry it across, and never finds out whether its suggestion worked. Every iteration costs a human round trip, and the human is doing the two things the model cannot: gathering context and verifying results.

Giving the model tools closes that loop. Six are enough for almost everything: read a file, search file contents, match filenames, edit a file, write a file, run a command.

That last one is the load-bearing one, and it is why this works at all.

## Search, because reading is impossible

Take a repository of 4,200 files averaging 180 lines. At roughly 12 tokens a line that is **9.07 million tokens** — about 45 times what a large context window holds. A 200,000-token context fits 92 whole files, which is 2.2% of the project.

So reading the codebase is not an option, and neither is guessing which 2% to read.

Search is the answer, used as a funnel:

| | tokens |
| --- | --- |
| the whole repository | 9,072,000 |
| the 6 files that match a search | 12,960 |

**700× less**, and the 6 files are the right ones because they were selected by content rather than by hope. The agent then reads only the relevant regions of those.

This is the difference between an agent that works on a real project and one that works on a toy. Not the quality of the edits — the ability to locate the code worth editing without drowning in the rest.

<figure>
<svg viewBox="0 0 560 284" width="560" role="img" aria-label="A funnel from the whole repository through a search to a handful of files, with the context window drawn as a small slice of the total." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<defs><marker id="cc" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--muted-foreground)"/></marker></defs>
<text class="hd" x="20" y="18">SEARCH FIRST, READ SECOND</text>
<rect x="20" y="40" width="300" height="60" rx="5" fill="color-mix(in srgb, var(--muted-foreground) 16%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 34%, transparent)"/>
<text class="l" x="34" y="64">4,200 files</text>
<text class="l" x="34" y="82">9,072,000 tokens</text>
<rect x="20" y="40" width="7" height="60" fill="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<text class="b" x="330" y="58">the shaded sliver is</text>
<text class="b" x="330" y="74">everything a 200k</text>
<text class="b" x="330" y="90">context could hold</text>
<path d="M170 108 V138" stroke="var(--muted-foreground)" stroke-opacity="0.55" stroke-width="1.4" marker-end="url(#cc)"/>
<text class="l" x="182" y="128">grep</text>
<rect x="20" y="142" width="72" height="30" rx="5" fill="color-mix(in srgb, var(--primary) 26%, transparent)" stroke="var(--primary)" stroke-opacity="0.6"/>
<text class="b" x="102" y="162">6 files · 12,960 tokens · 700× less</text>
<path d="M20 194 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="l" x="20" y="218">reading the repository is not an option — it is 45 context windows</text>
<text class="b" x="20" y="240">the files are chosen by content, not by guessing</text>
<text class="l" x="20" y="262">then only the matching regions of those six are read</text>
</svg>
<figcaption>The funnel is the design. Without it there is no way to start.</figcaption>
</figure>

## Verification is the multiplier

Here is the part that changes the arithmetic completely.

A blind pipeline of steps compounds against you: four steps at 55% each is 9.2%, because every failure passes silently onward. But an agent that can run the tests *finds out* when it was wrong, and can try again.

| attempts | success, at 55% per attempt |
| --- | --- |
| 1 | 55.0% |
| 2 | 79.8% |
| 3 | 90.9% |
| 4 | **95.9%** |

Same per-attempt accuracy, opposite direction. Four unverified steps at 55% gives 9.2%; four verified attempts at 55% gives 95.9%.

The entire difference is a check that produces a truthful signal. Which is why running the test suite is not a nicety at the end — it is the mechanism that makes a mediocre one-shot success rate into a reliable outcome.

It also explains what makes a task well suited to this kind of agent. The question is not "is it hard?" but **"can the result be checked automatically?"** A failing test, a type error, a script that exits non-zero — all of these close the loop. A change to visual layout, a judgement about naming, a refactor whose only measure is taste: these produce no signal, the loop cannot close, and the agent is back to one-shot accuracy.

## Standing instructions and permissions

Two smaller pieces do a lot of work.

A **project instruction file** holds facts that would otherwise be rediscovered or guessed every session: the build command, the test command, conventions the code follows but does not state. It is context that is always loaded, which is worth spending tokens on precisely because it would take several tool calls to establish.

**Permissions** exist because the same tool that runs the test suite can delete files. The gradations — ask before each action, allow edits but confirm commands, plan without acting — are ways of positioning a human at the point where a mistake would be expensive. The agent proposing an action and a person approving it are two separate events, and keeping them separate is the whole safety story.

## What to take away

The model is the least distinctive part. What makes a coding agent useful is the loop around it.

Search, so that a nine-million-token repository becomes thirteen thousand relevant tokens. Then verify, so that being wrong is detected rather than shipped — because a check that closes the loop is worth far more than a higher chance of being right first time.
