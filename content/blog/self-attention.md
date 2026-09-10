---
title: "Self attention"
date: "2026-09-10T22:00"
category: "AI"
tags: ["attention", "transformers", "context", "embeddings", "qkv"]
summary: "The word self means the queries, keys and values all come from the same sequence. The consequence is that a word's representation is built from its neighbours, so the same word comes out different in different sentences."
draft: false
cover: "/blog/self-attention.svg"
---

Every token in a sequence looks at every other token, decides which ones matter to it, and rebuilds itself as a blend of what it found.

The *self* is the important word. The things being looked at are the other tokens in the same sequence — not a separate input, not a stored document. A sentence is examined against itself.

## Why that is necessary

A word's embedding is fixed. `charge` gets the same vector every time, whatever the sentence, because the lookup table does not know what sentence it is in.

But `charge` in a courtroom and `charge` in a battery are different words wearing the same spelling. Something has to make the representation depend on the surroundings, and self attention is that something.

## Three roles per token

Each token produces three vectors, all from its own embedding through three learned matrices:

**Query** — what this token is looking for. **Key** — what this token offers to anyone looking. **Value** — what it actually contributes if chosen.

A token's query is compared against every token's key, including its own. The comparison is a dot product, divided by the square root of the vector width to keep the numbers in a sane range, and passed through softmax so the results are weights that sum to 1. The output is those weights applied to the values.

$$
\text{Attention}(Q,K,V) = \text{softmax}\!\left(\frac{QK^{\top}}{\sqrt{d_k}}\right)V
$$

All three come from the same sequence. That single fact is what makes it self attention.

## The same word, twice

Take four dimensions and pretend they mean something: legal, electrical, generic, physical. Give `charge` an ambiguous embedding, sitting equally in the legal and electrical directions:

`charge = [0.5, 0.5, 0.6, 0.2]`

Now run it in two sentences.

<figure>
<svg viewBox="0 0 560 230" width="560" role="img" aria-label="Two bar charts of the output vector for the word charge. In the legal sentence the legal dimension is 0.758 and electrical is 0.179. In the battery sentence those two values are swapped." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.s{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.v{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.t{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="16">SAME INPUT VECTOR, DIFFERENT OUTPUT</text>
<text class="s" x="160" y="38" text-anchor="middle">…dropped by the judge</text>
<path d="M84 170 H244" stroke="var(--border)" stroke-width="1"/>
<rect x="92" y="94" width="28" height="76" rx="2" fill="color-mix(in srgb, var(--primary) 60%, transparent)"/>
<text class="v" x="106" y="88" text-anchor="middle">.76</text>
<rect x="128" y="152" width="28" height="18" rx="2" fill="color-mix(in srgb, var(--muted-foreground) 40%, transparent)"/>
<text class="t" x="142" y="146" text-anchor="middle">.18</text>
<rect x="164" y="126" width="28" height="44" rx="2" fill="color-mix(in srgb, var(--muted-foreground) 28%, transparent)"/>
<rect x="200" y="153" width="28" height="17" rx="2" fill="color-mix(in srgb, var(--muted-foreground) 28%, transparent)"/>
<text class="t" x="106" y="186" text-anchor="middle">L</text>
<text class="t" x="142" y="186" text-anchor="middle">E</text>
<text class="t" x="178" y="186" text-anchor="middle">G</text>
<text class="t" x="214" y="186" text-anchor="middle">O</text>
<text class="s" x="400" y="38" text-anchor="middle">…went flat in the battery</text>
<path d="M324 170 H484" stroke="var(--border)" stroke-width="1"/>
<rect x="332" y="152" width="28" height="18" rx="2" fill="color-mix(in srgb, var(--muted-foreground) 40%, transparent)"/>
<text class="t" x="346" y="146" text-anchor="middle">.18</text>
<rect x="368" y="94" width="28" height="76" rx="2" fill="color-mix(in srgb, var(--primary) 60%, transparent)"/>
<text class="v" x="382" y="88" text-anchor="middle">.76</text>
<rect x="404" y="126" width="28" height="44" rx="2" fill="color-mix(in srgb, var(--muted-foreground) 28%, transparent)"/>
<rect x="440" y="134" width="28" height="36" rx="2" fill="color-mix(in srgb, var(--muted-foreground) 28%, transparent)"/>
<text class="t" x="346" y="186" text-anchor="middle">L</text>
<text class="t" x="382" y="186" text-anchor="middle">E</text>
<text class="t" x="418" y="186" text-anchor="middle">G</text>
<text class="t" x="454" y="186" text-anchor="middle">O</text>
<text class="t" x="20" y="214">L legal · E electrical · G generic · O physical — the output vector for "charge"</text>
</svg>
<figcaption>Nothing about the word changed. Its context did, and the output followed.</figcaption>
</figure>

| | legal | electrical | generic | physical |
| --- | --- | --- | --- | --- |
| *…dropped by the judge* | **0.758** | 0.179 | 0.439 | 0.168 |
| *…went flat in the battery* | 0.175 | **0.762** | 0.437 | 0.365 |

The legal and electrical dimensions swap almost exactly. The cosine similarity between the two outputs is **0.59**, from an input that was byte-identical in both cases.

That is the whole mechanism. The token did not become legal or electrical by itself — it absorbed a share of its neighbours' values, and the neighbours were different.

Notice too that the attention weights were nearly flat, around a third each. Attention did not need to pick a winner. The output changed because *what was there to average over* changed, which is a quieter and more common way for it to work than the dramatic one-token-attends-strongly-to-another picture suggests.

## Why it replaced what came before

**Everything happens at once.** Previous sequence models read left to right, each step waiting on the last. Self attention computes all positions in parallel, which is what makes training on large data practical.

**Distance stops mattering.** A token at position 400 reaches a token at position 3 directly, in one operation. In a recurrent model that information had to survive 397 sequential updates, and it usually did not.

**Words stop having one meaning.** As above.

## Several at once

One set of Q, K and V matrices learns one way of relating tokens. Running several in parallel, each with its own matrices, lets different heads pick up different relationships — one tracking grammatical agreement, another nearby modifiers, another something with no clean name.

Each head produces its own output, the outputs are concatenated, and a final matrix mixes them back to the expected width.

## The one variant that matters

In a model that generates text, a token must not see what comes after it — during training the whole sentence is present, so without intervention position 3 could read position 5 while learning to predict position 4.

The fix is to set those scores to negative infinity before the softmax, so their weights come out as exactly zero. Same mechanism, with the upper triangle switched off.

Encoders skip the mask and let every token see the whole sequence, because there is nothing to predict in order.

## The short version

- Every token attends to every token in the same sequence, itself included.
- *Self* means queries, keys and values all come from that one sequence.
- Each token compares its query against all keys, softmaxes the scores, and blends the values.
- Because the blend is over its neighbours, a fixed embedding produces different output in different sentences — 0.76 legal in one, 0.76 electrical in the other.
- Weights are often fairly flat; what changes is what there is to average.
- All positions compute in parallel, and distance costs nothing.
- Multiple heads learn different relationships and are concatenated.
- Masking future positions turns it into the version generation needs.
