---
title: "KV cache compression"
date: "2026-11-06T09:20"
category: "AI"
tags: ["kv-cache", "inference", "quantization", "eviction", "memory"]
summary: "A 70B-class model stores 320 KB of keys and values per token — 10.74 GB for one 32k-token conversation, so 40 GB of free memory serves three. Quantizing and evicting the cache together takes that to 66, and the three methods that get there fail in different ways."
draft: false
cover: "/blog/kv-cache-compression.svg"
---

During generation, every token a model has seen leaves behind a key and a value at every layer. They are kept so the next token can attend to them without recomputing the whole sequence. That store is the KV cache, and on long contexts it, not the model weights, is what fills the GPU.

KV cache compression is the family of tricks for keeping less of it. There are three, and they trade different things.

## How big the cache is

For one token, the cache holds a key and a value, for every layer, for every key–value head, each a vector of the head dimension:

`bytes per token = 2 × layers × kv_heads × head_dim × bytes per number`

For a 70B-class model with grouped-query attention — 80 layers, 8 KV heads, 128 dimensions, 16-bit numbers:

`2 × 80 × 8 × 128 × 2 = 327,680 bytes` — **320 KB per token.**

| context | cache for one sequence |
| --- | --- |
| 8,192 | 2.68 GB |
| 32,768 | 10.74 GB |
| 131,072 | **42.95 GB** |

A single 131k-token conversation needs more cache memory than the free space on most accelerators once the weights are loaded. Suppose 40 GB remains after the weights. At 32k tokens per conversation, that is room for **three** at once. Throughput is decided by how many sequences can be batched, so the cache is setting the serving cost.

## Method one: store fewer bits

Keys and values are ordinary numbers and can be quantized like weights. Storing them in 8 bits instead of 16 nearly halves the cache; 4 bits nearly quarters it. "Nearly" because each small group of numbers also stores a scale factor — about half a bit of overhead per number at typical group sizes.

| format | per sequence at 32k | sequences in 40 GB | saving |
| --- | --- | --- | --- |
| fp16 | 10.74 GB | 3 | 1.00× |
| int8 | 5.70 GB | 7 | 1.88× |
| int4 | 3.02 GB | **13** | 3.56× |

Quantization touches every entry evenly, so it degrades nothing in particular. Keys are the more sensitive half: they decide *where* attention goes, and a small error there moves weight to the wrong token. Values only decide what is copied once attention has chosen. Many schemes therefore spend more bits, or finer groups, on keys.

## Method two: keep fewer tokens

Attention is not spread evenly. In a long sequence, a small set of tokens collects most of the attention weight in every step, and most tokens collect almost none. Eviction keeps the ones that matter and drops the rest:

- **Recent tokens** — the last few hundred are always kept; local context matters at every step.
- **Heavy hitters** — tokens that have accumulated the most attention so far are kept on the grounds that they will keep receiving it.
- **The first few tokens** — attention sinks, which absorb weight the softmax has nowhere else to put. Dropping them destabilises everything.

Keep 20% of the tokens and the cache is a fifth of the size: 2.15 GB per sequence, **18** sequences in 40 GB.

Eviction has a failure that quantization does not. A dropped token is gone. If the conversation later turns back to a detail from early on — a name, a number, a constraint stated once — the model attends to an approximation of a context that no longer contains it. Benchmarks of average quality hide this; "needle" retrieval tests expose it.

## Method three: store something smaller per token

The first two methods compress the cache after the architecture has decided what goes in it. The third changes the architecture.

Grouped-query attention is already one example: many query heads share a few KV heads, which is why the formula above has 8 KV heads rather than 64. Multi-head latent attention, used in the DeepSeek models, goes further. Instead of storing keys and values per head, it stores one compressed latent vector per token per layer and reconstructs keys and values from it when they are needed.

| per token, per layer | numbers stored |
| --- | --- |
| full multi-head (128 heads × 128 dims × K and V) | 32,768 |
| latent attention (512 latent + 64 positional) | **576** |

That is **57×** less, and it is learned during training rather than imposed afterwards — the model learns to put what it needs into the latent. The catch is that it cannot be applied to a model that was not trained for it.

<figure>
<svg viewBox="0 0 560 290" width="560" role="img" aria-label="Bar chart of concurrent 32k-token sequences in 40 GB under each compression method: fp16 3, int8 7, int4 13, eviction 18, int4 plus eviction 66." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">32K-TOKEN CONVERSATIONS IN 40 GB</text>
<text class="l" x="20" y="54">fp16</text><rect x="150" y="42" width="15" height="18" rx="3" fill="var(--muted-foreground)" fill-opacity="0.6"/><text class="l" x="172" y="55">3</text>
<text class="l" x="20" y="84">int8</text><rect x="150" y="72" width="35" height="18" rx="3" fill="var(--muted-foreground)" fill-opacity="0.6"/><text class="l" x="192" y="85">7</text>
<text class="l" x="20" y="114">int4</text><rect x="150" y="102" width="64" height="18" rx="3" fill="var(--muted-foreground)" fill-opacity="0.6"/><text class="l" x="221" y="115">13</text>
<text class="l" x="20" y="144">evict to 20%</text><rect x="150" y="132" width="89" height="18" rx="3" fill="var(--muted-foreground)" fill-opacity="0.6"/><text class="l" x="246" y="145">18</text>
<text class="b" x="20" y="174">int4 + evict</text><rect x="150" y="162" width="326" height="18" rx="3" fill="var(--primary)" fill-opacity="0.8"/><text class="b" x="484" y="175">66</text>
<path d="M20 200 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="224">the methods multiply because they remove different things</text>
<text class="l" x="20" y="244">quantization removes precision from every token</text>
<text class="l" x="20" y="262">eviction removes whole tokens — and what is evicted cannot be recalled</text>
</svg>
<figcaption>Bits per number and numbers per sequence are independent axes, so the savings compound.</figcaption>
</figure>

## They combine

Because the methods remove different things — precision, tokens, dimensions — they stack. 4-bit storage of a cache evicted to 20% is 0.60 GB per 32k sequence: **66** conversations in the space that held three, a 17.8× improvement.

How far to push depends on the workload. Chat with a short memory tolerates aggressive eviction. Long-document question answering, where the answer could be any sentence, wants quantization and little or no eviction. Code assistants sit in between: recent context dominates, but a definition from 20,000 tokens ago is sometimes exactly what is needed.

## What to take away

The cache costs `2 × layers × kv_heads × head_dim × bytes` per token — 320 KB for a 70B-class model — and at long contexts it, not the weights, sets how many requests a GPU can serve.

Quantization shrinks every entry and degrades evenly. Eviction drops whole tokens and degrades on exactly the questions that need them. Architectural compression like latent attention shrinks what is stored per token by up to 57× but must be trained in. The three multiply, which is how three concurrent conversations become sixty-six.
