---
title: "Matrix multiplication in neural networks"
date: "2026-11-06T13:30"
category: "AI"
tags: ["matrix-multiplication", "linear-algebra", "gpu", "batching", "fundamentals"]
summary: "Almost all the arithmetic in a neural network is one operation: multiply a matrix of inputs by a matrix of weights. A 70B model does about 140 GFLOPs of it per token — and serving one user at a time uses 0.34% of a GPU's compute, because a matrix times a single vector reuses nothing."
draft: false
cover: "/blog/matrix-multiplication-in-neural-networks.svg"
---

Open up any neural network — an image classifier, a speech recogniser, a large language model — and nearly all of the computation is the same operation repeated: a matrix multiplication. Attention, feed-forward layers, embeddings, output projections: each is, at its core, inputs multiplied by weights.

Understanding that one operation explains why networks are written the way they are, why GPUs suit them, and why batching requests together makes serving so much cheaper.

## One layer is one multiplication

A layer of neurons computes, for each neuron, a weighted sum of all inputs. Write the weights of all the neurons as a matrix and the whole layer becomes a single multiplication:

`y = x W + b`

If the input has 3 numbers and the layer has 2 neurons, `W` is 3 × 2: each column holds one neuron's weights. Feeding two examples at once — a batch — stacks them as rows of `X`:

```text title="a batch of 2 through a layer of 2 neurons"
X (2×3)        W (3×2)          XW (2×2)
[1 2 3]        [0.1 0.4]        [1.4 3.2]
[4 5 6]   ×    [0.2 0.5]   =    [3.2 7.7]
               [0.3 0.6]
```

Each output entry is a row of `X` dotted with a column of `W`. The top-left is `1×0.1 + 2×0.2 + 3×0.3 = 1.4`: example one, neuron one. The bottom-right is `4×0.4 + 5×0.5 + 6×0.6 = 7.7`: example two, neuron two. Every example meets every neuron in one operation.

## How much arithmetic

Multiplying an *m × k* matrix by a *k × n* matrix takes *m × n × k* multiplications and about as many additions: **2mnk** floating-point operations.

For a language model, every parameter is used in one multiply and one add for each token processed. So a forward pass costs about **2 × parameters** operations per token. For a 70B-parameter model, that is roughly **140 billion operations per token**. Generating a 500-token answer is 70 trillion.

That volume is only practical because matrix multiplication is the operation hardware has been built around: GPUs and TPUs have dedicated units that multiply small tiles of matrices in a single instruction.

## The catch: reuse

How fast a matrix multiplication runs depends on how many times each number loaded from memory gets used.

When a language model generates text for a single user, each step processes one token. The "batch" is one row. The layer is a matrix times a *vector*: every weight is loaded from memory, used for exactly one multiply-add, and discarded. With 16-bit weights that is 2 operations per 2 bytes — **1 operation per byte**.

An H100-class GPU needs about 295 operations per byte to keep its arithmetic units busy (its compute divided by its memory bandwidth). At 1, it is idle almost all the time, waiting for weights to arrive.

Now serve many users at once. With a batch of *B* tokens, each weight loaded is used *B* times — once per row:

| batch size | operations per byte | share of peak compute |
| --- | --- | --- |
| 1 | 1 | **0.34%** |
| 8 | 8 | 2.71% |
| 64 | 64 | 21.7% |
| 295 | 295 | **100%** |

Up to that point, adding users costs almost nothing extra: the weights are being streamed from memory anyway, and the arithmetic units had spare capacity. This one fact is why inference servers batch requests together, and why the cost per token falls so steeply with traffic.

<figure>
<svg viewBox="0 0 560 260" width="560" role="img" aria-label="A weight matrix multiplied by a single input row versus by a tall batch of rows, with the share of GPU compute used rising from 0.34% at batch 1 to 100% at batch 295." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">EACH WEIGHT LOADED, USED B TIMES</text>
<rect x="20" y="70" width="80" height="8" fill="var(--muted-foreground)" fill-opacity="0.7"/>
<text class="l" x="108" y="78">×</text>
<rect x="122" y="40" width="70" height="70" fill="var(--muted-foreground)" fill-opacity="0.25" stroke="var(--muted-foreground)" stroke-opacity="0.5"/>
<text class="l" x="20" y="130">batch 1: 1 op per byte</text>
<rect x="290" y="40" width="80" height="70" fill="var(--primary)" fill-opacity="0.6"/>
<text class="l" x="378" y="78">×</text>
<rect x="392" y="40" width="70" height="70" fill="var(--muted-foreground)" fill-opacity="0.25" stroke="var(--muted-foreground)" stroke-opacity="0.5"/>
<text class="b" x="290" y="130">batch B: B ops per byte</text>
<text class="l" x="20" y="162">1</text><rect x="70" y="152" width="2" height="12" fill="var(--muted-foreground)"/><text class="l" x="80" y="162">0.34%</text>
<text class="l" x="20" y="182">64</text><rect x="70" y="172" width="98" height="12" fill="var(--muted-foreground)" fill-opacity="0.6"/><text class="l" x="176" y="182">21.7%</text>
<text class="b" x="20" y="202">295</text><rect x="70" y="192" width="450" height="12" fill="var(--primary)" fill-opacity="0.8"/><text class="b" x="470" y="202" text-anchor="end" fill="var(--background)">100%</text>
<path d="M20 220 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="242">serving one user, the GPU mostly waits for weights; serving 295, it computes</text>
</svg>
<figcaption>The same weights, read once from memory, can serve one row or hundreds.</figcaption>
</figure>

## Where else it appears

**Training** processes large batches of long sequences, so its matrices are big on every side and it runs close to peak. That is why training throughput numbers look so much better than single-user inference numbers on the same hardware.

**Prefill**, the first pass over a prompt, multiplies the weights by every prompt token at once — a tall matrix — and is compute-bound even for one user. **Decode**, one token at a time, is the matrix-times-vector case, bandwidth-bound unless batched.

**Attention** contains matrix multiplications of its own: queries times keys to score every pair of positions, and scores times values to mix them. These grow with sequence length rather than with parameter count, which is why long contexts get expensive.

## Why the shapes are what they are

Hardware multiplies matrices in fixed-size tiles — often 16 × 16 or larger. Matrices whose dimensions are multiples of the tile size fill the hardware exactly; awkward sizes waste part of each tile. This is why model widths are numbers like 4,096 and 8,192, head dimensions are 64 or 128, and vocabularies are often padded up to a round multiple.

## What to take away

A neural network layer is a matrix multiplication: inputs times weights, every example meeting every neuron at once, at a cost of 2mnk operations. A language model does about 2 × parameters operations per token — 140 billion for a 70B model.

How fast it runs depends on reuse. One token at a time, each weight is used once per load and the GPU reaches 0.34% of its compute. Batch 295 tokens together and the same loads feed the arithmetic fully. Most of the economics of serving models follow from that.
