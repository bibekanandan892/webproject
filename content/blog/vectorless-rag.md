---
title: "Vectorless RAG"
date: "2026-08-04T20:25"
category: "AI"
tags: ["rag", "retrieval", "reasoning", "document-tree", "long-documents"]
summary: "Instead of embedding chunks, give the model a table of contents and let it navigate. A 300-page report is answered by reading 2,320 tokens instead of 150,000 — but every level of the tree is a chance to take the wrong branch, and 95% per step is 85.7% after three."
draft: false
cover: "/blog/vectorless-rag.svg"
---

Ordinary RAG answers a question by turning it into a vector and fetching the chunks whose vectors are nearest. Vectorless RAG removes the vectors. The document is organised into a tree — chapters, sections, pages — and a language model reads its way down that tree, choosing a branch at each level, the way a person uses a table of contents.

No embedding model, no vector database, no chunking. The retrieval step is itself a sequence of reasoning calls.

It sounds like a regression. For a particular kind of document it is not.

## Why similarity is not relevance

Ask a vector index over an annual report: *"What was operating margin in the third quarter?"*

Every section that discusses margins is close to that question in embedding space — the CFO's letter, the risk factors, the segment analysis, last year's comparison, the glossary entry for "operating margin". The phrase that would actually decide the matter, *third quarter*, is a small part of the question's vector and an even smaller part of each chunk's.

The search returns five plausible chunks, ranked by how much they *sound like* the question. The one with the number may be sixth.

A person would not search this way. They would open the contents page, go to *Quarterly results*, then *Q3*, then the income statement. Each step uses the structure of the document, which an embedding throws away.

## How the navigation works

The document is first turned into a tree, once, at indexing time. Each node stores a title and a short summary — a sentence or two of what is underneath it.

Take a 300-page report: 12 chapters, about 5 sections each, about 5 pages per section. At query time:

1. The model reads the 12 chapter summaries and picks one.
2. It reads that chapter's 5 section summaries and picks one.
3. It reads that section's 5 page summaries and picks one or two.
4. It reads those pages in full and answers.

With summaries of 60 tokens and pages of 500:

| | tokens read |
| --- | --- |
| 12 chapter summaries | 720 |
| 5 section summaries | 300 |
| 5 page summaries | 300 |
| 2 full pages | 1,000 |
| **total** | **2,320** |
| the whole document | 150,000 |

That is a **65×** reduction against stuffing the document into context, with no index other than the tree itself — and the tree is something many documents already have in their headings.

<figure>
<svg viewBox="0 0 560 300" width="560" role="img" aria-label="A document tree three levels deep, with one highlighted path from root to a page and the per-level success rate multiplying along it." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">NAVIGATE, DON'T SEARCH</text>
<rect x="240" y="34" width="80" height="24" rx="5" fill="none" stroke="var(--primary)" stroke-width="1.6"/>
<text class="b" x="280" y="50" text-anchor="middle">report</text>
<g stroke="var(--muted-foreground)" stroke-opacity="0.4">
<path d="M280 58 L80 92"/><path d="M280 58 L180 92"/><path d="M280 58 L380 92"/><path d="M280 58 L480 92"/>
</g>
<path d="M280 58 L280 92" stroke="var(--primary)" stroke-width="2.2"/>
<g fill="none" stroke="var(--muted-foreground)" stroke-opacity="0.5">
<rect x="50" y="92" width="60" height="22" rx="4"/><rect x="150" y="92" width="60" height="22" rx="4"/><rect x="350" y="92" width="60" height="22" rx="4"/><rect x="450" y="92" width="60" height="22" rx="4"/>
</g>
<rect x="250" y="92" width="60" height="22" rx="4" fill="none" stroke="var(--primary)" stroke-width="1.6"/>
<text class="l" x="80" y="107" text-anchor="middle">ch 1</text><text class="l" x="180" y="107" text-anchor="middle">ch 2</text>
<text class="b" x="280" y="107" text-anchor="middle">results</text>
<text class="l" x="380" y="107" text-anchor="middle">risk</text><text class="l" x="480" y="107" text-anchor="middle">ch 12</text>
<g stroke="var(--muted-foreground)" stroke-opacity="0.4"><path d="M280 114 L200 148"/><path d="M280 114 L360 148"/></g>
<path d="M280 114 L280 148" stroke="var(--primary)" stroke-width="2.2"/>
<g fill="none" stroke="var(--muted-foreground)" stroke-opacity="0.5"><rect x="175" y="148" width="50" height="22" rx="4"/><rect x="335" y="148" width="50" height="22" rx="4"/></g>
<rect x="255" y="148" width="50" height="22" rx="4" fill="none" stroke="var(--primary)" stroke-width="1.6"/>
<text class="l" x="200" y="163" text-anchor="middle">Q2</text><text class="b" x="280" y="163" text-anchor="middle">Q3</text><text class="l" x="360" y="163" text-anchor="middle">Q4</text>
<path d="M280 170 L280 200" stroke="var(--primary)" stroke-width="2.2"/>
<rect x="230" y="200" width="100" height="22" rx="4" fill="var(--primary)" fill-opacity="0.15" stroke="var(--primary)" stroke-width="1.6"/>
<text class="b" x="280" y="215" text-anchor="middle">income stmt</text>
<text class="l" x="420" y="140">0.95</text><text class="l" x="420" y="163">× 0.95</text><text class="l" x="420" y="186">× 0.95</text>
<text class="b" x="420" y="210">= 0.857</text>
<path d="M20 240 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="262">2,320 tokens read instead of 150,000 — and one wrong turn ends the search</text>
<text class="l" x="20" y="282">a vector index has no path to get wrong, but it cannot tell Q3 from Q2</text>
</svg>
<figcaption>Each level is a decision. The cost is low; the errors multiply.</figcaption>
</figure>

## Where it breaks: the errors multiply

A vector search makes one decision — the ranking — and returns several candidates, so a near miss is often still in the top five.

Tree navigation makes one decision per level, and each one is final unless the system is built to back up. If the model picks the right branch with probability *p* at each level, it reaches the right page with probability *p* to the power of the depth:

| per-level accuracy | after 3 levels |
| --- | --- |
| 98% | 94.1% |
| 95% | **85.7%** |
| 90% | 72.9% |

A model that is right 19 times in 20 at every choice still loses one question in seven. The mitigations are the obvious ones: let the model pick two branches at the uncertain levels, let it back up when a page turns out not to contain the answer, and write summaries that state what a section *contains*, not what it is *called*.

The other costs are latency and money. Three or four sequential model calls before the answer starts is seconds, against tens of milliseconds for a vector lookup. Every query pays for reasoning that an embedding search did once at indexing time.

## When it is the right tool

**Long, structured, high-stakes documents.** Financial filings, contracts, regulations, technical manuals. They have real hierarchy, the questions reference that hierarchy ("in section 4.2", "for Q3", "under the indemnity clause"), and a wrong answer is expensive enough to justify a few seconds and a few cents.

**Questions where wording is shared across sections.** When every chapter uses the same vocabulary, similarity has nothing to distinguish them by. Structure does.

**Small collections.** Ten documents can each have a tree. A model can even choose the document first.

## When it is not

**Many short, unstructured documents.** A million support tickets have no table of contents. The top level of the tree would be a million summaries.

**Latency-sensitive paths.** Autocomplete, chat over a knowledge base with a sub-second budget.

**Broad questions.** "What are the main risks?" wants material from many branches at once — something a vector search returning many chunks handles naturally, and a single path through a tree does not.

## What to take away

Vectorless RAG swaps similarity search for navigation: the model reads summaries down a document tree and opens only the pages it chose. On a 300-page report that is about 2,320 tokens instead of 150,000, and it uses the one thing embeddings discard — the document's own structure.

The cost is that the search is now a chain of decisions, and accuracy is the product of them. Use it where structure is real and wrong answers are expensive; keep vectors where documents are many, short and flat.
