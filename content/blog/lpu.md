---
title: "LPU"
date: "2026-09-12T06:40"
category: "AI"
tags: ["lpu", "inference", "sram", "latency", "hardware"]
summary: "Putting the weights in on-chip SRAM makes a single stream 27× faster and costs 732× the throughput per chip. That one exchange rate explains every design decision in the architecture."
draft: false
cover: "/blog/lpu.svg"
---

An LPU is a chip built for one job: running an already-trained language model and producing tokens as fast as possible. Not training. Not flexibility. Latency.

Everything about it follows from one measurement.

## The measurement

Generating a token means reading every weight once, so the time per token is model size divided by memory bandwidth.

For a 70-billion-parameter model at 8 bits — 70 GB:

| | bandwidth | per token | tokens/sec, one stream |
| --- | --- | --- | --- |
| GPU, off-chip HBM | 3 TB/s | 23.3 ms | 43 |
| LPU, on-chip SRAM | 80 TB/s | **0.875 ms** | **1,143** |

**27× faster**, and the arithmetic is trivial: SRAM sitting on the same silicon as the compute is roughly 27 times faster to read than memory stacked next to it. Shorter wires, no off-chip interface.

That is the entire performance claim. The rest of the architecture exists to make it usable.

## The catch, and what it forces

On-chip SRAM is fast because it is small. Around 230 MB per chip.

So a 70 GB model does not fit on one chip. It does not nearly fit:

| | chips required |
| --- | --- |
| 70B at 8-bit | **305** |
| 70B at 4-bit | 153 |
| 8B at 8-bit | 35 |
| 8B at 4-bit | 18 |

The chip count is set by **capacity, not by the speed you wanted.** You cannot buy a smaller deployment for a large model; the floor is the model size divided by the SRAM per chip.

Which gives quantization a much more direct consequence here than on a GPU. Halving the bits does not merely free memory — it halves the number of chips you have to buy and power.

<figure>
<svg viewBox="0 0 560 306" width="560" role="img" aria-label="A comparison of single-stream speed and per-chip throughput between a GPU and an LPU, showing the LPU far ahead on one and far behind on the other." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">ONE TRADE, IN BOTH DIRECTIONS</text>
<text class="l" x="20" y="44">tokens per second for a single stream</text>
<rect x="20" y="54" width="19" height="20" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 30%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 48%, transparent)"/>
<text class="l" x="47" y="69">43 — gpu</text>
<rect x="20" y="80" width="500" height="20" rx="3" fill="color-mix(in srgb, var(--primary) 40%, transparent)" stroke="var(--primary)" stroke-opacity="0.65"/>
<text class="b" x="30" y="95">1,143 — lpu · 27× faster</text>
<path d="M20 120 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="l" x="20" y="144">tokens per second per chip, serving many users</text>
<rect x="20" y="154" width="500" height="20" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 30%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 48%, transparent)"/>
<text class="l" x="30" y="169">2,743 — one gpu at batch 64</text>
<rect x="20" y="180" width="2" height="20" rx="1" fill="color-mix(in srgb, var(--primary) 55%, transparent)"/>
<text class="b" x="30" y="195">3.7 — lpu, one of 305 chips · 732× behind</text>
<path d="M20 216 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="240">on-chip memory buys latency and spends capacity</text>
<text class="l" x="20" y="262">a gpu amortises one weight read over a whole batch; an lpu does not</text>
<text class="l" x="20" y="284">which is why the answer depends on what you are optimising</text>
</svg>
<figcaption>Both bars are the same architectural decision, measured two different ways.</figcaption>
</figure>

## Two more design choices

**No guesswork anywhere.** A general processor spends a large share of its silicon predicting: branch prediction, cache management, out-of-order scheduling, all of it there to cope with not knowing what comes next.

For a fixed model the sequence of operations is known completely before the chip is powered on. So the compiler plans every cycle in advance, and the hardware for guessing is simply absent — the area goes to compute and memory instead.

**A network that never waits.** Since the model is split across hundreds of chips, activations have to move between them constantly. All the chips share one clock and the compiler schedules every transfer to the cycle. No handshakes, no arbitration, no queues.

Both of these come from the same source: **a fixed workload does not need to be discovered at run time.**

## The property that is easy to miss

Because the schedule is decided at compile time, the latency is not merely low — it is *the same every time.*

A GPU under load has variable latency: scheduling, memory contention, other tenants, cache behaviour. Its 99th-percentile response can be several times its median. An LPU's 99th percentile equals its median, because there is nothing in the system that could vary.

For a voice assistant answering "how long until my train leaves", the median does not determine whether the product feels responsive. The tail does. An architecture with no tail is a different kind of guarantee from an architecture with a small one.

## The honest comparison

Now the other direction, which is the number rarely put next to the first.

A GPU reads the weights once and multiplies them against a whole batch. At batch 64 that is 64 tokens produced per 23.3 ms — **2,743 tokens per second from one GPU.**

An LPU deployment of 305 chips produces 1,143 tokens per second for one stream. Per chip, that is **3.7**.

| | tokens/sec per chip |
| --- | --- |
| one GPU at batch 64 | 2,743 |
| one of 305 LPU chips | **3.7** |

The GPU is ahead by **732×** on throughput per chip. That is not a rounding difference, and it is not a flaw in the LPU — it is the same design decision seen from the other side. The LPU's speed comes from dedicating an enormous amount of silicon to one stream, and dedicated silicon does not amortise.

## Where each belongs

**An LPU** where per-request latency is the product: conversation, voice, an agent whose loop is waiting on each token before it can take the next step. Anywhere a tail latency of twice the median would be visible to someone.

**A GPU** for training, for anything where the model changes, and for batch work where total throughput per unit of hardware is what is being paid for. Which is most of what runs.

The LPU also cannot train, and cannot run a model it was not compiled for — the compile-time schedule that makes it fast is also what makes it inflexible.

## What to take away

One sentence covers it: **once a workload is memory-bound, the win comes from moving data less, not computing more.**

An LPU takes that as far as it goes — weights on the same silicon as the arithmetic — and pays the price the trade demands: hundreds of chips for one model, no batching amortisation, no flexibility. Worth it when one stream's latency is the thing being sold, and not otherwise.
