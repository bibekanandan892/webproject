---
title: "SGLang"
date: "2026-09-11T17:20"
category: "AI"
tags: ["sglang", "radix-tree", "serving", "constrained-decoding", "kv-cache"]
summary: "SGLang keeps every in-flight request's attention cache in one prefix tree, so any overlap between any two requests is reused automatically — including overlaps nobody declared. Its second trick is not calling the model for output that was never in doubt."
draft: false
cover: "/blog/sglang.svg"
---

SGLang is a serving engine for language models. Its distinguishing idea is what it does with the work already done for other requests.

Reading a prompt is expensive — the model builds an internal state for every token before it can generate anything. If two requests begin with the same text, that state is identical for the shared part. SGLang's claim is that this happens constantly, in shapes nobody anticipated, and that finding it should be automatic.

## One tree for everybody

Instead of each request owning its cache, SGLang keeps all of them in a single **radix tree** — a tree where each path from the root spells out a token sequence, and shared beginnings share nodes.

A new request walks down from the root as far as its tokens match. Everything matched is reuse: the state already exists and is pointed at, not recomputed. Where the tokens diverge, a new branch is created and only the divergent part is prefilled.

Nobody registers a prefix. The overlap is discovered by walking.

## Why nesting is the point

Take an agent that reads two documents and asks four questions about each. Eight requests: all sharing a 900-token instruction block, split into two groups of four sharing a 600-token document, each ending in about 120 unique tokens.

| | prompt tokens prefilled |
| --- | --- |
| no sharing at all | 12,960 |
| sharing the instruction block only | 6,660 |
| radix tree, all levels | **3,060** |

The first saving is the obvious one — hoist the system prompt, get 1.95×. The second is the one you cannot get by hand: the *document* level is shared by four requests each, and that nested reuse is worth another 2.18× on top.

Together, 4.24× less prefill, and the deeper the branching the wider the gap. A conversation tree, a set of samples from one prompt, several tool calls over the same context — all of these are branch structures, and a tree handles them without anyone describing the shape in advance.

<figure>
<svg viewBox="0 0 560 294" width="560" role="img" aria-label="A prefix tree with one shared root block, two document branches, and eight leaves, contrasted with eight separate full prompts." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">SHARED ONCE, AT EVERY LEVEL</text>
<rect x="180" y="40" width="200" height="26" rx="4" fill="color-mix(in srgb, var(--primary) 30%, transparent)" stroke="var(--primary)" stroke-opacity="0.7"/>
<text class="b" x="280" y="58" text-anchor="middle">instructions · 900</text>
<path d="M240 70 V84 H160 V94" stroke="var(--primary)" stroke-opacity="0.5" stroke-width="1.4" fill="none"/>
<path d="M320 70 V84 H400 V94" stroke="var(--primary)" stroke-opacity="0.5" stroke-width="1.4" fill="none"/>
<rect x="80" y="96" width="160" height="26" rx="4" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="var(--primary)" stroke-opacity="0.6"/>
<text class="b" x="160" y="114" text-anchor="middle">document A · 600</text>
<rect x="320" y="96" width="160" height="26" rx="4" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="var(--primary)" stroke-opacity="0.6"/>
<text class="b" x="400" y="114" text-anchor="middle">document B · 600</text>
<g stroke="var(--muted-foreground)" stroke-opacity="0.45" stroke-width="1.3" fill="none">
<path d="M160 126 V138 H100 V150"/><path d="M160 126 V138 H140 V150"/><path d="M160 126 V138 H180 V150"/><path d="M160 126 V138 H220 V150"/>
<path d="M400 126 V138 H340 V150"/><path d="M400 126 V138 H380 V150"/><path d="M400 126 V138 H420 V150"/><path d="M400 126 V138 H460 V150"/>
</g>
<g fill="color-mix(in srgb, var(--muted-foreground) 28%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 48%, transparent)">
<rect x="86" y="152" width="28" height="24" rx="3"/><rect x="126" y="152" width="28" height="24" rx="3"/><rect x="166" y="152" width="28" height="24" rx="3"/><rect x="206" y="152" width="28" height="24" rx="3"/>
<rect x="326" y="152" width="28" height="24" rx="3"/><rect x="366" y="152" width="28" height="24" rx="3"/><rect x="406" y="152" width="28" height="24" rx="3"/><rect x="446" y="152" width="28" height="24" rx="3"/>
</g>
<text class="l" x="20" y="196">eight questions · 120 tokens each</text>
<path d="M20 214 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="238">3,060 tokens prefilled instead of 12,960</text>
<text class="l" x="20" y="258">a node can only be evicted once its children are gone</text>
<text class="l" x="20" y="274">nobody declared any of these prefixes</text>
</svg>
<figcaption>Every internal node is work that all of its descendants get for free.</figcaption>
</figure>

## Eviction on a tree

The cache is finite, so entries have to go. On a tree the rule is not simply "drop the least recently used".

An internal node's state is a prerequisite for every node beneath it. Dropping it would invalidate the whole subtree, even if those children were used seconds ago. So eviction works from the **leaves** inward: only a node with no children can go, and an internal node becomes eligible only once its descendants have already been removed.

This falls out of recency naturally. A node with active children keeps being touched by their requests, so it stays warm without any special rule — the structure encodes the dependency that a flat cache would have to be told about.

## Not calling the model when the answer is forced

The second idea has nothing to do with caching.

When output must match a format — a JSON object with known keys, say — most of what comes out is not a prediction at all. After an opening brace the next characters are a quote and a key name, and there is exactly one legal continuation. The model is being asked a question with one possible answer.

Constrained decoding tracks the format with a state machine and masks out every token the format forbids. The useful consequence is that when the machine has only one legal next token, it can be emitted directly — no forward pass.

For an object with four fixed keys, roughly 24 of 36 output tokens are structural:

| | tokens |
| --- | --- |
| forced by the format | 24 |
| genuinely predicted | 12 |

That is **3× fewer forward passes** for the same output, and it is free accuracy as well: a token the format forbids can no longer be generated, so malformed output stops being a failure mode rather than becoming a rarer one.

## The front end

SGLang also ships a Python interface for writing multi-step generations — call the model, keep the result in a variable, branch on it, call again — where the steps are described in one place rather than assembled as separate requests.

This is not only ergonomics. Because the runtime can see the whole program, it knows which calls share a prefix and which branches can run in parallel, and it can schedule accordingly. A sequence of independent HTTP requests gives the server none of that information.

## Where it earns its keep

The engine's advantage scales with overlap. Long shared system prompts, multi-turn chat, many questions over one document, several samples from one prompt, agent loops that re-send the same context — all high-overlap patterns.

A workload of unrelated one-off prompts has nothing to share, and the tree is then pure bookkeeping. That is the honest limit: the mechanism does not create reuse, it finds reuse that already exists.

## What to take away

Two separate insights, both about not repeating work.

Keep every request's cache in one tree and shared prefixes are found rather than declared — including the nested ones no configuration would have described. And when the output format leaves no choice, skip the model entirely, because there was never a prediction to make.
