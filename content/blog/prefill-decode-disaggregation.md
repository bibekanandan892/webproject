---
title: "Prefill-decode disaggregation"
date: "2026-08-07T15:40"
category: "AI"
tags: ["inference", "serving", "prefill", "decode", "latency"]
summary: "One 32k-token prompt arriving on a shared server freezes every running conversation for 1.16 seconds — 178 decode steps. Splitting prefill and decode onto separate machines removes the freeze, at the price of shipping a 10.74 GB cache across the network."
draft: false
cover: "/blog/prefill-decode-disaggregation.svg"
---

A language model answers a request in two phases. **Prefill** reads the whole prompt in one pass and builds the KV cache. **Decode** then produces the answer one token at a time, each step reading the cache and the weights again.

The two phases want opposite hardware. Prefill does a great deal of arithmetic on data it loads once: it is compute-bound. Decode does a little arithmetic on data it must load in full every step: it is memory-bandwidth-bound.

Prefill-decode disaggregation runs them on different machines. To see why anyone would accept the complexity, look at what happens when they share one.

## The stall

Take a 70B-parameter model served on 8 accelerators, running a batch of conversations that are all decoding.

One decode step has to stream the 140 GB of weights through the chips. At about 80% of 8 × 3.35 TB/s, that is **6.53 ms per step** — every conversation in the batch gets one token every 6.53 ms.

Now a new request arrives with a 32,768-token prompt. Its prefill is roughly `2 × parameters × tokens` operations:

`2 × 70e9 × 32,768 = 4.59 × 10¹⁵ FLOPs`

At half of peak throughput on 8 chips, that takes **1.16 seconds.** If the server runs that prefill in the same iteration as everyone's decode — which a simple scheduler does — every running conversation waits for it to finish.

1.16 seconds is **178 decode steps.** A user watching a reply stream at 150 tokens a second sees it stop dead for over a second, every time anyone else submits a long document.

<figure>
<svg viewBox="0 0 560 260" width="560" role="img" aria-label="Timeline of a shared server: a steady stream of short decode steps interrupted by one long prefill block, against two separate timelines where decode never stops." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">ONE SERVER VS TWO POOLS</text>
<text class="l" x="20" y="48">shared</text>
<g fill="var(--muted-foreground)" fill-opacity="0.55">
<rect x="100" y="38" width="8" height="16"/><rect x="111" y="38" width="8" height="16"/><rect x="122" y="38" width="8" height="16"/><rect x="133" y="38" width="8" height="16"/><rect x="144" y="38" width="8" height="16"/>
<rect x="395" y="38" width="8" height="16"/><rect x="406" y="38" width="8" height="16"/><rect x="417" y="38" width="8" height="16"/><rect x="428" y="38" width="8" height="16"/><rect x="439" y="38" width="8" height="16"/><rect x="450" y="38" width="8" height="16"/>
</g>
<rect x="155" y="38" width="236" height="16" fill="var(--primary)" fill-opacity="0.8"/>
<text class="b" x="273" y="74" text-anchor="middle">32k prefill — 1.16 s, 178 steps of nothing</text>
<text class="l" x="20" y="118">decode pool</text>
<g fill="var(--muted-foreground)" fill-opacity="0.55">
<rect x="100" y="108" width="8" height="16"/><rect x="111" y="108" width="8" height="16"/><rect x="122" y="108" width="8" height="16"/><rect x="133" y="108" width="8" height="16"/><rect x="144" y="108" width="8" height="16"/><rect x="155" y="108" width="8" height="16"/><rect x="166" y="108" width="8" height="16"/><rect x="177" y="108" width="8" height="16"/><rect x="188" y="108" width="8" height="16"/><rect x="199" y="108" width="8" height="16"/><rect x="210" y="108" width="8" height="16"/><rect x="221" y="108" width="8" height="16"/><rect x="232" y="108" width="8" height="16"/><rect x="243" y="108" width="8" height="16"/><rect x="254" y="108" width="8" height="16"/><rect x="265" y="108" width="8" height="16"/><rect x="276" y="108" width="8" height="16"/><rect x="287" y="108" width="8" height="16"/><rect x="298" y="108" width="8" height="16"/><rect x="309" y="108" width="8" height="16"/><rect x="320" y="108" width="8" height="16"/><rect x="331" y="108" width="8" height="16"/><rect x="342" y="108" width="8" height="16"/><rect x="353" y="108" width="8" height="16"/><rect x="364" y="108" width="8" height="16"/><rect x="375" y="108" width="8" height="16"/><rect x="386" y="108" width="8" height="16"/><rect x="397" y="108" width="8" height="16"/><rect x="408" y="108" width="8" height="16"/><rect x="419" y="108" width="8" height="16"/><rect x="430" y="108" width="8" height="16"/><rect x="441" y="108" width="8" height="16"/><rect x="452" y="108" width="8" height="16"/>
</g>
<text class="l" x="20" y="158">prefill pool</text>
<rect x="155" y="148" width="236" height="16" fill="var(--primary)" fill-opacity="0.8"/>
<rect x="391" y="148" width="44" height="16" fill="none" stroke="var(--primary)" stroke-dasharray="3 3"/>
<text class="l" x="440" y="160">ship cache</text>
<path d="M20 190 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="214">the decode pool never pauses; the new request pays the transfer</text>
<text class="l" x="20" y="234">10.74 GB of cache: 0.215 s on one 400 Gb/s link, 0.027 s on eight</text>
</svg>
<figcaption>Moving prefill elsewhere turns a stall shared by everyone into a delay paid by one request.</figcaption>
</figure>

## The split

In a disaggregated setup there are two pools of machines.

1. A request arrives at the **prefill pool**, which processes the prompt and produces the KV cache.
2. The cache is sent over the network to a machine in the **decode pool**.
3. The decode machine generates the reply, never interrupted by anyone's prefill.

Each pool can now be tuned for its phase. The prefill pool runs small batches of large prompts and keeps its arithmetic units busy. The decode pool runs large batches of short steps and keeps its memory bandwidth busy. They can even be different hardware, and they can be scaled independently — more prefill machines when users paste long documents, more decode machines when they ask for long answers.

## The price: moving the cache

The KV cache has to cross from one machine to the other. For the 70B-class model, 320 KB per token, a 32,768-token prompt produces 10.74 GB of cache.

| link | transfer time | as a share of the prefill |
| --- | --- | --- |
| one 400 Gb/s NIC | 0.215 s | 18.5% |
| eight 400 Gb/s NICs | 0.027 s | 2.3% |
| NVLink-class, 900 GB/s | 0.012 s | 1.0% |

On a single commodity link the new request's first token is delayed by a fifth on top of its prefill. With one fast link per accelerator, the cost is a rounding error. In practice the transfer is also pipelined: layer 1's cache is sent while layer 2 is still being computed, so much of it hides behind the prefill itself.

Note who pays. In the shared design, one long prompt delays *every* active conversation. In the split design, the transfer delays only the request that caused it. That is the right person to charge.

## The alternative: chunked prefill

The simpler fix keeps one pool and breaks the big prefill into pieces. Instead of 32,768 tokens in one iteration, process 2,048 per iteration, mixed in with everyone's decode step.

A 2,048-token chunk takes about 72.5 ms. Decoding users now see each step slow from 6.5 ms to around 79 ms for sixteen iterations instead of stopping for 1,160 ms. That is a slowdown rather than a freeze, and it needs no second pool and no network transfer.

Chunked prefill is usually where a deployment starts. Disaggregation is where it goes when the workload is large enough that two separately tuned pools beat one compromise — long prompts, strict latency targets on streaming, and enough traffic to keep both pools full.

## What to take away

Prefill is compute-bound and decode is bandwidth-bound, and when they share a machine the expensive one interrupts the cheap one: a 32k-token prompt costs every running conversation 1.16 seconds, or 178 tokens' worth of waiting.

Disaggregation puts them on separate pools so decode never stops, and charges the one request that caused the work for moving its cache — 0.2 seconds on one ordinary link, a few hundredths with fast interconnect. Chunked prefill is the cheaper halfway house: no freeze, just a slower stream while the big prompt is digested.
