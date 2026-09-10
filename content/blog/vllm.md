---
title: "vLLM"
date: "2026-09-11T14:20"
category: "AI"
tags: ["vllm", "paged-attention", "serving", "gpu-memory", "throughput"]
summary: "vLLM's central idea is to stop giving each request a contiguous slab of GPU memory and instead hand it small blocks through a lookup table — which removes the waste, and as a side effect makes sharing memory between requests almost free."
draft: false
cover: "/blog/vllm.svg"
---

vLLM is a serving engine. You give it a model and it answers many requests at once, as fast as the hardware allows.

Its main contribution is a memory-management idea, and the reason that matters is that on a serving GPU, memory is what decides how many people you can serve.

## Where the memory goes

The weights are fixed — load them once and they sit there. The part that grows is per request: while a model generates, it keeps a running set of attention keys and values for every token it has seen so far.

Call it 128 KB per token for a mid-sized model. That is small. It stops being small when you multiply it by tokens and by concurrent users.

The problem is that nobody knows how long an answer will be. It is generated one token at a time and finishes when the model decides to stop.

## The obvious approach, and what it costs

Since the length is unknown, the straightforward thing is to reserve for the worst case: give every request a contiguous slab big enough for the longest answer it could produce.

At 4,096 tokens that is 537 MB per request. With 66 GB free after the weights, the card holds 122 concurrent requests.

But a typical request uses about 400 tokens between prompt and answer. So **90.2% of every reservation is never touched** — held, unusable by anyone else, for the entire life of the request.

And it gets worse over time. Requests of different sizes come and go, leaving gaps in the middle of memory. A gap of 300 MB cannot host a 537 MB reservation, so it sits empty even though the total free memory is plentiful. The memory is there; it is just not in one piece.

## Blocks and a lookup table

vLLM does what operating systems do with RAM. Instead of one contiguous slab per request, it allocates small fixed-size **blocks** — 16 tokens each — and keeps a per-request table saying which physical blocks hold which positions.

A request starts with the blocks it needs right now. When it generates past the end of its last block, it is handed one more. It never reserves for a future it might not have.

Two things fall out immediately:

**Waste collapses.** A request using 400 tokens holds 25 blocks — 52.4 MB instead of 537 MB. The only waste left is the unused part of the final block, at most 15 tokens, averaging 2.00% of what the request holds. The card now fits **1,258 concurrent requests** instead of 122, a 10.3× increase.

**Fragmentation disappears.** Every free block is the same size and every request wants blocks of exactly that size, so any free block fits any request. There is no such thing as a gap too awkward to use.

<figure>
<svg viewBox="0 0 560 264" width="560" role="img" aria-label="Contiguous reservations leaving large unused tails and unusable gaps, compared with small uniform blocks handed out on demand through a table." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">RESERVE FOR THE WORST CASE, OR HAND OUT BLOCKS</text>
<text class="l" x="20" y="46">contiguous — shaded part is actually used</text>
<rect x="20" y="56" width="160" height="26" rx="3" fill="none" stroke="color-mix(in srgb, var(--muted-foreground) 45%, transparent)" stroke-dasharray="4 3"/>
<rect x="20" y="56" width="18" height="26" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 32%, transparent)"/>
<rect x="188" y="56" width="160" height="26" rx="3" fill="none" stroke="color-mix(in srgb, var(--muted-foreground) 45%, transparent)" stroke-dasharray="4 3"/>
<rect x="188" y="56" width="26" height="26" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 32%, transparent)"/>
<rect x="356" y="56" width="160" height="26" rx="3" fill="none" stroke="color-mix(in srgb, var(--muted-foreground) 45%, transparent)" stroke-dasharray="4 3"/>
<rect x="356" y="56" width="14" height="26" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 32%, transparent)"/>
<text class="l" x="20" y="100">90.2% reserved and never touched · gaps too small to reuse</text>
<path d="M20 118 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="l" x="20" y="146">paged — uniform blocks, taken as needed</text>
<g fill="color-mix(in srgb, var(--primary) 24%, transparent)" stroke="var(--primary)" stroke-opacity="0.55">
<rect x="20" y="156" width="24" height="26" rx="3"/><rect x="48" y="156" width="24" height="26" rx="3"/><rect x="76" y="156" width="24" height="26" rx="3"/><rect x="104" y="156" width="24" height="26" rx="3"/><rect x="132" y="156" width="24" height="26" rx="3"/><rect x="160" y="156" width="24" height="26" rx="3"/><rect x="188" y="156" width="24" height="26" rx="3"/><rect x="216" y="156" width="24" height="26" rx="3"/><rect x="244" y="156" width="24" height="26" rx="3"/><rect x="272" y="156" width="24" height="26" rx="3"/><rect x="300" y="156" width="24" height="26" rx="3"/><rect x="328" y="156" width="24" height="26" rx="3"/><rect x="356" y="156" width="24" height="26" rx="3"/><rect x="384" y="156" width="24" height="26" rx="3"/><rect x="412" y="156" width="24" height="26" rx="3"/><rect x="440" y="156" width="24" height="26" rx="3"/><rect x="468" y="156" width="24" height="26" rx="3"/><rect x="496" y="156" width="24" height="26" rx="3"/>
</g>
<text class="b" x="20" y="204">every free block fits every request — nothing is the wrong shape</text>
<text class="l" x="20" y="226">at most 15 unused tokens in the last block, 2.00% on average</text>
<text class="l" x="20" y="244">122 concurrent requests becomes 1,258</text>
</svg>
<figcaption>The table between the request and the blocks is what makes the physical layout irrelevant.</figcaption>
</figure>

## The part that is easy to miss

That table is an indirection layer, and indirection lets two requests point at the same block.

Ten requests sharing the same long system instruction do not each need their own copy of it. They point at the same blocks, and the engine counts how many references each block has. When a request writes past the shared region it gets fresh blocks of its own; the shared ones stay untouched. Copy-on-write, applied to attention state.

The saving is not marginal. Twelve requests sharing an 1,800-token prefix would hold 2.83 GB as separate copies, or 0.236 GB shared — freeing 2.60 GB, which is another 49 requests the card can host.

The same mechanism covers sampling several continuations of one prompt: they share every block up to the point where they diverge, and only branch after it.

None of this is possible with contiguous reservations. Two requests cannot share half of a slab.

## Keeping the batch full

Memory decides how many requests *can* run. Scheduling decides how many actually are.

Requests in a group finish at wildly different times — one stops after 30 tokens, another runs to 900. If the group is fixed, the short ones leave their slots empty and the GPU spends most of the run at a fraction of the batch it paid for.

vLLM admits and retires requests at every generation step instead. A finished request's blocks are returned immediately and a waiting request takes its place on the next step. The batch stays as full as memory permits, continuously.

This works *because* of the block allocator. Adding a request mid-flight means finding memory for it right now, which is trivial when the unit of allocation is a 16-token block and impossible when it is a 537 MB contiguous slab.

## What you get

The interface is an HTTP server speaking the widely used chat-completions shape, so client code does not change. Behind it, the throughput difference comes from the same place the memory savings do: more requests resident, and the batch never running half-empty.

## What to take away

The insight is not really about attention. It is that reserving memory for a length you cannot predict is a bad trade, and that a table between logical positions and physical storage removes the need to predict.

Everything else — the sharing, the copy-on-write, the ability to admit a request mid-batch — follows from having that table.
