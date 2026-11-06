---
title: "Contextual retrieval"
date: "2026-08-26T20:25"
category: "AI"
tags: ["rag", "retrieval", "bm25", "embeddings", "prompt-caching"]
summary: "A chunk that says \"revenue grew 3%\" does not say whose revenue or when. Contextual retrieval has a model write that missing context onto each chunk before indexing. Anthropic measured a 49% cut in retrieval failures — and prompt caching makes the preprocessing 6.2× cheaper."
draft: false
cover: "/blog/contextual-retrieval.svg"
---

Chunking a document for retrieval cuts each piece away from everything around it. Most of the time that is fine. Sometimes it removes exactly what the chunk needed to be found.

Take a chunk from a quarterly filing:

> *The company's revenue grew by 3% over the previous quarter.*

Which company? Which quarter? The filing said so on page one. The chunk does not. A user asking *"What was ACME's revenue growth in Q2 2023?"* shares almost no distinguishing words with it, and its embedding is a generic vector for "revenue grew". It may well lose to a chunk from a different company's filing that happens to name ACME.

Contextual retrieval fixes the chunk before it is indexed.

## The method

For each chunk, ask a language model to write a short piece of context situating it within the whole document, and prepend that to the chunk:

```text title="prompt, per chunk"
<document>
{the whole document}
</document>

Here is a chunk from that document:
<chunk>
{the chunk}
</chunk>

Write a short context (50–100 tokens) that situates this chunk within the
document, to improve search retrieval. Answer with the context only.
```

The output becomes part of the chunk:

> *This chunk is from ACME Corp's Q2 2023 quarterly report, in the section on financial results; the previous quarter's revenue was $314M.* **The company's revenue grew by 3% over the previous quarter.**

The contextualised chunk is then embedded *and* indexed for keyword search (BM25). Both indexes now contain "ACME", "Q2 2023" and "revenue". The question and the chunk finally share the words that matter.

## How much it helps

Anthropic published this technique with measurements across several datasets, using the failure rate of retrieval — how often the right chunk is not in the top 20:

| setup | top-20 failure rate | reduction |
| --- | --- | --- |
| ordinary embeddings | 5.7% | — |
| contextual embeddings | 3.7% | 35% |
| contextual embeddings + contextual BM25 | 2.9% | **49%** |
| … plus a reranker | 1.9% | **67%** |

The gains stack. Context helps embeddings; it helps keyword search even more, because BM25 is exactly the method that fails when a chunk lacks the literal words of the question. A reranker on top then reorders the larger, better candidate set.

<figure>
<svg viewBox="0 0 560 270" width="560" role="img" aria-label="A bare chunk and the same chunk with a prepended context line; below, bars for retrieval failure rates falling from 5.7% to 3.7%, 2.9% and 1.9%." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">GIVE THE CHUNK BACK ITS CONTEXT</text>
<rect x="20" y="32" width="250" height="44" rx="5" fill="none" stroke="var(--muted-foreground)" stroke-opacity="0.5"/>
<text class="l" x="30" y="58">"revenue grew by 3% …"</text>
<rect x="290" y="32" width="250" height="44" rx="5" fill="none" stroke="var(--primary)" stroke-width="1.5"/>
<rect x="290" y="32" width="250" height="18" rx="5" fill="var(--primary)" fill-opacity="0.15"/>
<text class="b" x="300" y="45">ACME · Q2 2023 · financial results</text>
<text class="l" x="300" y="68">"revenue grew by 3% …"</text>
<text class="l" x="20" y="112">top-20 failure rate</text>
<text class="l" x="20" y="140">embeddings</text><rect x="200" y="128" width="285" height="16" rx="3" fill="var(--muted-foreground)" fill-opacity="0.55"/><text class="l" x="492" y="141">5.7%</text>
<text class="l" x="20" y="164">+ context</text><rect x="200" y="152" width="185" height="16" rx="3" fill="var(--muted-foreground)" fill-opacity="0.55"/><text class="l" x="392" y="165">3.7%</text>
<text class="l" x="20" y="188">+ contextual BM25</text><rect x="200" y="176" width="145" height="16" rx="3" fill="var(--primary)" fill-opacity="0.7"/><text class="b" x="352" y="189">2.9%</text>
<text class="l" x="20" y="212">+ reranker</text><rect x="200" y="200" width="95" height="16" rx="3" fill="var(--primary)" fill-opacity="0.9"/><text class="b" x="302" y="213">1.9%</text>
<path d="M20 232 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="254">two-thirds fewer misses, from rewriting the index rather than the search</text>
</svg>
<figcaption>Failure rates as reported by Anthropic. The improvement comes from what is indexed, not how it is searched.</figcaption>
</figure>

## What it costs

The expensive part is obvious from the prompt: every chunk's call includes the *entire document*. A document of 8,000 tokens cut into 30 chunks of 256 tokens means 30 calls, each reading the whole document:

`30 × (8,000 + 256) = 247,680 input tokens` — to index one 8,000-token document.

This is where prompt caching turns the idea from expensive to cheap. The document is the same prefix in all 30 calls. With caching, it is processed once and then read from cache at a fraction of the price — around a tenth, depending on the provider. The effective cost becomes:

`8,000 + 30 × (800 + 256) = 39,680` input-token equivalents — **6.2× cheaper.**

Generation is small: 30 contexts of 50–100 tokens each. Indexing is a one-time cost per document, paid again only when the document changes.

The other costs are minor. The index grows by the size of the contexts — about 23% for 60-token contexts on 256-token chunks — and the context text appears in what is returned to the generation model, which is usually an advantage rather than a cost.

## When it helps most

**Documents where chunks depend on surrounding context.** Financial reports, legal agreements, technical manuals, meeting notes — anywhere a paragraph refers to "the company", "this clause", "the above".

**Collections of similar documents.** Many filings from different companies, many versions of the same contract. Without context, chunks from different documents look identical; with it, they carry their source.

**Systems using keyword search.** The largest gain in the table came from contextual BM25. If the retriever is embeddings only, the improvement is real but smaller.

It helps least on documents whose chunks already stand alone — FAQ entries, product descriptions, short self-contained articles.

## Practical notes

- **Keep the context short and factual.** It should name the document, the section and any entities the chunk refers to, not summarise or interpret.
- **Use a small, cheap model.** The task is extraction, not reasoning.
- **Evaluate on your own questions.** The published reductions are averages across datasets; the gain on yours depends on how much context your chunks lose.

## What to take away

Contextual retrieval asks a model to write 50–100 tokens of situating context for each chunk — which document, which section, which entities — and indexes the chunk with that context attached, in both the embedding index and the keyword index.

Anthropic's measurements put the reduction in retrieval failures at 49% for contextual embeddings plus contextual BM25, and 67% with a reranker. Prompt caching cuts the indexing cost about 6.2× by processing each document once for all of its chunks.
