---
title: "Cross attention"
date: "2026-09-11T09:00"
category: "AI"
tags: ["attention", "transformers", "encoder-decoder", "multimodal", "alignment"]
summary: "One sequence asks the questions and a different sequence answers them. Two useful things follow from that split: the attention matrix stops being square, and the answering side is computed once."
draft: false
cover: "/blog/cross-attention.svg"
---

In cross attention the queries come from one sequence and the keys and values come from another.

That is the entire definition, and everything interesting about it follows from that one asymmetry.

## What it is for

Some tasks have two sequences, not one. Translating means an input sentence and an output sentence. Describing an image means a picture and a caption. Transcribing means audio and text.

The output has to be built while consulting the input, and the two are not the same length and do not line up position by position. Something has to let each output position look at whichever parts of the input matter to it.

## Reading a different sequence

Encode the source once. From it, build keys — what each source token offers — and values — what each contributes.

Then, at each output position, form a query from what has been generated so far and compare it against every source key. Softmax the scores, apply them to the values, and the result is a summary of the source, weighted for this particular output position.

$$
\text{Attention}(Q,K,V) = \text{softmax}\!\left(\frac{QK^{\top}}{\sqrt{d_k}}\right)V
$$

Identical formula to attention within one sequence. Only the provenance of the three inputs differs.

## Alignment, watched

Take a source of five tokens — *the meeting starts at noon* — and two different output positions querying it.

<figure>
<svg viewBox="0 0 560 250" width="560" role="img" aria-label="Two rows of attention weights over five source tokens. The first output position puts 0.452 on the word starts; the second puts 0.432 on the word noon." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.l{font:500 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}.v{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.t{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">SAME SOURCE, TWO OUTPUT POSITIONS</text>
<text class="l" x="140" y="98" text-anchor="end">asking for</text>
<text class="l" x="140" y="114" text-anchor="end">the action</text>
<path d="M148 100 H440" stroke="var(--border)" stroke-width="1"/>
<rect x="150" y="84.6" width="48" height="15.4" rx="2" fill="color-mix(in srgb, var(--muted-foreground) 30%, transparent)"/>
<rect x="208" y="82.6" width="48" height="17.4" rx="2" fill="color-mix(in srgb, var(--muted-foreground) 30%, transparent)"/>
<rect x="266" y="45.7" width="48" height="54.3" rx="2" fill="color-mix(in srgb, var(--primary) 60%, transparent)"/>
<text class="v" x="290" y="39" text-anchor="middle">0.452</text>
<rect x="324" y="83.7" width="48" height="16.3" rx="2" fill="color-mix(in srgb, var(--muted-foreground) 30%, transparent)"/>
<rect x="382" y="83.3" width="48" height="16.7" rx="2" fill="color-mix(in srgb, var(--muted-foreground) 30%, transparent)"/>
<text class="l" x="140" y="198" text-anchor="end">asking for</text>
<text class="l" x="140" y="214" text-anchor="end">the time</text>
<path d="M148 200 H440" stroke="var(--border)" stroke-width="1"/>
<rect x="150" y="186.4" width="48" height="13.6" rx="2" fill="color-mix(in srgb, var(--muted-foreground) 30%, transparent)"/>
<rect x="208" y="185" width="48" height="15" rx="2" fill="color-mix(in srgb, var(--muted-foreground) 30%, transparent)"/>
<rect x="266" y="182.4" width="48" height="17.6" rx="2" fill="color-mix(in srgb, var(--muted-foreground) 30%, transparent)"/>
<rect x="324" y="178.1" width="48" height="21.9" rx="2" fill="color-mix(in srgb, var(--muted-foreground) 30%, transparent)"/>
<rect x="382" y="148.1" width="48" height="51.9" rx="2" fill="color-mix(in srgb, var(--primary) 60%, transparent)"/>
<text class="v" x="406" y="141" text-anchor="middle">0.432</text>
<text class="t" x="174" y="230" text-anchor="middle">the</text>
<text class="t" x="232" y="230" text-anchor="middle">meeting</text>
<text class="t" x="290" y="230" text-anchor="middle">starts</text>
<text class="t" x="348" y="230" text-anchor="middle">at</text>
<text class="t" x="406" y="230" text-anchor="middle">noon</text>
</svg>
<figcaption>Each row sums to 1 across the source. Different output positions land on different source tokens.</figcaption>
</figure>

| | the | meeting | starts | at | noon |
| --- | --- | --- | --- | --- | --- |
| asking for the action | 0.128 | 0.145 | **0.452** | 0.136 | 0.139 |
| asking for the time | 0.113 | 0.125 | 0.147 | 0.183 | **0.432** |

Nothing told the model which source token corresponds to which output position. The alignment is an outcome of what each query happens to match, and it is learned.

## Two consequences worth naming

**The matrix is rectangular.** Two output positions against five source tokens is a 2×5 matrix. Within one sequence, attention is always square — every token against every token — which is why masking makes sense there: you can hide the upper triangle.

There is no triangle here. The axes are different sequences, and the whole source already exists before generation starts, so there is nothing to hide. Cross attention is never masked, and that is not a design choice but a consequence of the shape.

**The keys and values are built once.** They come from the source, which does not change while the output is generated. So they are computed once and reused at every output step.

| | token projections |
| --- | --- |
| rebuilding K and V at each of 60 output steps | 2,400 |
| building them once from 40 source tokens | **40** |

Sixty times fewer, and the factor is exactly the number of tokens generated. The longer the output, the more that one property is worth.

## Where it shows up

**Encoder-decoder models.** The original use: an encoder reads the input, and every decoder layer has a cross-attention step that consults it. Translation, summarisation, question answering over a passage.

**Image generation from text.** The image being denoised carries the queries; the encoded prompt supplies keys and values. Each region of the image attends to whichever words are relevant to it, which is how "a red door" puts red on the door and not on the wall.

**Speech to text.** The decoder generates text while attending over encoded audio frames.

The pattern generalises past sequences of words entirely. Any time two different things need to be related — and one of them is being produced while the other is fixed — this is the mechanism.

## The short version

- Queries come from one sequence; keys and values come from another.
- The formula is unchanged from attention within a single sequence; only where the inputs come from differs.
- Each output position gets its own weighting over the whole source.
- The matrix is rectangular, so there is no triangle to mask — and nothing to hide, since the source is fully known.
- Keys and values are built once from the source and reused for every output token: 60× fewer projections on a 60-token output.
- Alignment between the two sequences is learned, never specified.
- It is what connects an encoder to a decoder, a prompt to an image, and audio to a transcript.
