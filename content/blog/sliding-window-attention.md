---
title: "Sliding Window Attention"
date: "2026-09-12T07:20"
category: "AI"
tags: ["attention", "long-context", "kv-cache", "receptive-field", "efficiency"]
summary: "Limiting each token to a 4,096-position window cuts the attention cost 32× at 131k tokens — and cuts the memory a sequence holds from 17.18 GB to a fixed 537 MB, which is 3 concurrent requests becoming 122."
draft: false
cover: "/blog/sliding-window-attention.svg"
---

In ordinary attention every position looks at every earlier position. A sequence of *n* tokens produces *n²* pairs of comparisons, which is fine at a thousand tokens and ruinous at a hundred thousand.

Sliding window attention limits each position to a fixed number of recent ones. A window of 4,096 means position 90,000 looks at positions 85,905 through 90,000 and nothing before that.

## What that saves in arithmetic

| sequence length | full attention | windowed at 4,096 | ratio |
| --- | --- | --- | --- |
| 8,192 | 0.07B pairs | 0.03B | 2× |
| 32,768 | 1.07B | 0.13B | 8× |
| 131,072 | **17.18B** | **0.54B** | **32×** |

The cost stops being quadratic and becomes linear — `n × w` instead of `n²` — so the ratio is exactly `n / w` and grows without bound.

## What it saves in memory, which matters more

The arithmetic is the advertised benefit. The memory is the one that decides what you can deploy.

With full attention, every generated token adds a set of keys and values that must be kept for the rest of the sequence. At roughly 128 KB per token for a mid-sized model:

| sequence length | full attention | windowed | ratio |
| --- | --- | --- | --- |
| 8,192 | 1.07 GB | 537 MB | 2× |
| 32,768 | 4.29 GB | 537 MB | 8× |
| 131,072 | **17.18 GB** | **537 MB** | **32×** |

Look at the windowed column. It does not change. Past 4,096 tokens, positions falling out of the window are discarded, so the cache reaches a fixed size and stays there — **a sequence of any length costs 537 MB.**

Turn that into concurrency. On 66 GB of free GPU memory at a 131,072-token context:

| | concurrent sequences |
| --- | --- |
| full attention | **3** |
| 4,096-token window | **122** |

Three requests becoming a hundred and twenty-two. That is not an efficiency improvement; it is the difference between a demo and a service.

<figure>
<svg viewBox="0 0 560 314" width="560" role="img" aria-label="Two curves of cache size against sequence length: full attention rising without limit, windowed attention flat after the window size." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">THE WINDOWED CACHE STOPS GROWING</text>
<path d="M60 40 V190 H520" stroke="var(--muted-foreground)" stroke-opacity="0.35"/>
<text class="l" x="18" y="46">17.2 GB</text>
<text class="l" x="26" y="118">8.6 GB</text>
<text class="l" x="46" y="194">0</text>
<path d="M60 190 L175 152 L290 115 L405 77 L520 40" stroke="color-mix(in srgb, var(--muted-foreground) 80%, transparent)" stroke-width="2.4" fill="none"/>
<circle cx="520" cy="40" r="4.4" fill="var(--muted-foreground)"/>
<text class="l" x="330" y="64">full attention — 17.18 GB</text>
<path d="M60 190 L74 185 L520 185" stroke="var(--primary)" stroke-width="2.6" fill="none"/>
<circle cx="74" cy="185" r="4" fill="var(--primary)"/>
<text class="b" x="86" y="178">flat from 4,096 onward — 537 MB, whatever the length</text>
<text class="l" x="60" y="210">0</text>
<text class="l" x="290" y="210" text-anchor="middle">65,536</text>
<text class="l" x="520" y="210" text-anchor="end">131,072 tokens</text>
<path d="M20 228 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="252">on 66 GB: 3 concurrent sequences becomes 122</text>
<text class="l" x="20" y="274">because positions leaving the window are discarded rather than kept</text>
<text class="l" x="20" y="292">the arithmetic saving is 32×; the deployment saving is the same number</text>
</svg>
<figcaption>The flat line is the whole argument. Length stops being a memory variable.</figcaption>
</figure>

## Can it still see far?

Yes, indirectly, and the reach is exactly computable.

Layer 1 lets a token see 4,096 positions back. Layer 2's input at *that* position already summarises 4,096 before it, so layer 2 reaches 8,192. Stacking multiplies:

**receptive field = layers × window**

A 32-layer model with a 4,096 window can in principle propagate information across **131,072 tokens** — which is exactly the context length in the tables above, and not a coincidence.

But "in principle" is doing work. Information travelling *k* hops has been mixed with everything else at every hop. If each hop preserves a fraction of one specific signal:

| hops | signal remaining, r = 0.75 | r = 0.6 |
| --- | --- | --- |
| 1 | 75.0% | 60.0% |
| 2 | 56.3% | 36.0% |
| 4 | 31.6% | 13.0% |
| 8 | **10.0%** | 1.7% |
| 16 | 1.0% | 0.03% |

Eight hops — 32,768 tokens away — arrives at 10% strength in the optimistic case and 1.7% in the pessimistic one. The path exists; it is not the same as looking directly.

So the honest statement is: a windowed model has a long *reach* and a short *grip*. Something 100,000 tokens back is reachable and will not be attended to sharply.

## Which is why it is usually mixed

Few production models use a window everywhere. The common arrangement is to give most layers a window and a few layers full attention.

The full-attention layers provide the direct long-range paths — exact retrieval of a distant fact, with no hop attenuation. The windowed layers provide the cheap local mixing that most of the work actually needs. Since only a minority of layers keep a full cache, the memory stays close to the windowed figure.

That is a better design than either extreme, and it follows from the attenuation table: you need *some* direct paths, and you do not need thirty-two of them.

## What to take away

Two numbers, and they are the same number.

Windowing cuts attention cost by `n / w`, and it cuts the cache a sequence holds by the same factor — except the cache saving is better than it looks, because the windowed cache is *bounded* rather than merely smaller. Length stops being a variable in the memory budget.

What you give up is sharpness at distance, which decays with the number of hops rather than the number of tokens. Which is why a handful of full-attention layers is the arrangement that actually ships.
