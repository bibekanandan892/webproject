---
title: "Decoding ColBERT"
date: "2026-09-12T02:40"
category: "AI"
tags: ["colbert", "late-interaction", "maxsim", "retrieval", "ranking"]
summary: "Keeping one vector per token instead of one per passage lets every query term find its own best match. On a worked example that widened the gap between the right document and a plausible wrong one from 64% to 113%."
draft: false
cover: "/blog/decoding-colbert.svg"
---

Retrieval has two standard shapes and they sit at opposite extremes.

**Score the query and the document together.** Feed both into one model and let attention run between them. Accurate, and nothing can be prepared in advance — the score exists only once both halves are present, so every query re-reads the whole corpus. Published figures put a full pass at around 10,700 ms per query.

**Score them separately.** Encode every document into one vector ahead of time, encode the query into one vector, compare. Fast, because the corpus was processed before the query existed. The cost is that a passage has been compressed to a single point.

ColBERT is a third shape, and the idea is small: keep a vector **per token** rather than per passage, and defer the interaction to something cheap.

## What one vector per passage loses

A pooled vector is an average. Averaging a hundred token vectors produces something that represents the passage's overall drift and blurs anything specific in it.

Take a query of three terms — *refund*, *window*, *damaged* — against two candidates:

- **A:** "returns within thirty days if broken"
- **B:** "delivery takes three days by courier"

B is topically adjacent and answers nothing. A answers the question.

Pool everything to one vector each and compare:

| | score |
| --- | --- |
| query vs A | 0.932 |
| query vs B | 0.568 |

A wins by 64%, which is correct but not emphatic — and B scored 0.568 on a question it has nothing to say about, entirely because it shares the word *days* and a general customer-service register.

## MaxSim

ColBERT scores differently. Every query token is compared against every document token, each query token keeps its **best** match, and those bests are summed.

| query token | best match in A | score |
| --- | --- | --- |
| refund | returns | 0.992 |
| window | within | 0.998 |
| damaged | broken | 1.000 |
| | **total** | **2.990** |

| query token | best match in B | score |
| --- | --- | --- |
| refund | delivery | 0.234 |
| window | days | 0.997 |
| damaged | delivery | 0.171 |
| | **total** | **1.402** |

Now A wins by **113%** — the separation nearly doubled.

Look at where it came from. Under MaxSim, *refund* and *damaged* find nothing in B and contribute 0.234 and 0.171. Under pooling those same failures were averaged in with the one term that did match, and disappeared.

That is the mechanism: **each query term is scored on its own evidence.** A document that matches two terms out of three cannot hide the third behind an average.

<figure>
<svg viewBox="0 0 560 298" width="560" role="img" aria-label="Three query tokens each drawing a line to their best-matching document token, with the per-token scores summed, compared against a single pooled comparison." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">EVERY QUERY TERM KEEPS ITS OWN BEST MATCH</text>
<text class="l" x="20" y="44">query</text>
<g fill="color-mix(in srgb, var(--primary) 26%, transparent)" stroke="var(--primary)" stroke-opacity="0.6">
<rect x="20" y="54" width="76" height="22" rx="3"/><rect x="20" y="84" width="76" height="22" rx="3"/><rect x="20" y="114" width="76" height="22" rx="3"/>
</g>
<text class="b" x="30" y="69">refund</text>
<text class="b" x="30" y="99">window</text>
<text class="b" x="30" y="129">damaged</text>
<text class="l" x="250" y="44">document A</text>
<g fill="color-mix(in srgb, var(--muted-foreground) 20%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 40%, transparent)">
<rect x="250" y="48" width="78" height="20" rx="3"/><rect x="250" y="72" width="78" height="20" rx="3"/><rect x="250" y="96" width="78" height="20" rx="3"/><rect x="250" y="120" width="78" height="20" rx="3"/><rect x="250" y="144" width="78" height="20" rx="3"/>
</g>
<text class="l" x="258" y="62">returns</text>
<text class="l" x="258" y="86">within</text>
<text class="l" x="258" y="110">thirty</text>
<text class="l" x="258" y="134">days</text>
<text class="l" x="258" y="158">broken</text>
<path d="M100 65 L246 58" stroke="var(--primary)" stroke-opacity="0.8" stroke-width="2"/>
<path d="M100 95 L246 82" stroke="var(--primary)" stroke-opacity="0.8" stroke-width="2"/>
<path d="M100 125 L246 154" stroke="var(--primary)" stroke-opacity="0.8" stroke-width="2"/>
<g stroke="color-mix(in srgb, var(--muted-foreground) 30%, transparent)" stroke-width="1">
<path d="M100 65 L246 82"/><path d="M100 65 L246 106"/><path d="M100 65 L246 130"/><path d="M100 95 L246 130"/><path d="M100 125 L246 106"/>
</g>
<text class="b" x="344" y="62">0.992</text>
<text class="b" x="344" y="86">0.998</text>
<text class="b" x="344" y="158">1.000</text>
<text class="b" x="410" y="110">sum = 2.990</text>
<path d="M20 184 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="l" x="20" y="208">pooled to one vector each, the same pair scores 0.932 against 0.568</text>
<text class="b" x="20" y="230">MaxSim separates them by 113%, pooling by 64%</text>
<text class="l" x="20" y="252">because the two terms with no match in B are no longer averaged away</text>
<text class="l" x="20" y="276">the faint lines are the comparisons that lost</text>
</svg>
<figcaption>Interaction is deferred, not removed. It is just cheap enough to run at query time.</figcaption>
</figure>

## Why max and not average

A query term compared against every token of a document produces a list of similarities. Most are near zero — the document is mostly about other things.

| | |
| --- | --- |
| similarities for one query term | 0.96, 0.02, 0.61 |
| max | **0.96** |
| average | 0.53 |

Averaging punishes a document for containing other words, which is not a defect. The question is whether the term appears *somewhere*, and the maximum answers exactly that. The average answers "what fraction of this document is about this term", which is a different and less useful question.

## The trade: storage

Every token needs its own vector. At 128 dimensions and 16 bits, a 100-token passage costs:

| | |
| --- | --- |
| one pooled vector | 256 bytes |
| one vector per token | 25.0 KB |

**100× more storage**, which on a standard benchmark collection works out to roughly 154 GB where a single-vector index is a couple of gigabytes.

That is the whole price, and it is why the method took a while to become practical. The mitigations are the obvious ones: 128 dimensions rather than 768, aggressive quantization of each vector, and dropping vectors for tokens that carry no discriminative weight.

## Why it is fast anyway

The scoring itself is dot products and maximums — no model runs at query time. And the vectors are precomputed, so the expensive encoding happened offline.

At scale it works in two stages: approximate search over all the token vectors to gather candidate passages, then exact MaxSim over just those. Published results put it at around 61 ms per query with retrieval quality matching a full cross-encoder pass — **170× faster** for essentially the same measured quality.

## What it started

The pattern generalised. "Encode both sides into sets of vectors, defer a cheap interaction to query time" turned out to apply wherever one side can be precomputed and detail matters: image patches against text tokens, and multi-vector representations in retrieval systems generally.

## What to take away

The contribution is not a scoring formula. It is the observation that the choice was never *accurate versus precomputable* — you can precompute per-token representations and still let the query interact with them, as long as the interaction is simple enough to run on a shortlist.

You pay for it in disk. What you get back is that a query term which finds nothing cannot be hidden by one that does.
