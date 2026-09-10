---
title: "Context engineering"
date: "2026-09-10T14:40"
category: "AI"
tags: ["context", "prompting", "rag", "agents", "token-budget"]
summary: "Everything a model knows about your task is in one window, and the pieces compete for space. Deciding what goes in, in what order, and what gets dropped is most of the work."
draft: false
cover: "/blog/context-engineering.svg"
---

A model has no memory and no access to anything you have not shown it. Every call, its entire world is the context window.

Context engineering is deciding what goes in there. Not the phrasing of one instruction — the whole thing: which documents, which examples, how much history, which tool definitions, in what order, and what to drop when it will not all fit.

## What is competing for the space

Eight things, typically, and every one of them is optional in the sense that you chose to include it.

The **system prompt** — role, rules, output format. **Examples** of the input-output shape you want. **Retrieved documents**. **Tool definitions**, one per tool, each with its schema. **Long-term memory** about this user. The **conversation history**. The **results of tools called this turn**. And the **current message**.

They all come out of the same budget.

## It really is a budget

Take a 32,000-token window and a reasonable allocation:

| | tokens |
| --- | --- |
| system prompt | 800 |
| tool definitions (eight tools) | 1,600 |
| examples | 900 |
| retrieved chunks | 2,400 |
| memory | 300 |
| tool results this turn | 2,000 |
| current message | 200 |
| **fixed subtotal** | **8,200** |

Comfortable. But only one component in that list grows, and it grows every turn.

## What growth does

At roughly 600 tokens per exchange:

| | turn 1 | turn 10 | turn 40 |
| --- | --- | --- | --- |
| everything else | 8,200 | 8,200 | 8,200 |
| history | 600 | 6,000 | 24,000 |
| **used** | 8,800 | 14,200 | **32,200** |
| left for the reply | 23,200 | 17,800 | **none** |
| history's share | 7% | 42% | **75%** |

<figure>
<svg viewBox="0 0 580 200" width="580" role="img" aria-label="Two horizontal bars showing context usage. At turn one the window is mostly empty. At turn forty the conversation history has grown to three quarters of the context and the total exceeds the window limit." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.l{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.w{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}</style>
<text class="hd" x="20" y="18">ONLY ONE PART GROWS</text>
<text class="l" x="80" y="72" text-anchor="end">turn 1</text>
<rect x="90" y="50" width="50" height="34" fill="color-mix(in srgb, var(--muted-foreground) 26%, transparent)"/>
<rect x="140" y="50" width="31" height="34" fill="color-mix(in srgb, var(--primary) 22%, transparent)"/>
<rect x="171" y="50" width="26" height="34" fill="color-mix(in srgb, var(--primary) 38%, transparent)"/>
<rect x="197" y="50" width="8" height="34" fill="color-mix(in srgb, var(--primary) 62%, transparent)"/>
<text class="l" x="80" y="132" text-anchor="end">turn 40</text>
<rect x="90" y="110" width="50" height="34" fill="color-mix(in srgb, var(--muted-foreground) 26%, transparent)"/>
<rect x="140" y="110" width="31" height="34" fill="color-mix(in srgb, var(--primary) 22%, transparent)"/>
<rect x="171" y="110" width="26" height="34" fill="color-mix(in srgb, var(--primary) 38%, transparent)"/>
<rect x="197" y="110" width="315" height="34" fill="color-mix(in srgb, var(--primary) 62%, transparent)"/>
<path d="M510 36 V160" stroke="var(--primary)" stroke-opacity="0.7" stroke-width="1.5" stroke-dasharray="4 3"/>
<text class="w" x="514" y="34">32k limit</text>
<rect x="90" y="170" width="12" height="12" fill="color-mix(in srgb, var(--muted-foreground) 26%, transparent)"/>
<text class="l" x="108" y="180">fixed</text>
<rect x="180" y="170" width="12" height="12" fill="color-mix(in srgb, var(--primary) 22%, transparent)"/>
<text class="l" x="198" y="180">retrieved</text>
<rect x="290" y="170" width="12" height="12" fill="color-mix(in srgb, var(--primary) 38%, transparent)"/>
<text class="l" x="308" y="180">tool results</text>
<rect x="410" y="170" width="12" height="12" fill="color-mix(in srgb, var(--primary) 62%, transparent)"/>
<text class="l" x="428" y="180">history</text>
</svg>
<figcaption>Nothing was misconfigured. The same allocation simply stopped fitting.</figcaption>
</figure>

Nothing here was set up badly. The same allocation that was comfortable at turn one no longer fits at turn forty, and something has to give.

The instinct is to trim retrieval, because it is the easiest thing to make smaller. That is usually the wrong choice — retrieval is the part carrying facts about the current question, while history is mostly exchanges nobody will refer to again. Summarising old turns and keeping the recent ones intact costs less than answering with fewer documents.

## Order matters twice

**For the model.** Attention does not treat all positions equally: material at the start and end of a long context gets used more reliably than material buried in the middle. So a rule that must be followed does not belong three thousand tokens deep between two retrieved chunks. Put instructions at the edges.

**For the cache.** Most providers cache a prompt by its prefix — an identical opening span can be reused instead of reprocessed. That only works if the opening is byte-identical between calls, which means ordering from most stable to least: system prompt, then tools, then examples, then retrieval, then history, then the new message. Put anything that changes per call near the front and the cache never hits.

Those two considerations agree, which is convenient. Stable things are also the instructions you want read reliably.

## What goes wrong

**Too much.** More context is not better context. Padding the window with marginally relevant material makes the relevant material harder to find, and quality falls even though nothing is missing.

**Too little.** The model cannot infer a policy it was never shown. It will answer anyway, plausibly.

**Buried.** The right information is present, in the middle, and effectively ignored.

**Stale.** A tool result from six turns ago that has since been superseded is still sitting there being read as current.

**Unstructured.** One undifferentiated wall of text. Section headers cost a handful of tokens and make the boundaries unambiguous.

**Contradictory.** The system prompt says one thing, a retrieved document says another, and nothing establishes which wins. The model picks, and not always the same way twice.

## How to work on it

Give each component a token allowance and hold it to that, rather than letting retrieval and history expand until something breaks.

When output is wrong, **log the exact context that produced it** and read it before touching the prompt. Most failures blamed on the model turn out to be a missing document, a stale tool result, or an instruction that was present but buried.

Then treat that context as code: version it, diff it, and compare variants. It is the input that actually determines the output, so it deserves the same handling as anything else that does.

## The short version

- The context window is everything the model knows about the task.
- Eight or so components compete for one budget: system prompt, examples, retrieval, tools, memory, history, tool results, the message.
- History is the only one that grows without bound, and it will eventually crowd out everything else.
- When space runs short, compress history before cutting retrieval.
- Put instructions at the start or end — the middle gets read least reliably.
- Order from stable to fresh so the prefix cache can work.
- When output is wrong, read the context that produced it before blaming the model.
