---
title: "Hybrid Search"
date: "2026-09-11T19:20"
category: "AI"
tags: ["hybrid-search", "bm25", "rrf", "retrieval", "ranking"]
summary: "Keyword and vector search fail on opposite queries, so run both. The hard part is combining two ranked lists whose scores are not on the same scale — and the constant in the standard fix quietly decides your ordering."
draft: false
cover: "/blog/hybrid-search.svg"
---

Two ways to find a document, with complementary blind spots.

**Keyword search** scores a document by which query words it contains, weighted by how rare those words are in the collection. It is exact. A part number, an error code, a person's name — it finds them because it is matching the literal string.

It also finds nothing when the document says the same thing in different words. Search for "card declined" and a page titled "payment rejected" does not appear at all. Not ranked low — absent.

**Vector search** compares meaning, so it handles that case. It also fails in the opposite direction: asked for an exact identifier, it returns things that are *about* identifiers, because a rare token contributes little to an embedding built to capture overall meaning.

Neither is a superset of the other, so the answer is to run both. That part is easy. Merging the results is not.

## Why you cannot just add the scores

Keyword scores are unbounded and query-dependent. The top score for one query might be 18.4, for another 3.2, for another 41.7 — it depends on how rare the words are and how long the documents are.

Cosine similarity is bounded in a narrow band, typically 0.7 to 0.9 for anything worth returning.

So "add them with weights" is not well defined. A weight that balances the two for one query over-weights the keyword side for the next. The usual patch is to normalise each list — map its best to 1 and worst to 0 — but that introduces a distortion of its own: the lowest-scoring document you retrieved gets exactly zero, whatever its actual score was, purely because it came last.

## Fusing ranks instead

**Reciprocal rank fusion** discards the scores and uses only positions. Each document gets `1 / (k + rank)` from every list it appears in, summed.

Take a query where the two searches disagree:

| | keyword list | vector list |
| --- | --- | --- |
| 1 | D1 (18.4) | D3 (0.81) |
| 2 | D2 (12.1) | D7 (0.79) |
| 3 | D3 (9.6) | D2 (0.76) |
| 4 | D7 (4.2) | D9 (0.71) |

D1 is the keyword search's clear favourite — a score of 18.4 against the runner-up's 12.1 — and the vector search does not return it at all.

Fused with the standard constant:

| | fused score |
| --- | --- |
| D3 | 0.03227 |
| D2 | 0.03200 |
| D7 | 0.03175 |
| **D1** | **0.01639** |
| D9 | 0.01563 |

D1 drops to fourth. Its enormous keyword score bought it nothing, because **appearing respectably in both lists beats topping one of them.** That is the rule RRF encodes, and it is usually the behaviour you want: agreement between two independent methods is stronger evidence than enthusiasm from one.

## The constant is not a detail

That `k` is doing more work than it looks. It sets how much the top of a list dominates the rest of it:

| k | rank 1 | rank 2 | gap |
| --- | --- | --- | --- |
| 0 | 1.00000 | 0.50000 | 100% |
| 1 | 0.50000 | 0.33333 | 50% |
| 10 | 0.09091 | 0.08333 | 9.1% |
| 60 | 0.01639 | 0.01613 | **1.6%** |

At k = 60, being first rather than second in a list is worth 1.6% — so ranks are nearly interchangeable and what matters is *how many lists you appear in*. At k = 0, being first is worth twice being second, and a single list's favourite can win outright.

Re-fuse the same two lists with k = 0 and the order changes: **D3, D1, D2, D7**. D1 climbs from fourth to second. Same data, same formula, different answer.

<figure>
<svg viewBox="0 0 560 296" width="560" role="img" aria-label="Two ranked lists feeding a fusion step, with the keyword list's top document falling to fourth in the fused result." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.x{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:color-mix(in srgb, var(--muted-foreground) 95%, transparent)}</style>
<defs><marker id="hs" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--muted-foreground)"/></marker></defs>
<text class="hd" x="20" y="18">AGREEMENT BEATS ENTHUSIASM</text>
<text class="l" x="20" y="44">keyword</text>
<g fill="color-mix(in srgb, var(--muted-foreground) 24%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 45%, transparent)">
<rect x="20" y="54" width="96" height="22" rx="3"/><rect x="20" y="80" width="96" height="22" rx="3"/><rect x="20" y="106" width="96" height="22" rx="3"/><rect x="20" y="132" width="96" height="22" rx="3"/>
</g>
<text class="x" x="34" y="69">D1 · 18.4</text>
<text class="x" x="34" y="95">D2 · 12.1</text>
<text class="x" x="34" y="121">D3 · 9.6</text>
<text class="x" x="34" y="147">D7 · 4.2</text>
<text class="l" x="150" y="44">vector</text>
<g fill="color-mix(in srgb, var(--muted-foreground) 24%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 45%, transparent)">
<rect x="150" y="54" width="96" height="22" rx="3"/><rect x="150" y="80" width="96" height="22" rx="3"/><rect x="150" y="106" width="96" height="22" rx="3"/><rect x="150" y="132" width="96" height="22" rx="3"/>
</g>
<text class="x" x="164" y="69">D3 · 0.81</text>
<text class="x" x="164" y="95">D7 · 0.79</text>
<text class="x" x="164" y="121">D2 · 0.76</text>
<text class="x" x="164" y="147">D9 · 0.71</text>
<path d="M256 100 H296" stroke="var(--muted-foreground)" stroke-opacity="0.55" stroke-width="1.4" marker-end="url(#hs)"/>
<text class="l" x="262" y="92">fuse</text>
<text class="b" x="320" y="44">fused, k = 60</text>
<g fill="color-mix(in srgb, var(--primary) 24%, transparent)" stroke="var(--primary)" stroke-opacity="0.55">
<rect x="320" y="54" width="120" height="22" rx="3"/><rect x="320" y="80" width="120" height="22" rx="3"/><rect x="320" y="106" width="120" height="22" rx="3"/>
</g>
<rect x="320" y="132" width="120" height="22" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 24%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 45%, transparent)"/>
<text class="b" x="334" y="69">D3 · in both</text>
<text class="b" x="334" y="95">D2 · in both</text>
<text class="b" x="334" y="121">D7 · in both</text>
<text class="x" x="334" y="147">D1 · one list</text>
<path d="M116 65 L316 143" stroke="color-mix(in srgb, var(--muted-foreground) 50%, transparent)" stroke-width="1.4" stroke-dasharray="4 4"/>
<text class="l" x="452" y="147">↓ 3 places</text>
<path d="M20 176 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="l" x="20" y="200">the fused score is 1/(k+rank), summed over the lists a document appears in</text>
<text class="b" x="20" y="224">at k = 60, rank 1 beats rank 2 by only 1.6%</text>
<text class="l" x="20" y="248">so being in two lists outweighs being first in one</text>
<text class="l" x="20" y="272">set k = 0 and D1 climbs back to second — same data, different order</text>
</svg>
<figcaption>The formula looks parameter-free. It is not: k decides whether one list can win alone.</figcaption>
</figure>

## Choosing between the two methods

**Rank fusion** needs no calibration, is immune to scale differences, and behaves sensibly on any query. Its cost is that it throws away magnitude — a document that matched overwhelmingly and one that matched adequately are treated as "first" either way.

**Weighted score fusion** keeps that magnitude and lets you deliberately favour one retriever. It requires normalisation, and normalisation has to be chosen carefully: min-max over the retrieved list makes the last result zero regardless of its real score, which is an artefact, not a judgement.

For most systems, rank fusion first. Move to weighted scores only when you have an evaluation set showing a specific query type where magnitude carries information the ranks lose.

## What to take away

Running both searches is the obvious half. The combination is where the behaviour actually lives.

And the standard combination has a knob in it that is easy to copy without reading: `k` is not a smoothing detail, it is the answer to "can one retriever's favourite win on its own?" Whatever you set it to, set it on purpose.
