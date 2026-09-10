---
title: "LLM Inference Optimization"
date: "2026-09-11T14:00"
category: "AI"
tags: ["inference", "gpu", "memory-bandwidth", "batching", "kv-cache"]
summary: "Generating a token barely uses the GPU's arithmetic — it spends almost all its time moving weights from memory. Once you see that, every serving optimization sorts itself into one of three piles."
draft: false
cover: "/blog/llm-inference-optimization.svg"
---

There is a long list of tricks for making a served model faster, and read one at a time they look unrelated. They are not. Almost all of them attack one of three bottlenecks, and which bottleneck you are hitting is decided by arithmetic you can do on paper.

## The number that explains everything

Take a 7-billion-weight model at 16 bits, so 14 GB of weights, on a card with 2 TB/s of memory bandwidth and 400 TFLOP/s of fp16 throughput.

To generate **one** token the GPU must read every weight once — 14 GB — which takes 7 ms. The arithmetic it does with those weights is about 2 × 7 billion = 14 GFLOP, which takes 0.035 ms.

| | per generated token |
| --- | --- |
| reading the weights | 7.00 ms |
| doing the arithmetic | 0.035 ms |

The GPU is computing for **0.5% of the time**. The other 99.5% it is waiting for memory.

This is the single most important fact about serving a model, and it is counter-intuitive: the expensive-looking part is free, and the boring part is the whole cost. It also sets a hard ceiling — 143 tokens per second, no matter what you do, as long as one token per pass is all you ask for.

## Batching is not a scheduling convenience

Read the 14 GB once and you can multiply it against 64 different sequences for almost nothing extra. Every one of those gets a token.

| batch | compute time | memory time | tokens/sec |
| --- | --- | --- | --- |
| 1 | 0.03 ms | 7.00 ms | 143 |
| 16 | 0.56 ms | 7.00 ms | 2,286 |
| 64 | 2.24 ms | 7.00 ms | 9,143 |
| 200 | 7.00 ms | 7.00 ms | 28,571 |

Throughput rises 64× and each user's latency does not move, because the memory read was going to happen regardless. That free ride continues until batch 200, where compute finally takes as long as the memory read. Past that point you are paying for real work and throughput stops being free.

So the goal of a serving system is to keep the batch full — which is exactly why requests are admitted and retired continuously rather than in fixed groups. A batch slot sitting idle because one sequence in the group finished early is throughput thrown away.

## Why prefill is a different problem

Reading the prompt inverts the ratio. A 2,000-token prompt is 2,000 tokens' worth of arithmetic against the *same* single pass over the weights:

| | 2,000-token prefill |
| --- | --- |
| reading the weights | 7 ms |
| doing the arithmetic | 70 ms |

Prefill is 10× compute-bound. Decode is 200× memory-bound. They are opposite workloads that happen to share a model, and treating them as one thing is why naive servers behave badly — a long prompt arriving mid-batch stalls everyone's decoding behind 70 ms of arithmetic.

<figure>
<svg viewBox="0 0 560 262" width="560" role="img" aria-label="Two bars showing that decode spends 7ms on memory and 0.035ms computing, while a 2000-token prefill spends 70ms computing against the same 7ms of memory." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">OPPOSITE WORKLOADS, SAME MODEL</text>
<text class="b" x="20" y="46">decode — one token</text>
<text class="l" x="20" y="70">memory</text>
<rect x="86" y="56" width="42" height="20" rx="3" fill="color-mix(in srgb, var(--primary) 26%, transparent)" stroke="var(--primary)" stroke-opacity="0.6"/>
<text class="l" x="136" y="70">7.00 ms</text>
<text class="l" x="20" y="98">compute</text>
<rect x="86" y="84" width="1" height="20" fill="color-mix(in srgb, var(--muted-foreground) 40%, transparent)"/>
<text class="l" x="136" y="98">0.035 ms — the GPU is idle 99.5% of the time</text>
<path d="M20 120 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="146">prefill — 2,000 tokens</text>
<text class="l" x="20" y="170">memory</text>
<rect x="86" y="156" width="42" height="20" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 30%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 50%, transparent)"/>
<text class="l" x="136" y="170">7.00 ms</text>
<text class="l" x="20" y="198">compute</text>
<rect x="86" y="184" width="420" height="20" rx="3" fill="color-mix(in srgb, var(--primary) 26%, transparent)" stroke="var(--primary)" stroke-opacity="0.6"/>
<text class="b" x="86" y="222">70 ms — now the arithmetic is the cost</text>
<text class="l" x="20" y="242">a long prompt arriving mid-batch stalls everyone else's decoding</text>
</svg>
<figcaption>Same weights, same card. The ratio flips because prefill does 2,000 tokens of work per pass and decode does one.</figcaption>
</figure>

## The third bottleneck: capacity

Batching is limited by how much memory is left after the weights, because each sequence carries its own attention cache.

For this model — 32 layers, 4,096 hidden dimensions, 16-bit — that cache costs 512 KB per token, so a 4,000-token conversation holds 2.10 GB. On an 80 GB card with 14 GB spent on weights, 66 GB remains, which is **31 concurrent sequences**. Not 200. The batch that would have made compute and memory break even is out of reach.

This is why cutting the cache matters so much. Sharing key and value projections across groups of query heads — say 8 sets instead of 32 — drops the per-token cost to 128 KB and the same card holds **125 sequences**, a 4× increase in how many people it can serve at once.

It is also why the cache is allocated in small fixed pages rather than one contiguous reservation per sequence. Reserving for the longest possible conversation strands memory that a shorter one could have used, and that stranded memory converts directly into batch slots you do not get.

## Sorting the tricks

Every optimization worth knowing lands in one of three piles:

**Move fewer bytes per token.** Quantize the weights — 4-bit instead of 16-bit turns the 7 ms read into under 2 ms, and since decode is memory-bound that is very close to a straight speedup.

**Get more tokens per byte moved.** Batching, obviously. Also drafting several tokens with a small model and checking them all in one pass of the large one — the expensive read happens once and yields two or three accepted tokens instead of one.

**Free up capacity so the batch can be bigger.** Smaller attention caches, paged allocation, evicting finished sequences immediately.

Prefill sits outside all three because it is compute-bound. Its optimizations are different in kind: don't recompute a prefix you have already processed, and use attention kernels that keep intermediate values in fast on-chip memory instead of writing them out and reading them back.

## What to take away

Before reaching for any technique, work out which side you are on. Divide the bytes the GPU must read by its bandwidth, divide the arithmetic by its throughput, and compare.

If memory time dominates, more arithmetic is free and you should be buying tokens with it. If compute time dominates, nothing about memory will help. Almost every disappointing optimization is one applied to the wrong side of that comparison.
