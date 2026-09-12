---
title: "Context Compaction"
date: "2026-09-11T22:00"
category: "AI"
tags: ["context-compaction", "summarisation", "agents", "context-window", "memory"]
summary: "Replacing old turns with a summary buys room, and each summary is lossy. Summarise a summary eight times and 43% of the original detail is left — which is why the facts that matter must never be summarised twice."
draft: false
cover: "/blog/context-compaction.svg"
---

A model's context window is a fixed number of tokens. Everything it can see — instructions, the conversation so far, the current message — has to fit inside it.

A conversation only grows. So eventually it does not fit, and something has to go.

## The budget, concretely

A 200,000-token window is not 200,000 tokens of conversation. Space has to be reserved:

| | tokens |
| --- | --- |
| window | 200,000 |
| system instructions and tool definitions | −8,000 |
| room for the reply | −24,000 |
| **available for history** | **168,000** |

At roughly 1,400 tokens per exchange, that is about **120 turns**. Plenty for a chat, and not much at all for an agent that reads files and command output, where a single turn can be ten times that.

## Why deleting is wrong

The simplest response is to drop the oldest messages. It is cheap, it is exact, and it destroys the wrong thing.

What sits in the oldest messages is usually the most important content in the conversation: what the task is, what was decided, what constraint was agreed. What sits in the newest is a partial command output. Dropping by age removes the premises and keeps the working.

Compaction replaces old turns with a *summary* of them instead.

## What it buys

Triggering at 75% full, keeping the recent portion verbatim and compressing the rest:

| | tokens |
| --- | --- |
| used when compaction triggers | 126,000 |
| kept verbatim (most recent) | 36,000 |
| summarised | 90,000 → 8,000 |
| **freed** | **82,000** |

That is 11.3× compression on the old portion, and 82,000 tokens is another 58 turns.

Two things are worth noticing. The compaction is itself a model call that reads 90,000 tokens — not free, and it happens while the user waits. And keeping the recent portion verbatim is not politeness; the last few turns are where the immediate work is, and a summary of them would break the thread of whatever is in progress.

## The loss compounds

Here is the part that matters and gets skipped.

A long session compacts repeatedly. The second compaction summarises a region that already contains the first summary. The third summarises the second. A fact from the opening turns has now been through a summariser several times.

If each pass retains 90% of the specifics in what it is given:

| compactions | original detail surviving |
| --- | --- |
| 1 | 90.0% |
| 2 | 81.0% |
| 4 | 65.6% |
| 8 | **43.0%** |
| 16 | 18.5% |

Ninety percent per pass sounds excellent. Eight passes later, most of the detail is gone — and it goes quietly. The summary is fluent and confident; it simply no longer contains the version number that was agreed in turn three.

<figure>
<svg viewBox="0 0 560 298" width="560" role="img" aria-label="A decaying curve of surviving detail against the number of compactions, beside a flat line for facts kept pinned outside the compacted region." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">SUMMARISING A SUMMARY, EIGHT TIMES OVER</text>
<path d="M60 40 V196 H520" stroke="var(--muted-foreground)" stroke-opacity="0.35"/>
<text class="l" x="20" y="46">100%</text>
<text class="l" x="28" y="124">50%</text>
<text class="l" x="34" y="200">0</text>
<path d="M60 40 H520" stroke="var(--primary)" stroke-opacity="0.75" stroke-width="2.4"/>
<text class="b" x="330" y="60">pinned facts — never re-summarised</text>
<path d="M60 40 L89 56 L118 70 L147 82 L175 93 L204 103 L233 112 L262 120 L291 127 L320 133 L348 139 L377 144 L406 149 L435 153 L464 157 L492 161 L520 164" stroke="color-mix(in srgb, var(--muted-foreground) 80%, transparent)" stroke-width="2.4" fill="none"/>
<circle cx="291" cy="129" r="4" fill="var(--muted-foreground)"/>
<text class="l" x="301" y="122">43.0% after 8</text>
<text class="l" x="60" y="216">0</text>
<text class="l" x="291" y="216" text-anchor="middle">8</text>
<text class="l" x="520" y="216" text-anchor="end">16 compactions</text>
<path d="M20 234 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="256">each pass keeps 90% of what it was given — that is the good case</text>
<text class="l" x="20" y="276">the summary stays fluent while the specifics drain out of it</text>
</svg>
<figcaption>Compaction is not lossy once. It is lossy every time, over the output of the last time.</figcaption>
</figure>

## The fix that follows

If the problem is repeated summarisation, the answer is to make the things that matter exempt from it.

Keep a small region of **pinned facts** outside the compactable history: the task as originally stated, decisions with their reasons, constraints, file paths and identifiers that have been established. Written once, carried forward verbatim, never passed to a summariser a second time. It survives at 100%, indefinitely, because it never decays.

Everything else — exploration, dead ends, command output, discussion that led somewhere already recorded — can be compacted freely, because losing 90% of it costs nothing.

This makes the summariser's job much easier to specify, too. Rather than "summarise this conversation", the instruction becomes *extract anything that a later step would need and that is not already pinned* — which is a smaller and far more answerable question than compressing prose in general.

## Practical details that bite

**Compact before you have to, not when you are out of room.** A compaction needs its own headroom to run, and triggering at 100% leaves none.

**Keep the recent portion untouched.** Whatever is mid-flight must survive verbatim; a half-finished task summarised into a sentence cannot be resumed.

**Record that a compaction happened.** A model asked about something it cannot find should be able to tell the difference between "that never happened" and "the detail was compacted away", and can only do so if the boundary is visible in the context.

**Never compact quoted source material.** Code, data, an exact error message — these are exactly what summarisation ruins and exactly what later steps need verbatim. Drop them entirely and re-read them when needed; a re-read is cheap, a plausible paraphrase of a stack trace is worse than nothing.

## What to take away

Compaction is the right answer to a full context window, and it is not free.

Its cost is not the model call. Its cost is that the same material gets summarised again and again, and detail leaves silently. Pin the facts that must survive, compact only what can afford to be lost, and never let a summary become the input to another summary.
