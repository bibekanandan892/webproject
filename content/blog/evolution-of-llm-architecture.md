---
title: "The evolution of LLM architecture"
date: "2026-08-19T08:50"
category: "AI"
tags: ["transformer", "architecture", "gqa", "moe", "rope"]
summary: "The 2017 transformer block is still recognisable in every frontier model, but nearly every part of it has been replaced. Most of the replacements are about one thing: a GPT-3-style cache needs 4.72 MB per token, which at 128k tokens is 618 GB for a single conversation."
draft: false
cover: "/blog/evolution-of-llm-architecture.svg"
---

Put the 2017 transformer diagram next to the block inside a 2026 language model and they look like the same thing: attention, then a feed-forward network, with residual connections and normalisation around each. The skeleton has barely moved.

But take the block apart and almost every component has been swapped for something else. None of the changes is dramatic on its own. Together they are why models now read a hundred thousand tokens and run on hardware that would have been laughed at for that job a few years ago.

## The baseline: GPT-2 and GPT-3

The early decoder-only models fixed the basic recipe:

- **Learned absolute position embeddings** added to the input, one vector per position up to a maximum length.
- **LayerNorm**, applied before each sub-layer (pre-norm) from GPT-2 on, which made deep stacks stable to train.
- **GELU** activation in the feed-forward network.
- **Multi-head attention** with separate keys and values for every head.
- **Dense** layers: every parameter is used for every token.
- Context lengths of **1,024** and then **2,048** tokens.

The cost that would dominate everything later is visible in the attention design. With 96 layers, 96 heads of 128 dimensions, and 16-bit numbers, GPT-3's KV cache holds:

`2 × 96 × 96 × 128 × 2 bytes = 4.72 MB per token`

At its 2,048-token limit that is 9.7 GB per sequence — heavy but workable. At 131,072 tokens it would be **618 GB** — for one conversation.

## What changed, piece by piece

**Positions: absolute → RoPE.** Rotary position embeddings encode position by rotating the query and key vectors, so attention scores depend on the *distance* between tokens rather than their absolute indices. There is no table of positions to run off the end of, and with rescaling tricks a model can be extended to contexts far longer than it was trained on.

**Normalisation: LayerNorm → RMSNorm.** Dropping the mean-subtraction step and normalising only by the root mean square gives the same training stability with less work. A small saving, applied twice in every layer of every token.

**Activation: GELU → SwiGLU.** A gated feed-forward layer, where one projection decides how much of another passes through. It consistently trains to better quality at the same parameter count; the hidden width is shrunk to about two-thirds to keep the size constant.

**Attention heads: multi-head → grouped-query.** Many query heads share a small number of key–value heads. This is the change aimed directly at the cache. A 70B-class model with 80 layers but only 8 KV heads stores 0.33 MB per token — **14.4×** less than GPT-3 — and holds 131,072 tokens in 42.9 GB rather than 618. Multi-head latent attention pushes further, caching one compressed vector per token per layer.

**Feed-forward: dense → mixture of experts.** The feed-forward layer is split into many experts, and a router sends each token to a few of them. A model can hold 671B parameters and use 37B — **5.5%** — for any single token. Capacity grows; per-token compute does not.

**Context: 2k → 128k and beyond.** Made possible by RoPE (positions extrapolate), GQA and latent attention (the cache fits), and kernels like Flash Attention (the arithmetic fits in fast on-chip memory). The window grew 64× over GPT-3's.

<figure>
<svg viewBox="0 0 560 290" width="560" role="img" aria-label="A transformer block with each component labelled with its old and new version: absolute positions to RoPE, LayerNorm to RMSNorm, multi-head to grouped-query attention, GELU to SwiGLU, dense to mixture of experts." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">SAME SKELETON, NEW PARTS</text>
<rect x="190" y="34" width="180" height="200" rx="10" fill="none" stroke="var(--muted-foreground)" stroke-opacity="0.45"/>
<g fill="var(--primary)" fill-opacity="0.1" stroke="var(--primary)" stroke-opacity="0.7">
<rect x="210" y="48" width="140" height="26" rx="5"/><rect x="210" y="84" width="140" height="26" rx="5"/><rect x="210" y="120" width="140" height="26" rx="5"/><rect x="210" y="156" width="140" height="26" rx="5"/><rect x="210" y="192" width="140" height="26" rx="5"/>
</g>
<text class="b" x="280" y="65" text-anchor="middle">positions</text><text class="b" x="280" y="101" text-anchor="middle">norm</text><text class="b" x="280" y="137" text-anchor="middle">attention</text><text class="b" x="280" y="173" text-anchor="middle">activation</text><text class="b" x="280" y="209" text-anchor="middle">feed-forward</text>
<g text-anchor="end"><text class="l" x="180" y="65">absolute</text><text class="l" x="180" y="101">LayerNorm</text><text class="l" x="180" y="137">multi-head</text><text class="l" x="180" y="173">GELU</text><text class="l" x="180" y="209">dense</text></g>
<text class="b" x="380" y="65">RoPE</text><text class="b" x="380" y="101">RMSNorm</text><text class="b" x="380" y="137">GQA / latent — 14.4× less cache</text><text class="b" x="380" y="173">SwiGLU</text><text class="b" x="380" y="209">MoE — 5.5% active</text>
<text class="l" x="20" y="34">2019–2020</text><text class="b" x="540" y="34" text-anchor="end">2024–2026</text>
<path d="M20 252 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="274">context: 2,048 → 131,072 tokens, 618 GB of cache → 42.9 GB</text>
</svg>
<figcaption>Every box was replaced. The diagram did not change.</figcaption>
</figure>

## The thread running through it

Line the changes up and most of them answer the same question: how do you make long contexts and big models affordable *at inference time*?

- GQA and latent attention shrink the cache.
- MoE decouples capacity from per-token compute.
- RoPE makes long positions meaningful.
- Flash Attention and paged caches make long sequences fit in memory and run at speed.

The other changes — RMSNorm, SwiGLU, pre-norm — are about getting more quality from each unit of training compute and keeping very deep stacks stable.

What has *not* been displaced is the core: attention as the mechanism for mixing information between positions, and a per-position feed-forward network as the place knowledge is stored. Alternatives — state-space models, linear attention, diffusion language models — are active research and appear in hybrids, often interleaved with ordinary attention layers rather than replacing them.

## Where it seems to be going

Three directions are visible in recent releases:

1. **Hybrid layers.** Mixing a few full-attention layers with cheaper sliding-window or recurrent layers, keeping long-range recall while bounding most of the cost.
2. **Sparser everything.** More, smaller experts; sparse attention patterns that pick which earlier tokens to look at.
3. **Architecture for inference hardware.** Choosing dimensions, head counts and expert sizes to match what accelerators do well, since inference — not training — is now where most of the compute goes.

## What to take away

The 2017 block is still the skeleton, but its parts have been replaced one by one: RoPE for positions, RMSNorm for normalisation, SwiGLU for activations, grouped-query or latent attention for heads, mixture-of-experts for the feed-forward layer.

Most of those swaps are driven by the cost of serving long contexts. A GPT-3-style cache would need 618 GB for one 128k-token conversation; a modern grouped-query model needs 42.9 GB. That 14.4× is, more than any single headline feature, the reason long context became normal.
