---
title: "Lost in the Middle"
date: "2026-09-12T04:00"
category: "AI"
tags: ["long-context", "rag", "retrieval", "reranking", "evaluation"]
summary: "Accuracy follows a U-shape across a long input, which means the order you pass chunks in is worth real points. Ten chunks arranged well beat twenty in rank order, using half the tokens."
draft: false
cover: "/blog/lost-in-the-middle.svg"
---

Put a fact in a long input and ask about it. Where the fact sits changes whether the model finds it.

Near the start: found. Near the end: found. Somewhere in the middle: often missed — same fact, same model, same question, same total length. Plot accuracy against position and it makes a **U**.

That is a strange property, and it has a practical consequence that is easy to compute.

## Why the middle is weak

Four contributing causes, none of them a bug anyone introduced.

**Attention is a budget.** Each position distributes a fixed total of weight across everything it can see. As the input grows, the share available per token shrinks — and the positions that hold their share are the ones with structural advantages.

**Position encoding favours the edges.** The mechanisms that tell a model where a token sits make the very beginning distinctive and make recent tokens strong. A token 40% of the way through has neither advantage.

**Training text is front- and back-loaded.** Human writing puts the thesis at the start and the conclusion at the end. A model that learned to predict text learned that those positions carry weight.

**Long inputs are under-trained.** Most training sequences are short. The behaviour at 80,000 tokens was practised far less than the behaviour at 2,000, so the middle of a long input is the least-rehearsed region of the least-rehearsed length.

## What it costs a retrieval system

Model the U-shape: 0.92 accuracy at either end falling to 0.55 in the middle. Retrieve *k* chunks, with the answer more likely to be in a highly-ranked one than a low-ranked one, and a retriever whose recall improves as *k* grows.

End-to-end — the chance the answer is both retrieved *and* used:

| chunks | passed in rank order | best ranks placed at the two ends |
| --- | --- | --- |
| 3 | 58.4% | 60.6% |
| 5 | 63.2% | 66.5% |
| 10 | 67.7% | **71.5%** |
| 20 | 70.9% | 74.9% |
| 50 | 73.8% | 77.6% |

Two things fall out of that table, and the first one runs against the usual advice.

**More chunks does keep helping.** There is no interior optimum here — the recall gained by retrieving more outweighs the position penalty all the way to 50. The common advice to retrieve fewer chunks *because of* the U-shape does not hold on these numbers.

**But the returns are poor, and reordering is free.** Going from 10 chunks to 50 buys **+6.1 points** for five times the tokens and five times the prefill cost. Reordering the same 10 buys **+3.9 points** for nothing — 64% of the benefit at zero cost.

And the comparison that matters: **ten chunks arranged well (71.5%) beat twenty in rank order (70.9%)**, on half the tokens.

<figure>
<svg viewBox="0 0 560 312" width="560" role="img" aria-label="A U-shaped accuracy curve across input position, with the best-ranked chunks placed at the two ends where accuracy is highest." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">PUT THE BEST CHUNKS WHERE THE MODEL LOOKS</text>
<path d="M60 40 V172 H520" stroke="var(--muted-foreground)" stroke-opacity="0.35"/>
<text class="l" x="26" y="46">0.95</text>
<text class="l" x="26" y="110">0.70</text>
<text class="l" x="26" y="176">0.45</text>
<path d="M60 48 L106 83 L152 111 L198 130 L244 142 L290 146 L336 142 L382 130 L428 111 L474 83 L520 48" stroke="var(--primary)" stroke-width="2.6" fill="none"/>
<circle cx="60" cy="48" r="4.4" fill="var(--primary)"/>
<circle cx="520" cy="48" r="4.4" fill="var(--primary)"/>
<circle cx="290" cy="146" r="4.4" fill="var(--muted-foreground)"/>
<text class="b" x="70" y="42">0.92</text>
<text class="b" x="510" y="42" text-anchor="end">0.92</text>
<text class="l" x="290" y="164" text-anchor="middle">0.55</text>
<text class="l" x="60" y="192">start</text>
<text class="l" x="290" y="192" text-anchor="middle">middle</text>
<text class="l" x="520" y="192" text-anchor="end">end</text>
<g fill="color-mix(in srgb, var(--primary) 45%, transparent)" stroke="var(--primary)" stroke-opacity="0.7">
<rect x="60" y="202" width="34" height="18" rx="3"/><rect x="486" y="202" width="34" height="18" rx="3"/>
</g>
<g fill="color-mix(in srgb, var(--muted-foreground) 22%, transparent)" stroke="color-mix(in srgb, var(--muted-foreground) 40%, transparent)">
<rect x="98" y="202" width="34" height="18" rx="3"/><rect x="136" y="202" width="34" height="18" rx="3"/><rect x="174" y="202" width="34" height="18" rx="3"/><rect x="212" y="202" width="34" height="18" rx="3"/><rect x="250" y="202" width="34" height="18" rx="3"/><rect x="288" y="202" width="34" height="18" rx="3"/><rect x="326" y="202" width="34" height="18" rx="3"/><rect x="364" y="202" width="34" height="18" rx="3"/><rect x="402" y="202" width="34" height="18" rx="3"/><rect x="440" y="202" width="34" height="18" rx="3"/>
</g>
<text class="b" x="60" y="236">rank 1</text>
<text class="b" x="520" y="236" text-anchor="end">rank 2</text>
<path d="M20 252 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="274">ten chunks arranged this way beat twenty in rank order, on half the tokens</text>
<text class="l" x="20" y="290">and reordering costs nothing at all</text>
</svg>
<figcaption>The curve is the constraint. Where you place your best-ranked chunk is the free variable.</figcaption>
</figure>

## What to actually do

In rough order of value per unit of effort:

**Reorder.** Put the top-ranked chunk first, the second at the very end, and work inward. This is a few lines of code and it is the only intervention on this list that costs nothing.

**Rerank before you truncate.** A better ordering makes reordering worth more, because it raises the probability mass sitting in the two good positions. The two techniques compound.

**Extract before answering.** Make one pass that pulls the relevant facts out of each chunk, then answer from the extracted notes. The extraction pass reads each chunk in a short context where position barely matters, and the answering pass sees a short input. This converts a long-context problem into two short-context problems.

**Split into passes for genuinely large jobs.** Process chunks in batches, summarise each batch, combine the summaries. More model calls, and each one operates where the model is reliable.

**Measure the model you are using.** Insert a unique fact at 0%, 10%, … 100% depth across several input lengths and record whether it is found. An hour of work produces the actual curve for your model at your lengths, which is the only version of that curve that should inform a decision.

## The thing to be clear about

A one-million-token context window is a statement about what the model will **accept**, not what it will attend to evenly.

Those are different claims and only the first one is being made. Treating the advertised number as a promise of uniform comprehension is how a system ends up passing fifty chunks into a model that reliably reads about six of them.

## What to take away

The U-shape is real and the usual response to it is wrong. Retrieving fewer chunks does not help; the recall you lose outweighs the position penalty you avoid.

What helps is using the positions you have. Reorder so the strongest candidates sit where the model looks, rerank so those candidates are worth the good seats, and for long jobs read in short passes rather than one long one.
