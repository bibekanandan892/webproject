---
title: "LangChain"
date: "2026-09-11T17:40"
category: "AI"
tags: ["langchain", "llm", "composition", "streaming", "rag"]
summary: "The framework's actual content is one interface that every piece implements. That is what makes the pipe operator work, what makes batching and streaming propagate through a chain you assembled — and what makes a broken prompt hard to find."
draft: false
cover: "/blog/langchain.svg"
---

LangChain is a framework for building applications around language models. Most descriptions list its parts — prompt templates, chains, memory, retrievers, agents — which makes it look like a bag of utilities.

It is not a bag of utilities. It is one interface, implemented by everything.

## The interface

Every component supports the same small set of operations: run it on one input, run it on many, and stream its output as it is produced.

That uniformity is the whole design. Because a prompt template, a model and an output parser all expose the same shape, they can be connected:

```python
chain = template | model | parser
```

Each piece takes what the previous one produced and hands on what it made. Nothing in the chain knows what the others are. You could swap the model for a different provider, or the parser for one that produces a dictionary instead of a string, and the chain would be unchanged.

The individual parts are thin. A prompt template holds a string with `{placeholders}` and fills them in. An output parser converts the model's text into whatever the next step needs. Memory is a store of previous turns that gets injected into the prompt, which is how a follow-up question containing "she" can resolve — the earlier turns are in the text the model reads.

None of those is difficult on its own. What the framework adds is that they compose.

## What composition actually buys

Two things, and neither is the pipe character.

**Batching propagates.** Every component knows how to handle many inputs at once. So a chain assembled for one input can be run over two hundred with no change to its definition:

| | 200 items through a 3-step chain |
| --- | --- |
| one at a time | 220 s |
| batched 20 at a time | 16 s |

That is nearly 14× faster, and the reason is not clever scheduling — it is that the model call, which dominates, is made 10 times instead of 200. A hand-written loop over a chain gets none of this unless it was written to.

**Streaming propagates.** If every step can pass tokens through as they arrive, the whole chain streams, and the first words reach the user long before the model has finished.

That "if" is doing real work, and it is the most useful thing to understand about the abstraction.

<figure>
<svg viewBox="0 0 560 282" width="560" role="img" aria-label="Two chains: one where every step passes tokens through and output appears early, and one where a blocking parser holds everything until the model finishes." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<defs><marker id="lc" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--muted-foreground)"/></marker></defs>
<text class="hd" x="20" y="18">ONE STEP DECIDES WHETHER THE CHAIN STREAMS</text>
<rect x="20" y="38" width="104" height="30" rx="5" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="var(--primary)" stroke-opacity="0.6"/>
<text class="b" x="72" y="57" text-anchor="middle">template</text>
<path d="M130 53 H158" stroke="var(--muted-foreground)" stroke-opacity="0.55" stroke-width="1.4" marker-end="url(#lc)"/>
<rect x="164" y="38" width="104" height="30" rx="5" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="var(--primary)" stroke-opacity="0.6"/>
<text class="b" x="216" y="57" text-anchor="middle">model</text>
<path d="M274 53 H302" stroke="var(--muted-foreground)" stroke-opacity="0.55" stroke-width="1.4" marker-end="url(#lc)"/>
<rect x="308" y="38" width="104" height="30" rx="5" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="var(--primary)" stroke-opacity="0.6"/>
<text class="b" x="360" y="57" text-anchor="middle">passes through</text>
<path d="M418 53 H446" stroke="var(--muted-foreground)" stroke-opacity="0.55" stroke-width="1.4" marker-end="url(#lc)"/>
<text class="b" x="452" y="57">0.4 s</text>
<rect x="20" y="106" width="104" height="30" rx="5" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="var(--primary)" stroke-opacity="0.6"/>
<text class="b" x="72" y="125" text-anchor="middle">template</text>
<path d="M130 121 H158" stroke="var(--muted-foreground)" stroke-opacity="0.55" stroke-width="1.4" marker-end="url(#lc)"/>
<rect x="164" y="106" width="104" height="30" rx="5" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="var(--primary)" stroke-opacity="0.6"/>
<text class="b" x="216" y="125" text-anchor="middle">model</text>
<path d="M274 121 H302" stroke="var(--muted-foreground)" stroke-opacity="0.55" stroke-width="1.4" marker-end="url(#lc)"/>
<rect x="308" y="106" width="104" height="30" rx="5" fill="color-mix(in srgb, var(--muted-foreground) 30%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 55%, transparent)"/>
<text class="l" x="360" y="125" text-anchor="middle">needs it all</text>
<path d="M418 121 H446" stroke="var(--muted-foreground)" stroke-opacity="0.55" stroke-width="1.4" marker-end="url(#lc)"/>
<text class="l" x="452" y="125">1.1 s</text>
<path d="M20 158 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="l" x="20" y="182">time until the reader sees anything</text>
<rect x="20" y="194" width="60" height="18" rx="3" fill="color-mix(in srgb, var(--primary) 26%, transparent)" stroke="var(--primary)" stroke-opacity="0.6"/>
<text class="b" x="88" y="208">0.4 s — streaming end to end</text>
<rect x="20" y="220" width="165" height="18" rx="3" fill="color-mix(in srgb, var(--muted-foreground) 30%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 50%, transparent)"/>
<text class="l" x="193" y="234">1.1 s — one blocking step, 2.75× worse</text>
<text class="l" x="20" y="260">the model streamed identically in both cases</text>
</svg>
<figcaption>A single component that needs the complete string removes streaming from the whole chain.</figcaption>
</figure>

A strict JSON parser is the usual culprit. It cannot validate half an object, so it holds everything until the model is done. The model streamed perfectly; the chain did not, and nothing in the code says so. The fix is to parse partial output, or to put the parse after the point where the user is being shown text.

## Retrieval, assembled from the same parts

RAG in this framework is not a special feature. It is a chain whose first step happens to be a retriever.

Documents are split into chunks, each chunk is embedded, the vectors go into a store. At query time the question is embedded, the nearest chunks come back, and they are inserted into the prompt template alongside the question. The model then answers from text that is in front of it.

The framework's contribution here is that swapping the vector store, the embedding model or the chunking strategy changes one line, because all of them satisfy the same interface. The contribution is *not* that retrieval is hard to write — it is about fifteen lines — it is that the pieces are interchangeable.

## Agents, and the loop

An agent is what you get when the chain's output decides what happens next.

The model is given a set of tools with descriptions. It responds with either an answer or a request to call a tool. The runtime executes it, appends the result, and asks again. Repeat until the response is an answer.

This is a while-loop, and the framework's job is the plumbing: formatting the tool descriptions into the prompt, parsing the model's request, dispatching it, appending the result in the shape the model expects. Worth having, and worth knowing that it is all it is.

## The honest cost

The abstraction hides the prompt.

By the time a chain runs, the text the model receives has been assembled from a template, injected memory, retrieved chunks, and a tool-description block — none of which appear together anywhere in your code. When the output is wrong, the first question is always "what did the model actually see", and the answer is not in the source file.

So the practical advice is simple: print the assembled prompt, or use tracing that captures it. Every serious debugging session with this framework starts there, and the layers that make composition pleasant are exactly the layers that put that string out of sight.

## What to take away

The value is one interface implemented consistently, which is why batching and streaming work through a chain you assembled from parts that never heard of each other.

The cost is the distance between your code and the prompt. That distance is what you are paying for the composition, and it is worth paying — as long as you know how to close it when something breaks.
