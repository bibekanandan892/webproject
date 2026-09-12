---
title: "Semantic Search"
date: "2026-09-11T22:40"
category: "AI"
tags: ["semantic-search", "embeddings", "cosine-similarity", "chunking", "retrieval"]
summary: "Matching by meaning solves the vocabulary problem and creates a new one: one vector per chunk averages everything together, so a single distinguishing term contributes about 1/√n of the direction. At 200 tokens that is 7%."
draft: false
cover: "/blog/semantic-search.svg"
---

Keyword search matches words. Ask about "fixing my car" and a page titled "automobile repair guide" does not appear, because no word in the query appears in the document.

Semantic search fixes this by comparing *meaning*. Every document is turned into a vector by a model trained so that texts about similar things land near each other; the query is turned into a vector the same way; the nearest ones come back.

That works, and the way it works has a consequence that is rarely stated.

## One vector for the whole chunk

A chunk of text becomes a single fixed-length vector. However long the chunk, however many distinct things it mentions, the output is one point.

So the vector is a kind of average. And an average of many things is dominated by the bulk of them.

Quantifying it with vectors in 768 dimensions, averaged over 200 trials — a chunk of *n* tokens, then querying with exactly one of the terms in it:

| chunk length | match on one exact term | 1/√n | match on a topical query |
| --- | --- | --- | --- |
| 20 | 0.2230 | 0.2236 | 0.630 |
| 50 | 0.1415 | 0.1414 | 0.400 |
| 100 | 0.0962 | 0.1000 | 0.283 |
| 200 | **0.0709** | 0.0707 | 0.197 |
| 400 | 0.0512 | 0.0500 | 0.142 |

The measured values track **1/√n** almost exactly, which is what the geometry predicts. In a 200-token chunk, a single distinguishing term accounts for about **7%** of the chunk's direction.

That is the structural weakness. A document containing one crucial identifier — a part number, an error code, a policy name — has that identifier diluted into insignificance by the surrounding 199 tokens of ordinary prose. A query that *is* that identifier scores 0.07, while some unrelated chunk that happens to be broadly about the same topic scores 0.20 and wins.

Keyword search does not have this problem at all, and for the opposite reason: it scores a term by how rare it is in the collection, so a term appearing once in one document is the strongest possible signal rather than the weakest.

<figure>
<svg viewBox="0 0 560 292" width="560" role="img" aria-label="A curve showing that one term's contribution to a pooled embedding falls as one over the square root of chunk length, with keyword scoring drawn flat." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">ONE TERM'S SHARE OF A POOLED VECTOR</text>
<path d="M70 40 V190 H520" stroke="var(--muted-foreground)" stroke-opacity="0.35"/>
<text class="l" x="26" y="46">0.25</text>
<text class="l" x="34" y="118">0.12</text>
<text class="l" x="48" y="194">0</text>
<path d="M88 56 L115 105 L160 130 L250 148 L340 155 L430 160 L520 163" stroke="var(--primary)" stroke-width="2.4" fill="none"/>
<circle cx="88" cy="56" r="4" fill="var(--primary)"/>
<text class="b" x="98" y="50">0.223 at 20 tokens</text>
<circle cx="250" cy="148" r="4" fill="var(--primary)"/>
<text class="b" x="260" y="144">0.071 at 200 tokens</text>
<text class="l" x="70" y="210">0</text>
<text class="l" x="295" y="210" text-anchor="middle">250</text>
<text class="l" x="520" y="210" text-anchor="end">500 tokens per chunk</text>
<path d="M20 228 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="250">the curve is 1/√n — measured values match it to three decimals</text>
<text class="l" x="20" y="270">a keyword index scores the same term by its rarity, which does not decay</text>
</svg>
<figcaption>Longer chunks retrieve topics better and specifics worse, and the trade is not adjustable — it is arithmetic.</figcaption>
</figure>

## What this means for chunk size

The table above is the whole chunking debate in one place.

**Short chunks** keep specifics retrievable — halving a chunk from 200 tokens to 100 raises the single-term signal by √2 — and lose surrounding context, so a retrieved fragment may not carry enough to be useful on its own.

**Long chunks** preserve context and average specifics away.

There is no setting that is good at both, because the dilution is geometric rather than a tuning artefact. Which is why real systems stop trying: they index at more than one granularity, or they keep a keyword index alongside and merge the results, or they retrieve small and then expand to the surrounding region before sending it to a model.

## The parts that are straightforward

**The measure.** Cosine similarity — the angle between two vectors, from −1 to 1, ignoring length. Both vectors must come from the *same* model at the same version; a distance between vectors from two different models is a meaningless number, not a weak one.

**The storage.** Documents are embedded once, ahead of time, and kept in a vector store. Only the query is embedded at request time, which is what makes the search fast enough to be interactive.

**The scale.** Comparing against every stored vector is exact and too slow past a certain size, so production systems use approximate search: examine a promising neighbourhood rather than everything, accept an occasional miss, and get orders of magnitude more speed for it.

## What to take away

Semantic search solves vocabulary mismatch and introduces specificity loss. Both come from the same design: one vector standing in for a whole passage.

So the useful question when it disappoints is which of the two failures you are looking at. If the right document was never retrieved and it contained an exact term from the query, the embedding did not fail to understand — it averaged that term down to 7% and something blander outranked it. That is a job for a keyword index, not a better model.
