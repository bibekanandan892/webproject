---
title: "Cosine similarity"
date: "2026-10-15T13:00"
category: "AI"
tags: ["cosine-similarity", "embeddings", "vector-search", "rag", "fundamentals"]
summary: "Cosine similarity compares the direction of two vectors and ignores their length: (3, 4) and (6, 8) score exactly 1. In high dimensions, unrelated vectors score near 0 — random 768-dimensional vectors land within about ±0.037 — which is what makes a score of 0.4 meaningful."
draft: false
cover: "/blog/cosine-similarity.svg"
---

Embedding models turn text, images and other data into vectors so that similar things end up close together. "Close" needs a definition, and the one used almost everywhere — semantic search, RAG retrieval, deduplication, recommendation — is cosine similarity.

## The definition

Cosine similarity is the cosine of the angle between two vectors:

`cos(a, b) = (a · b) / (|a| × |b|)`

The dot product on top measures how much the vectors point the same way; dividing by both lengths removes the effect of how long they are. The result is always between −1 and 1.

| a | b | cosine | meaning |
| --- | --- | --- | --- |
| (3, 4) | (6, 8) | **1.000** | same direction |
| (3, 4) | (4, 3) | 0.960 | nearly the same |
| (3, 4) | (4, −3) | **0.000** | perpendicular — unrelated |
| (3, 4) | (−3, −4) | −1.000 | opposite |

Note the first row. (6, 8) is twice as long as (3, 4), but it points in exactly the same direction, so the similarity is a perfect 1. Cosine similarity is blind to length.

## Why ignore length?

In many embedding spaces, a vector's length carries information that is irrelevant to meaning — how long the text was, how frequent its words are, how confident the model was. Two passages about the same topic, one short and one long, should count as similar. Cosine similarity says they are; plain Euclidean distance would be thrown off by their different lengths.

Many embedding models normalise their outputs to length 1 anyway. For unit vectors, cosine similarity *is* the dot product, and ranking by cosine, by dot product, or by Euclidean distance all give the same order. That is why vector databases often just compute dot products on pre-normalised vectors: it is the same answer for less work.

## What the numbers mean in high dimensions

In two or three dimensions, two random directions are often fairly aligned. In hundreds of dimensions, they almost never are. Drawing pairs of random vectors and measuring their cosine:

| dimensions | typical spread of cosine between random vectors |
| --- | --- |
| 3 | ±0.570 |
| 100 | ±0.097 |
| 768 | **±0.037** |
| 4,096 | ±0.016 |

The spread is almost exactly `1 / √d`. In a 768-dimensional space, unrelated directions sit within a few hundredths of zero. That is why a cosine of 0.3 or 0.4 between two embeddings is a strong signal, not a weak one: it is ten standard deviations above chance.

It also means **cosine scores are not probabilities and are not comparable between models.** One embedding model's "similar" might be 0.8, another's 0.45, depending on how it spreads vectors through its space. Thresholds must be calibrated per model, on examples labelled relevant or not.

<figure>
<svg viewBox="0 0 560 260" width="560" role="img" aria-label="Vectors from an origin at different angles with their cosine values, and a bell curve of random-pair cosines that narrows as dimension rises from 3 to 768." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">ANGLE, NOT LENGTH</text>
<path d="M30 180 H250 M60 200 V40" stroke="var(--muted-foreground)" stroke-opacity="0.3"/>
<path d="M60 180 L108 116" stroke="var(--primary)" stroke-width="2.6"/>
<path d="M108 116 L156 52" stroke="var(--primary)" stroke-width="2.6" stroke-dasharray="4 3"/>
<text class="b" x="160" y="52">(6,8) · cos 1</text>
<text class="b" x="112" y="112">(3,4)</text>
<path d="M60 180 L124 132" stroke="var(--muted-foreground)" stroke-width="2"/>
<text class="l" x="128" y="140">(4,3) · 0.96</text>
<path d="M60 180 L100 210" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="2" stroke-dasharray="3 3"/>
<text class="l" x="106" y="206">(4,−3) · 0</text>
<text class="b" x="300" y="44">random pairs: cosine spread</text>
<path d="M300 180 H540 M420 60 V186" stroke="var(--muted-foreground)" stroke-opacity="0.3"/>
<path d="M300 172 C350 168 380 130 420 128 C460 130 490 168 540 172" stroke="var(--muted-foreground)" stroke-width="2" fill="none"/>
<text class="l" x="306" y="164">d = 3</text>
<path d="M300 180 C400 180 410 64 420 62 C430 64 440 180 540 180" stroke="var(--primary)" stroke-width="2.2" fill="none"/>
<text class="b" x="428" y="76">d = 768 · ±0.037</text>
<text class="l" x="300" y="196">−1</text><text class="l" x="416" y="196">0</text><text class="l" x="540" y="196" text-anchor="end">1</text>
<path d="M20 216 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="238">in high dimensions unrelated means ≈ 0, so modest scores carry real signal</text>
</svg>
<figcaption>Length is discarded; only direction counts. And in many dimensions, random directions are nearly perpendicular.</figcaption>
</figure>

## Using it well

**Normalise once, at index time.** Store unit-length vectors and compute dot products at query time. Comparing a query against a million 768-dimensional vectors is 768 million multiply-adds — trivial for a GPU, and vector indexes avoid most of it with approximate search.

**Embed queries and documents the way the model expects.** Many models use different prefixes or modes for queries and passages; mixing them up lowers every similarity and scrambles the ranking.

**Calibrate thresholds on labelled examples.** "Above 0.75 is a match" from one model's documentation means nothing for another.

**Do not compare scores across queries too literally.** A broad query's best match may score lower than a narrow query's worst. Rank within a query; use thresholds cautiously across them.

**Remember what it cannot see.** Cosine similarity measures topical closeness in the model's space. "The drug is safe" and "the drug is not safe" can be very close. Retrieval systems add keyword search and rerankers for exactly these cases.

## What to take away

Cosine similarity is the dot product of two vectors divided by both their lengths: it compares direction and ignores magnitude, so (3, 4) and (6, 8) score 1 and perpendicular vectors score 0. For unit vectors it equals the dot product, which is why systems normalise once and multiply thereafter.

In high dimensions, random vectors score within about ±1/√d of zero — ±0.037 at 768 dimensions — so moderate scores are meaningful, but only relative to the specific embedding model that produced them.
