---
title: "Speculative decoding"
date: "2026-09-10T14:00"
category: "AI"
tags: ["inference", "speculative-decoding", "latency", "sampling", "throughput"]
summary: "A small model guesses the next few tokens and a large one checks them all in a single pass. Done properly the output is not an approximation of the large model — it is exactly what the large model would have produced."
draft: false
cover: "/blog/speculative-decoding.svg"
---

Generating a token requires reading every weight in the model out of memory. Doing the arithmetic on those weights takes far less time than fetching them, so for most of each token the compute units sit idle waiting on memory.

That idle capacity is what speculative decoding spends. A small model guesses several tokens ahead; the large model checks all of the guesses in one pass, which costs it barely more than checking one.

## The round

<figure>
<svg viewBox="0 0 520 210" width="520" role="img" aria-label="Six tokens drafted by a small model, then a single verification pass by the large model covering all six at once. The first four are accepted, the fifth is rejected and replaced, and the sixth is discarded." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.r{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.t{font:600 12px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.ok{font:600 13px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.no{font:600 13px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">ONE ROUND, SIX GUESSES</text>
<text class="r" x="20" y="62">draft</text>
<rect x="110" y="40" width="56" height="32" rx="5" fill="color-mix(in srgb, var(--primary) 18%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<rect x="174" y="40" width="56" height="32" rx="5" fill="color-mix(in srgb, var(--primary) 18%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<rect x="238" y="40" width="56" height="32" rx="5" fill="color-mix(in srgb, var(--primary) 18%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<rect x="302" y="40" width="56" height="32" rx="5" fill="color-mix(in srgb, var(--primary) 18%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<rect x="366" y="40" width="56" height="32" rx="5" fill="color-mix(in srgb, var(--primary) 18%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<rect x="430" y="40" width="56" height="32" rx="5" fill="color-mix(in srgb, var(--primary) 18%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<text class="r" x="20" y="114">verify</text>
<rect x="110" y="92" width="376" height="32" rx="6" fill="color-mix(in srgb, var(--primary) 28%, transparent)" stroke="color-mix(in srgb, var(--primary) 60%, transparent)"/>
<text class="t" x="298" y="113" text-anchor="middle">one pass of the large model</text>
<text class="r" x="20" y="166">keep</text>
<text class="ok" x="138" y="166" text-anchor="middle">✓</text>
<text class="ok" x="202" y="166" text-anchor="middle">✓</text>
<text class="ok" x="266" y="166" text-anchor="middle">✓</text>
<text class="ok" x="330" y="166" text-anchor="middle">✓</text>
<text class="no" x="394" y="166" text-anchor="middle">✗</text>
<text class="no" x="458" y="166" text-anchor="middle">–</text>
<text class="r" x="110" y="192">4 accepted, 1 replaced, the rest discarded</text>
</svg>
<figcaption>Everything after the first rejection is discarded, however good it looked.</figcaption>
</figure>

The draft model generates its guesses one at a time, as any model must. But the large model sees all of them at once, as a sequence, and produces its own prediction for every position in a single forward pass — the same pass it would have spent on one token.

Tokens are accepted up to the first disagreement. That one is replaced with the large model's choice, and everything after it is thrown away — those guesses were conditioned on a token that turned out to be wrong.

So a round of $k$ guesses yields between 1 and $k+1$ tokens.

## Why the output is not an approximation

The obvious worry is that this trades quality for speed. It does not, and the reason is worth spelling out.

Each draft token carries two probabilities: $q$, what the draft model gave it, and $p$, what the large model gives it. The rule is:

$$
\text{accept with probability } \min\left(1, \frac{p}{q}\right)
$$

If the large model likes the token at least as much as the draft model did, it is always accepted. If it likes it less, it is accepted in proportion.

On a rejection, the replacement is not simply the large model's top choice. It is sampled from the **residual** distribution, $\max(0, p - q)$ renormalised — what is left of the large model's opinion after subtracting what the draft model already had a chance to propose.

Those two rules together make the output distribution exactly $p$. Not close to it. To check rather than assume, here is the whole scheme run twenty million times over four tokens:

| token | $q$ | $p$ | measured | error |
| --- | --- | --- | --- | --- |
| alpha | 0.50 | 0.15 | 0.150152 | 1.5e−4 |
| beta | 0.20 | 0.35 | 0.349640 | 3.6e−4 |
| gamma | 0.20 | 0.10 | 0.100065 | 6.5e−5 |
| delta | 0.10 | 0.40 | 0.400143 | 1.4e−4 |

The draft model gave `alpha` half its probability mass and the large model gave it 0.15 — and 0.15 is what comes out. The draft model's opinion has no influence on the result whatsoever. It only affects *speed*.

There is a tidy consequence. The acceptance rate is $\sum_i \min(q_i, p_i)$, the overlap between the two distributions. For the numbers above that is 0.55, and the simulation measured 0.55018. A draft model helps exactly as much as it agrees.

## What the speedup actually is

Let $\alpha$ be the per-token acceptance rate, $k$ the number of guesses per round, $T$ the time for one large-model pass and $D$ the time per draft token.

Tokens per round is a truncated geometric series, and it comes out clean:

$$
\text{tokens per round} = \frac{1 - \alpha^{\,k+1}}{1 - \alpha}
\qquad
\text{speedup} = \frac{1 - \alpha^{\,k+1}}{1 - \alpha} \cdot \frac{T}{kD + T}
$$

With $T = 40$ ms and $D = 4$ ms:

| $\alpha$ | $k=4$ | $k=6$ | $k=8$ | $k=12$ | best $k$ |
| --- | --- | --- | --- | --- | --- |
| 0.95 | 3.23× | 3.77× | 4.11× | 4.42× | 15 → 4.48× |
| 0.90 | 2.93× | 3.26× | 3.40× | 3.39× | 10 → 3.43× |
| 0.80 | 2.40× | **2.47×** | 2.40× | 2.15× | 6 → 2.47× |
| 0.70 | 1.98× | 1.91× | 1.78× | 1.50× | 4 → 1.98× |
| 0.50 | 1.38× | 1.24× | 1.11× | 0.91× | 2 → 1.46× |
| 0.30 | 1.02× | 0.89× | 0.79× | 0.65× | 1 → 1.18× |

Read down a column and the acceptance rate dominates everything. Read across a row and the draft length has an optimum that moves: at 95% agreement it pays to guess fifteen tokens ahead, at 50% it pays to guess two, and guessing twelve at 50% agreement is **slower than not bothering at all**.

That is the trap. A long draft is not cautious, it is a bet — every token after the first rejection is work that gets thrown away, and the further ahead you guess the more of it there is.

With $k = 6$ the whole thing breaks even at about 38% acceptance. Below that the drafting costs more than it saves.

At a realistic 80% and $k = 6$: 3.95 tokens per 64 ms round, against 158 ms for the same tokens from the large model alone. Over a 300-token reply, 12.0 seconds becomes 4.9.

## What it costs

The draft model sits in GPU memory alongside the large one, and it earns nothing except by agreeing.

Both models must share a tokeniser. Agreement is compared token by token, so two models that split text differently cannot be compared at all.

The gain also depends on there being idle compute to use. At low batch sizes memory bandwidth is the limit and the spare capacity is real. Under heavy batching the GPU is already busy, verification is no longer nearly free, and the speedup shrinks.

And on very short replies the fixed overhead of running two models is a larger share of the total.

An alternative avoids the second model entirely: let the large model draft for itself, either through extra output heads predicting several positions at once, or by drafting from its own internal representations. Same round structure, same verification, no separate set of weights to host.

## The short version

- Generating one token is limited by reading the weights, not by the arithmetic, so compute sits idle.
- A small model drafts several tokens; the large model verifies them all in one pass.
- Tokens are accepted until the first disagreement; everything after it is discarded.
- Accept with probability $\min(1, p/q)$ and resample rejections from $\max(0, p-q)$, and the output distribution is exactly the large model's.
- The acceptance rate is the overlap between the two models' distributions.
- Speedup is $\frac{1-\alpha^{k+1}}{1-\alpha} \cdot \frac{T}{kD+T}$ — and the best draft length falls as agreement falls.
- Draft too far ahead with a poorly matched model and it is slower than doing nothing.
