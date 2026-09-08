---
title: "Decoding flash attention"
date: "2026-09-08T01:25"
category: "AI"
tags: ["attention", "gpu", "flash-attention", "memory", "softmax"]
summary: "Flash attention produces exactly the same numbers as ordinary attention. It is faster because it never writes the score matrix to memory at all."
draft: false
cover: "/blog/decoding-flash-attention.svg"
---

Flash attention computes the same thing ordinary attention computes. Same inputs, same outputs, to the last bit. It is not an approximation.

What changes is where the intermediate work happens. Ordinary attention writes a large matrix out to GPU memory and reads it back; flash attention never writes it at all. That single difference is worth several times the speed.

## What ordinary attention does

Attention scores every token against every other token. For a sequence of $N$ tokens that is an $N \times N$ matrix — one score per pair. Softmax turns each row into weights, and those weights multiply the value vectors.

The matrix is the problem. It is produced, stored, read back for the softmax, stored again, and read back once more for the final multiply. Each of those trips crosses the slowest link the GPU has.

Put a number on it. For 8,192 tokens with a head dimension of 128, in fp16:

| | entries | size |
| --- | --- | --- |
| the $N \times N$ score matrix | 67,108,864 | **128 MB** |
| Q, K, V and the output together | 4,194,304 | 8 MB |

The scratch space is **16 times larger than all the real data combined**. And it grows quadratically — double the sequence length and it quadruples.

## Two kinds of GPU memory

The reason this matters is that a GPU has two very different places to put things.

**HBM** is the big pool, tens of gigabytes. It is what people mean by "GPU memory". It is also comparatively slow.

**SRAM** is on-chip, right next to the compute units. It is roughly an order of magnitude faster to read, and there is very little of it — on the order of a hundred kilobytes per streaming multiprocessor.

A 128 MB matrix has no chance of fitting in SRAM. So the standard implementation parks it in HBM and shuttles it back and forth. The arithmetic is not the bottleneck; the shuttling is.

## The idea: never build the matrix

Flash attention breaks the computation into tiles small enough to live in SRAM while they are being worked on.

<figure>
<svg viewBox="0 0 531 345" width="531" role="img" aria-label="An eight by eight grid standing for the full attention score matrix, drawn faintly, with a single tile highlighted. The full matrix is 128 megabytes and is never built; one tile is 32 kilobytes and fits in fast on-chip memory." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.m{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.k{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}</style>
<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--muted-foreground)"/></marker></defs>
<text class="hd" x="4" y="18">THE N&#215;N SCORE MATRIX</text>
<rect x="4" y="34" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="39" y="34" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="74" y="34" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="109" y="34" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="144" y="34" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="179" y="34" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="214" y="34" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="249" y="34" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="4" y="69" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="39" y="69" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="74" y="69" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="109" y="69" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="144" y="69" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="179" y="69" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="214" y="69" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="249" y="69" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="4" y="104" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="39" y="104" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="74" y="104" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="109" y="104" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="144" y="104" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="179" y="104" width="32" height="32" rx="4" fill="color-mix(in srgb, var(--primary) 30%, transparent)" stroke="color-mix(in srgb, var(--primary) 75%, transparent)" stroke-width="1.6"/>
<rect x="214" y="104" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="249" y="104" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="4" y="139" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="39" y="139" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="74" y="139" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="109" y="139" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="144" y="139" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="179" y="139" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="214" y="139" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="249" y="139" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="4" y="174" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="39" y="174" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="74" y="174" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="109" y="174" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="144" y="174" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="179" y="174" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="214" y="174" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="249" y="174" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="4" y="209" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="39" y="209" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="74" y="209" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="109" y="209" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="144" y="209" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="179" y="209" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="214" y="209" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="249" y="209" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="4" y="244" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="39" y="244" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="74" y="244" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="109" y="244" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="144" y="244" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="179" y="244" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="214" y="244" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="249" y="244" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="4" y="279" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="39" y="279" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="74" y="279" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="109" y="279" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="144" y="279" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="179" y="279" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="214" y="279" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<rect x="249" y="279" width="32" height="32" rx="4" fill="var(--secondary)" fill-opacity="0.5" stroke="var(--border)"/>
<path d="M215 120 H299" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.4" marker-end="url(#ar)"/>
<text class="k" x="307" y="114">one tile &#183; 32 KB</text>
<text class="m" x="307" y="132">fits in on-chip SRAM</text>
<text class="m" x="307" y="190">whole matrix &#183; 128 MB</text>
<text class="m" x="307" y="208">never built at all</text>
<text class="m" x="4" y="333">4,096 tiles cover it, one at a time</text>
</svg>
<figcaption>Only the bright tile is ever real. The rest is computed and discarded, one tile at a time.</figcaption>
</figure>

A 128×128 tile of scores is 32 KB in fp16. That fits comfortably. So instead of computing all 67 million scores and storing them, the GPU loads a block of queries and a block of keys, computes just that tile of scores in SRAM, uses it immediately, and discards it.

The full matrix is never assembled anywhere. It exists only one tile at a time, in fast memory, and is gone before the next tile arrives.

## The problem with doing softmax in pieces

There is an obstacle. Softmax is not computed per element — it needs a whole row.

$$
\text{softmax}(s)_i = \frac{e^{s_i - \max(s)}}{\sum_j e^{s_j - \max(s)}}
$$

Both the maximum and the sum are over the entire row. But a tile only holds part of a row. You cannot normalise until you have seen everything, and the whole point is to avoid holding everything.

## Online softmax

The fix is to keep a running maximum and a running sum, and correct them as new blocks arrive.

Process a block, note its maximum and its exponential sum. When the next block turns out to contain a larger maximum, the earlier numbers were computed against the wrong reference — so scale them by $e^{m_{\text{old}} - m_{\text{new}}}$ to bring them onto the new one. The same correction applies to the accumulated output.

Take a row of eight scores, in two blocks of four:

| block | scores | running max | running sum |
| --- | --- | --- | --- |
| 1 | 1.4, 3.9, 0.7, 2.2 | 3.9 | 1.3055 |
| 2 | 4.6, 1.1, 3.1, 0.3 | 4.6 | 1.9152 |

The second block raises the maximum from 3.9 to 4.6, so everything carried from block 1 gets rescaled before the new numbers are folded in.

Comparing the streamed result against a plain softmax over the whole row:

| | output |
| --- | --- |
| plain softmax over the full row | (1.765581, 3.078123) |
| streamed, block by block | (1.765581, 3.078123) |
| difference | 0 |

Not close — identical. That is what makes this an optimisation rather than a trade-off.

## The backward pass

Training needs the attention scores again to compute gradients, and flash attention threw them away.

Rather than store the matrix, it stores only the per-row statistics — the max and the sum, which are $N$ numbers rather than $N^2$ — and recomputes the tiles on the way back.

That trades extra arithmetic for less memory traffic. On modern GPUs, where compute has grown far faster than memory bandwidth, that trade is worth taking.

## Later versions

**Flash attention 2** reorganises the work: fewer rescaling operations, parallelism over query blocks as well as batch and heads, and a better split of work between threads.

**Flash attention 3** targets newer hardware specifically, overlapping data movement with computation so the transfers happen while the arithmetic is still running.

Both are engineering on the same idea. The output stays identical.

## The short version

- Flash attention returns exactly the same numbers as standard attention.
- Standard attention builds an $N \times N$ score matrix — 128 MB at 8,192 tokens, against 8 MB for all the actual data.
- That matrix lives in slow HBM and gets shuttled back and forth; the memory traffic, not the arithmetic, is the bottleneck.
- Flash attention computes it in tiles small enough for fast on-chip SRAM, and never assembles the whole thing.
- Softmax is made block-friendly by carrying a running max and sum, rescaling when a bigger max appears.
- The backward pass stores $N$ statistics instead of $N^2$ scores and recomputes what it needs.
