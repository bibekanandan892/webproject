---
title: "Chunking strategies for RAG"
date: "2026-11-06T09:00"
category: "AI"
tags: ["rag", "chunking", "retrieval", "embeddings", "overlap"]
summary: "Chunk size is a trade between two failure rates that both scale as L/C: a 60-token fact is cut in half 23% of the time at 256-token chunks, and makes up only 23% of the chunk when it survives. Overlap is how you stop paying both."
draft: false
cover: "/blog/chunking-strategies-for-rag.svg"
---

Before a retrieval system can find anything, the documents have to be cut into pieces small enough to embed and cheap enough to put in a prompt. That cutting is chunking, and it fails in two opposite directions.

Cut too small and the answer gets split across two pieces, neither of which contains it. Cut too large and the answer is in there, diluted by everything around it — the embedding of the chunk is mostly an embedding of other things.

Both failures can be put in numbers, and they turn out to be the same number.

## Failure one: the boundary lands in the answer

Take a fact that occupies 60 tokens — a paragraph stating a refund policy, say. Split the document into fixed chunks of *C* tokens with no overlap. A boundary falls inside the fact whenever the fact's start lands in the last 59 positions of a chunk, so the chance it is cut is `(L − 1) / C`.

| chunk size | fact is split | context for top-5 |
| --- | --- | --- |
| 128 | **46.1%** | 640 tokens |
| 256 | 23.0% | 1,280 |
| 512 | 11.5% | 2,560 |
| 1,024 | 5.8% | 5,120 |

At 128-token chunks, nearly half of all 60-token facts are broken. No retriever can recover a sentence whose subject is in one chunk and whose number is in the next — each half embeds as something vaguer than the question.

## Failure two: the answer is a minority of its chunk

Now look at the chunk that does contain the whole fact. The embedding is a single vector for the entire chunk. If the fact is 60 tokens out of 1,024, the vector is about 94% *other material*.

| chunk size | share of chunk that is the fact |
| --- | --- |
| 128 | 46.9% |
| 256 | 23.4% |
| 512 | 11.7% |
| 1,024 | **5.9%** |

The second column of the first table and this column are nearly identical — both are roughly `L / C`. That is the trade in one line: **every halving of the chunk size halves the dilution and doubles the chance of a split.** There is no size that wins both.

<figure>
<svg viewBox="0 0 560 300" width="560" role="img" aria-label="Two lines against chunk size: the chance a fact is split falls as chunks grow; the share of the chunk that is relevant falls at the same rate." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">ONE RATIO, TWO FAILURES</text>
<text class="b" x="20" y="48">split risk — wants big chunks</text>
<g fill="var(--primary)" fill-opacity="0.75">
<rect x="20" y="58" width="230" height="16" rx="3"/>
<rect x="20" y="80" width="115" height="16" rx="3"/>
<rect x="20" y="102" width="57" height="16" rx="3"/>
<rect x="20" y="124" width="29" height="16" rx="3"/>
</g>
<text class="l" x="258" y="70">128 → 46.1%</text>
<text class="l" x="143" y="92">256 → 23.0%</text>
<text class="l" x="85" y="114">512 → 11.5%</text>
<text class="l" x="57" y="136">1,024 → 5.8%</text>
<text class="b" x="300" y="48">relevant share — wants small chunks</text>
<g fill="var(--muted-foreground)" fill-opacity="0.55">
<rect x="300" y="58" width="234" height="16" rx="3"/>
<rect x="300" y="80" width="117" height="16" rx="3"/>
<rect x="300" y="102" width="58" height="16" rx="3"/>
<rect x="300" y="124" width="29" height="16" rx="3"/>
</g>
<text class="l" x="425" y="92">23.4%</text>
<text class="l" x="366" y="114">11.7%</text>
<text class="l" x="337" y="136">5.9%</text>
<path d="M20 168 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="194">both are ≈ L / C, so no chunk size improves one without worsening the other</text>
<text class="l" x="20" y="216">overlap removes the split for any fact up to overlap + 1 tokens</text>
<text class="l" x="20" y="236">parent–child retrieval removes the dilution by returning more than it matched</text>
<text class="l" x="20" y="256">structure-aware splitting moves the boundaries to where meaning already breaks</text>
</svg>
<figcaption>The two curves fall together. Fixing one with chunk size alone breaks the other.</figcaption>
</figure>

## Overlap: buy out the split

Overlap repeats the last *O* tokens of each chunk at the start of the next. Any fact no longer than `O + 1` tokens now sits whole inside at least one chunk — the split probability for it drops to zero, whatever the chunk size.

It is not free. Each chunk now advances only `C − O` new tokens, so the index grows:

| chunk | overlap | index size | chunks for a 10M-token corpus |
| --- | --- | --- | --- |
| 256 | 0 | 1.00× | 39,062 |
| 256 | 32 | 1.14× | 44,643 |
| 256 | 64 | **1.33×** | 52,083 |
| 512 | 64 | 1.14× | 22,321 |
| 512 | 128 | 1.33× | 26,042 |

A 64-token overlap on 256-token chunks costs a third more vectors and protects every fact up to 65 tokens. That is usually a good trade: storage is cheap, and a missed answer is the most expensive outcome a RAG system has.

The practical rule is to size the overlap from the facts, not the chunks. If the things users ask about are two or three sentences long, overlap by two or three sentences.

## Parent–child: buy out the dilution

The second fix separates what you *match* from what you *return*.

Index small chunks — 128 tokens, so the fact dominates its embedding and matching is sharp. But store, with each one, a pointer to the larger section it came from. When a small chunk wins the search, hand the model the parent: the surrounding 1,024 tokens.

Matching sees the 46.9% column. The model sees the context it needs to read the answer correctly. The split risk of small chunks is handled by the overlap from the previous section, applied to the children.

## Structure-aware: move the boundaries

Both fixes so far accept that boundaries fall at arbitrary token counts. Better is to put them where the document already breaks: headings, list items, table rows, function definitions.

A section heading is an almost free signal. Splitting on it means a chunk is about one thing by construction, and the heading text itself can be prepended to every chunk beneath it — "Refunds › International orders" — so a chunk that says "within 30 days" still embeds as being about refunds.

Semantic chunking goes one step further: embed each sentence, and start a new chunk wherever the similarity between neighbouring sentences drops sharply. It costs an embedding call per sentence at indexing time and works best on prose without headings — transcripts, emails, long articles.

Tables and code need their own rules. A table cut between rows loses its header; repeat the header in every chunk. A function cut in the middle is useless; split on definitions.

## How to choose, in order

1. **Split on structure first.** Headings, sections, definitions. Most documents have more structure than a fixed splitter assumes.
2. **Cap the size.** Sections that are still too long get a size-based split, around 256–512 tokens.
3. **Overlap by one typical fact.** Sentences or tokens, whichever your facts are measured in.
4. **Prepend the path.** Title and headings above the chunk, so context survives the cut.
5. **Evaluate on real questions.** The right size depends on how long your answers are, and only a set of real questions with known answers tells you that.

## What to take away

Chunk size alone cannot be tuned to a good answer, because the split rate and the dilution rate are both about `L / C` and move in opposite directions.

Overlap removes the split at a cost of `C / (C − O)` in index size. Parent–child retrieval removes the dilution by matching small and returning large. Structural boundaries make both problems smaller before either fix is applied. A chunking strategy is those three things together, not a number.
