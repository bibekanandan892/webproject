---
title: "Prompt Caching"
date: "2026-09-11T12:20"
category: "AI"
tags: ["prompt-caching", "kv-cache", "llm-inference", "cost", "latency"]
summary: "Most of a long prompt is the same on every request. Prompt caching stores the work already done on that unchanging opening so the model never has to redo it — but only if the opening really is unchanged, character for character."
draft: false
cover: "/blog/prompt-caching.svg"
---

Before a model writes a single token of its answer, it has to read the whole prompt. That reading step builds an internal working state for every token in the input — one entry per token, per layer.

For a short prompt nobody notices. For a long one it is most of the cost of the request.

## The same opening, over and over

Look at what an application actually sends. A policy assistant sends the same operating rules, the same handbook extract, the same output format — and then, at the very end, one short question that changes each time.

Say that fixed part is 9,600 tokens and the question is 240.

Every request makes the model read all 9,840. But 9,600 of them were identical to last time, and the time before, and the time before that. The model builds exactly the same working state for them on every single call and throws it away when the call ends.

That is 97.6% of the reading repeated for nothing.

## What gets cached

Prompt caching keeps that working state instead of discarding it.

The first request reads the 9,600 tokens normally and saves the result. The next request that begins with the same 9,600 tokens loads the saved state instead of computing it, and only reads the 240 new ones.

Note what is stored: not the text, and not the answer. What is stored is the *reading* — the internal state the model built while going through those tokens. Two different questions on the same handbook share that state completely, even though their answers have nothing in common.

## The rule that catches everyone

The cached part must be a **prefix**, and it must match exactly.

Not "mostly the same". Not "the same section, reordered". The same tokens, from the very first one, in the same order, until the point where the reuse stops.

This follows from how the model reads. Each token's state is built with all the tokens before it in view, so a token's state is only valid if everything preceding it is identical. Change something at position 5 and every position after it is now wrong — all 9,595 remaining entries have to be rebuilt.

Which is why one habit quietly destroys the whole thing:

```
You are a policy assistant.
Today is 2026-03-04 09:15.        <- changes every request
[9,600 tokens of rules and handbook]
[the question]
```

That clock sits near the top. It differs on every call, so the match ends within the first few tokens and nothing downstream is reusable. The cache is technically working and saving nothing.

Move the same line to the bottom, just above the question, and the entire 9,600-token block matches again.

**Order the prompt by how often each part changes.** Never-changes first, changes-every-call last.

<figure>
<svg viewBox="0 0 560 250" width="560" role="img" aria-label="Two prompts drawn as bars: with the changing timestamp at the top nothing is reusable, with it at the bottom the whole stable block is reusable." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">WHERE THE CHANGING PART SITS DECIDES EVERYTHING</text>
<text class="l" x="20" y="46">clock at the top</text>
<rect x="20" y="56" width="34" height="30" rx="4" fill="color-mix(in srgb, var(--muted-foreground) 22%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 45%, transparent)"/>
<text class="l" x="37" y="76" text-anchor="middle">clk</text>
<rect x="58" y="56" width="330" height="30" rx="4" fill="color-mix(in srgb, var(--muted-foreground) 10%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 28%, transparent)"/>
<text class="l" x="223" y="76" text-anchor="middle">rules + handbook — 9,600 tokens</text>
<rect x="392" y="56" width="60" height="30" rx="4" fill="color-mix(in srgb, var(--muted-foreground) 22%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 45%, transparent)"/>
<text class="l" x="422" y="76" text-anchor="middle">question</text>
<text class="b" x="464" y="76">0% reused</text>
<text class="l" x="20" y="132">clock at the bottom</text>
<rect x="20" y="142" width="330" height="30" rx="4" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="var(--primary)" stroke-opacity="0.7"/>
<text class="b" x="185" y="162" text-anchor="middle">rules + handbook — 9,600 tokens</text>
<rect x="354" y="142" width="34" height="30" rx="4" fill="color-mix(in srgb, var(--muted-foreground) 22%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 45%, transparent)"/>
<text class="l" x="371" y="162" text-anchor="middle">clk</text>
<rect x="392" y="142" width="60" height="30" rx="4" fill="color-mix(in srgb, var(--muted-foreground) 22%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 45%, transparent)"/>
<text class="l" x="422" y="162" text-anchor="middle">question</text>
<text class="b" x="464" y="162">98% reused</text>
<path d="M20 196 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="l" x="20" y="216">the shaded block is what the model can skip reading</text>
<text class="l" x="20" y="234">a single differing token ends the match — and everything after it</text>
</svg>
<figcaption>The reusable part always starts at token one and stops at the first difference.</figcaption>
</figure>

## What it costs

Writing to the cache is slightly more expensive than reading the tokens normally — around 1.25× — because the state has to be stored as well as computed. Reading from it is far cheaper, around 0.1×.

That write premium sounds like something to be careful about. It isn't. One write plus one read costs 1.35 against 2.0 for reading the tokens twice, so the cache pays for itself on its **first** reuse.

Over the 40 questions in a working session:

| | tokens charged |
| --- | --- |
| no caching — 40 × 9,840 | 393,600 |
| caching — one write, 39 reads | 59,040 |

That is 6.7× less, or 85% saved. And the saving grows with the length of the fixed part, which is the opposite of the usual situation, where long prompts only ever get worse.

Latency moves the same way, for the same reason: the skipped work is real computation, and loading a stored state is much faster than recomputing it.

## It expires

The cached state is large — it is per token, per layer — so it is not kept indefinitely. Typical lifetimes are a few minutes from last use, extendable at a slightly higher write cost.

This shapes what is worth caching. A conversation with a user, where requests arrive seconds apart, keeps the cache alive naturally. A nightly batch job with hours between runs will pay the write premium every time and never collect a read.

## What to take away

Prompt caching is not a model feature you turn on. It is a consequence of how you lay out the prompt.

Put the stable material first and keep it byte-identical between calls. Put anything that varies — clocks, session ids, the user's message — at the end. Do that and long shared context becomes nearly free to reuse.

Do the opposite, and you pay full price on every request while believing you are caching.
