---
title: "Decoding EAGLE"
date: "2026-09-12T06:20"
category: "AI"
tags: ["eagle", "speculative-decoding", "inference", "hidden-states", "throughput"]
summary: "Guessing the model's next hidden state instead of its next token removes the sampling noise from the guess. Going from 2.5 to 3.5 accepted tokens per pass is only an 11-point accept-rate gain, and a 40% speedup."
draft: false
cover: "/blog/decoding-eagle.svg"
---

Speculative decoding works by proposing several tokens cheaply and checking them all in one pass of the large model. The speedup is just the average number of proposals accepted per pass, so everything comes down to making the proposals better.

EAGLE's answer is to change **what** gets predicted.

## Why guessing tokens is hard

A drafter that predicts the next token has to predict the outcome of a sample.

The model produces a distribution and one token is drawn from it. If that distribution has 2.1 bits of entropy, there are effectively 4.3 plausible choices — and which one appears is genuinely random. A drafter predicting it is trying to guess a coin flip with four sides.

| entropy of the token distribution | plausible choices to guess among |
| --- | --- |
| 0.5 bits | 1.4 |
| 1.4 bits | 2.6 |
| 2.1 bits | 4.3 |
| 3.2 bits | 9.2 |

That noise is irreducible. It is not a weakness of the drafter; it is a property of what the drafter was asked to predict.

## Predicting the state instead

Before the model produces that distribution, it computes a hidden state — a dense vector near the top of the network. The distribution is derived from it.

That vector is not sampled. It is a deterministic function of the context. So predicting it is a regression problem with a single correct answer, not a guess at a random draw.

It is also smoother. Consecutive hidden states are close together in a way consecutive tokens are not, because the state changes continuously as context accumulates while the token identity jumps around a discrete vocabulary.

## The subtlety that makes it work

There is an obvious objection, and resolving it is the paper's actual contribution.

The next hidden state is not determined by the current one alone. It is:

```
h(t+1) = f( h(t), x(t+1) )
```

where `x(t+1)` is the token that was sampled. So given only `h(t)`, the next state is uncertain — and it is uncertain by **exactly the entropy of the sampled token**. The randomness did not disappear; it moved.

The fix is to feed the sampled token back in. The drafter receives both the previous hidden state and the token that was actually drawn, and with both, the next state is determined. No entropy left to guess at.

This is why the method is not simply "predict features instead of tokens". It is *predict features conditioned on the token you already know* — which is the one framing under which the target has no noise in it.

<figure>
<svg viewBox="0 0 560 312" width="560" role="img" aria-label="Two drafting schemes: predicting the next token from the current state, which must guess a sampled outcome, against predicting the next hidden state from both the state and the sampled token." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<defs><marker id="eg" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--primary)"/></marker>
<marker id="er" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--muted-foreground)"/></marker></defs>
<text class="hd" x="20" y="18">GUESS THE STATE, NOT THE SAMPLE</text>
<text class="l" x="20" y="44">drafting tokens</text>
<rect x="20" y="54" width="76" height="26" rx="4" fill="color-mix(in srgb, var(--muted-foreground) 20%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 40%, transparent)"/>
<text class="l" x="58" y="71" text-anchor="middle">h(t)</text>
<path d="M102 67 H140" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.4" marker-end="url(#er)"/>
<g fill="color-mix(in srgb, var(--muted-foreground) 20%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 40%, transparent)">
<rect x="146" y="42" width="52" height="16" rx="3"/><rect x="146" y="62" width="52" height="16" rx="3"/><rect x="146" y="82" width="52" height="16" rx="3"/><rect x="146" y="102" width="52" height="16" rx="3"/>
</g>
<text class="l" x="208" y="60">4.3 plausible tokens</text>
<text class="l" x="208" y="78">— one is drawn at random</text>
<text class="l" x="208" y="96">the drafter has to guess which</text>
<path d="M20 136 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="160">drafting states</text>
<rect x="20" y="170" width="76" height="26" rx="4" fill="color-mix(in srgb, var(--primary) 26%, transparent)" stroke="var(--primary)" stroke-opacity="0.6"/>
<text class="b" x="58" y="187" text-anchor="middle">h(t)</text>
<rect x="20" y="202" width="76" height="26" rx="4" fill="color-mix(in srgb, var(--primary) 26%, transparent)" stroke="var(--primary)" stroke-opacity="0.6"/>
<text class="b" x="58" y="219" text-anchor="middle">x(t+1)</text>
<path d="M102 183 L146 192" stroke="var(--primary)" stroke-opacity="0.8" stroke-width="1.6" marker-end="url(#eg)"/>
<path d="M102 215 L146 200" stroke="var(--primary)" stroke-opacity="0.8" stroke-width="1.6" marker-end="url(#eg)"/>
<rect x="152" y="182" width="86" height="26" rx="4" fill="color-mix(in srgb, var(--primary) 40%, transparent)" stroke="var(--primary)" stroke-opacity="0.7"/>
<text class="b" x="195" y="199" text-anchor="middle">h(t+1)</text>
<text class="b" x="250" y="192">one answer — nothing to guess</text>
<text class="l" x="250" y="212">the token that was drawn is already known</text>
<path d="M20 244 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="268">2.5 accepted tokens per pass becomes 3.5 — a 40% speedup</text>
<text class="l" x="20" y="290">from an accept rate of 60.0% rising to 71.4%</text>
</svg>
<figcaption>The randomness does not vanish by moving to features — it is removed by conditioning on the token that resolved it.</figcaption>
</figure>

## What that buys, precisely

The speedup is the average accepted tokens per pass. Treating the accept chain as geometric, `E = 1/(1 − p)`:

| tokens per pass | implied accept rate |
| --- | --- |
| 2.0 | 50.0% |
| 2.5 | 60.0% |
| 3.0 | 66.7% |
| 3.5 | **71.4%** |
| 4.0 | 75.0% |

So moving from token-level drafting at 2.5 tokens per pass to feature-level at 3.5 is an accept rate going from 60.0% to 71.4% — **11.4 percentage points**, producing a **1.40×** speedup on top of what speculative decoding already gave.

That leverage is the thing to notice. Because the chain is geometric, small improvements in accept rate produce large improvements in throughput, and they get larger the higher you already are: 50% → 60% buys 0.5 tokens, while 66.7% → 75% buys 1.0.

Published results put the method at roughly 3 to 4× overall, which is consistent with these accept rates.

## Spending the tree budget where it pays

The follow-up work changed how candidates are arranged rather than what is predicted.

A **fixed** draft tree has a shape decided in advance — branch twice at every level, say. With 60 nodes that supports about four speculative tokens, and it spends the same number of nodes on parts of the sequence the drafter is certain about as on parts where it is not.

A **dynamic** tree expands where the drafter's confidence is high and stops early where it is low. Same 60-node budget, but the nodes go into depth along the likely continuation rather than into breadth everywhere.

| | with 60 nodes |
| --- | --- |
| fixed, uniform branching | ~4 speculative tokens |
| concentrated on the confident path | considerably deeper on that path |

The drafter's own confidence is the signal, and it is free — it was computed anyway.

## Where it ended up

Two ideas from this line of work are now standard in serving systems.

**Draft from the target's internal state.** A drafter that reads the model's hidden representation is both smaller and better aligned than an independent model, because it is predicting the same thing the model is about to do rather than imitating its output.

**Shape the draft tree from confidence.** Any fixed shape is spending its budget without looking at the problem.

## What to take away

The whole method reduces to choosing a prediction target with no noise in it.

Tokens are sampled, so guessing them means guessing a random draw. Hidden states are computed, so guessing them is a regression — provided you condition on the token that was actually drawn, which is the step that makes the target deterministic rather than merely smoother.
