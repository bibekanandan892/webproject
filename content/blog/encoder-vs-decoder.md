---
title: "Encoder vs Decoder"
date: "2026-09-12T01:40"
category: "AI"
tags: ["transformers", "encoder", "decoder", "attention-mask", "training"]
summary: "One mask setting separates the two, and it decides two things that look unrelated: how much training signal a corpus yields, and whether generation can be made incremental. Both favour the decoder by a wide margin."
draft: false
cover: "/blog/encoder-vs-decoder.svg"
---

A transformer processes a sequence of tokens with attention: every position looks at other positions and gathers what it needs from them.

The only structural difference between an encoder and a decoder is **which positions each one is allowed to look at.** An encoder sees the whole sequence. A decoder sees only what came before.

That single restriction has consequences far beyond what it sounds like.

## Why seeing both sides helps

Take a sentence where a word is ambiguous until later:

> She left the plant by the window.
>
> She left the plant at six.

The first *plant* is a pot of leaves; the second is a factory. When the model reaches that word it has no way to know which — the disambiguating information arrives afterwards.

An encoder reads bidirectionally, so the representation it builds for *plant* incorporates *window* or *at six*. It is not predicting anything; it is producing a representation of text that already exists, and there is no reason to withhold part of it.

This is why encoders suit classification, retrieval, extraction, tagging — anything where the input is complete and the job is to characterise it.

## Why a decoder cannot do that

A decoder's job is to produce the next token. If it could see the next token while predicting it, the task would be trivial and it would learn nothing.

So a causal mask blocks every position from attending to anything after itself. Position 7 sees positions 1 to 7 and nothing else.

That is the whole distinction. Same layers, same attention, one mask setting — and everything else follows from it.

## The first consequence: training signal

This is the part that explains which architecture won, and it is arithmetic.

An encoder is trained by hiding some tokens and asking it to recover them. Hide too many and there is not enough context left; the conventional figure is around 15%. So **only 15% of positions produce a learning signal**; the other 85% are context.

A decoder predicts every position from its prefix. Every token is simultaneously an input and a target, so **100% of positions produce a signal.**

| | prediction targets per token of corpus | over a 1-trillion-token corpus |
| --- | --- | --- |
| masked encoder | 0.15 | 150 billion |
| causal decoder | 1.00 | **1,000 billion** |

**6.67× more learning from the same text.** When the binding constraint on model quality is how much data you can get through, an architecture that extracts nearly seven times the signal per token is not slightly better — it is on a different scaling curve.

<figure>
<svg viewBox="0 0 560 294" width="560" role="img" aria-label="A row of tokens with only a few marked as training targets for an encoder, against every token marked as a target for a decoder." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">THE SAME TEXT, 6.67× THE LESSONS</text>
<text class="l" x="20" y="44">masked encoder — 15% of positions are targets</text>
<g stroke="color-mix(in srgb, var(--muted-foreground) 34%, transparent)" stroke-width="1.2" fill="color-mix(in srgb, var(--muted-foreground) 12%, transparent)">
<rect x="20" y="54" width="22" height="22" rx="3"/><rect x="45" y="54" width="22" height="22" rx="3"/><rect x="70" y="54" width="22" height="22" rx="3"/><rect x="95" y="54" width="22" height="22" rx="3"/><rect x="120" y="54" width="22" height="22" rx="3"/><rect x="145" y="54" width="22" height="22" rx="3"/><rect x="170" y="54" width="22" height="22" rx="3"/><rect x="195" y="54" width="22" height="22" rx="3"/><rect x="220" y="54" width="22" height="22" rx="3"/><rect x="245" y="54" width="22" height="22" rx="3"/><rect x="270" y="54" width="22" height="22" rx="3"/><rect x="295" y="54" width="22" height="22" rx="3"/><rect x="320" y="54" width="22" height="22" rx="3"/><rect x="345" y="54" width="22" height="22" rx="3"/><rect x="370" y="54" width="22" height="22" rx="3"/><rect x="395" y="54" width="22" height="22" rx="3"/><rect x="420" y="54" width="22" height="22" rx="3"/><rect x="445" y="54" width="22" height="22" rx="3"/><rect x="470" y="54" width="22" height="22" rx="3"/><rect x="495" y="54" width="22" height="22" rx="3"/>
</g>
<g fill="color-mix(in srgb, var(--primary) 55%, transparent)" stroke="var(--primary)" stroke-opacity="0.7" stroke-width="1.5">
<rect x="70" y="54" width="22" height="22" rx="3"/><rect x="245" y="54" width="22" height="22" rx="3"/><rect x="420" y="54" width="22" height="22" rx="3"/>
</g>
<text class="l" x="20" y="96">3 of 20</text>
<text class="b" x="20" y="132">causal decoder — every position is a target</text>
<g fill="color-mix(in srgb, var(--primary) 55%, transparent)" stroke="var(--primary)" stroke-opacity="0.7" stroke-width="1.5">
<rect x="20" y="142" width="22" height="22" rx="3"/><rect x="45" y="142" width="22" height="22" rx="3"/><rect x="70" y="142" width="22" height="22" rx="3"/><rect x="95" y="142" width="22" height="22" rx="3"/><rect x="120" y="142" width="22" height="22" rx="3"/><rect x="145" y="142" width="22" height="22" rx="3"/><rect x="170" y="142" width="22" height="22" rx="3"/><rect x="195" y="142" width="22" height="22" rx="3"/><rect x="220" y="142" width="22" height="22" rx="3"/><rect x="245" y="142" width="22" height="22" rx="3"/><rect x="270" y="142" width="22" height="22" rx="3"/><rect x="295" y="142" width="22" height="22" rx="3"/><rect x="320" y="142" width="22" height="22" rx="3"/><rect x="345" y="142" width="22" height="22" rx="3"/><rect x="370" y="142" width="22" height="22" rx="3"/><rect x="395" y="142" width="22" height="22" rx="3"/><rect x="420" y="142" width="22" height="22" rx="3"/><rect x="445" y="142" width="22" height="22" rx="3"/><rect x="470" y="142" width="22" height="22" rx="3"/><rect x="495" y="142" width="22" height="22" rx="3"/>
</g>
<text class="b" x="20" y="184">20 of 20</text>
<path d="M20 204 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="b" x="20" y="228">1 trillion tokens gives 150 billion targets, or 1,000 billion</text>
<text class="l" x="20" y="250">and the mask is also what lets generation reuse past work — 250× at 500 tokens</text>
<text class="l" x="20" y="272">one setting, two advantages that look unrelated</text>
</svg>
<figcaption>Every token a decoder reads is also a question it has to answer. For an encoder, most of them are just background.</figcaption>
</figure>

## The second consequence: generation can be incremental

A causal mask guarantees that a token's representation depends only on tokens before it. So once computed, it never changes.

That is precisely what makes the attention cache possible. Generate a token, keep its keys and values, and the next step only has to process the one new position.

Without that guarantee, generating 500 tokens means reprocessing the whole prefix at every step:

| | token-positions processed to generate 500 tokens |
| --- | --- |
| recompute the prefix each step | 125,250 |
| reuse past keys and values | **500** |

A 250× difference, and it is not an optimization you could add to a bidirectional model. In an encoder, every new token changes every earlier representation, so there is nothing stable to cache. Bidirectionality and incremental generation are mutually exclusive.

## The three shapes

**Encoder-only.** Bidirectional, no generation. Good at understanding a fixed input — classification, retrieval, extraction. Still the right choice when the output is a label or a vector rather than text.

**Decoder-only.** Causal, generates. What nearly all current chat and coding models are.

**Encoder-decoder.** An encoder reads the input bidirectionally, a decoder writes the output while attending to that reading. Natural for transforming one text into another — translation, summarisation — where the input is complete and the output is new.

The interesting question is why decoder-only models took over tasks the other two were designed for. Partly the training-signal arithmetic above. Partly that a model good enough at predicting text turns out to be able to *describe* a classification in words, so the separate architecture stopped being necessary — one model, prompted differently, covers what previously needed three.

## What to take away

The difference is one line of masking, and it cascades.

Blocking the future costs an encoder's bidirectional view of ambiguous words. It buys a learning signal on every token instead of one in seven, and a representation stable enough to cache — which are the two things that decided the field.
