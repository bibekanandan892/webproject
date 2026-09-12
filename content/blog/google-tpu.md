---
title: "Google TPU"
date: "2026-09-11T16:40"
category: "AI"
tags: ["tpu", "systolic-array", "hardware", "matrix-multiplication", "accelerator"]
summary: "A TPU is built around a grid of multipliers that pass values to each other instead of fetching them. That one decision is where its speed and its power efficiency come from — and also where its awkwardness comes from."
draft: false
cover: "/blog/google-tpu.svg"
---

A TPU is a chip that does one thing: multiply matrices. Not "mostly" — the design gives up nearly everything a general processor offers in exchange for doing that single operation extremely well.

Understanding why that trade pays off means looking at what the expensive part of arithmetic actually is.

## The operation

Almost all the work in a neural network reduces to multiply-and-accumulate: take a list of inputs, take a list of weights, multiply them pairwise, add the products.

```
3×4 + 7×1 + 2×9 = 12 + 7 + 18 = 37
```

That is the whole computation, repeated an enormous number of times. Multiplying two 128 × 128 matrices is 2,097,152 of those multiply-accumulates.

A general-purpose processor handles this by fetching operands, multiplying, storing the result, and moving on. The multiplication is trivially cheap. The **fetching** is not — reading a value from off-chip memory costs orders of magnitude more energy than the multiply it feeds, and takes far longer.

So the real question for any matrix-multiply chip is not how many multipliers it has. It is how many multiplications it gets out of each value it reads.

## Passing instead of fetching

A TPU's answer is a **systolic array**: a grid of small multiply-accumulate cells — 128 wide by 128 tall, so 16,384 of them — wired only to their immediate neighbours.

Weights are loaded into the grid once and stay put. Input values enter from one edge and move across, one cell per clock tick. Partial sums move down. Each cell does one thing per tick: multiply the value arriving from the left by its resident weight, add the partial sum arriving from above, pass the value right and the sum down.

No cell reads memory. A value read once at the edge is used by 128 cells as it crosses.

Count the traffic for that 128 × 128 multiplication:

| | values moved |
| --- | --- |
| every multiply fetches both operands | 4,194,304 |
| systolic array — weights once, inputs once | 32,768 |

That is **128× less memory traffic** for identical arithmetic, or 64 multiply-accumulates per value read. Since memory access dominates both the time and the energy, this ratio is essentially the whole story of why the chip is fast and why it runs cool.

The throughput follows almost for free. 16,384 cells each doing one multiply-accumulate per cycle, at around 940 MHz, is 15.4 trillion multiply-accumulates per second.

<figure>
<svg viewBox="0 0 560 282" width="560" role="img" aria-label="A grid of multiply-accumulate cells with input values entering from the left and partial sums descending, showing that a value read once is used across a whole row." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<defs><marker id="tp" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--primary)"/></marker></defs>
<text class="hd" x="20" y="18">READ ONCE AT THE EDGE, USED ALL THE WAY ACROSS</text>
<g fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="var(--primary)" stroke-opacity="0.4">
<rect x="150" y="46" width="42" height="34" rx="4"/><rect x="196" y="46" width="42" height="34" rx="4"/><rect x="242" y="46" width="42" height="34" rx="4"/><rect x="288" y="46" width="42" height="34" rx="4"/><rect x="334" y="46" width="42" height="34" rx="4"/>
<rect x="150" y="84" width="42" height="34" rx="4"/><rect x="196" y="84" width="42" height="34" rx="4"/><rect x="242" y="84" width="42" height="34" rx="4"/><rect x="288" y="84" width="42" height="34" rx="4"/><rect x="334" y="84" width="42" height="34" rx="4"/>
<rect x="150" y="122" width="42" height="34" rx="4"/><rect x="196" y="122" width="42" height="34" rx="4"/><rect x="242" y="122" width="42" height="34" rx="4"/><rect x="288" y="122" width="42" height="34" rx="4"/><rect x="334" y="122" width="42" height="34" rx="4"/>
</g>
<text class="l" x="20" y="68">inputs</text>
<path d="M62 63 H142" stroke="var(--primary)" stroke-opacity="0.75" stroke-width="1.6" marker-end="url(#tp)"/>
<path d="M62 101 H142" stroke="var(--primary)" stroke-opacity="0.55" stroke-width="1.6" marker-end="url(#tp)"/>
<path d="M62 139 H142" stroke="var(--primary)" stroke-opacity="0.4" stroke-width="1.6" marker-end="url(#tp)"/>
<path d="M171 164 V194" stroke="var(--muted-foreground)" stroke-opacity="0.5" stroke-width="1.4"/>
<path d="M217 164 V194" stroke="var(--muted-foreground)" stroke-opacity="0.5" stroke-width="1.4"/>
<path d="M263 164 V194" stroke="var(--muted-foreground)" stroke-opacity="0.5" stroke-width="1.4"/>
<path d="M309 164 V194" stroke="var(--muted-foreground)" stroke-opacity="0.5" stroke-width="1.4"/>
<path d="M355 164 V194" stroke="var(--muted-foreground)" stroke-opacity="0.5" stroke-width="1.4"/>
<text class="l" x="396" y="190">partial sums out</text>
<text class="l" x="396" y="68">weights stay</text>
<text class="l" x="396" y="84">resident in</text>
<text class="l" x="396" y="100">the cells</text>
<path d="M20 216 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="240">one value read at the edge feeds 128 cells — 64 MACs per read</text>
<text class="l" x="20" y="260">no cell in the grid ever touches memory</text>
</svg>
<figcaption>The multiplications were never the expensive part. The fetches were.</figcaption>
</figure>

## What the design costs

A pipeline this rigid has a warm-up. Values entering the left edge take 128 ticks to cross, and partial sums take 128 ticks to fall through, so roughly 255 cycles pass before the array is doing full work — and the same at the end as it empties.

For a large multiplication that overhead disappears into the total. For a small one it dominates:

| columns streamed through | array utilisation |
| --- | --- |
| 128 | 34% |
| 512 | 67% |
| 1,024 | 80% |
| 8,192 | 97% |

This is why a TPU wants large batches and large matrices, and why it can look unimpressive on small ones. It is not a latency device. Feed it one small request and most of its 16,384 cells are idle for most of the run.

The array's fixed 128 × 128 shape has the same character. A matrix whose dimensions are not multiples of 128 gets padded, and the padding is real work the chip performs on zeros.

Two further deliberate sacrifices:

**Reduced precision.** Weights and activations are held in narrow formats rather than 32-bit floats. A smaller multiplier is smaller and cheaper in silicon, and training tolerates the imprecision — one of the few places where the mathematics happens to be forgiving.

**No general-purpose machinery.** No branch prediction, no out-of-order execution, no large cache hierarchy. The data flow is known in advance, so none of the apparatus for coping with unpredictable access patterns is needed. Remove it and the die area goes to multipliers instead.

Which is also why a TPU cannot run ordinary code. There is nothing there to run it with.

## Where it fits

TPUs sit in data centres serving and training large models, where the workload is exactly the shape the chip was built for: enormous matrix multiplications, in batches, with a known structure. Smaller variants appear in devices for on-device inference, with the same trade at a smaller scale.

The limitation is the mirror image of the strength. Any workload with unpredictable control flow, small irregular tensors, or heavy data movement between operations loses most of the advantage — the array spends its cycles filling and draining rather than multiplying.

## What to take away

The interesting number in a TPU is not 16,384 multipliers. It is 64 multiply-accumulates per value read.

Everything else about the chip — the fixed grid, the appetite for big batches, the narrow number formats, the inability to run anything else — is the price paid for that ratio. On the workload it was designed for, it is a bargain.
