---
title: "How the context window works"
date: "2026-10-30T10:20"
category: "AI"
tags: ["context-window", "llm", "kv-cache", "attention", "tokens"]
summary: "The context window is everything a model can see at once — about 100,825 words, or 306 pages, at 128k tokens. Filling it costs 256 times the attention arithmetic of an 8k context and 42.9 GB of cache on a 70B model, and a 20-turn chat re-sends 105,000 tokens to hold a 10,000-token conversation."
draft: false
cover: "/blog/context-window.svg"
---

A language model has no memory between requests. Everything it can use to produce an answer — the system prompt, the conversation so far, retrieved documents, tool results, and the answer it is writing — has to be present, as tokens, in a single input. That input has a maximum size: the **context window**.

## What fits

Context windows are measured in tokens. At roughly 1.3 tokens per English word and about 330 words to a printed page:

| context window | words | pages |
| --- | --- | --- |
| 8,192 tokens | 6,302 | 19 |
| 131,072 tokens | **100,825** | **306** |
| 1,000,000 tokens | 769,231 | 2,331 |

A 128k window holds a long novel or a substantial codebase module. A million-token window holds several books. The output counts against the same budget: if the window is 128k and the prompt is 120k, at most 8k tokens remain for the reply.

## Why it is limited

Two costs grow with context length.

**Attention arithmetic.** Each token attends to every earlier token, so the number of pairs grows with the square of the length. Going from 8k to 128k tokens multiplies the pairs by **256** — from 67 million to 17 billion per layer and head. Kernels like Flash Attention make this fast in practice, but the growth is still quadratic.

**Memory for the KV cache.** Every token in context leaves keys and values at every layer, held for the rest of the generation. For a 70B-class model with grouped-query attention, about 320 KB per token: **42.9 GB** for a single 131k-token conversation. That memory decides how many conversations a GPU can serve at once, and therefore the cost.

Training matters too. A model trained mostly on short sequences does not automatically handle long ones well; long-context ability has to be trained, often in a late stage with position-encoding adjustments.

## Bigger is not the same as better

A model that *accepts* 128k tokens does not necessarily *use* all of them equally well.

- **Lost in the middle.** Many models recall information near the start and end of a long context better than information buried in the middle.
- **Distraction.** Irrelevant material competes for attention. Adding loosely related documents can lower accuracy compared with adding only the relevant one.
- **Latency.** Processing a long prompt takes time before the first output token appears, even with fast hardware.
- **Cost.** Input tokens are billed. A full window on every request is expensive.

The practical lesson is to treat context as a scarce resource to be spent deliberately, not a container to be filled.

<figure>
<svg viewBox="0 0 560 260" width="560" role="img" aria-label="A context window bar divided into system prompt, retrieved documents, conversation history, and space reserved for the answer; below, a staircase showing each chat turn re-sending all previous turns." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">ONE BUDGET, EVERYTHING IN IT</text>
<rect x="20" y="34" width="520" height="28" rx="4" fill="none" stroke="var(--muted-foreground)" stroke-opacity="0.6"/>
<rect x="20" y="34" width="60" height="28" fill="var(--muted-foreground)" fill-opacity="0.5"/>
<rect x="80" y="34" width="190" height="28" fill="var(--muted-foreground)" fill-opacity="0.3"/>
<rect x="270" y="34" width="190" height="28" fill="var(--primary)" fill-opacity="0.35"/>
<rect x="460" y="34" width="80" height="28" fill="none" stroke="var(--primary)" stroke-dasharray="4 3"/>
<text class="l" x="26" y="52">system</text><text class="l" x="90" y="52">retrieved documents</text><text class="b" x="280" y="52">conversation</text><text class="b" x="468" y="52">answer</text>
<text class="l" x="20" y="80">131,072 tokens ≈ 100,825 words ≈ 306 pages · output shares the budget</text>
<text class="b" x="20" y="108">a chat re-sends its history every turn</text>
<g fill="var(--primary)" fill-opacity="0.55">
<rect x="20" y="186" width="20" height="4"/><rect x="44" y="182" width="20" height="8"/><rect x="68" y="178" width="20" height="12"/><rect x="92" y="174" width="20" height="16"/><rect x="116" y="170" width="20" height="20"/><rect x="140" y="166" width="20" height="24"/><rect x="164" y="162" width="20" height="28"/><rect x="188" y="158" width="20" height="32"/><rect x="212" y="154" width="20" height="36"/><rect x="236" y="150" width="20" height="40"/>
<rect x="260" y="146" width="20" height="44"/><rect x="284" y="142" width="20" height="48"/><rect x="308" y="138" width="20" height="52"/><rect x="332" y="134" width="20" height="56"/><rect x="356" y="130" width="20" height="60"/><rect x="380" y="126" width="20" height="64"/><rect x="404" y="122" width="20" height="68"/><rect x="428" y="118" width="20" height="72"/><rect x="452" y="114" width="20" height="76"/><rect x="476" y="110" width="20" height="80"/>
</g>
<text class="l" x="20" y="206">turn 1</text><text class="l" x="496" y="206" text-anchor="end">turn 20</text>
<path d="M20 216 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="238">20 turns × 500 tokens: 10,000 in context, 105,000 sent in total</text>
</svg>
<figcaption>Every request carries the whole conversation again; prompt caching is what keeps that affordable.</figcaption>
</figure>

## Conversations re-send everything

Because the model is stateless, a chat application sends the entire conversation with every new message. If each turn adds 500 tokens, turn 20 sends 10,000 tokens — and the total sent over the whole conversation is `500 × (1 + 2 + … + 20) =` **105,000 tokens**, more than ten times what is finally in context.

Prompt caching softens this: a provider can reuse the computation for a prefix it has already processed, charging a fraction of the price and skipping most of the prefill time. Keeping the stable part of the prompt — system instructions, tool definitions, early history — unchanged and at the front is what makes caching effective.

## Managing context

When conversations or documents outgrow the window, or simply grow expensive, systems choose what to keep:

- **Retrieval** — store documents outside the context and bring in only the passages relevant to the current question.
- **Summarisation and compaction** — replace old turns with a summary that preserves decisions, facts and open tasks.
- **Truncation** — drop the oldest turns, keeping the system prompt and recent exchanges.
- **Structured memory** — save key facts to an external store and reinsert only those that matter.
- **Ordering** — place the most important material at the start or end, where it is most reliably used.

## What to take away

The context window is the single input that holds everything a model can see: instructions, history, documents, tool results and its own answer. At 128k tokens it is about 306 pages, but filling it costs 256 times the attention arithmetic of an 8k context and about 42.9 GB of cache on a 70B-class model.

Models do not use long contexts uniformly, and chats re-send their whole history each turn — 105,000 tokens over 20 turns for 10,000 in context. Spend context deliberately: retrieve, summarise, order carefully and keep stable prefixes cacheable.
