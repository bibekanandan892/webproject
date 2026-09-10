---
title: "Grouped query attention"
date: "2026-09-10T10:00"
category: "AI"
tags: ["attention", "gqa", "kv-cache", "inference", "memory"]
summary: "Every attention head keeping its own keys and values makes the cache enormous. Grouped query attention has heads share them in small groups, cutting the memory by the size of the group."
draft: false
cover: "/blog/grouped-query-attention.svg"
---

Attention normally runs several heads side by side, and each head has its own queries, keys and values. Grouped query attention keeps the separate queries but has heads share keys and values in groups.

That one change is aimed at a single number: how much memory a model needs while it is generating.

## Why the cache grows

A model generates one token at a time, and each new token attends to everything before it. Rather than recompute the keys and values of all the earlier tokens at every step, they are worked out once and kept. That store is the KV cache.

It grows with the sequence, and it is multiplied by the number of heads, because every head has its own keys and values to keep.

Take a model with 8 heads, a head dimension of 128, and 32 layers, holding 8,000 tokens in fp16. Every token adds a key and a value per head per layer:

$$
2 \times 32 \text{ layers} \times 8 \text{ heads} \times 128 \times 2\text{ bytes} = 128 \text{ KiB per token}
$$

Over 8,000 tokens that is just under a gigabyte, for one conversation. Serving many at once, the cache — not the weights — is what fills the GPU.

## Two ways to shrink it

The heads are the multiplier, so the saving has to come from there.

The blunt version is to keep one set of keys and values for the whole layer and let every head share it. Each head still has its own queries, so it still asks its own question, but every head now looks at the same evidence. This is **multi-query attention**, and with 8 heads it cuts the cache eight-fold.

It also costs quality. What made the heads different was partly that they built different keys and values — different views of what each token offers. Collapse those into one and the heads lose much of their independence.

**Grouped query attention** is the version in between. Split the heads into groups, and give each group its own keys and values.

<figure>
<svg viewBox="0 0 660 180" width="660" role="img" aria-label="Three panels comparing attention schemes. In multi-head attention eight query heads each connect to their own key-value set. In grouped query attention the eight heads are split into two groups of four, each group sharing one key-value set. In multi-query attention all eight heads share a single key-value set." xmlns="http://www.w3.org/2000/svg">
<style>.pt{font:600 12px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.06em}.l{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.n{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}</style>
<text class="pt" x="110" y="18" text-anchor="middle">MHA</text>
<rect x="24" y="34" width="18" height="24" rx="3" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<rect x="46" y="34" width="18" height="24" rx="3" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<rect x="68" y="34" width="18" height="24" rx="3" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<rect x="90" y="34" width="18" height="24" rx="3" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<rect x="112" y="34" width="18" height="24" rx="3" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<rect x="134" y="34" width="18" height="24" rx="3" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<rect x="156" y="34" width="18" height="24" rx="3" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<rect x="178" y="34" width="18" height="24" rx="3" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<path d="M33 58 V96 M55 58 V96 M77 58 V96 M99 58 V96 M121 58 V96 M143 58 V96 M165 58 V96 M187 58 V96" stroke="color-mix(in srgb, var(--primary) 40%, transparent)" stroke-width="1.3"/>
<rect x="24" y="96" width="18" height="28" rx="3" fill="color-mix(in srgb, var(--primary) 10%, transparent)" stroke="color-mix(in srgb, var(--primary) 34%, transparent)"/>
<rect x="46" y="96" width="18" height="28" rx="3" fill="color-mix(in srgb, var(--primary) 10%, transparent)" stroke="color-mix(in srgb, var(--primary) 34%, transparent)"/>
<rect x="68" y="96" width="18" height="28" rx="3" fill="color-mix(in srgb, var(--primary) 10%, transparent)" stroke="color-mix(in srgb, var(--primary) 34%, transparent)"/>
<rect x="90" y="96" width="18" height="28" rx="3" fill="color-mix(in srgb, var(--primary) 10%, transparent)" stroke="color-mix(in srgb, var(--primary) 34%, transparent)"/>
<rect x="112" y="96" width="18" height="28" rx="3" fill="color-mix(in srgb, var(--primary) 10%, transparent)" stroke="color-mix(in srgb, var(--primary) 34%, transparent)"/>
<rect x="134" y="96" width="18" height="28" rx="3" fill="color-mix(in srgb, var(--primary) 10%, transparent)" stroke="color-mix(in srgb, var(--primary) 34%, transparent)"/>
<rect x="156" y="96" width="18" height="28" rx="3" fill="color-mix(in srgb, var(--primary) 10%, transparent)" stroke="color-mix(in srgb, var(--primary) 34%, transparent)"/>
<rect x="178" y="96" width="18" height="28" rx="3" fill="color-mix(in srgb, var(--primary) 10%, transparent)" stroke="color-mix(in srgb, var(--primary) 34%, transparent)"/>
<text class="l" x="110" y="142" text-anchor="middle">8 kv sets</text>
<text class="n" x="110" y="162" text-anchor="middle">1,000 MiB</text>
<text class="pt" x="330" y="18" text-anchor="middle">GQA</text>
<rect x="244" y="34" width="18" height="24" rx="3" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<rect x="266" y="34" width="18" height="24" rx="3" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<rect x="288" y="34" width="18" height="24" rx="3" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<rect x="310" y="34" width="18" height="24" rx="3" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<rect x="332" y="34" width="18" height="24" rx="3" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<rect x="354" y="34" width="18" height="24" rx="3" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<rect x="376" y="34" width="18" height="24" rx="3" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<rect x="398" y="34" width="18" height="24" rx="3" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<path d="M253 58 L286 96 M275 58 L286 96 M297 58 L286 96 M319 58 L286 96 M341 58 L374 96 M363 58 L374 96 M385 58 L374 96 M407 58 L374 96" stroke="color-mix(in srgb, var(--primary) 40%, transparent)" stroke-width="1.3"/>
<rect x="244" y="96" width="84" height="28" rx="4" fill="color-mix(in srgb, var(--primary) 14%, transparent)" stroke="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<rect x="332" y="96" width="84" height="28" rx="4" fill="color-mix(in srgb, var(--primary) 14%, transparent)" stroke="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<text class="l" x="330" y="142" text-anchor="middle">2 kv sets</text>
<text class="n" x="330" y="162" text-anchor="middle">250 MiB</text>
<text class="pt" x="550" y="18" text-anchor="middle">MQA</text>
<rect x="464" y="34" width="18" height="24" rx="3" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<rect x="486" y="34" width="18" height="24" rx="3" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<rect x="508" y="34" width="18" height="24" rx="3" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<rect x="530" y="34" width="18" height="24" rx="3" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<rect x="552" y="34" width="18" height="24" rx="3" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<rect x="574" y="34" width="18" height="24" rx="3" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<rect x="596" y="34" width="18" height="24" rx="3" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<rect x="618" y="34" width="18" height="24" rx="3" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<path d="M473 58 L550 96 M495 58 L550 96 M517 58 L550 96 M539 58 L550 96 M561 58 L550 96 M583 58 L550 96 M605 58 L550 96 M627 58 L550 96" stroke="color-mix(in srgb, var(--primary) 40%, transparent)" stroke-width="1.3"/>
<rect x="464" y="96" width="172" height="28" rx="4" fill="color-mix(in srgb, var(--primary) 14%, transparent)" stroke="color-mix(in srgb, var(--primary) 40%, transparent)"/>
<text class="l" x="550" y="142" text-anchor="middle">1 kv set</text>
<text class="n" x="550" y="162" text-anchor="middle">125 MiB</text>
</svg>
<figcaption>Same eight query heads throughout. Only the number of key-value sets below them changes.</figcaption>
</figure>

The queries stay separate in all three. That matters, because the query is what decides what a head goes looking for — it is where most of a head's individuality lives. Sharing the keys and values costs less than sharing the queries would.

## It is one dial, not three designs

Grouped query attention is not a third scheme sitting between two others. It is the general case, and the other two are its endpoints.

Set the number of groups equal to the number of heads and every head gets its own keys and values — that is ordinary multi-head attention. Set it to 1 and every head shares one set — that is multi-query attention. Anything between is what gets called GQA.

In code the dial usually appears as two numbers, `num_attention_heads` and `num_key_value_heads`, and the group size is just one divided by the other. A model with 32 query heads and 8 key-value heads runs 8 groups of 4.

## What it saves

Same model as before — 8 heads, head dimension 128, 32 layers, 8,000 tokens, fp16:

| | kv sets | per token | at 8,000 tokens | vs MHA |
| --- | --- | --- | --- | --- |
| multi-head | 8 | 128 KiB | 1,000 MiB | — |
| **grouped, 2 groups** | **2** | **32 KiB** | **250 MiB** | **4× smaller** |
| multi-query | 1 | 16 KiB | 125 MiB | 8× smaller |

The saving is exactly the group size. Four heads per group, four times less cache. Nothing subtler is going on.

What that buys is not really speed at the arithmetic — it is room. A smaller cache means longer contexts fit, and more conversations fit on one GPU at the same time. Generation is limited by moving memory around rather than by multiplying numbers, so a cache a quarter of the size is also read a quarter as fast.

## Converting a model that already exists

A model trained with full multi-head attention can be moved to grouped attention without starting again.

Take the heads destined for one group and average their key projection matrices into a single one. Do the same for the values. The model now has one key-value set per group, built out of what its heads already learned, and a short period of further training recovers most of what the averaging blurred.

That is cheap next to the original training run, which is a large part of why the technique spread quickly — existing models could adopt it rather than waiting for the next generation.

## The short version

- The KV cache is multiplied by the number of attention heads, and it is what fills memory during generation.
- Multi-query attention gives every head one shared set of keys and values — smallest cache, some quality lost.
- Grouped query attention splits heads into groups and gives each group its own set.
- Queries always stay separate, because that is where most of a head's individuality sits.
- Groups equal to heads is multi-head attention; one group is multi-query; it is a single dial.
- The cache shrinks by exactly the group size, which buys longer contexts and more concurrent users.
- An existing multi-head model can be converted by averaging key and value matrices within each group and briefly training on.
