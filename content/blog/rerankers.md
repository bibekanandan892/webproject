---
title: "Rerankers"
date: "2026-09-11T11:40"
category: "AI"
tags: ["reranking", "retrieval", "rag", "cross-encoder", "search"]
summary: "Retrieval is fast because it never reads the question and the document together. A reranker does read them together, which is why it is better and why it can only be used on a shortlist."
draft: false
cover: "/blog/rerankers.svg"
---

A reranker takes a list of candidate documents and reorders them by how well they actually answer the question. It never searches, never adds anything, never invents. It only sorts what it was handed.

That sounds like a small job. It exists because the thing that produced the list was working under a constraint the reranker is not.

## The constraint

Search over a large corpus has to be fast, and fast means the documents were processed **before the question existed**.

An embedding-based retriever encodes each document into a vector in advance. When a question arrives it encodes that too and finds the nearest vectors. This works because the document's vector does not depend on the question — which is exactly what makes it possible to precompute, and exactly what limits it.

A document's embedding is a summary of the whole document, fixed in advance, made without knowing what would be asked. It captures roughly what the document is about. It cannot emphasise the one sentence that answers *this* question, because when it was made there was no question.

A keyword retriever has the analogous problem in a different form: it matches words, so it misses a document that says the right thing in different words, and matches one that uses the right words about something else.

## Reading both together

A reranker drops the constraint. It takes the question and one document as a **single input** and produces a relevance score.

Because it sees both at once, attention can run between them — this phrase in the question against that clause in the document. It can tell a document that mentions the topic from one that answers the question, which is precisely the distinction a precomputed summary cannot make.

The price is that nothing can be prepared in advance. The score depends on the pair, so it exists only once both halves are present.

| | over 1M documents, 1 query | over 1M documents, 1,000 queries |
| --- | --- | --- |
| bi-encoder (precomputable) | 1,000,001 encoder runs | 1,001,000 |
| cross-encoder (not) | 1,000,000 | **1,000,000,000** |

The first column is the corpus plus one run per query. The second is a multiplication — every query redoes the entire corpus.

## Which is why it goes second

At roughly 10 ms per pair:

| documents scored | time for one query |
| --- | --- |
| 10 | 100 ms |
| 100 | 1.0 s |
| 1,000 | 10.0 s |
| 1,000,000 | **2.8 hours** |

<figure>
<svg viewBox="0 0 560 220" width="560" role="img" aria-label="A pipeline narrowing from a million documents through a fast retriever to a hundred candidates, then through a slow reranker to five results." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 12px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<defs><marker id="rk" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--muted-foreground)"/></marker></defs>
<text class="hd" x="20" y="18">FAST AND ROUGH, THEN SLOW AND CAREFUL</text>
<rect x="30" y="46" width="120" height="110" rx="7" fill="color-mix(in srgb, var(--muted-foreground) 14%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 30%, transparent)"/>
<text class="b" x="90" y="96" text-anchor="middle">1,000,000</text>
<text class="l" x="90" y="114" text-anchor="middle">documents</text>
<path d="M156 101 H196" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.4" marker-end="url(#rk)"/>
<text class="l" x="176" y="92" text-anchor="middle">retriever</text>
<text class="l" x="176" y="122" text-anchor="middle">~ms</text>
<rect x="204" y="70" width="110" height="62" rx="7" fill="color-mix(in srgb, var(--primary) 18%, transparent)" stroke="color-mix(in srgb, var(--primary) 45%, transparent)"/>
<text class="b" x="259" y="100" text-anchor="middle">100</text>
<text class="l" x="259" y="118" text-anchor="middle">candidates</text>
<path d="M320 101 H360" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.4" marker-end="url(#rk)"/>
<text class="l" x="340" y="92" text-anchor="middle">reranker</text>
<text class="l" x="340" y="122" text-anchor="middle">~1 s</text>
<rect x="368" y="82" width="90" height="38" rx="7" fill="color-mix(in srgb, var(--primary) 34%, transparent)" stroke="color-mix(in srgb, var(--primary) 62%, transparent)"/>
<text class="b" x="413" y="106" text-anchor="middle">5</text>
<text class="l" x="30" y="182">the reranker on all million would take 2.8 hours per query</text>
<text class="l" x="30" y="200">on a hundred it takes about a second</text>
</svg>
<figcaption>Two stages exist because one model can be prepared in advance and the other cannot.</figcaption>
</figure>

So the pipeline is: a fast retriever narrows a million documents to a hundred, and a slow model reads all hundred properly and keeps the best five.

The retriever does not have to be right about the order. It only has to get the right documents *somewhere* in its hundred. That is a much easier requirement, and it is why a crude first stage paired with a good reranker beats a better first stage alone.

## The knob

How many candidates to rerank is the one parameter that matters.

Too few and the reranker cannot fix what the retriever missed — if the right document was at rank 150 and you rerank 100, no amount of careful reading recovers it. Too many and the latency grows linearly with no benefit, because the extra candidates were not relevant anyway.

A hundred to two hundred in, five to ten out is the usual range. The output number matters as well as the input: passing a model twenty documents when three were relevant buries the useful ones among distractors, and long contexts are read least reliably in the middle.

## In between

There is a middle design worth knowing about. Instead of one vector per document, keep one per token, precomputed. At query time, compare the question's tokens against the document's tokens directly.

The comparison is fine-grained, like a cross-encoder. The document side is still precomputed, like a bi-encoder. The cost is storage — hundreds of vectors per document rather than one — which is a real constraint at corpus scale, but it can be fast enough to serve as the retriever itself rather than only reordering someone else's shortlist.

## Why it matters more than it sounds

In a retrieval-augmented system the model can only answer from what it was given. A wrong document does not produce a hedged answer; it produces a confident answer about the wrong thing.

Reranking is where that gets caught, and it is often the cheapest available improvement — no retraining, no re-embedding the corpus, one component added between two existing ones.

## The short version

- A reranker reorders candidates; it never searches or adds.
- Retrieval is fast because documents are encoded before the question exists — which is also its limitation.
- A reranker reads the question and document together, so it can tell mentioning a topic from answering a question.
- That makes it impossible to precompute: 1,000 queries over 1M documents is a billion runs.
- At ~10 ms a pair, scoring a whole corpus per query is 2.8 hours; scoring a hundred is about a second.
- So the retriever only needs the right document somewhere in its shortlist, not at the top.
- Rerank 100–200, keep 5–10; anything the retriever missed entirely is unrecoverable.
- Late-interaction models keep per-token vectors precomputed, trading storage for precision.
