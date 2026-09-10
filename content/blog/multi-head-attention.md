---
title: "Multi-head attention"
date: "2026-09-11T09:20"
category: "AI"
tags: ["attention", "transformers", "heads", "parameters", "architecture"]
summary: "Running several attention operations side by side costs nothing extra — the parameters and the cache are identical to one big head. What you actually spend is the width each head gets to work in."
draft: false
cover: "/blog/multi-head-attention.svg"
---

One attention operation produces one weighting over the sequence. Every token ends up with a single opinion about which other tokens mattered to it.

That is limiting, because a token relates to its neighbours in several ways at once — grammatically to one, semantically to another, positionally to a third. One set of weights has to average all of that into a single answer.

Multi-head attention runs several attention operations in parallel, each with its own projections, so each can settle on a different notion of relevance.

## How the split works

Take the model width $d_{\text{model}}$ and the number of heads $h$. Each head works in a narrower space of $d_k = d_{\text{model}}/h$ dimensions.

Each head has its own $W_Q$, $W_K$ and $W_V$, projecting the full-width input down into its own $d_k$. Each runs ordinary attention in there and produces a $d_k$-wide output. The $h$ outputs are concatenated back to full width, and a final matrix $W_O$ mixes them.

$$
\text{MultiHead} = \text{Concat}(\text{head}_1, \ldots, \text{head}_h)\,W_O
$$

## It costs nothing

This is the part that is usually stated as a footnote and is actually the point.

<figure>
<svg viewBox="0 0 560 242" width="560" role="img" aria-label="Two arrangements of the same total width. One wide head of 512 dimensions above, and eight narrow heads of 64 dimensions below, filling exactly the same span." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.l{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.v{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}</style>
<text class="hd" x="20" y="18">SAME TOTAL WIDTH, DIFFERENT PARTITION</text>
<text class="l" x="90" y="62" text-anchor="end">1 head</text>
<rect x="100" y="44" width="416" height="34" rx="4" fill="color-mix(in srgb, var(--primary) 40%, transparent)" stroke="color-mix(in srgb, var(--primary) 60%, transparent)"/>
<text class="v" x="308" y="66" text-anchor="middle">d_k = 512</text>
<text class="l" x="90" y="122" text-anchor="end">8 heads</text>
<rect x="100" y="104" width="48" height="34" rx="4" fill="color-mix(in srgb, var(--primary) 40%, transparent)" stroke="color-mix(in srgb, var(--primary) 60%, transparent)"/>
<rect x="152" y="104" width="48" height="34" rx="4" fill="color-mix(in srgb, var(--primary) 40%, transparent)" stroke="color-mix(in srgb, var(--primary) 60%, transparent)"/>
<rect x="204" y="104" width="48" height="34" rx="4" fill="color-mix(in srgb, var(--primary) 40%, transparent)" stroke="color-mix(in srgb, var(--primary) 60%, transparent)"/>
<rect x="256" y="104" width="48" height="34" rx="4" fill="color-mix(in srgb, var(--primary) 40%, transparent)" stroke="color-mix(in srgb, var(--primary) 60%, transparent)"/>
<rect x="308" y="104" width="48" height="34" rx="4" fill="color-mix(in srgb, var(--primary) 40%, transparent)" stroke="color-mix(in srgb, var(--primary) 60%, transparent)"/>
<rect x="360" y="104" width="48" height="34" rx="4" fill="color-mix(in srgb, var(--primary) 40%, transparent)" stroke="color-mix(in srgb, var(--primary) 60%, transparent)"/>
<rect x="412" y="104" width="48" height="34" rx="4" fill="color-mix(in srgb, var(--primary) 40%, transparent)" stroke="color-mix(in srgb, var(--primary) 60%, transparent)"/>
<rect x="464" y="104" width="48" height="34" rx="4" fill="color-mix(in srgb, var(--primary) 40%, transparent)" stroke="color-mix(in srgb, var(--primary) 60%, transparent)"/>
<text class="v" x="308" y="158" text-anchor="middle">d_k = 64 each</text>
<path d="M100 180 H516" stroke="var(--muted-foreground)" stroke-opacity="0.5" stroke-width="1"/>
<path d="M100 176 V184 M516 176 V184" stroke="var(--muted-foreground)" stroke-opacity="0.5" stroke-width="1"/>
<text class="l" x="308" y="200" text-anchor="middle">1,048,576 parameters either way</text>
<text class="l" x="20" y="222">and the same KV cache per token</text>
</svg>
<figcaption>Adding heads does not add width. It divides the width you already had.</figcaption>
</figure>

With $d_{\text{model}} = 512$:

| heads | $d_k$ | Q, K, V, O parameters | KV cache per token per layer |
| --- | --- | --- | --- |
| 1 | 512 | 1,048,576 | 1,024 |
| 8 | 64 | 1,048,576 | 1,024 |
| 32 | 16 | 1,048,576 | 1,024 |
| 64 | 8 | 1,048,576 | 1,024 |

Every row identical. The projections total $h \times (d_{\text{model}} \times d_k) \times 3$, and since $h \cdot d_k = d_{\text{model}}$ that is just $3d_{\text{model}}^2$, plus $d_{\text{model}}^2$ for the output matrix — **regardless of $h$**.

The cache behaves the same way: $2 \times h \times d_k$ per token per layer is $2 \, d_{\text{model}}$, whatever the head count.

So "more heads" is not a cost-versus-capability trade in the way it sounds. It is free.

## What it actually costs

Not memory. Width.

| heads | dimensions per head |
| --- | --- |
| 1 | 512 |
| 8 | 64 |
| 32 | 16 |
| 64 | **8** |

At 64 heads, each one has eight numbers in which to encode what it is looking for and what each token offers. Attention scores become dot products of 8-dimensional vectors, and there is only so much a head can distinguish with that.

That is the real trade: **many narrow specialists against few broad generalists**, at fixed total capacity. Too few heads and each is forced to average several kinds of relationship together. Too many and each is too thin to represent one properly.

The original design used 8. Current models use 32 or 64, because the model width grew alongside — a 64-head model at $d_{\text{model}} = 4096$ still gives each head 64 dimensions.

## What the heads do

Nothing assigns them roles. Each head has its own randomly initialised projections, and whatever it ends up specialising in is a product of training.

What is observed afterwards is that heads do differentiate — some attend mostly to adjacent tokens, some track syntactic dependencies at a distance, some appear to do something with no clean description. Many are close to redundant and can be removed with little effect.

The specialisation is a side effect of having several separate parameter sets that all reduce the same loss. Nothing coordinates them, and nothing guarantees they will divide the work sensibly.

## Where it sits

Every attention block in a transformer is multi-head. In an encoder, all heads attend across the whole input. In a decoder's self-attention, all heads are masked so nothing sees the future. Where a decoder consults an encoder, all heads attend across to it.

The head count is per block, so a 32-layer model with 32 heads runs 1,024 attention operations for one forward pass — all of them in parallel, which is why hardware likes this shape.

## The short version

- Several attention operations run side by side, each with its own projections.
- The model width is divided among them: $d_k = d_{\text{model}}/h$.
- Parameter count is $4d_{\text{model}}^2$ whatever the head count — adding heads is free.
- The KV cache is likewise independent of $h$.
- What changes is how many dimensions each head gets: 64 heads at width 512 leaves eight each.
- The trade is many narrow specialists against few broad generalists at fixed capacity.
- Roles are never assigned; specialisation emerges, and some heads end up doing very little.
