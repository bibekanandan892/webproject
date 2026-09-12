---
title: "GPU for Deep Learning"
date: "2026-09-11T18:20"
category: "AI"
tags: ["gpu", "vram", "training", "mixed-precision", "cuda"]
summary: "A GPU is thousands of simple cores, which suits the arithmetic of a neural network perfectly. What actually decides what you can build on one is not the cores — it is that training a model needs eight times the memory of running it."
draft: false
cover: "/blog/gpu-for-deep-learning.svg"
---

A CPU has a handful of cores, each sophisticated — branch prediction, deep caches, out-of-order execution — designed to make a single sequence of instructions finish as fast as possible.

A GPU has thousands of simple cores with almost none of that machinery, designed so that thousands of independent calculations happen at once.

Which of those is better depends entirely on whether the work is one long dependent sequence or a great many unrelated pieces. Neural networks are emphatically the second.

## Why the arithmetic fits

Nearly all the computation in a neural network is matrix multiplication, and a matrix multiplication is a collection of independent dot products.

Each output element is one multiply-and-add chain over a row and a column. Nothing about the element at position (3, 7) depends on the element at (3, 8). They can all be computed simultaneously, in any order, by anyone.

That is an unusually friendly structure. Most programs are full of dependencies — this branch depends on that comparison, this write must precede that read — and a machine with a thousand weak cores cannot help with them. A matrix multiplication has no dependencies to respect, so the more cores you throw at it the faster it finishes, right up until you run out of work to give them.

## Where the limit actually is

Not the cores. Memory.

A GPU has its own memory, and everything it computes on must be in there. This is the constraint people hit first, and it is much tighter for training than the model size suggests.

Take a 7-billion-parameter model trained in mixed precision with a standard optimizer:

| | bytes per parameter | 7B model |
| --- | --- | --- |
| weights, 16-bit | 2 | 14.0 GB |
| gradients, 16-bit | 2 | 14.0 GB |
| 32-bit master copy of the weights | 4 | 28.0 GB |
| optimizer's two running averages, 32-bit | 8 | 56.0 GB |
| | | **112.0 GB** |

That total is before a single activation is stored, and it does not fit on an 80 GB card.

Running the same model needs only the 14 GB of weights. **Training costs 8× the memory of inference** — and if inference is quantized to around 4 bits, 28×.

The line items are worth reading carefully, because the two largest have nothing to do with the model. The optimizer's running averages are 56 GB on their own: 4× the weights, kept in full precision because they accumulate small updates that would vanish at 16-bit. Drop to an optimizer without momentum and the budget falls to 56 GB, which is why memory-constrained training sometimes does exactly that, accepting slower convergence in exchange for fitting.

<figure>
<svg viewBox="0 0 560 286" width="560" role="img" aria-label="Stacked bars comparing the memory needed to run a seven billion parameter model with the memory needed to train it." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">THE SAME MODEL, RUN AND TRAINED</text>
<text class="l" x="20" y="46">running it</text>
<rect x="20" y="56" width="58" height="26" rx="3" fill="color-mix(in srgb, var(--primary) 30%, transparent)" stroke="var(--primary)" stroke-opacity="0.6"/>
<text class="b" x="86" y="74">14 GB — weights</text>
<text class="l" x="20" y="110">training it</text>
<rect x="20" y="120" width="58" height="26" rx="3" fill="color-mix(in srgb, var(--primary) 30%, transparent)" stroke="var(--primary)" stroke-opacity="0.6"/>
<rect x="80" y="120" width="58" height="26" rx="3" fill="color-mix(in srgb, var(--primary) 18%, transparent)" stroke="var(--primary)" stroke-opacity="0.45"/>
<rect x="140" y="120" width="116" height="26" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 26%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 45%, transparent)"/>
<rect x="258" y="120" width="232" height="26" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 34%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 55%, transparent)"/>
<text class="b" x="20" y="166">weights</text>
<text class="l" x="80" y="166">grads</text>
<text class="l" x="140" y="166">fp32 copy</text>
<text class="l" x="258" y="166">optimizer averages — 56 GB</text>
<text class="b" x="20" y="192">112 GB before any activations are stored</text>
<path d="M20 210 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<rect x="20" y="224" width="331" height="14" rx="3" fill="none" stroke="var(--muted-foreground)" stroke-opacity="0.5" stroke-dasharray="5 4"/>
<text class="l" x="359" y="236">80 GB — one large card</text>
<text class="l" x="20" y="264">the two biggest line items are not the model</text>
</svg>
<figcaption>The optimizer's state is four times the weights, and it is the reason training does not fit where inference does.</figcaption>
</figure>

Activations are the one term you can trade. They scale with batch size and sequence length, and they exist only so the backward pass can reuse them — so you can throw them away and recompute them during the backward pass instead. That is a direct exchange of arithmetic for memory, and on a machine where arithmetic is abundant it is usually a good trade.

## Precision

Since memory is the constraint, the number format matters twice: fewer bits per value means less memory *and* less traffic to move.

Sixteen-bit formats halve both against 32-bit and are the norm for training. Eight-bit integers halve again and are common for inference, where there is no gradient to accumulate and small rounding errors do not compound across steps.

Dedicated matrix-multiply units on the chip operate on these narrow formats specifically, which is why the speedup from lower precision is larger than the bit count suggests — it is not only less data, it is a different, faster unit doing the work.

## Why small work is wasted work

A GPU hides memory latency by having far more work in flight than it can execute, and switching whenever something stalls. That requires a lot of independent work to be available.

A 128 × 128 output has 16,384 elements to compute. A large card wants a few hundred thousand threads resident to stay busy — roughly 16× more than that matrix can supply. The hardware is not slow on small matrices; it is idle on them.

This is why batching matters so much, and why a GPU can look unimpressive on a single small request while being extraordinary on a large batch. The device is sized for a volume of work that small inputs simply do not contain.

## The software is half of it

None of this is reachable without the software layer. Writing a matrix multiplication that actually achieves peak throughput is a serious undertaking — tiling for the cache hierarchy, coalescing memory accesses, choosing instruction mixes per architecture.

Almost nobody does it. Framework code calls into heavily tuned libraries, written per hardware generation by the vendor, and the framework's job is to dispatch to the right one. This is why the practical experience of using a GPU is `move tensor to device` and nothing more.

It is also the real reason one vendor dominates: the hardware advantage is contestable, but a decade of libraries that every framework already targets is not.

## What to take away

The thousands of cores are the easy part of the story and rarely the binding constraint.

What decides whether you can train a given model on a given card is an accounting exercise: weights, plus gradients, plus a full-precision copy, plus the optimizer's state. Do that sum before anything else, because it is usually the answer.
