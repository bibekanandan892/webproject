---
title: "Prefill vs Decode"
date: "2026-09-11T18:40"
category: "AI"
tags: ["prefill", "decode", "latency", "ttft", "serving"]
summary: "Serving a model is two workloads wearing one name, and their metrics pull against each other. Time to first token is 1.5% of a long answer's duration and almost all of how responsive it feels."
draft: false
cover: "/blog/prefill-vs-decode.svg"
---

Answering one request involves two phases that look nothing alike.

**Prefill** reads the prompt. Every token is available at once, so the whole thing goes through the model in a single pass — thousands of tokens processed together — and produces exactly one output token.

**Decode** writes the answer. One token per pass, each pass seeing everything written so far, repeated until the model stops.

The bridge between them is the attention cache. Prefill fills it with keys and values for every prompt token; decode reads all of it and appends one entry per step. Without it, each new token would reprocess the entire sequence and the cost of an answer would grow with the square of its length.

Prefill is a wide, parallel, one-shot operation. Decode is a narrow, sequential, repeated one. Nearly everything confusing about serving latency comes from measuring them as if they were one thing.

## Two metrics, and which one matters

**Time to first token** is how long until anything appears. It is essentially prefill.

**Time per output token** is the gap between subsequent tokens. It is decode.

End-to-end duration is the first plus the second repeated. For a 480-token answer with a 320 ms first token and 22 ms per token after:

| | |
| --- | --- |
| time to first token | 320 ms |
| 479 further tokens at 22 ms | 10,538 ms |
| **end to end** | **10.9 s** |

Decode is **97.1%** of the total. Which means:

- Halving time to first token — a serious optimization — saves 160 ms, or **1.5%** of the duration.
- Shaving 2 ms off per-token time saves 958 ms, or **8.8%**.

And yet time to first token is what users describe as "fast" or "slow". Nobody experiences the 97%: once tokens are arriving faster than they read, the wait is over. The 3% is the entire perceived latency.

So the two metrics are not two views of one goal. They are separate goals, and improving one rarely helps the other.

## Where they collide

Worse: they actively fight, and the mechanism is worth seeing.

Forty users are decoding, one token every 25 ms. A new request arrives with a 4,000-token prompt. Prefilling it takes 143 ms of solid arithmetic — and during that time the GPU is not decoding.

Every one of those forty users gets a 143 ms gap in their stream: **5.7 missed tokens**, visible as a stutter. One person's fast first token was paid for by everyone else's smooth output.

The fix is to stop treating prefill as indivisible. **Chunked prefill** splits the prompt into pieces and interleaves them with decode steps:

| | unchunked | chunked at 512 |
| --- | --- | --- |
| worst gap in an existing stream | 143 ms | 43 ms |
| token rate during the prefill | 0/s | 23/s |
| new request's first token | 143 ms | 346 ms |

The new request waits 2.4× longer. In exchange, nobody's stream ever stalls for more than one slightly-longer step, and the stall is cut 3.3×.

That is the trade in its clearest form: you can have the best possible first token for one request, or predictable output for everyone, and the knob between them is the chunk size.

<figure>
<svg viewBox="0 0 560 290" width="560" role="img" aria-label="Two timelines of decode steps: one with a long prefill block creating a gap, one with the prefill split into chunks between steps." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">ONE BIG PREFILL, OR MANY SMALL ONES</text>
<text class="l" x="20" y="44">unchunked</text>
<g fill="color-mix(in srgb, var(--primary) 28%, transparent)" stroke="var(--primary)" stroke-opacity="0.55">
<rect x="20" y="54" width="22" height="24" rx="3"/><rect x="46" y="54" width="22" height="24" rx="3"/><rect x="72" y="54" width="22" height="24" rx="3"/>
</g>
<rect x="98" y="54" width="143" height="24" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 32%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 55%, transparent)"/>
<text class="l" x="112" y="71">prefill · 143 ms</text>
<g fill="color-mix(in srgb, var(--primary) 28%, transparent)" stroke="var(--primary)" stroke-opacity="0.55">
<rect x="245" y="54" width="22" height="24" rx="3"/><rect x="271" y="54" width="22" height="24" rx="3"/><rect x="297" y="54" width="22" height="24" rx="3"/><rect x="323" y="54" width="22" height="24" rx="3"/>
</g>
<text class="l" x="98" y="96">no tokens for anyone — 5.7 slots lost</text>
<text class="l" x="20" y="132">chunked</text>
<g>
<rect x="20" y="142" width="22" height="24" rx="3" fill="color-mix(in srgb, var(--primary) 28%, transparent)" stroke="var(--primary)" stroke-opacity="0.55"/>
<rect x="46" y="142" width="18" height="24" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 32%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 55%, transparent)"/>
<rect x="68" y="142" width="22" height="24" rx="3" fill="color-mix(in srgb, var(--primary) 28%, transparent)" stroke="var(--primary)" stroke-opacity="0.55"/>
<rect x="94" y="142" width="18" height="24" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 32%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 55%, transparent)"/>
<rect x="116" y="142" width="22" height="24" rx="3" fill="color-mix(in srgb, var(--primary) 28%, transparent)" stroke="var(--primary)" stroke-opacity="0.55"/>
<rect x="142" y="142" width="18" height="24" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 32%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 55%, transparent)"/>
<rect x="164" y="142" width="22" height="24" rx="3" fill="color-mix(in srgb, var(--primary) 28%, transparent)" stroke="var(--primary)" stroke-opacity="0.55"/>
<rect x="190" y="142" width="18" height="24" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 32%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 55%, transparent)"/>
<rect x="212" y="142" width="22" height="24" rx="3" fill="color-mix(in srgb, var(--primary) 28%, transparent)" stroke="var(--primary)" stroke-opacity="0.55"/>
<rect x="238" y="142" width="18" height="24" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 32%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 55%, transparent)"/>
<rect x="260" y="142" width="22" height="24" rx="3" fill="color-mix(in srgb, var(--primary) 28%, transparent)" stroke="var(--primary)" stroke-opacity="0.55"/>
<rect x="286" y="142" width="18" height="24" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 32%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 55%, transparent)"/>
<rect x="308" y="142" width="22" height="24" rx="3" fill="color-mix(in srgb, var(--primary) 28%, transparent)" stroke="var(--primary)" stroke-opacity="0.55"/>
<rect x="334" y="142" width="18" height="24" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 32%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 55%, transparent)"/>
<rect x="356" y="142" width="22" height="24" rx="3" fill="color-mix(in srgb, var(--primary) 28%, transparent)" stroke="var(--primary)" stroke-opacity="0.55"/>
<rect x="382" y="142" width="18" height="24" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 32%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 55%, transparent)"/>
</g>
<text class="b" x="20" y="184">a token every 43 ms, without interruption</text>
<path d="M20 202 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="l" x="20" y="226">shaded = a decode step for the whole batch · grey = prompt work</text>
<text class="b" x="20" y="248">the new request's first token: 143 ms becomes 346 ms</text>
<text class="l" x="20" y="268">the stall everyone else sees: 143 ms becomes 43 ms</text>
</svg>
<figcaption>Interleaving does not reduce the work. It changes who waits for it.</figcaption>
</figure>

## Which technique targets which

Once the phases are separate, every optimization has an obvious address:

- **Reusing a shared prompt prefix** removes prefill work outright — the only lever that reduces first-token time by orders of magnitude rather than percent.
- **Drafting several tokens and checking them in one pass** attacks decode, because the expensive step there is reading the weights, and one read can validate more than one token.
- **Smaller attention caches** are a decode concern: they raise how many sequences fit, which raises how many tokens come out per weight read.
- **Continuous admission and retirement of requests** helps both, by never leaving a batch slot idle.
- **Running the two phases on separate pools of hardware** is the logical conclusion at scale — one set of machines doing compute-heavy prefill, another doing bandwidth-heavy decode, so neither ever blocks the other.

That last one is the clearest statement of the whole idea. If the phases were similar, splitting the fleet would be pointless.

## What to take away

Measure them apart. A single average latency number blends a compute-bound one-shot operation with a bandwidth-bound loop, and the average tells you nothing about either.

And be clear which you are optimizing for. Time to first token is a small fraction of a long answer's duration and almost the whole of how fast it feels — so improving it is frequently the right call, and almost never for the reason the end-to-end number suggests.
