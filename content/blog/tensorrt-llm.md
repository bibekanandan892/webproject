---
title: "TensorRT-LLM"
date: "2026-09-12T07:00"
category: "AI"
tags: ["tensorrt-llm", "inference", "cuda-graphs", "kernel-fusion", "serving"]
summary: "A decode step launches 384 tiny kernels and spends 1.92 ms of CPU time just asking for them. Replaying the whole step as one recorded graph makes that 5 microseconds, which is 1.27× more tokens per second for no change in arithmetic."
draft: false
cover: "/blog/tensorrt-llm.svg"
---

A GPU runs **kernels** — small programs, each doing one piece of maths across thousands of parallel lanes. A forward pass through a language model is a long sequence of them.

TensorRT-LLM's premise is that a great deal of the time is spent not computing. It compiles a specific model into a fixed **engine** ahead of time, and that compilation is where the recovered time comes from.

## The overhead nobody sees

Every kernel has to be launched by the CPU: parameters marshalled, the call submitted, the GPU notified. Around 5 microseconds each, and that is CPU time the GPU spends idle.

A decode step on a 32-layer model issues roughly a dozen kernels per layer:

| | |
| --- | --- |
| kernels launched per token | 384 |
| CPU launch overhead at 5 µs each | **1.92 ms** |
| actual GPU work in the step | 7 ms |
| overhead as a share of wall clock | **22%** |

A fifth of the time is spent asking for work rather than doing it.

The fix is to record the whole sequence once and replay it as a single submission. The kernels still run; the CPU stops re-describing them.

| | launches | overhead | tokens/sec |
| --- | --- | --- | --- |
| launched individually | 384 | 1.92 ms | 112 |
| replayed as one graph | **1** | 0.005 ms | **143** |

**1.27× more throughput** with no change whatsoever to the arithmetic.

And notice where it matters. The same 384 launches against a 70 ms prefill is **2.7%** — invisible. Launch overhead is a *decode* problem specifically, because a decode step is short and made of many tiny kernels. Which is a good illustration of why serving optimizations have to be aimed at one phase or the other.

<figure>
<svg viewBox="0 0 560 312" width="560" role="img" aria-label="A decode step's time split between GPU work and CPU launch overhead, shown before and after replaying the step as one recorded graph." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">A FIFTH OF A DECODE STEP IS ASKING FOR WORK</text>
<text class="l" x="20" y="44">384 separate launches</text>
<rect x="20" y="54" width="392" height="22" rx="3" fill="color-mix(in srgb, var(--primary) 30%, transparent)" stroke="var(--primary)" stroke-opacity="0.6"/>
<rect x="414" y="54" width="107" height="22" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 32%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 50%, transparent)"/>
<text class="b" x="30" y="69">7.00 ms of gpu work</text>
<text class="l" x="20" y="94">1.92 ms of launch overhead — 22% of the wall clock</text>
<text class="b" x="20" y="128">one recorded graph</text>
<rect x="20" y="138" width="392" height="22" rx="3" fill="color-mix(in srgb, var(--primary) 30%, transparent)" stroke="var(--primary)" stroke-opacity="0.6"/>
<rect x="414" y="138" width="1" height="22" fill="color-mix(in srgb, var(--muted-foreground) 50%, transparent)"/>
<text class="b" x="30" y="153">7.00 ms of gpu work</text>
<text class="b" x="20" y="178">0.005 ms — 384× fewer launches, 1.27× the tokens</text>
<path d="M20 198 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="l" x="20" y="222">the same 384 launches against a 70 ms prefill is 2.7% — invisible</text>
<text class="b" x="20" y="246">so this is a decode optimization, not a general one</text>
<text class="l" x="20" y="268">short steps made of many tiny kernels are where the overhead lives</text>
<text class="l" x="20" y="290">nothing about the arithmetic changed</text>
</svg>
<figcaption>The kernels still run. The CPU just stops describing them 384 times per token.</figcaption>
</figure>

## Fusing, and why it is about traffic

Three elementwise operations in a row — scale, add a correction, apply a nonlinearity — as three separate kernels means three reads and three writes of the whole tensor.

For a 4,096 × 4,096 activation at 16 bits:

| | memory moved | at 3 TB/s |
| --- | --- | --- |
| three separate kernels | 201 MB | 67 µs |
| one fused kernel | **67 MB** | **22 µs** |

**3× less traffic**, because the intermediate values never leave the chip's fast registers. The arithmetic is identical; only the number of round trips changed.

This is the same principle as everything else in a memory-bound setting. The work was never the problem — the moving was.

## What the build step is for

All of this requires knowing the shape of the computation in advance, which is what the compilation produces. Given a model, a precision, a maximum batch size and a maximum sequence length, the build chooses which kernels to fuse, selects implementations tuned for the specific GPU architecture, and lays out memory.

That is the trade at the centre of the tool. The engine is **fixed**:

- built for one model and one precision
- built for a maximum batch and sequence length
- built for one GPU architecture, not portable to another
- a build takes tens of minutes

Change any of those and you build again. Which is exactly why a more flexible runtime path exists alongside the compiled one — most teams want to change models more often than they want the last 20%.

## The rest, briefly

The remaining features are the standard serving set, and they matter for the reasons they always do.

**Quantization** cuts the bytes read per token, which is the dominant decode cost, and lets the narrow-precision units do the arithmetic.

**Paged attention cache** hands out small fixed blocks instead of reserving for the longest possible answer, so memory that would have been stranded becomes batch slots.

**In-flight batching** refills a finished slot at the next step rather than waiting for the slowest request in a group, keeping the batch full.

**Custom attention kernels** keep intermediate attention values in fast on-chip memory rather than writing them out and reading them back.

**Speculative decoding** verifies several proposed tokens in one pass, so the expensive weight read yields more than one token.

**Multi-GPU** splits a model either sideways — every GPU holds part of every layer and they work on the same token together — or lengthways, with each GPU holding a range of layers and requests flowing through as a pipeline. The first reduces latency and needs fast interconnect; the second scales capacity and introduces pipeline bubbles.

## What to take away

One idea runs through all of it: **keep the GPU from waiting.**

Waiting for the CPU to launch the next kernel, waiting for values to come back from memory that never needed to leave, waiting for a batch slot that a finished request is still holding. None of those are arithmetic problems, and all of them are recovered by deciding the shape of the computation before it runs — which is what you are buying, and the inflexibility is what you are paying.
