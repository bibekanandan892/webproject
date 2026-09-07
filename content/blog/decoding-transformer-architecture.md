---
title: "Decoding the transformer architecture"
date: "2026-09-08"
category: "AI"
tags: ["transformers", "architecture", "encoder", "decoder", "llm"]
summary: "A transformer takes tokens in and gives tokens out. Between those two ends sits a short list of components, each with one job — and the same list underpins BERT, GPT and everything since."
draft: false
cover: "/blog/decoding-transformer-architecture.svg"
---

A transformer is a tokens-in, tokens-out machine. You give it a sequence of tokens and it gives you back a sequence of tokens.

What made it matter is *how* it does that. Earlier sequence models read one word at a time, carrying a running memory forward. That was slow, because nothing could be parallelised, and forgetful, because the memory of early words faded by the end of a long sentence. The 2017 paper *Attention Is All You Need* dropped the sequential reading entirely and let every word look at every other word at once.

## Two halves

The original design has two stacks.

The **encoder** reads the input and builds a representation of it — a set of vectors that captures what the input means. The **decoder** produces the output, one token at a time, consulting the encoder's representation as it goes.

Think of one person reading a document and taking notes, and a second person writing a summary from those notes. The notes are the encoder's output. The writer is the decoder.

<figure>
<svg viewBox="0 0 566 364" width="566" role="img" aria-label="The encoder stack on the left runs token embeddings, positional encoding, self-attention and a feed-forward network. The decoder stack on the right adds masked self-attention, cross-attention that reads from the encoder, and a final linear and softmax layer." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.08em}.b{font:500 12px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.m{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--muted-foreground)"/></marker></defs>
<text class="hd" x="4" y="30">ENCODER</text>
<rect x="4" y="46" width="196" height="36" rx="7" fill="color-mix(in srgb, var(--primary) 14%, transparent)" stroke="color-mix(in srgb, var(--primary) 48%, transparent)"/>
<text class="b" x="102" y="68" text-anchor="middle">token embeddings</text>
<rect x="4" y="94" width="196" height="36" rx="7" fill="color-mix(in srgb, var(--primary) 14%, transparent)" stroke="color-mix(in srgb, var(--primary) 48%, transparent)"/>
<text class="b" x="102" y="116" text-anchor="middle">+ positional</text>
<path d="M102 83 V92" stroke="color-mix(in srgb, var(--primary) 45%, transparent)" stroke-width="1.4"/>
<rect x="4" y="142" width="196" height="36" rx="7" fill="color-mix(in srgb, var(--primary) 14%, transparent)" stroke="color-mix(in srgb, var(--primary) 48%, transparent)"/>
<text class="b" x="102" y="164" text-anchor="middle">self-attention</text>
<path d="M102 131 V140" stroke="color-mix(in srgb, var(--primary) 45%, transparent)" stroke-width="1.4"/>
<rect x="4" y="190" width="196" height="36" rx="7" fill="color-mix(in srgb, var(--primary) 14%, transparent)" stroke="color-mix(in srgb, var(--primary) 48%, transparent)"/>
<text class="b" x="102" y="212" text-anchor="middle">feed-forward</text>
<path d="M102 179 V188" stroke="color-mix(in srgb, var(--primary) 45%, transparent)" stroke-width="1.4"/>
<path d="M208 138 h7 V230 h-7" fill="none" stroke="var(--border)" stroke-width="1.3"/>
<text class="m" x="219" y="187">&#215; N</text>
<text class="hd" x="296" y="30">DECODER</text>
<rect x="296" y="46" width="226" height="36" rx="7" fill="color-mix(in srgb, var(--primary) 14%, transparent)" stroke="color-mix(in srgb, var(--primary) 48%, transparent)"/>
<text class="b" x="409" y="68" text-anchor="middle">token embeddings</text>
<rect x="296" y="94" width="226" height="36" rx="7" fill="color-mix(in srgb, var(--primary) 14%, transparent)" stroke="color-mix(in srgb, var(--primary) 48%, transparent)"/>
<text class="b" x="409" y="116" text-anchor="middle">+ positional</text>
<path d="M409 83 V92" stroke="color-mix(in srgb, var(--primary) 45%, transparent)" stroke-width="1.4"/>
<rect x="296" y="142" width="226" height="36" rx="7" fill="color-mix(in srgb, var(--primary) 14%, transparent)" stroke="color-mix(in srgb, var(--primary) 48%, transparent)"/>
<text class="b" x="409" y="164" text-anchor="middle">masked self-attention</text>
<path d="M409 131 V140" stroke="color-mix(in srgb, var(--primary) 45%, transparent)" stroke-width="1.4"/>
<rect x="296" y="190" width="226" height="36" rx="7" fill="color-mix(in srgb, var(--primary) 14%, transparent)" stroke="color-mix(in srgb, var(--primary) 48%, transparent)"/>
<text class="b" x="409" y="212" text-anchor="middle">cross-attention</text>
<path d="M409 179 V188" stroke="color-mix(in srgb, var(--primary) 45%, transparent)" stroke-width="1.4"/>
<rect x="296" y="238" width="226" height="36" rx="7" fill="color-mix(in srgb, var(--primary) 14%, transparent)" stroke="color-mix(in srgb, var(--primary) 48%, transparent)"/>
<text class="b" x="409" y="260" text-anchor="middle">feed-forward</text>
<path d="M409 227 V236" stroke="color-mix(in srgb, var(--primary) 45%, transparent)" stroke-width="1.4"/>
<rect x="296" y="286" width="226" height="36" rx="7" fill="color-mix(in srgb, var(--primary) 14%, transparent)" stroke="color-mix(in srgb, var(--primary) 48%, transparent)"/>
<text class="b" x="409" y="308" text-anchor="middle">linear + softmax</text>
<path d="M409 275 V284" stroke="color-mix(in srgb, var(--primary) 45%, transparent)" stroke-width="1.4"/>
<path d="M530 138 h7 V278 h-7" fill="none" stroke="var(--border)" stroke-width="1.3"/>
<text class="m" x="541" y="211">&#215; N</text>
<path d="M230 208 H290" stroke="var(--muted-foreground)" stroke-opacity="0.6" stroke-width="1.5" stroke-dasharray="5 4" marker-end="url(#ar)"/>
<text class="m" x="263" y="198" text-anchor="middle">keys + values</text>
</svg>
<figcaption>The two stacks. The dashed arrow is cross-attention reading the encoder.</figcaption>
</figure>

## What each piece does

The stacks are built from a small set of components.

**Tokens to vectors.** The text is split into tokens, and each token is looked up as a vector. These vectors are learned, and similar words end up with similar vectors.

**Positional encoding.** Because every token is processed at once rather than in order, nothing so far records *where* each token was. A position vector is added to each token's vector to supply that. Without it, "the dog bit the man" and "the man bit the dog" would look identical.

**Self-attention.** Each token compares itself against every other token and pulls in information from whichever ones matter. This is where "it" in a sentence works out which earlier noun it refers to.

**Multi-head attention.** Rather than one comparison, several run in parallel, each with its own learned projections. One head might track grammatical subjects, another nearby words, another something with no clean name. Their outputs are concatenated and combined.

**Feed-forward network.** After attention has mixed information between tokens, a small network processes each token on its own. Attention moves information sideways; this refines it in place.

**Residual connections and layer normalisation.** Each sub-layer adds its output to its input rather than replacing it, so the original signal always has a clear path forward. Normalisation then rescales the result to keep the numbers in a stable range. Both exist so deep stacks train at all.

**Stacking.** Attention plus feed-forward makes one block, and blocks are stacked. The original transformer used 6 in each stack; GPT-3 used 96.

## What the decoder does differently

The decoder has the same parts plus two changes.

Its self-attention is **masked**. When producing token 5 it may look at tokens 1 to 4 and no further. During training the whole target sequence is present at once, so without the mask the model could read the answer it is being asked to predict.

It also has a **cross-attention** layer. Here the queries come from the decoder, but the keys and values come from the encoder's output. That is the moment the output sequence actually consults the input.

At the very end, a linear layer maps the final vector to one score per vocabulary entry, and softmax turns those into probabilities. The next token is picked from that distribution.

## Following one sentence through

Translating `she reads quickly` into Spanish.

The encoder splits the input into three tokens, embeds them, adds positions, and runs the stack. Out comes three vectors — still one per input token, but each now carrying context from the others.

The decoder then works one token at a time:

| step | decoder has | attends to | emits |
| --- | --- | --- | --- |
| 1 | start token | encoder output | `ella` |
| 2 | `ella` | itself + encoder output | `lee` |
| 3 | `ella lee` | itself + encoder output | `rápido` |
| 4 | `ella lee rápido` | itself + encoder output | end token |

Each step runs the whole decoder stack again, with one more token of context than the last. When it emits the end token, generation stops.

## Three ways to use it

Not every model keeps both halves.

| shape | keeps | good at | example |
| --- | --- | --- | --- |
| encoder-only | encoder | understanding a whole input at once | BERT |
| decoder-only | decoder | generating text | GPT |
| encoder-decoder | both | turning one sequence into another | T5 |

Decoder-only models dropped the encoder and the cross-attention with it, keeping masked self-attention. That is the shape most current language models use.

## Why it took over

- **It parallelises.** Every token is processed at once, so training uses hardware that sequential models could not.
- **Distance stops mattering.** Attention connects any two tokens directly, so a word at the end can reach a word at the start in one step rather than through hundreds of intermediate states.
- **It scales predictably.** Adding layers, widening vectors and adding heads keeps improving results, which is what made very large models worth building.
- **One design covers many tasks.** The same components handle translation, classification and generation, depending on which half you keep.

## The short version

- A transformer maps a sequence of tokens to a sequence of tokens.
- The encoder builds a representation of the input; the decoder generates output from it.
- Tokens become vectors, positions are added, attention mixes information between tokens, and a feed-forward network refines each one.
- Residual connections and normalisation are what let the stack go deep.
- The decoder masks its self-attention and adds cross-attention to read the encoder.
- Keep the encoder, the decoder, or both, and you get BERT, GPT or T5.
