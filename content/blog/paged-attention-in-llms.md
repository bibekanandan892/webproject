---
title: "Paged attention in LLMs"
date: "2026-09-07T21:03"
category: "AI"
tags: ["llm", "inference", "paged-attention", "memory"]
summary: "Serving an LLM means reserving memory for a reply before you know how long it will be. Paged attention stops that reservation from wasting most of the GPU."
draft: false
cover: "/blog/paged-attention-in-llms.svg"
---

Paged attention is a way of storing an LLM's KV cache in small fixed-size blocks instead of one long, unbroken stretch of memory. It exists because the unbroken version wastes an enormous amount of GPU memory, which caps how many people you can serve at once.

## The cache being stored

While a model generates, it keeps the keys and values of every token it has seen so far. That store is the KV cache, and it is what lets the model avoid recomputing the same vectors on every step.

The cache grows by one token's worth of keys and values each step, and it lives in GPU memory for as long as the request does. Fitting more requests on a GPU is mostly a question of fitting more of these caches.

## Why the memory gets wasted

Here is the awkward part: when a request arrives, nobody knows how long the reply will be. It could be 12 tokens or 900.

The simple approach is to reserve enough room for the longest reply you allow. If your limit is 2,048 tokens, every request gets 2,048 slots reserved up front, in one continuous run.

That produces two kinds of waste.

**Waste inside the reservation.** A request that answers in 60 tokens still holds all 2,048 slots. The other 1,988 sit reserved and unused for the whole request. Nothing else can touch them.

**Waste between reservations.** Because each reservation has to be one continuous run, free memory left between finished requests is often unusable. You might have three free gaps of 8, 6 and 10 slots — 24 slots free in total — and still be unable to admit a request needing 20 in a row. The memory is there. It just isn't in one piece.

## The fix: stop demanding one continuous run

Paged attention borrows an old operating-system idea. Instead of one long reservation, the cache is cut into small blocks of a fixed size, and those blocks do not have to sit next to each other.

A request takes a block when it needs one. When that block fills up, it takes another from wherever there is space.

Think of a car park with numbered bays. Rather than roping off a whole row for a group that might not turn up in full, you hand out single bays as cars arrive and write down the numbers. The cars end up scattered. It does not matter, because the list tells you where each one is.

## A worked example

Take a reply that comes out 14 tokens long:

> Rain started just as the match reached its final over and everyone ran inside

Reserving for a 32-token maximum, and then paging the same reply into blocks of 5:

<figure>
<svg viewBox="0 0 720 196" width="720" role="img" aria-label="A contiguous reservation of 32 slots holding 14 tokens and wasting 18, compared with three blocks of five slots holding the same 14 tokens and wasting one." xmlns="http://www.w3.org/2000/svg">
<style>.h{font:600 12px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.06em}.n{font:500 12px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="h" x="4" y="16">ONE CONTIGUOUS RESERVATION</text>
<rect x="4" y="28" width="18" height="18" rx="3" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="color-mix(in srgb, var(--primary) 50%, transparent)"/>
<rect x="25" y="28" width="18" height="18" rx="3" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="color-mix(in srgb, var(--primary) 50%, transparent)"/>
<rect x="46" y="28" width="18" height="18" rx="3" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="color-mix(in srgb, var(--primary) 50%, transparent)"/>
<rect x="67" y="28" width="18" height="18" rx="3" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="color-mix(in srgb, var(--primary) 50%, transparent)"/>
<rect x="88" y="28" width="18" height="18" rx="3" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="color-mix(in srgb, var(--primary) 50%, transparent)"/>
<rect x="109" y="28" width="18" height="18" rx="3" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="color-mix(in srgb, var(--primary) 50%, transparent)"/>
<rect x="130" y="28" width="18" height="18" rx="3" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="color-mix(in srgb, var(--primary) 50%, transparent)"/>
<rect x="151" y="28" width="18" height="18" rx="3" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="color-mix(in srgb, var(--primary) 50%, transparent)"/>
<rect x="172" y="28" width="18" height="18" rx="3" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="color-mix(in srgb, var(--primary) 50%, transparent)"/>
<rect x="193" y="28" width="18" height="18" rx="3" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="color-mix(in srgb, var(--primary) 50%, transparent)"/>
<rect x="214" y="28" width="18" height="18" rx="3" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="color-mix(in srgb, var(--primary) 50%, transparent)"/>
<rect x="235" y="28" width="18" height="18" rx="3" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="color-mix(in srgb, var(--primary) 50%, transparent)"/>
<rect x="256" y="28" width="18" height="18" rx="3" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="color-mix(in srgb, var(--primary) 50%, transparent)"/>
<rect x="277" y="28" width="18" height="18" rx="3" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="color-mix(in srgb, var(--primary) 50%, transparent)"/>
<rect x="298" y="28" width="18" height="18" rx="3" fill="var(--secondary)" stroke="var(--border)"/>
<rect x="319" y="28" width="18" height="18" rx="3" fill="var(--secondary)" stroke="var(--border)"/>
<rect x="340" y="28" width="18" height="18" rx="3" fill="var(--secondary)" stroke="var(--border)"/>
<rect x="361" y="28" width="18" height="18" rx="3" fill="var(--secondary)" stroke="var(--border)"/>
<rect x="382" y="28" width="18" height="18" rx="3" fill="var(--secondary)" stroke="var(--border)"/>
<rect x="403" y="28" width="18" height="18" rx="3" fill="var(--secondary)" stroke="var(--border)"/>
<rect x="424" y="28" width="18" height="18" rx="3" fill="var(--secondary)" stroke="var(--border)"/>
<rect x="445" y="28" width="18" height="18" rx="3" fill="var(--secondary)" stroke="var(--border)"/>
<rect x="466" y="28" width="18" height="18" rx="3" fill="var(--secondary)" stroke="var(--border)"/>
<rect x="487" y="28" width="18" height="18" rx="3" fill="var(--secondary)" stroke="var(--border)"/>
<rect x="508" y="28" width="18" height="18" rx="3" fill="var(--secondary)" stroke="var(--border)"/>
<rect x="529" y="28" width="18" height="18" rx="3" fill="var(--secondary)" stroke="var(--border)"/>
<rect x="550" y="28" width="18" height="18" rx="3" fill="var(--secondary)" stroke="var(--border)"/>
<rect x="571" y="28" width="18" height="18" rx="3" fill="var(--secondary)" stroke="var(--border)"/>
<rect x="592" y="28" width="18" height="18" rx="3" fill="var(--secondary)" stroke="var(--border)"/>
<rect x="613" y="28" width="18" height="18" rx="3" fill="var(--secondary)" stroke="var(--border)"/>
<rect x="634" y="28" width="18" height="18" rx="3" fill="var(--secondary)" stroke="var(--border)"/>
<rect x="655" y="28" width="18" height="18" rx="3" fill="var(--secondary)" stroke="var(--border)"/>
<text class="n" x="4" y="66">32 slots reserved &#183; 14 used &#183; <tspan fill="var(--destructive)">18 wasted</tspan></text>
<text class="h" x="4" y="116">PAGED INTO BLOCKS OF 5</text>
<rect x="4" y="128" width="18" height="18" rx="3" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="color-mix(in srgb, var(--primary) 50%, transparent)"/>
<rect x="25" y="128" width="18" height="18" rx="3" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="color-mix(in srgb, var(--primary) 50%, transparent)"/>
<rect x="46" y="128" width="18" height="18" rx="3" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="color-mix(in srgb, var(--primary) 50%, transparent)"/>
<rect x="67" y="128" width="18" height="18" rx="3" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="color-mix(in srgb, var(--primary) 50%, transparent)"/>
<rect x="88" y="128" width="18" height="18" rx="3" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="color-mix(in srgb, var(--primary) 50%, transparent)"/>
<text class="n" x="4" y="161">block 0</text>
<rect x="132" y="128" width="18" height="18" rx="3" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="color-mix(in srgb, var(--primary) 50%, transparent)"/>
<rect x="153" y="128" width="18" height="18" rx="3" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="color-mix(in srgb, var(--primary) 50%, transparent)"/>
<rect x="174" y="128" width="18" height="18" rx="3" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="color-mix(in srgb, var(--primary) 50%, transparent)"/>
<rect x="195" y="128" width="18" height="18" rx="3" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="color-mix(in srgb, var(--primary) 50%, transparent)"/>
<rect x="216" y="128" width="18" height="18" rx="3" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="color-mix(in srgb, var(--primary) 50%, transparent)"/>
<text class="n" x="132" y="161">block 1</text>
<rect x="260" y="128" width="18" height="18" rx="3" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="color-mix(in srgb, var(--primary) 50%, transparent)"/>
<rect x="281" y="128" width="18" height="18" rx="3" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="color-mix(in srgb, var(--primary) 50%, transparent)"/>
<rect x="302" y="128" width="18" height="18" rx="3" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="color-mix(in srgb, var(--primary) 50%, transparent)"/>
<rect x="323" y="128" width="18" height="18" rx="3" fill="color-mix(in srgb, var(--primary) 22%, transparent)" stroke="color-mix(in srgb, var(--primary) 50%, transparent)"/>
<rect x="344" y="128" width="18" height="18" rx="3" fill="var(--secondary)" stroke="var(--border)"/>
<text class="n" x="260" y="161">block 2</text>
<text class="n" x="4" y="190">15 slots used &#183; 14 filled &#183; <tspan fill="var(--primary)">1 wasted</tspan></text>
</svg>
<figcaption>Filled = a token. Empty = a reserved slot doing nothing.</figcaption>
</figure>

Reserved as one run, 18 of the 32 slots are wasted. Paged into blocks of 5, the reply needs three blocks — 15 slots — and wastes exactly one, in the tail of the last block.

| | slots held | used | wasted |
| --- | --- | --- | --- |
| one contiguous reservation | 32 | 14 | 18 |
| three blocks of 5 | 15 | 14 | 1 |

The three blocks are filled like this:

| block | tokens |
| --- | --- |
| 0 | `Rain` `started` `just` `as` `the` |
| 1 | `match` `reached` `its` `final` `over` |
| 2 | `and` `everyone` `ran` `inside` — |

## Keeping track: the block table

Once blocks are scattered, something has to remember where they are. That is the block table.

Each request gets one. It maps the block's position in the sequence — block 0, block 1, block 2 — to wherever that block physically sits in memory. When attention needs the keys and values for earlier tokens, it reads the table and follows it to each block in turn.

The sequence stays in order from the model's point of view. Only the physical layout is scattered.

## Why this helps so much

Both kinds of waste mostly disappear.

Waste inside a request drops to whatever is left over in its final block. With blocks of 5, that is at most 4 slots per request, no matter how long the reply is — instead of hundreds.

Waste between requests disappears too. Every block is the same size, so any free block fits any request. There is no such thing as a gap that is the wrong shape.

The result is that far more requests fit in the same GPU memory, which is exactly what decides how many users a server can handle at once.

## Sharing blocks

There is a bonus. Two requests that begin with the same tokens can point at the same physical blocks from their own block tables.

This happens whenever you generate several candidate replies for one prompt, as with parallel sampling or beam search. The shared prefix is stored once and read by all of them. Each request keeps its own table, so they stay independent — they just stop paying for duplicate copies of identical data.

## The short version

- The KV cache holds the keys and values of every token so far, and it grows as the reply grows.
- Reply length is unknown up front, so the simple approach reserves the maximum in one continuous run.
- That wastes the unused tail of every reservation, and leaves free gaps too small or badly shaped to reuse.
- Paged attention splits the cache into fixed-size blocks that need not be adjacent.
- A block table records where each block sits, so the sequence still reads in order.
- Waste per request falls to the tail of the last block, and identical prefixes can share blocks outright.
