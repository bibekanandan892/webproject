---
title: "Decoding DeepSeek-V4"
date: "2026-09-10T12:00"
category: "AI"
tags: ["deepseek", "moe", "attention", "long-context", "architecture"]
summary: "A million tokens of context is unaffordable with ordinary attention. DeepSeek-V4 gets there by summarising the distant past into far fewer entries and attending to those instead."
draft: false
cover: "/blog/decoding-deepseek-v4.svg"
---

Attention compares every token against every other token. At a thousand tokens that is a million comparisons and nobody notices. At a million tokens it is a trillion, and the whole idea stops working.

DeepSeek-V4 is built around getting a million-token context anyway. Most of what is interesting about it follows from that one goal.

## Two models

| | V4-Flash | V4-Pro |
| --- | --- | --- |
| total parameters | 284B | 1.6T |
| active per token | 13B | 49B |
| layers | 43 | 61 |
| context | 1M | 1M |
| pre-training tokens | 32T | 33T |

Both are mixture-of-experts models: the feed-forward section of each layer is split into many small expert networks and a router sends each token through only a couple of them. That is why the active count is a small fraction of the total — Flash holds 284 billion parameters but any given token touches 13 billion of them.

## Compressing the past

The headline change is to attention, and the idea is simple enough to state in a sentence: do not keep every old token at full resolution.

Group consecutive tokens and replace each group with one learned summary. A query then attends to the summaries rather than to the originals, and the number of things it has to look at falls by the size of the group.

At a million tokens:

| | entries a query sees | share of dense |
| --- | --- | --- |
| ordinary attention | 1,000,000 | 100% |
| grouped by 4 | 250,000 | 25% |
| grouped by 128 | 7,813 | **0.78%** |

Group by 128 and a million tokens becomes fewer than eight thousand entries — few enough that a query can attend to all of them densely, with no cleverness required.

V4 runs two versions of this. One compresses lightly, by a factor of four, and then *selects*: a small fast scorer ranks the 250,000 entries against the current query and only the top few are attended to in detail. The other compresses heavily, by 128, and skips selection entirely because the list is already short.

<figure>
<svg viewBox="0 0 640 220" width="640" role="img" aria-label="A row of tokens. Distant tokens are grouped in fours and replaced by single summary entries, while the most recent tokens are kept uncompressed at full resolution." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.l{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.b{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}</style>
<text class="hd" x="24" y="18">OLD TOKENS SUMMARISED, RECENT ONES KEPT</text>
<rect x="24" y="34" width="18" height="26" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 18%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 34%, transparent)"/>
<rect x="46" y="34" width="18" height="26" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 18%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 34%, transparent)"/>
<rect x="68" y="34" width="18" height="26" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 18%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 34%, transparent)"/>
<rect x="90" y="34" width="18" height="26" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 18%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 34%, transparent)"/>
<rect x="120" y="34" width="18" height="26" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 18%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 34%, transparent)"/>
<rect x="142" y="34" width="18" height="26" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 18%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 34%, transparent)"/>
<rect x="164" y="34" width="18" height="26" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 18%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 34%, transparent)"/>
<rect x="186" y="34" width="18" height="26" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 18%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 34%, transparent)"/>
<rect x="216" y="34" width="18" height="26" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 18%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 34%, transparent)"/>
<rect x="238" y="34" width="18" height="26" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 18%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 34%, transparent)"/>
<rect x="260" y="34" width="18" height="26" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 18%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 34%, transparent)"/>
<rect x="282" y="34" width="18" height="26" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 18%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 34%, transparent)"/>
<text class="l" x="340" y="52" text-anchor="middle">· · ·</text>
<rect x="396" y="34" width="26" height="26" rx="3" fill="color-mix(in srgb, var(--primary) 28%, transparent)" stroke="color-mix(in srgb, var(--primary) 62%, transparent)"/>
<rect x="428" y="34" width="26" height="26" rx="3" fill="color-mix(in srgb, var(--primary) 28%, transparent)" stroke="color-mix(in srgb, var(--primary) 62%, transparent)"/>
<rect x="460" y="34" width="26" height="26" rx="3" fill="color-mix(in srgb, var(--primary) 28%, transparent)" stroke="color-mix(in srgb, var(--primary) 62%, transparent)"/>
<rect x="492" y="34" width="26" height="26" rx="3" fill="color-mix(in srgb, var(--primary) 28%, transparent)" stroke="color-mix(in srgb, var(--primary) 62%, transparent)"/>
<rect x="524" y="34" width="26" height="26" rx="3" fill="color-mix(in srgb, var(--primary) 28%, transparent)" stroke="color-mix(in srgb, var(--primary) 62%, transparent)"/>
<text class="b" x="473" y="24" text-anchor="middle">most recent, kept whole</text>
<path d="M24 70 V80 H108 V70" fill="none" stroke="color-mix(in srgb, var(--primary) 34%, transparent)" stroke-width="1.2"/>
<path d="M120 70 V80 H204 V70" fill="none" stroke="color-mix(in srgb, var(--primary) 34%, transparent)" stroke-width="1.2"/>
<path d="M216 70 V80 H300 V70" fill="none" stroke="color-mix(in srgb, var(--primary) 34%, transparent)" stroke-width="1.2"/>
<path d="M66 80 V104" stroke="color-mix(in srgb, var(--primary) 40%, transparent)" stroke-width="1.2"/>
<path d="M162 80 V104" stroke="color-mix(in srgb, var(--primary) 40%, transparent)" stroke-width="1.2"/>
<path d="M258 80 V104" stroke="color-mix(in srgb, var(--primary) 40%, transparent)" stroke-width="1.2"/>
<rect x="48" y="104" width="36" height="30" rx="4" fill="color-mix(in srgb, var(--primary) 18%, transparent)" stroke="color-mix(in srgb, var(--primary) 48%, transparent)"/>
<text class="b" x="66" y="124" text-anchor="middle">s1</text>
<rect x="144" y="104" width="36" height="30" rx="4" fill="color-mix(in srgb, var(--primary) 18%, transparent)" stroke="color-mix(in srgb, var(--primary) 48%, transparent)"/>
<text class="b" x="162" y="124" text-anchor="middle">s2</text>
<rect x="240" y="104" width="36" height="30" rx="4" fill="color-mix(in srgb, var(--primary) 18%, transparent)" stroke="color-mix(in srgb, var(--primary) 48%, transparent)"/>
<text class="b" x="258" y="124" text-anchor="middle">s3</text>
<text class="l" x="24" y="158">one summary per group — this is what a query attends to</text>
<text class="l" x="24" y="184">1,000,000 tokens → 7,813 entries at a group size of 128</text>
</svg>
<figcaption>Distance buys compression. Recent tokens stay at full resolution because that is where the fine detail matters.</figcaption>
</figure>

Both keep a small window of the most recent tokens uncompressed — a hundred or so. Compression is fine for context from far back, but the last few tokens are where exact wording matters, and summarising those would cost real accuracy for a saving of nothing. A window of 128 out of a million is 0.013% of the sequence.

There is also a small addition to the softmax that lets attention weights sum to less than one. Ordinarily softmax must distribute all its weight somewhere, so a query with nothing relevant to look at is forced to pretend something is relevant. Allowing the total to fall short gives it a way to say none of these.

The reported result is that at a million tokens V4-Pro uses about 27% of the per-token compute and 10% of the KV cache of the previous version, and V4-Flash about 10% and 7%.

## The other changes

Three more, each aimed at making a model this size train without falling over.

**A wider residual stream.** Instead of one path carrying the signal up through the layers there are four, mixed by a learned matrix at each step. Widening it this way is unstable on its own — over enough layers the signal either grows without bound or dies — so the mixing matrix is constrained so that its rows and columns each sum to one. That caps how much any layer can amplify the signal, which is what keeps a very deep stack numerically sane.

**A different optimiser.** The usual choice treats every weight as an independent number. Muon instead looks at the gradient as a whole matrix and reshapes the update so no single direction dominates it. It is used for the main weight matrices; the embeddings, the normalisation layers and the output head keep the conventional optimiser, which already works well for them.

**Four-bit weights, trained that way.** The expert weights are stored in a 4-bit floating point format. The important part is that the model is trained *knowing* this — the reduced precision is simulated during training, so the weights settle into values that survive it, rather than being rounded down afterwards and hoping.

## How it is trained

Pre-training runs over 32 trillion tokens, and the context length is raised in stages — 4K, then 16K, then 64K, and finally a million. Attention starts dense and only becomes sparse once the sequences are long enough for sparsity to be worth anything.

The post-training is the more unusual part. Rather than fine-tuning one model on everything, separate specialists are trained for separate domains — maths, code, agent use, instruction following — each tuned on its own data with its own reward signal.

Those specialists are then merged into one model by distillation, with a twist. The student generates its *own* answers, and for each one it is taught to match the probability distribution the relevant specialist would have produced. Training on the student's own output matters: a model distilled from its teacher's text learns on sentences it would never have written, and then has to perform on sentences it does write. Letting it generate first closes that gap.

## Choosing how hard to think

The released model exposes three effort levels: answer directly, think first, or think as hard as possible with an instruction demanding the reasoning be exhaustive.

This is a cost control. Most requests do not need extended reasoning, and paying for it on all of them is waste — so the depth becomes a dial the caller sets per request rather than a property of the model.

## The short version

- The goal is a million-token context at a price anyone would pay.
- Ordinary attention cannot get there: a million tokens means a trillion comparisons.
- Groups of consecutive tokens are replaced by learned summaries, cutting what a query sees by the group size — a factor of 128 takes a million tokens to under eight thousand entries.
- One variant compresses lightly and then picks the most relevant entries; the other compresses hard and attends to everything that is left.
- Recent tokens are exempt, because that is where exact detail matters.
- Both models are mixture-of-experts, so the active parameter count is a small fraction of the total.
- The residual stream is widened but constrained, the optimiser reshapes whole gradient matrices, and the experts are trained directly in 4-bit.
- Specialists are trained per domain, then merged by distilling into a student on its own generations.
