---
title: "GraphRAG"
date: "2026-09-10T13:40"
category: "AI"
tags: ["rag", "knowledge-graph", "retrieval", "multi-hop", "entities"]
summary: "Chunk search finds passages that look like the question. When the answer is a chain running through documents that mention none of the question's words, that is not enough."
draft: false
cover: "/blog/graphrag.svg"
---

Ordinary retrieval splits documents into chunks, embeds them, and fetches the ones closest to the question. It works because a passage answering a question usually resembles it.

GraphRAG is for the case where it does not. Instead of storing only chunks, it extracts the entities in those documents and the relationships between them, and stores that as a graph. Answering then means walking the graph.

## Where chunk search breaks

Three sentences, from three different documents:

- *"Checkout calls the pricing API for every basket."* — the runbook
- *"The pricing API reads rates from the tariffs database."* — the architecture notes
- *"The tariffs database was migrated to the new cluster by the platform team on 12 June."* — the change log

Now ask: **checkout started failing after 12 June — who owns the change that might have caused it?**

Chunk search will find the runbook, which mentions checkout, and the change log, which mentions 12 June. It will not find the middle sentence, because that sentence contains neither the word checkout nor the date nor anything about failing. It matches the question on nothing.

And the middle sentence is the whole answer. Without it there are two unrelated facts; with it there is a chain.

This is the general shape of the problem. The chunk that *links* two others is often the one least similar to the question, because linking chunks are about the relationship rather than about either end of it.

## What gets stored instead

<figure>
<svg viewBox="0 0 600 242" width="600" role="img" aria-label="A graph with four nodes: checkout calls the pricing API, which reads the tariffs database, which was migrated by the platform team. Each edge came from a different document." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.n{font:600 12px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.e{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.s{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<defs><marker id="gr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="color-mix(in srgb, var(--primary) 60%, transparent)"/></marker></defs>
<text class="hd" x="40" y="22">THREE DOCUMENTS, ONE CHAIN</text>
<rect x="40" y="50" width="118" height="42" rx="8" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="color-mix(in srgb, var(--primary) 52%, transparent)"/>
<text class="n" x="99" y="76" text-anchor="middle">checkout</text>
<rect x="222" y="50" width="118" height="42" rx="8" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="color-mix(in srgb, var(--primary) 52%, transparent)"/>
<text class="n" x="281" y="76" text-anchor="middle">pricing api</text>
<rect x="404" y="50" width="118" height="42" rx="8" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="color-mix(in srgb, var(--primary) 52%, transparent)"/>
<text class="n" x="463" y="76" text-anchor="middle">tariffs db</text>
<rect x="404" y="160" width="118" height="42" rx="8" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="color-mix(in srgb, var(--primary) 52%, transparent)"/>
<text class="n" x="463" y="186" text-anchor="middle">platform team</text>
<path d="M158 71 H216" stroke="color-mix(in srgb, var(--primary) 60%, transparent)" stroke-width="1.6" marker-end="url(#gr)"/>
<text class="e" x="187" y="62" text-anchor="middle">calls</text>
<text class="s" x="187" y="110" text-anchor="middle">runbook</text>
<path d="M340 71 H398" stroke="color-mix(in srgb, var(--primary) 60%, transparent)" stroke-width="1.6" marker-end="url(#gr)"/>
<text class="e" x="369" y="62" text-anchor="middle">reads</text>
<text class="s" x="369" y="110" text-anchor="middle">architecture notes</text>
<path d="M463 154 V98" stroke="color-mix(in srgb, var(--primary) 60%, transparent)" stroke-width="1.6" marker-end="url(#gr)"/>
<text class="e" x="536" y="122" text-anchor="middle">migrated</text>
<text class="s" x="536" y="140" text-anchor="middle">change log</text>
<text class="s" x="40" y="222">the question mentions only the two ends — the middle edge is what connects them</text>
</svg>
<figcaption>Each edge came from a different document. Only together do they answer anything.</figcaption>
</figure>

Now the question is answerable. Start at checkout, follow the edges, arrive at the platform team. Three documents that share no vocabulary, joined by the entities they have in common.

## Building it

The indexing is done once, and it is where the cost sits.

Documents are chunked as usual. Then a model reads each chunk and pulls out the **entities** — services, people, teams, products, dates — and the **relations** between them: calls, reads, owns, migrated, acquired.

Those become nodes and edges. The same entity mentioned in twenty documents becomes one node with twenty edges, which is precisely what the chunk store could not represent.

Then densely connected regions of the graph are grouped into **communities**, and a model writes a plain summary of each. Those summaries matter for the next part.

The result stored is three things: the graph, embeddings for the pieces, and the community summaries. That is considerably more than a vector store of chunks, and every step of it costs model calls.

## Answering

Two quite different modes, depending on the question.

**Local** — a question about specific things. Find the entities the question names, pull the subgraph around them along with the original chunks those edges came from, and hand that to the model. The trace above is a local search.

**Global** — a question about the whole corpus, like what the recurring themes are. There is no starting entity, and the corpus does not fit in a context window. So the community summaries are used instead: each one is asked the question in parallel and produces a partial answer with a score, and the best of those are combined into one. Map, then reduce.

Global search is the part that has no equivalent in ordinary RAG at all. "What are the main themes here?" is not a retrieval question — no chunk contains the answer.

## What it costs

| | ordinary RAG | GraphRAG |
| --- | --- | --- |
| retrieval | chunk similarity | traversal plus similarity |
| good at | single-fact questions | chains and whole-corpus questions |
| indexing | embed each chunk | model calls to extract entities, relations, summaries |
| storage | vectors | graph, vectors and summaries |
| adding a document | one more embedding | new nodes, changed edges, resummarised communities |
| complexity | low | high |

The update row is the one that bites in practice. Adding a document to a vector store is appending a row. Adding one to a graph can change edges that already existed, and communities the new node joins have to be summarised again.

## When it is worth it

Two conditions, and both have to hold.

The data has to be genuinely relational — entities that recur across documents and relate to each other. A corpus of independent articles has no graph to build.

And the questions have to be the kind that need it. If people ask single-fact questions, the graph will be traversed one hop and the indexing cost bought nothing.

If either is missing, ordinary retrieval is the right starting point. It is cheaper, simpler, and correct for the majority of questions.

## The short version

- Chunk search retrieves passages resembling the question; GraphRAG retrieves along relationships.
- The chunk that links two others is often the least similar to the question, which is exactly the case that breaks chunk search.
- Indexing uses a model to extract entities and relations, then groups the graph into communities and summarises each.
- Local search walks the subgraph around the named entities.
- Global search asks every community summary in parallel and combines the answers.
- The costs are indexing, storage, and the difficulty of updating a graph.
- Worth it only when the data is relational and the questions are multi-hop.
